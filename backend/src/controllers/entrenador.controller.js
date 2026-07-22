const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const { crudController } = require('../utils/crud');
const entrenadorService = require('../services/entrenador.service');

module.exports = {
  ...crudController(entrenadorService, 'Entrenador'),
  clientes: asyncHandler(async (req, res) => res.json(await entrenadorService.clientesDe(req.params.id))),
  asignarCliente: asyncHandler(async (req, res) => {
    const r = await entrenadorService.asignarCliente(req.params.id, req.body.clienteId);
    auditar(req, 'ASIGNAR_CLIENTE', 'Entrenador', Number(req.params.id));
    res.status(201).json(r);
  }),
  quitarCliente: asyncHandler(async (req, res) => {
    const r = await entrenadorService.quitarCliente(req.params.id, req.params.clienteId);
    auditar(req, 'QUITAR_CLIENTE', 'Entrenador', Number(req.params.id));
    res.json(r);
  })
};
