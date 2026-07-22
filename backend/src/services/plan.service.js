// Gestión de planes de membresía
const { crudService } = require('../utils/crud');
module.exports = crudService('plan', { camposBusqueda: ['nombre'] });
