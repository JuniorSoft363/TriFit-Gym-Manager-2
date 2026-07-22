// Recolecta los errores de express-validator y responde 400 si existen
const { validationResult } = require('express-validator');

function validar(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      mensaje: 'Datos inválidos',
      errores: errores.array().map((e) => e.msg)
    });
  }
  next();
}
module.exports = { validar };
