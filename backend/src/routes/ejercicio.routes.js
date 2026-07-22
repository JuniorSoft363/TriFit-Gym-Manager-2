const { Router } = require('express');
const ctrl = require('../controllers/ejercicio.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();

router.use(autenticar, permitirRoles('ADMINISTRADOR', 'ENTRENADOR'));

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', v.ejercicio, validar, ctrl.crear);
router.put('/:id', v.ejercicio, validar, ctrl.editar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
