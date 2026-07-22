// Inventario: productos, proveedores y movimientos de stock
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { getPaginacion } = require('../utils/paginacion');
const { crudService } = require('../utils/crud');

const productos = crudService('producto', {
  camposBusqueda: ['nombre'],
  incluir: { proveedor: true }
});
const proveedores = crudService('proveedor', { camposBusqueda: ['nombre', 'ruc'] });

async function registrarMovimiento({ productoId, tipo, cantidad, observacion }, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUniqueOrThrow({ where: { id: Number(productoId) } });
    let nuevoStock = producto.stock;
    if (tipo === 'ENTRADA') nuevoStock += cantidad;
    if (tipo === 'SALIDA') {
      nuevoStock -= cantidad;
      if (nuevoStock < 0) throw new HttpError(409, 'Stock insuficiente para registrar la salida');
    }
    if (tipo === 'AJUSTE') nuevoStock = cantidad;
    await tx.producto.update({ where: { id: producto.id }, data: { stock: nuevoStock } });
    return tx.inventario.create({
      data: {
        productoId: producto.id,
        tipo,
        cantidad,
        observacion: observacion || null,
        usuarioId: usuarioId || null
      },
      include: { producto: true }
    });
  });
}

async function listarMovimientos(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.productoId) where.productoId = Number(query.productoId);
  if (query.tipo) where.tipo = query.tipo;
  const [total, datos] = await Promise.all([
    prisma.inventario.count({ where }),
    prisma.inventario.findMany({
      where, skip, take,
      include: { producto: true, usuario: { select: { nombre: true } } },
      orderBy: { id: 'desc' }
    })
  ]);
  return { datos, total, page, limit };
}

module.exports = { productos, proveedores, registrarMovimiento, listarMovimientos };
