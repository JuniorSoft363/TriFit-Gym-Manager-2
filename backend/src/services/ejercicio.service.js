// Gestión de ejercicios
const { crudService } = require('../utils/crud');
module.exports = crudService('ejercicio', { camposBusqueda: ['nombre', 'grupoMuscular'] });
