const { Router } = require('express');
const ctrl = require('../controllers/rutina.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();

router.use(autenticar, permitirRoles('ADMINISTRADOR', 'ENTRENADOR'));

router.get('/', ctrl.listar);
router.post('/', v.rutina, validar, ctrl.crear);
router.put('/:id', v.rutina, validar, ctrl.editar);
router.patch('/:id/asignar', ctrl.asignar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
