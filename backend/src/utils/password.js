// Cifrado y verificación de contraseñas con bcrypt
const bcrypt = require('bcryptjs');

const hashPassword = (password) => bcrypt.hash(password, 10);
const compararPassword = (password, hash) => bcrypt.compare(password, hash);

module.exports = { hashPassword, compararPassword };
