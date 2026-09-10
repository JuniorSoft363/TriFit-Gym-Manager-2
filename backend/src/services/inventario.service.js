// Inventario: productos, proveedores y movimientos de stock
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
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
const OFF_AGENTE = 'TriFit-Gym-Manager/1.0';
const FOTO_MAX_BYTES = 5 * 1024 * 1024;
const PETICION_TIMEOUT_MS = 8000;

// Dominios desde los que se acepta descargar la foto. La URL de la imagen llega
// dentro de la respuesta de Open Food Facts, que es una base editable por la
// comunidad: sin esta comprobación una ficha manipulada podría conseguir que el
// servidor pidiera una dirección de la red interna.
const FOTO_DOMINIOS = ['openfoodfacts.org', 'openfoodfacts.net'];

function fotoPermitida(url) {
  let destino;
  try {
    destino = new URL(url);
  } catch {
    return false;
  }
  if (destino.protocol !== 'https:') return false;
  return FOTO_DOMINIOS.some((d) => destino.hostname === d || destino.hostname.endsWith(`.${d}`));
}

// El content-type lo declara el servidor remoto; los primeros bytes no, así que
// se comprueba la firma real del archivo antes de guardarlo.
function extensionDeImagen(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg';
  if (buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return '.png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  return null;
}

// Las redirecciones se siguen a mano para que un 302 no pueda sacar la petición
// fuera de los dominios permitidos.
async function descargarFoto(urlOriginal) {
  let actual = urlOriginal;
  for (let salto = 0; salto < 3; salto += 1) {
    if (!fotoPermitida(actual)) return null;
    const resp = await fetch(actual, {
      redirect: 'manual',
      headers: { 'User-Agent': OFF_AGENTE },
      signal: AbortSignal.timeout(PETICION_TIMEOUT_MS)
    });
    if (resp.status >= 300 && resp.status < 400) {
      const siguiente = resp.headers.get('location');
      if (!siguiente) return null;
      actual = new URL(siguiente, actual).toString();
      continue;
    }
    if (!resp.ok) return null;
    if (!(resp.headers.get('content-type') || '').toLowerCase().startsWith('image/')) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    if (!buffer.length || buffer.length > FOTO_MAX_BYTES) return null;
    const ext = extensionDeImagen(buffer);
    return ext ? { buffer, ext } : null;
  }
  return null;
}

// La foto se guarda al consultar el código, antes de que el admin decida si crea
// el producto: las que nunca llegaron a usarse se barren pasado un día. Solo se
// tocan archivos con prefijo off_ que no estén referenciados en la base; las
// imágenes subidas a mano (producto_*) nunca entran aquí.
const HUERFANA_MS = 24 * 60 * 60 * 1000;

async function limpiarFotosHuerfanas(carpeta) {
  const archivos = (await fsp.readdir(carpeta)).filter((n) => n.startsWith('off_'));
  const ahora = Date.now();
  const candidatas = [];
  for (const nombre of archivos) {
    const info = await fsp.stat(path.join(carpeta, nombre)).catch(() => null);
    if (info && ahora - info.mtimeMs > HUERFANA_MS) candidatas.push(nombre);
  }
  if (!candidatas.length) return;

  const enUso = await prisma.producto.findMany({
    where: { imagenUrl: { in: candidatas.map((n) => `/uploads/productos/${n}`) } },
    select: { imagenUrl: true }
  });
  const referenciadas = new Set(enUso.map((p) => p.imagenUrl));
  for (const nombre of candidatas) {
    if (referenciadas.has(`/uploads/productos/${nombre}`)) continue;
    await fsp.unlink(path.join(carpeta, nombre)).catch(() => {});
  }
}

async function consultarCodigoBarras(codigo) {
  const limpio = String(codigo || '').replace(/\D/g, '');
  if (limpio.length < 6) throw new HttpError(400, 'Código de barras inválido');

  let json;
  try {
    const resp = await fetch(
      `${OFF_URL}/${limpio}.json?fields=product_name,product_name_es,brands,categories,quantity,image_front_url,image_url`,
      { headers: { 'User-Agent': OFF_AGENTE }, signal: AbortSignal.timeout(PETICION_TIMEOUT_MS) }
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
      const foto = await descargarFoto(fotoRemota);
      if (foto) {
        const carpeta = path.join(__dirname, '..', '..', 'uploads', 'productos');
        await fsp.mkdir(carpeta, { recursive: true });
        // Nombre fijo por código: repetir la consulta reescribe el mismo archivo
        // en vez de dejar una copia nueva cada vez.
        const nombreArchivo = `off_${limpio}${foto.ext}`;
        await fsp.writeFile(path.join(carpeta, nombreArchivo), foto.buffer);
        imagenUrl = `/uploads/productos/${nombreArchivo}`;
        limpiarFotosHuerfanas(carpeta).catch(() => {});
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
