// Carga y expone las variables de entorno.
// En producción se exige un JWT_SECRET real: los valores de ejemplo son
// públicos (están en el repo) y permitirían falsificar tokens.
require('dotenv').config();

const SECRETOS_EJEMPLO = new Set(['secreto_desarrollo', 'cambia_este_secreto_en_produccion']);

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_desarrollo';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || SECRETOS_EJEMPLO.has(JWT_SECRET))) {
  console.error(
    '[seguridad] JWT_SECRET no configurado o con valor de ejemplo. ' +
      'Define JWT_SECRET con un valor aleatorio (openssl rand -base64 48). Arranque abortado.'
  );
  process.exit(1);
}

if (SECRETOS_EJEMPLO.has(JWT_SECRET)) {
  console.warn('[seguridad] Aviso: usando JWT_SECRET de ejemplo (solo válido en desarrollo).');
}

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '8h'
};
