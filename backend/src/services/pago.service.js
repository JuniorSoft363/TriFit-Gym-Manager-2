// Gestión de pagos
const prisma = require('../config/prisma');
const { getPaginacion } = require('../utils/paginacion');

async function listar(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.estado) where.estado = query.estado;
  if (query.metodo) where.metodo = query.metodo;
  if (query.desde || query.hasta) {
    where.fecha = {};
    if (query.desde) where.fecha.gte = new Date(query.desde);
    if (query.hasta) {
      const h = new Date(query.hasta);
      h.setHours(23, 59, 59, 999);
      where.fecha.lte = h;
    }
  }
  if (query.busqueda) {
    where.membresia = {
      cliente: {
        OR: [
          { cedula: { contains: query.busqueda } },
          { nombres: { contains: query.busqueda, mode: 'insensitive' } },
          { apellidos: { contains: query.busqueda, mode: 'insensitive' } }
        ]
      }
    };
  }
  const [total, datos, suma] = await Promise.all([
    prisma.pago.count({ where }),
    prisma.pago.findMany({
      where, skip, take,
      include: { membresia: { include: { cliente: true, plan: true } } },
      orderBy: { id: 'desc' }
    }),
    prisma.pago.aggregate({ _sum: { monto: true }, where: { ...where, estado: 'PAGADO' } })
  ]);
  return { datos, total, page, limit, sumaTotal: suma._sum.monto || 0 };
}

function registrar({ membresiaId, monto, metodo, observacion, estado }, usuarioId) {
  return prisma.pago.create({
    data: {
      membresiaId: Number(membresiaId),
      monto,
      metodo,
      estado: estado || 'PAGADO',
      observacion: observacion || null,
      usuarioId: usuarioId || null
    },
    include: { membresia: { include: { cliente: true, plan: true } } }
  });
}

function anular(id) {
  return prisma.pago.update({ where: { id: Number(id) }, data: { estado: 'ANULADO' } });
}

module.exports = { listar, registrar, anular };
