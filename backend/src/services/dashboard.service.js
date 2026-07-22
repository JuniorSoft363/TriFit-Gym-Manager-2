// Indicadores del panel principal
const prisma = require('../config/prisma');
const membresiaService = require('./membresia.service');

async function resumen() {
  await membresiaService.actualizarVencidas();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
  const en7 = new Date(); en7.setDate(en7.getDate() + 7);

  const [
    clientesActivos, membresiasActivas, membresiasPorVencer,
    asistenciasHoy, ingresosDia, ingresosMes, ultimosPagos
  ] = await Promise.all([
    prisma.cliente.count({ where: { activo: true } }),
    prisma.membresia.count({ where: { estado: 'ACTIVA' } }),
    prisma.membresia.count({ where: { estado: 'ACTIVA', fechaFin: { lte: en7 } } }),
    prisma.asistencia.count({ where: { horaEntrada: { gte: hoy } } }),
    prisma.pago.aggregate({ _sum: { monto: true }, where: { estado: 'PAGADO', fecha: { gte: hoy } } }),
    prisma.pago.aggregate({ _sum: { monto: true }, where: { estado: 'PAGADO', fecha: { gte: mes } } }),
    prisma.pago.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: { membresia: { include: { cliente: true, plan: true } } }
    })
  ]);

  return {
    clientesActivos,
    membresiasActivas,
    membresiasPorVencer,
    asistenciasHoy,
    ingresosDia: ingresosDia._sum.monto || 0,
    ingresosMes: ingresosMes._sum.monto || 0,
    ultimosPagos
  };
}

module.exports = { resumen };
