const { Router } = require('express');
const ctrl = require('../controllers/reporte.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');

const router = Router();

router.use(autenticar, permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'));

router.get('/clientes', ctrl.clientes);
router.get('/membresias', ctrl.membresias);
router.get('/ingresos', ctrl.ingresos);
router.get('/asistencias', ctrl.asistencias);
router.get('/inventario', ctrl.inventario);

module.exports = router;
