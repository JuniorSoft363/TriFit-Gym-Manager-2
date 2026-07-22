const { crudController } = require('../utils/crud');
const ejercicioService = require('../services/ejercicio.service');
module.exports = crudController(ejercicioService, 'Ejercicio');
