// Inventario: productos, proveedores y movimientos de stock
const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { getPaginacion } = require('../utils/paginacion');
const { crudService } = require('../utils/crud');

const productos = crudService('producto', {
  camposBusqueda: ['nombre'],
  incluir: { proveedor: true }
});
const proveedores = crudService('proveedor', { camposBusqueda: ['nombre', 'ruc'] });

function eliminarImagenAnterior(imagenUrl) {
  if (!imagenUrl) return;
  const ruta = path.join(__dirname, '..', '..', imagenUrl.replace(/^\//, ''));
  fs.unlink(ruta, () => {});
}

async function actualizarImagenProducto(id, archivo) {
  if (!archivo) throw new HttpError(400, 'No se proporcionó ninguna imagen');
  const mime = archivo.mimetype || '';
  if (!mime.startsWith('image/')) throw new HttpError(400, 'El archivo debe ser una imagen');
  if (archivo.size > 5 * 1024 * 1024) throw new HttpError(400, 'La imagen no puede superar 5MB');

  const anterior = await prisma.producto.findUnique({ where: { id: Number(id) }, select: { imagenUrl: true } });
  const ext = path.extname(archivo.originalname) || '.jpg';
  const nombreArchivo = `producto_${id}_${Date.now()}${ext}`;
  const carpetaDestino = path.join(__dirname, '..', '..', 'uploads', 'productos');
  if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });
  const rutaDestino = path.join(carpetaDestino, nombreArchivo);
  fs.renameSync(archivo.path, rutaDestino);
  if (anterior?.imagenUrl) eliminarImagenAnterior(anterior.imagenUrl);

  const imagenUrl = `/uploads/productos/${nombreArchivo}`;
  return prisma.producto.update({
    where: { id: Number(id) },
    data: { imagenUrl },
    include: { proveedor: true }
  });
}

async function listarMovimientosProducto(productoId) {
  return prisma.inventario.findMany({
    where: { productoId: Number(productoId) },
    include: { usuario: { select: { nombre: true } } },
    orderBy: { id: 'desc' },
    take: 10
  });
}

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

module.exports = {
  productos,
  proveedores,
  registrarMovimiento,
  listarMovimientos,
  actualizarImagenProducto,
  listarMovimientosProducto
};
