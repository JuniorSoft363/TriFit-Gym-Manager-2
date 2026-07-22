const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const configuracionService = require('../services/configuracion.service');

module.exports = {
  obtenerGimnasio: asyncHandler(async (req, res) => res.json(await configuracionService.obtenerGimnasio())),
  // Endpoint público para la Landing Page (solo datos de contacto)
  publico: asyncHandler(async (req, res) => res.json(await configuracionService.obtenerGimnasio())),
  actualizarGimnasio: asyncHandler(async (req, res) => {
    const r = await configuracionService.actualizarGimnasio(req.body);
    auditar(req, 'EDITAR', 'Gimnasio', r.id);
    res.json(r);
  }),
  auditoria: asyncHandler(async (req, res) => res.json(await configuracionService.auditoria(req.query)))
};
