const { Router } = require('express');
const ctrl = require('../controllers/asistencia.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];

router.use(autenticar, permitirRoles(...GESTION));

router.get('/', ctrl.listar);
router.get('/consultar/:cedula', ctrl.consultar);
router.post('/entrada', v.asistencia, validar, ctrl.entrada);
router.post('/salida', v.asistencia, validar, ctrl.salida);

module.exports = router;
