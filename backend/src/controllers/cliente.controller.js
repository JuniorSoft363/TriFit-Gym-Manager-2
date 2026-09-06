const asyncHandler = require('../utils/asyncHandler');
const { crudController } = require('../utils/crud');
const clienteService = require('../services/cliente.service');

module.exports = {
  ...crudController(clienteService, 'Cliente'),
  listar: asyncHandler(async (req, res) => res.json(await clienteService.listar(req.query, req.usuario))),
  obtener: asyncHandler(async (req, res) =>
    res.json(await clienteService.obtener(req.params.id, req.usuario))
  ),
  porCedula: asyncHandler(async (req, res) =>
    res.json(await clienteService.porCedula(req.params.cedula, req.usuario))
  ),
  historial: asyncHandler(async (req, res) =>
    res.json(await clienteService.historial(req.params.id, req.usuario))
  )
};
