// Controlador: endpoints del perfil del usuario autenticado
const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const perfilService = require('../services/perfil.service');

const obtener = asyncHandler(async (req, res) => {
  res.json(await perfilService.obtenerPerfil(req.usuario.id));
});

const actualizar = asyncHandler(async (req, res) => {
  const usuario = await perfilService.actualizarPerfil(req.usuario.id, req.body);
  auditar(req, 'PERFIL_ACTUALIZADO', 'Usuario', req.usuario.id);
  res.json(usuario);
});

const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;
  await perfilService.cambiarPassword(req.usuario.id, passwordActual, passwordNuevo);
  auditar(req, 'PASSWORD_CAMBIADO', 'Usuario', req.usuario.id);
  res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
});

const subirFoto = asyncHandler(async (req, res) => {
  const usuario = await perfilService.actualizarFoto(req.usuario.id, req.file);
  auditar(req, 'FOTO_ACTUALIZADA', 'Usuario', req.usuario.id);
  res.json(usuario);
});

module.exports = { obtener, actualizar, cambiarPassword, subirFoto };
