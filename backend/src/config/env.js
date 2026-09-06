// Carga y expone las variables de entorno.
// En producción se exige un JWT_SECRET real: los valores de ejemplo son
// públicos (están en el repo) y permitirían falsificar tokens.
require('dotenv').config();
const logger = require('../utils/logger');

const SECRETOS_EJEMPLO = new Set(['secreto_desarrollo', 'cambia_este_secreto_en_produccion']);

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_desarrollo';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || SECRETOS_EJEMPLO.has(JWT_SECRET))) {
  logger.error('arranque_abortado', {
    motivo: 'JWT_SECRET no configurado o con valor de ejemplo. Define JWT_SECRET con un valor aleatorio (openssl rand -base64 48).'
  });
  process.exit(1);
}

if (SECRETOS_EJEMPLO.has(JWT_SECRET)) {
  logger.warn('jwt_ejemplo', { detalle: 'usando JWT_SECRET de ejemplo (solo válido en desarrollo)' });
}

const DIAS_REFRESH = Number(process.env.REFRESH_EXPIRES_DIAS || 7);

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET,
  // Access token corto; la sesión se mantiene viva con el refresh token.
  JWT_EXPIRES: process.env.JWT_EXPIRES || '30m',
  REFRESH_EXPIRES_MS: DIAS_REFRESH * 24 * 60 * 60 * 1000
};
