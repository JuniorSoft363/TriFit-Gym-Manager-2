// Cifrado, verificación y política de contraseñas con bcrypt.
// Política: mínimo 8 caracteres, al menos una letra y un número.
const bcrypt = require('bcryptjs');

const POLITICA = { minLongitud: 8 };

const hashPassword = (password) => bcrypt.hash(password, 10);
const compararPassword = (password, hash) => bcrypt.compare(password, hash);

// Devuelve el mensaje de incumplimiento o null si cumple la política.
function validarPolitica(password) {
  if (!password || password.length < POLITICA.minLongitud) {
    return `La contraseña debe tener al menos ${POLITICA.minLongitud} caracteres`;
  }
  if (!/[A-Za-z]/.test(password)) return 'La contraseña debe incluir al menos una letra';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número';
  return null;
}

module.exports = { hashPassword, compararPassword, validarPolitica, POLITICA };
