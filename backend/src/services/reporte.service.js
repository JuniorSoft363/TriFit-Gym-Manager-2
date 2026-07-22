// Reportes en forma de tablas con filtros y paginación
const prisma = require('../config/prisma');
const { getPaginacion } = require('../utils/paginacion');
const membresiaService = require('./membresia.service');
const pagoService = require('./pago.service');
const asistenciaService = require('./asistencia.service');

async function clientes(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.activo !== undefined && query.activo !== '') where.activo = query.activo === 'true';
  if (query.busqueda) {
    where.OR = [
      { cedula: { contains: query.busqueda } },
      { nombres: { contains: query.busqueda, mode: 'insensitive' } },
      { apellidos: { contains: query.busqueda, mode: 'insensitive' } }
    ];
  }
  const [total, datos] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where, skip, take,
      include: { membresias: { orderBy: { id: 'desc' }, take: 1, include: { plan: true } } },
      orderBy: { id: 'desc' }
    })
  ]);
  return { datos, total, page, limit };
}

const membresias = (query) => membresiaService.listar(query);
const ingresos = (query) => pagoService.listar({ ...query, estado: query.estado || 'PAGADO' });
const asistencias = (query) => asistenciaService.listar(query);

async function inventario(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = { activo: true };
  if (query.tipo) where.tipo = query.tipo;
  if (query.busqueda) where.nombre = { contains: query.busqueda, mode: 'insensitive' };
  let datos = await prisma.producto.findMany({ where, include: { proveedor: true }, orderBy: { id: 'desc' } });
  if (query.bajoStock === 'true') datos = datos.filter((p) => p.stock <= p.stockMinimo);
  const total = datos.length;
  return { datos: datos.slice(skip, skip + take), total, page, limit };
}

module.exports = { clientes, membresias, ingresos, asistencias, inventario };
