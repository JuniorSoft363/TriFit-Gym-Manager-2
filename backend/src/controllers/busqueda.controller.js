const asyncHandler = require('../utils/asyncHandler');
const busquedaService = require('../services/busqueda.service');

module.exports = {
  global: asyncHandler(async (req, res) =>
    res.json(await busquedaService.global(req.query.q, req.usuario))
  )
};
