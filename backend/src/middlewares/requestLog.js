// Asigna un ID de correlación por petición, lo devuelve en X-Request-Id
// y registra una línea estructurada al terminar (método, ruta sin query,
// estado, latencia, usuario e IP). Se omite el healthcheck de Docker.
const crypto = require('crypto');
const logger = require('../utils/logger');

function requestLog(req, res, next) {
  // Se omite el healthcheck de Docker (HEAD /) para no ensuciar el log.
  if (req.path === '/') return next();
  const id = crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  const inicio = Date.now();
  res.on('finish', () => {
    logger.info('peticion', {
      reqId: id,
      metodo: req.method,
      ruta: req.originalUrl.split('?')[0],
      estado: res.statusCode,
      ms: Date.now() - inicio,
      usuarioId: req.usuario && req.usuario.id,
      ip: req.ip
    });
  });
  next();
}

module.exports = { requestLog };
