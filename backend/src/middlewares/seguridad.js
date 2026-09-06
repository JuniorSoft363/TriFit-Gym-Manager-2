const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

// Cabeceras de seguridad. crossOriginResourcePolicy en 'cross-origin'
// porque /uploads sirve imágenes que el frontend puede pedir directo.
const cabeceras = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

// CORS restringido a los orígenes del frontend.
// Configurable con CORS_ORIGIN="https://app.midominio.com" (coma-separado).
const origenesPermitidos = (process.env.CORS_ORIGIN || 'https://localhost:8443,http://localhost:4200')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsRestringido = cors({
  origin: (origen, cb) => {
    // Sin Origin (curl, apps móviles, healthchecks) se permite.
    if (!origen || origenesPermitidos.includes(origen)) return cb(null, true);
    return cb(new Error('Origen no permitido por CORS'));
  }
});

const respuestaLimite = (req, res) =>
  res.status(429).json({ mensaje: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });

// Antifuerza bruta en login: 10 intentos / 15 min por IP.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: respuestaLimite
});

// Protección general de la API: 300 req / 15 min por IP.
const limiteApi = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: respuestaLimite
});

module.exports = { cabeceras, corsRestringido, limiteLogin, limiteApi };
