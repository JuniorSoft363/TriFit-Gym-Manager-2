// Sesiones de refresco: token opaco aleatorio, rotación en cada uso,
// detección de reuso (posible robo) y revocación.
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { REFRESH_EXPIRES_MS } = require('../config/env');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function generarToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function limpiarExpiradas() {
  await prisma.sesionRefresh.deleteMany({ where: { expiraEn: { lt: new Date() } } });
}

async function crearSesion(usuarioId) {
  await limpiarExpiradas();
  const token = generarToken();
  await prisma.sesionRefresh.create({
    data: {
      tokenHash: hashToken(token),
      usuarioId,
      expiraEn: new Date(Date.now() + REFRESH_EXPIRES_MS)
    }
  });
  return token;
}

async function revocar(token) {
  if (!token) return;
  const s = await prisma.sesionRefresh.findUnique({ where: { tokenHash: hashToken(token) } });
  if (s && !s.revocadoEn) {
    await prisma.sesionRefresh.update({ where: { id: s.id }, data: { revocadoEn: new Date() } });
  }
}

// Rotación: valida el token actual, lo revoca y emite uno nuevo.
// Si se presenta un token ya revocado, se asume robo y se cierran TODAS
// las sesiones del usuario.
async function rotar(token) {
  if (!token) throw new HttpError(401, 'Sesión inválida');
  const s = await prisma.sesionRefresh.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!s) throw new HttpError(401, 'Sesión inválida');

  if (s.revocadoEn) {
    await prisma.sesionRefresh.updateMany({
      where: { usuarioId: s.usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() }
    });
    throw new HttpError(401, 'Sesión inválida');
  }

  if (s.expiraEn < new Date()) {
    await prisma.sesionRefresh.update({ where: { id: s.id }, data: { revocadoEn: new Date() } });
    throw new HttpError(401, 'Sesión expirada');
  }

  await prisma.sesionRefresh.update({ where: { id: s.id }, data: { revocadoEn: new Date() } });
  const nuevoToken = await crearSesion(s.usuarioId);
  return { token: nuevoToken, usuarioId: s.usuarioId };
}

async function revocarTodas(usuarioId) {
  await prisma.sesionRefresh.updateMany({
    where: { usuarioId, revocadoEn: null },
    data: { revocadoEn: new Date() }
  });
}

module.exports = { crearSesion, revocar, rotar, revocarTodas };
