const { Router } = require('express');
const ctrl = require('../controllers/usuario.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();

router.use(autenticar, permitirRoles('ADMINISTRADOR'));

router.get('/', ctrl.listar);
router.get('/roles', ctrl.roles);
router.get('/:id', ctrl.obtener);
router.post('/', v.usuario, validar, ctrl.crear);
router.put('/:id', v.usuario, validar, ctrl.editar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
