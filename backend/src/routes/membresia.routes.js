const { Router } = require('express');
const ctrl = require('../controllers/membresia.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];

router.use(autenticar, permitirRoles(...GESTION));

router.get('/', ctrl.listar);
router.get('/por-vencer', ctrl.porVencer);
router.get('/vigente/:cedula', ctrl.vigentePorCedula);
router.post('/', v.membresia, validar, ctrl.asignar);
router.patch('/:id/renovar', ctrl.renovar);
router.patch('/:id/estado', v.estadoMembresia, validar, ctrl.cambiarEstado);

module.exports = router;
