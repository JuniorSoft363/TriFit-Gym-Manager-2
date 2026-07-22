const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
module.exports = { resumen: asyncHandler(async (req, res) => res.json(await dashboardService.resumen())) };
