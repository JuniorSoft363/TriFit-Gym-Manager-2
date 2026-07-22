// Registro de asistencias mediante número de cédula
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { getPaginacion } = require('../utils/paginacion');
const membresiaService = require('./membresia.service');

// Consulta el estado de un cliente antes de registrar (flujo del recepcionista)
async function consultar(cedula) {
  const { cliente, membresia } = await membresiaService.vigentePorCedula(cedula);
  const entradaAbierta = await prisma.asistencia.findFirst({
    where: { clienteId: cliente.id, horaSalida: null },
    orderBy: { id: 'desc' }
  });
  return { cliente, membresia, entradaAbierta };
}

async function registrarEntrada(cedula, usuarioId) {
  const { cliente, membresia, entradaAbierta } = await consultar(cedula);
  if (!membresia || membresia.estado !== 'ACTIVA') {
    throw new HttpError(403, 'El cliente no tiene una membresía activa');
  }
  if (entradaAbierta) {
    throw new HttpError(409, 'El cliente ya registró una entrada sin salida');
  }
  const ahora = new Date();
  return prisma.asistencia.create({
    data: { clienteId: cliente.id, fecha: ahora, horaEntrada: ahora, usuarioId: usuarioId || null },
    include: { cliente: true }
  });
}

async function registrarSalida(cedula) {
  const cliente = await prisma.cliente.findUnique({ where: { cedula } });
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  const abierta = await prisma.asistencia.findFirst({
    where: { clienteId: cliente.id, horaSalida: null },
    orderBy: { id: 'desc' }
  });
  if (!abierta) throw new HttpError(404, 'No existe una entrada abierta para este cliente');
  return prisma.asistencia.update({
    where: { id: abierta.id },
    data: { horaSalida: new Date() },
    include: { cliente: true }
  });
}

async function listar(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  const dia = query.fecha ? new Date(query.fecha) : null;
  if (dia) {
    const inicio = new Date(dia); inicio.setHours(0, 0, 0, 0);
    const fin = new Date(dia); fin.setHours(23, 59, 59, 999);
    where.horaEntrada = { gte: inicio, lte: fin };
  } else if (query.desde || query.hasta) {
    where.horaEntrada = {};
    if (query.desde) where.horaEntrada.gte = new Date(query.desde);
    if (query.hasta) {
      const h = new Date(query.hasta); h.setHours(23, 59, 59, 999);
      where.horaEntrada.lte = h;
    }
  }
  if (query.busqueda) {
    where.cliente = {
      OR: [
        { cedula: { contains: query.busqueda } },
        { nombres: { contains: query.busqueda, mode: 'insensitive' } },
        { apellidos: { contains: query.busqueda, mode: 'insensitive' } }
      ]
    };
  }
  const [total, datos] = await Promise.all([
    prisma.asistencia.count({ where }),
    prisma.asistencia.findMany({
      where, skip, take,
      include: { cliente: true },
      orderBy: { id: 'desc' }
    })
  ]);
  return { datos, total, page, limit };
}

module.exports = { consultar, registrarEntrada, registrarSalida, listar };
