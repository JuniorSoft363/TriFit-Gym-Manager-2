const { Router } = require('express');
const ctrl = require('../controllers/inventario.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const upload = require('../middlewares/uploads');
const v = require('../validators');

const router = Router();

router.use(autenticar, permitirRoles('ADMINISTRADOR'));

// Productos y equipos
router.get('/productos', ctrl.productos.listar);
router.get('/productos/:id', ctrl.productos.obtener);
router.post('/productos', v.producto, validar, ctrl.productos.crear);
router.put('/productos/:id', v.producto, validar, ctrl.productos.editar);
router.delete('/productos/:id', ctrl.productos.eliminar);
router.post('/productos/:id/imagen', upload.single('imagen'), ctrl.subirImagen);
router.get('/productos/:id/movimientos', ctrl.movimientosPorProducto);

// Proveedores
router.get('/proveedores', ctrl.proveedores.listar);
router.get('/proveedores/:id', ctrl.proveedores.obtener);
router.post('/proveedores', v.proveedor, validar, ctrl.proveedores.crear);
router.put('/proveedores/:id', v.proveedor, validar, ctrl.proveedores.editar);
router.delete('/proveedores/:id', ctrl.proveedores.eliminar);

// Movimientos de stock
router.get('/movimientos', ctrl.listarMovimientos);
router.post('/movimientos', v.movimiento, validar, ctrl.registrarMovimiento);

module.exports = router;
