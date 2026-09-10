const { crudController } = require('../utils/crud');
const asyncHandler = require('../utils/asyncHandler');
const planService = require('../services/plan.service');

module.exports = {
  ...crudController(planService, 'Plan'),
  publicos: asyncHandler(async (req, res) => res.json(await planService.publicos()))
};
