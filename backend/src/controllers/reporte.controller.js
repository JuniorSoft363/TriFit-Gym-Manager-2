const asyncHandler = require('../utils/asyncHandler');
const reporteService = require('../services/reporte.service');

const envolver = (fn) => asyncHandler(async (req, res) => res.json(await fn(req.query)));

module.exports = {
  clientes: envolver(reporteService.clientes),
  membresias: envolver(reporteService.membresias),
  ingresos: envolver(reporteService.ingresos),
  asistencias: envolver(reporteService.asistencias),
  inventario: envolver(reporteService.inventario)
};
