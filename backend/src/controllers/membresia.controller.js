const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const membresiaService = require('../services/membresia.service');

module.exports = {
  listar: asyncHandler(async (req, res) => res.json(await membresiaService.listar(req.query))),
  porVencer: asyncHandler(async (req, res) => res.json(await membresiaService.porVencer(req.query.dias))),
  vigentePorCedula: asyncHandler(async (req, res) =>
    res.json(await membresiaService.vigentePorCedula(req.params.cedula))
  ),
  asignar: asyncHandler(async (req, res) => {
    const r = await membresiaService.asignar(req.body);
    auditar(req, 'ASIGNAR', 'Membresia', r.id);
    res.status(201).json(r);
  }),
  renovar: asyncHandler(async (req, res) => {
    const r = await membresiaService.renovar(req.params.id);
    auditar(req, 'RENOVAR', 'Membresia', r.id);
    res.json(r);
  }),
  cambiarEstado: asyncHandler(async (req, res) => {
    const r = await membresiaService.cambiarEstado(req.params.id, req.body.estado);
    auditar(req, 'CAMBIAR_ESTADO', 'Membresia', r.id, req.body.estado);
    res.json(r);
  })
};
