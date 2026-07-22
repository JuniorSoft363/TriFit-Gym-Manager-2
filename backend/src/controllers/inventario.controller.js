const asyncHandler = require('../utils/asyncHandler');
const { auditar } = require('../utils/auditoria');
const { crudController } = require('../utils/crud');
const inventarioService = require('../services/inventario.service');

module.exports = {
  productos: crudController(inventarioService.productos, 'Producto'),
  proveedores: crudController(inventarioService.proveedores, 'Proveedor'),
  listarMovimientos: asyncHandler(async (req, res) =>
    res.json(await inventarioService.listarMovimientos(req.query))
  ),
  registrarMovimiento: asyncHandler(async (req, res) => {
    const r = await inventarioService.registrarMovimiento(req.body, req.usuario.id);
    auditar(req, 'MOVIMIENTO_' + req.body.tipo, 'Inventario', r.id);
    res.status(201).json(r);
  })
};
