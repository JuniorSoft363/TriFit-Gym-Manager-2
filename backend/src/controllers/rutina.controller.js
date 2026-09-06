const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const rutinaService = require('../services/rutina.service');

module.exports = {
  listar: asyncHandler(async (req, res) => res.json(await rutinaService.listar(req.query, req.usuario))),
  crear: asyncHandler(async (req, res) => {
    const r = await rutinaService.crear(req.body, req.usuario);
    auditar(req, 'CREAR', 'Rutina', r.id);
    res.status(201).json(r);
  }),
  editar: asyncHandler(async (req, res) => {
    const r = await rutinaService.editar(req.params.id, req.body, req.usuario);
    auditar(req, 'EDITAR', 'Rutina', r.id);
    res.json(r);
  }),
  asignar: asyncHandler(async (req, res) => {
    const r = await rutinaService.asignar(req.params.id, req.body.clienteId, req.usuario);
    auditar(req, 'ASIGNAR', 'Rutina', r.id);
    res.json(r);
  }),
  eliminar: asyncHandler(async (req, res) => {
    if (req.query.definitivo === 'true') {
      const r = await rutinaService.eliminarFisico(req.params.id, req.usuario);
      auditar(req, 'ELIMINAR', 'Rutina', r.id);
      return res.json(r);
    }
    const r = await rutinaService.eliminar(req.params.id, req.usuario);
    auditar(req, 'DESACTIVAR', 'Rutina', r.id);
    res.json(r);
  })
};
