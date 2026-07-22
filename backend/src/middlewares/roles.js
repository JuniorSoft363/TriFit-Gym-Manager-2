// Middleware de autorización por roles
const { HttpError } = require('../utils/httpError');

const permitirRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return next(new HttpError(403, 'No tiene permisos para realizar esta acción'));
  }
  next();
};
module.exports = { permitirRoles };
