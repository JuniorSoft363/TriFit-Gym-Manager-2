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

// Consulta un código de barras en Open Food Facts (base de datos abierta) y
// devuelve datos normalizados para autocompletar el formulario de producto.
// Si el producto trae foto, se descarga al volumen local para servirla same-origin.
const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';

async function consultarCodigoBarras(codigo) {
  const limpio = String(codigo || '').replace(/\D/g, '');
  if (limpio.length < 6) throw new HttpError(400, 'Código de barras inválido');

  let json;
  try {
    const resp = await fetch(
      `${OFF_URL}/${limpio}.json?fields=product_name,product_name_es,brands,categories,quantity,image_front_url,image_url`,
      { headers: { 'User-Agent': 'TriFit-Gym-Manager/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    json = await resp.json();
  } catch {
    throw new HttpError(502, 'No se pudo consultar la base de datos externa. Revisa la conexión.');
  }
  if (!json || json.status !== 1 || !json.product) {
    throw new HttpError(404, 'No se encontró ningún producto con ese código de barras');
  }

  const p = json.product;
  const nombre = [p.brands ? p.brands.split(',')[0].trim() : '', p.product_name_es || p.product_name || '']
    .filter(Boolean)
    .join(' ')
    .trim();
  const categoria = (p.categories || '').split(',').map((c) => c.trim()).filter(Boolean).slice(-1)[0] || '';

  let imagenUrl = null;
  const fotoRemota = p.image_front_url || p.image_url;
  if (fotoRemota) {
    try {
      const img = await fetch(fotoRemota, { signal: AbortSignal.timeout(8000) });
      if (img.ok) {
        const buffer = Buffer.from(await img.arrayBuffer());
        if (buffer.length && buffer.length < 5 * 1024 * 1024) {
          const carpeta = path.join(__dirname, '..', '..', 'uploads', 'productos');
          if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });
          const nombreArchivo = `off_${limpio}_${Date.now()}.jpg`;
          fs.writeFileSync(path.join(carpeta, nombreArchivo), buffer);
          imagenUrl = `/uploads/productos/${nombreArchivo}`;
        }
      }
    } catch {
      /* la foto es opcional: si falla, se devuelve el resto igual */
    }
  }

  return {
    codigo: limpio,
    nombre: nombre || `Producto ${limpio}`,
    descripcion: [categoria, p.quantity].filter(Boolean).join(' · '),
    imagenUrl,
    fuente: 'Open Food Facts'
  };
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
  listarMovimientosProducto,
  consultarCodigoBarras
};
