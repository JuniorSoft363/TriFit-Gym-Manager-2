const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { LOGIN_RATE_MAX, LOGIN_RATE_VENTANA_MIN, API_RATE_MAX, API_RATE_VENTANA_MIN } = require('../config/env');

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

// Antifuerza bruta en login (por IP) y protección general de la API.
const limiteLogin = rateLimit({
  windowMs: LOGIN_RATE_VENTANA_MIN * 60 * 1000,
  limit: LOGIN_RATE_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: respuestaLimite
});

const limiteApi = rateLimit({
  windowMs: API_RATE_VENTANA_MIN * 60 * 1000,
  limit: API_RATE_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: respuestaLimite
});

module.exports = { cabeceras, corsRestringido, limiteLogin, limiteApi };
