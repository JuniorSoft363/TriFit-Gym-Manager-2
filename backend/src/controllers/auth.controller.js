const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const r = await authService.login(req.body.email, req.body.password);
  req.usuario = r.usuario;
  auditar(req, 'LOGIN', 'Usuario', r.usuario.id);
  res.json(r);
});

const perfil = asyncHandler(async (req, res) => res.json(await authService.perfil(req.usuario.id)));

module.exports = { login, perfil };
