// Autenticación: login con email/contraseña, emisión de access token corto
// y refresh token con rotación.
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { compararPassword } = require('../utils/password');
const { firmarToken } = require('../utils/jwt');
const sesionService = require('./sesion.service');

function shapeBasico(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono || '',
    direccion: u.direccion || '',
    fotoUrl: u.fotoUrl || '',
    rol: u.rol.nombre,
    debeCambiarPassword: !!u.debeCambiarPassword
  };
}

async function login(email, password) {
  const u = await prisma.usuario.findUnique({ where: { email }, include: { rol: true } });
  if (!u || !u.activo) throw new HttpError(401, 'Credenciales incorrectas');
  const ok = await compararPassword(password, u.passwordHash);
  if (!ok) throw new HttpError(401, 'Credenciales incorrectas');
  const usuario = shapeBasico(u);
  return {
    token: firmarToken(usuario),
    refreshToken: await sesionService.crearSesion(u.id),
    usuario
  };
}

// Renueva la sesión: rota el refresh y emite un access token nuevo.
async function refrescar(refreshToken) {
  const { token, usuarioId } = await sesionService.rotar(refreshToken);
  const u = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    include: { rol: true }
  });
  if (!u.activo) throw new HttpError(401, 'Usuario desactivado');
  const usuario = shapeBasico(u);
  return { token: firmarToken(usuario), refreshToken: token, usuario };
}

async function cerrarSesion(refreshToken) {
  await sesionService.revocar(refreshToken);
  return { ok: true };
}

async function perfil(id) {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { id }, include: { rol: true } });
  return shapeBasico(u);
}

module.exports = { login, refrescar, cerrarSesion, perfil };
