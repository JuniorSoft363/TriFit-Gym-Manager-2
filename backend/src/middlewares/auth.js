// Middleware de autenticación: valida el JWT y adjunta el usuario a la petición
const { verificarToken } = require('../utils/jwt');
const { HttpError } = require('../utils/httpError');

function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Token no proporcionado'));
  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
}
module.exports = { autenticar };
