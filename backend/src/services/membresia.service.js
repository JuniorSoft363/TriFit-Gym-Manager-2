// Gestión de membresías: asignación, renovación, suspensión y vencimientos
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { getPaginacion } = require('../utils/paginacion');

// Marca como VENCIDA toda membresía ACTIVA cuya fecha fin ya pasó
function actualizarVencidas() {
  return prisma.membresia.updateMany({
    where: { estado: 'ACTIVA', fechaFin: { lt: new Date() } },
    data: { estado: 'VENCIDA' }
  });
}

function filtroCliente(busqueda) {
  return {
    OR: [
      { cedula: { contains: busqueda } },
      { nombres: { contains: busqueda, mode: 'insensitive' } },
      { apellidos: { contains: busqueda, mode: 'insensitive' } }
    ]
  };
}

async function listar(query) {
  await actualizarVencidas();
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.estado) where.estado = query.estado;
  if (query.busqueda) where.cliente = filtroCliente(query.busqueda);
  const [total, datos] = await Promise.all([
    prisma.membresia.count({ where }),
    prisma.membresia.findMany({
      where, skip, take,
      include: { cliente: true, plan: true },
      orderBy: { id: 'desc' }
    })
  ]);
  return { datos, total, page, limit };
}

async function asignar({ clienteId, planId, fechaInicio }) {
  await actualizarVencidas();
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: Number(planId) } });
  if (!plan.activo) throw new HttpError(400, 'El plan seleccionado no está activo');
  const existente = await prisma.membresia.findFirst({
    where: { clienteId: Number(clienteId), estado: 'ACTIVA' }
  });
  if (existente) throw new HttpError(409, 'El cliente ya tiene una membresía activa');
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + plan.duracionDias);
  return prisma.membresia.create({
    data: { clienteId: Number(clienteId), planId: plan.id, fechaInicio: inicio, fechaFin: fin },
    include: { cliente: true, plan: true }
  });
}

async function renovar(id) {
  const m = await prisma.membresia.findUniqueOrThrow({
    where: { id: Number(id) },
    include: { plan: true }
  });
  if (m.estado === 'CANCELADA')
    throw new HttpError(409, 'No se puede renovar una membresía cancelada');
  const base = m.fechaFin > new Date() ? new Date(m.fechaFin) : new Date();
  const fin = new Date(base);
  fin.setDate(fin.getDate() + m.plan.duracionDias);
  return prisma.membresia.update({
    where: { id: m.id },
    data: { fechaFin: fin, estado: 'ACTIVA' },
    include: { cliente: true, plan: true }
  });
}

function cambiarEstado(id, estado) {
  return prisma.membresia.update({
    where: { id: Number(id) },
    data: { estado },
    include: { cliente: true, plan: true }
  });
}

async function porVencer(dias = 7) {
  await actualizarVencidas();
  const limite = new Date();
  limite.setDate(limite.getDate() + Number(dias));
  return prisma.membresia.findMany({
    where: { estado: 'ACTIVA', fechaFin: { lte: limite } },
    include: { cliente: true, plan: true },
    orderBy: { fechaFin: 'asc' }
  });
}

// Contadores de vencimientos para alertas del panel (sin traer los registros).
async function resumenVencimientos() {
  await actualizarVencidas();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const enDias = (n) => {
    const d = new Date(hoy); d.setDate(d.getDate() + n); d.setHours(23, 59, 59, 999); return d;
  };
  const hace30 = new Date(hoy); hace30.setDate(hace30.getDate() - 30);

  const [activas, venceEn3, venceEn7, venceEn30, vencidas, vencidasRecientes, suspendidas] =
    await Promise.all([
      prisma.membresia.count({ where: { estado: 'ACTIVA' } }),
      prisma.membresia.count({ where: { estado: 'ACTIVA', fechaFin: { gte: hoy, lte: enDias(3) } } }),
      prisma.membresia.count({ where: { estado: 'ACTIVA', fechaFin: { gte: hoy, lte: enDias(7) } } }),
      prisma.membresia.count({ where: { estado: 'ACTIVA', fechaFin: { gte: hoy, lte: enDias(30) } } }),
      prisma.membresia.count({ where: { estado: 'VENCIDA' } }),
      prisma.membresia.count({ where: { estado: 'VENCIDA', fechaFin: { gte: hace30 } } }),
      prisma.membresia.count({ where: { estado: 'SUSPENDIDA' } })
    ]);

  return { activas, venceEn3, venceEn7, venceEn30, vencidas, vencidasRecientes, suspendidas };
}

// Membresía vigente de un cliente identificado por cédula (para pagos y asistencias)
async function vigentePorCedula(cedula) {
  await actualizarVencidas();
  const cliente = await prisma.cliente.findUnique({ where: { cedula } });
  if (!cliente || !cliente.activo) throw new HttpError(404, 'Cliente no encontrado o inactivo');
  const membresia = await prisma.membresia.findFirst({
    where: { clienteId: cliente.id, estado: { in: ['ACTIVA', 'VENCIDA', 'SUSPENDIDA'] } },
    orderBy: { id: 'desc' },
    include: { plan: true }
  });
  return { cliente, membresia };
}

module.exports = {
  listar, asignar, renovar, cambiarEstado, porVencer, resumenVencimientos,
  vigentePorCedula, actualizarVencidas
};
