// Middleware de autenticación: valida el JWT y adjunta el usuario a la petición.
// Además exige cambio de contraseña cuando el usuario aún usa una inicial
// (debeCambiarPassword) y rechaza tokens de usuarios desactivados.
const { verificarToken } = require('../utils/jwt');
const { HttpError } = require('../utils/httpError');
const prisma = require('../config/prisma');

// Rutas que un usuario con cambio pendiente SÍ puede usar.
const RUTAS_EXENTAS = new Set([
  'POST /api/auth/login',
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
  'GET /api/auth/perfil',
  'PUT /api/auth/perfil/password'
]);

async function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Token no proporcionado'));
  try {
    req.usuario = verificarToken(token);
  } catch {
    return next(new HttpError(401, 'Token inválido o expirado'));
  }
  try {
    const u = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { activo: true, debeCambiarPassword: true }
    });
    if (!u || !u.activo) return next(new HttpError(401, 'Usuario desactivado'));
    const ruta = `${req.method} ${req.originalUrl.split('?')[0]}`;
    if (u.debeCambiarPassword && !RUTAS_EXENTAS.has(ruta)) {
      return next(
        new HttpError(403, 'Debes cambiar tu contraseña antes de continuar', 'PASSWORD_CAMBIAR_REQUERIDO')
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}
module.exports = { autenticar };
