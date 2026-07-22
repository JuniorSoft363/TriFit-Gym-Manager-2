const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const asistenciaService = require('../services/asistencia.service');

module.exports = {
  listar: asyncHandler(async (req, res) => res.json(await asistenciaService.listar(req.query))),
  consultar: asyncHandler(async (req, res) => res.json(await asistenciaService.consultar(req.params.cedula))),
  entrada: asyncHandler(async (req, res) => {
    const r = await asistenciaService.registrarEntrada(req.body.cedula, req.usuario.id);
    auditar(req, 'ENTRADA', 'Asistencia', r.id);
    res.status(201).json(r);
  }),
  salida: asyncHandler(async (req, res) => {
    const r = await asistenciaService.registrarSalida(req.body.cedula);
    auditar(req, 'SALIDA', 'Asistencia', r.id);
    res.json(r);
  })
};
