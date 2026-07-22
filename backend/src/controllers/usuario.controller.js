const asyncHandler = require('../utils/asyncHandler');
const { crudController } = require('../utils/crud');
const usuarioService = require('../services/usuario.service');

module.exports = {
  ...crudController(usuarioService, 'Usuario'),
  roles: asyncHandler(async (req, res) => res.json(await usuarioService.roles()))
};
