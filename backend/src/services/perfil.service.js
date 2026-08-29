// Perfil del usuario autenticado: ver y actualizar datos, cambiar contraseña y subir foto
const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { hashPassword, compararPassword } = require('../utils/password');

function shapeUsuario(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono || '',
    direccion: u.direccion || '',
    fotoUrl: u.fotoUrl || '',
    rol: u.rol ? u.rol.nombre : null,
    activo: u.activo,
    creadoEn: u.creadoEn,
    actualizadoEn: u.actualizadoEn
  };
}

async function obtenerPerfil(id) {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { id }, include: { rol: true } });
  return shapeUsuario(u);
}

async function actualizarPerfil(id, datos) {
  const { nombre, email, telefono, direccion } = datos;
  if (email) {
    const existe = await prisma.usuario.findFirst({ where: { email, NOT: { id } } });
    if (existe) throw new HttpError(409, 'El correo ya está en uso por otro usuario');
  }
  const actualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...(nombre !== undefined ? { nombre } : {}),
      ...(email !== undefined ? { email } : {}),
      telefono: telefono === '' ? null : telefono,
      direccion: direccion === '' ? null : direccion
    },
    include: { rol: true }
  });
  return shapeUsuario(actualizado);
}

async function cambiarPassword(id, passwordActual, passwordNuevo) {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { id } });
  const ok = await compararPassword(passwordActual, u.passwordHash);
  if (!ok) throw new HttpError(400, 'La contraseña actual es incorrecta');
  if (!passwordNuevo || passwordNuevo.length < 6) {
    throw new HttpError(400, 'La nueva contraseña debe tener al menos 6 caracteres');
  }
  if (passwordActual === passwordNuevo) {
    throw new HttpError(400, 'La nueva contraseña debe ser diferente a la actual');
  }
  const passwordHash = await hashPassword(passwordNuevo);
  await prisma.usuario.update({ where: { id }, data: { passwordHash } });
  return { ok: true };
}

function eliminarFotoAnterior(fotoUrl) {
  if (!fotoUrl) return;
  const ruta = path.join(__dirname, '..', '..', fotoUrl.replace(/^\//, ''));
  fs.unlink(ruta, () => {});
}

async function actualizarFoto(id, archivo) {
  if (!archivo) throw new HttpError(400, 'No se proporcionó ninguna imagen');
  const mime = archivo.mimetype || '';
  if (!mime.startsWith('image/')) throw new HttpError(400, 'El archivo debe ser una imagen');
  if (archivo.size > 5 * 1024 * 1024) throw new HttpError(400, 'La imagen no puede superar 5MB');

  const anterior = await prisma.usuario.findUnique({ where: { id }, select: { fotoUrl: true } });
  const ext = path.extname(archivo.originalname) || '.jpg';
  const nombreArchivo = `usuario_${id}_${Date.now()}${ext}`;
  const carpetaDestino = path.join(__dirname, '..', '..', 'uploads', 'perfiles');
  if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });
  const rutaDestino = path.join(carpetaDestino, nombreArchivo);
  fs.renameSync(archivo.path, rutaDestino);
  if (anterior?.fotoUrl) eliminarFotoAnterior(anterior.fotoUrl);

  const fotoUrl = `/uploads/perfiles/${nombreArchivo}`;
  const actualizado = await prisma.usuario.update({
    where: { id },
    data: { fotoUrl },
    include: { rol: true }
  });
  return shapeUsuario(actualizado);
}

module.exports = { obtenerPerfil, actualizarPerfil, cambiarPassword, actualizarFoto };
