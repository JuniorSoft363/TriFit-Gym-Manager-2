const { Router } = require('express');
const ctrl = require('../controllers/plan.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();
const LECTURA = ['ADMINISTRADOR', 'RECEPCIONISTA'];

router.use(autenticar);

router.get('/', permitirRoles(...LECTURA), ctrl.listar);
router.get('/:id', permitirRoles(...LECTURA), ctrl.obtener);
router.post('/', permitirRoles('ADMINISTRADOR'), v.plan, validar, ctrl.crear);
router.put('/:id', permitirRoles('ADMINISTRADOR'), v.plan, validar, ctrl.editar);
router.delete('/:id', permitirRoles('ADMINISTRADOR'), ctrl.eliminar);

module.exports = router;
