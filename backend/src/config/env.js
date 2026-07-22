// Carga y expone las variables de entorno
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'secreto_desarrollo',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '8h'
};
