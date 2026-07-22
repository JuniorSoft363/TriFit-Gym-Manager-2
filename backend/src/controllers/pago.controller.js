const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const pagoService = require('../services/pago.service');

module.exports = {
  listar: asyncHandler(async (req, res) => res.json(await pagoService.listar(req.query))),
  registrar: asyncHandler(async (req, res) => {
    const r = await pagoService.registrar(req.body, req.usuario.id);
    auditar(req, 'REGISTRAR', 'Pago', r.id);
    res.status(201).json(r);
  }),
  anular: asyncHandler(async (req, res) => {
    const r = await pagoService.anular(req.params.id);
    auditar(req, 'ANULAR', 'Pago', r.id);
    res.json(r);
  })
};
