const { crudController } = require('../utils/crud');
const planService = require('../services/plan.service');
module.exports = crudController(planService, 'Plan');
