const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { HttpError } = require('../utils/httpError');
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

// Acepta orígenes exactos y comodines de subdominio (*.ejemplo.com).
// El comodín de túneles es para sesiones UAT; en producción usa el dominio exacto.
function origenPermitido(origen) {
  if (!origen) return true; // curl, apps móviles, healthchecks
  if (origenesPermitidos.includes(origen)) return true;
  let u;
  try {
    u = new URL(origen);
  } catch {
    return false;
  }
  return origenesPermitidos.some((p) => {
    const m = p.match(/^(https?:\/\/)?\*\.([^/]+)$/);
    if (!m) return false;
    if (m[1] && `${u.protocol}//` !== m[1]) return false;
    return u.hostname === m[2] || u.hostname.endsWith(`.${m[2]}`);
  });
}

const corsRestringido = cors({
  origin: (origen, cb) => {
    if (origenPermitido(origen)) return cb(null, true);
    // 403 controlado (antes era un Error sin estado → 500 genérico).
    return cb(new HttpError(403, 'Origen no permitido', 'ORIGEN_NO_PERMITIDO'));
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

module.exports = { cabeceras, corsRestringido, limiteLogin, limiteApi, origenPermitido };
