const { Router } = require('express');
const ctrl = require('../controllers/entrenador.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();

router.use(autenticar, permitirRoles('ADMINISTRADOR'));

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.get('/:id/clientes', ctrl.clientes);
router.post('/', v.entrenador, validar, ctrl.crear);
router.put('/:id', v.entrenador, validar, ctrl.editar);
router.delete('/:id', ctrl.eliminar);
router.post('/:id/clientes', ctrl.asignarCliente);
router.delete('/:id/clientes/:clienteId', ctrl.quitarCliente);

module.exports = router;
