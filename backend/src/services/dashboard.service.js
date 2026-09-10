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

// --- Métricas ampliadas (tendencias y rankings para gráficos) ---

const claveDia = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const claveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

async function metricas() {
  await membresiaService.actualizarVencidas();
  const ahora = new Date();

  // Rango: primer día del mes, 5 meses atrás.
  const desdeMeses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
  // Rango: 00:00 de hace 6 días.
  const desdeDias = new Date(ahora); desdeDias.setDate(desdeDias.getDate() - 6); desdeDias.setHours(0, 0, 0, 0);

  const [pagos, asistencias, entrenadores, productos, clientesActivos, clientesConMembresia, distPlanes] =
    await Promise.all([
      prisma.pago.findMany({
        where: { estado: 'PAGADO', fecha: { gte: desdeMeses } },
        select: { monto: true, fecha: true }
      }),
      prisma.asistencia.findMany({
        where: { horaEntrada: { gte: desdeDias } },
        select: { horaEntrada: true }
      }),
      prisma.entrenador.findMany({
        where: { activo: true },
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          _count: { select: { clientes: { where: { activo: true } } } }
        }
      }),
      prisma.producto.findMany({
        where: { activo: true },
        select: { id: true, nombre: true, stock: true, stockMinimo: true }
      }),
      prisma.cliente.count({ where: { activo: true } }),
      prisma.cliente.count({ where: { activo: true, membresias: { some: { estado: 'ACTIVA' } } } }),
      prisma.membresia.groupBy({ by: ['planId'], where: { estado: 'ACTIVA' }, _count: { _all: true } })
    ]);

  // Ingresos por mes (6 cubos).
  const ingresosPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    ingresosPorMes.push({
      clave: claveMes(d),
      etiqueta: d.toLocaleDateString('es-EC', { month: 'short', year: '2-digit' }),
      total: 0
    });
  }
  for (const p of pagos) {
    const cubo = ingresosPorMes.find((m) => m.clave === claveMes(new Date(p.fecha)));
    if (cubo) cubo.total += Number(p.monto);
  }

  // Asistencias por día (7 cubos).
  const asistenciasPorDia = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(ahora); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    asistenciasPorDia.push({
      clave: claveDia(d),
      etiqueta: d.toLocaleDateString('es-EC', { weekday: 'short' }),
      total: 0
    });
  }
  for (const a of asistencias) {
    const cubo = asistenciasPorDia.find((x) => x.clave === claveDia(new Date(a.horaEntrada)));
    if (cubo) cubo.total += 1;
  }

  const topEntrenadores = entrenadores
    .map((e) => ({
      id: e.id,
      nombre: `${e.nombres} ${e.apellidos}`.trim(),
      clientesActivos: e._count.clientes
    }))
    .sort((a, b) => b.clientesActivos - a.clientesActivos)
    .slice(0, 5);

  const stockBajo = productos
    .filter((p) => p.stock <= p.stockMinimo)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  const nombresPlan = await prisma.plan.findMany({
    where: { id: { in: distPlanes.map((d) => d.planId) } },
    select: { id: true, nombre: true }
  });
  const distribucionPlanes = distPlanes
    .map((d) => ({
      plan: nombresPlan.find((p) => p.id === d.planId)?.nombre || '—',
      total: d._count._all
    }))
    .sort((a, b) => b.total - a.total);

  const retencion = clientesActivos
    ? Math.round((clientesConMembresia / clientesActivos) * 100)
    : 0;

  return {
    ingresosPorMes,
    asistenciasPorDia,
    topEntrenadores,
    stockBajo,
    distribucionPlanes,
    retencion,
    clientesActivos,
    clientesConMembresia,
    generadoEn: ahora
  };
}

module.exports = { resumen, metricas };
