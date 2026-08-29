// Autenticación: login con email/contraseña y emisión de JWT
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { compararPassword } = require('../utils/password');
const { firmarToken } = require('../utils/jwt');

function shapeBasico(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono || '',
    direccion: u.direccion || '',
    fotoUrl: u.fotoUrl || '',
    rol: u.rol.nombre
  };
}

async function login(email, password) {
  const u = await prisma.usuario.findUnique({ where: { email }, include: { rol: true } });
  if (!u || !u.activo) throw new HttpError(401, 'Credenciales incorrectas');
  const ok = await compararPassword(password, u.passwordHash);
  if (!ok) throw new HttpError(401, 'Credenciales incorrectas');
  const usuario = shapeBasico(u);
  return { token: firmarToken(usuario), usuario };
}

async function perfil(id) {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { id }, include: { rol: true } });
  return shapeBasico(u);
}

module.exports = { login, perfil };
