const asyncHandler = require('../utils/asyncHandler');
const { crudController } = require('../utils/crud');
const clienteService = require('../services/cliente.service');

module.exports = {
  ...crudController(clienteService, 'Cliente'),
  porCedula: asyncHandler(async (req, res) => res.json(await clienteService.porCedula(req.params.cedula))),
  historial: asyncHandler(async (req, res) => res.json(await clienteService.historial(req.params.id)))
};
