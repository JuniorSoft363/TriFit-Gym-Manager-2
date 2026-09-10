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

// Clientes actualmente dentro del gimnasio (entrada sin salida registrada).
async function presentes() {
  const datos = await prisma.asistencia.findMany({
    where: { horaSalida: null },
    include: { cliente: true },
    orderBy: { horaEntrada: 'desc' }
  });
  return { total: datos.length, datos };
}

const claveDia = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Aforo de un día: total de ingresos, cuántos siguen dentro y desglose por hora.
async function aforo(query) {
  const base = query.fecha ? new Date(query.fecha) : new Date();
  const inicio = new Date(base); inicio.setHours(0, 0, 0, 0);
  const fin = new Date(base); fin.setHours(23, 59, 59, 999);

  const asistencias = await prisma.asistencia.findMany({
    where: { horaEntrada: { gte: inicio, lte: fin } },
    select: { horaEntrada: true, horaSalida: true }
  });

  const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, entradas: 0 }));
  for (const a of asistencias) porHora[new Date(a.horaEntrada).getHours()].entradas += 1;
  const horaPico = porHora.reduce((max, x) => (x.entradas > max.entradas ? x : max), porHora[0]);

  return {
    fecha: claveDia(inicio),
    totalDia: asistencias.length,
    dentroAhora: asistencias.filter((a) => !a.horaSalida).length,
    horaPico,
    porHora
  };
}

module.exports = { consultar, registrarEntrada, registrarSalida, listar, presentes, aforo };
