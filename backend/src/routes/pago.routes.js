const { Router } = require('express');
const ctrl = require('../controllers/pago.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];

router.use(autenticar, permitirRoles(...GESTION));

router.get('/', ctrl.listar);
router.post('/', v.pago, validar, ctrl.registrar);
router.patch('/:id/anular', ctrl.anular);

module.exports = router;
