const { Router } = require('express');
const ctrl = require('../controllers/cliente.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();
const TODOS = ['ADMINISTRADOR', 'RECEPCIONISTA', 'ENTRENADOR'];
const GESTION = ['ADMINISTRADOR', 'RECEPCIONISTA'];

router.use(autenticar);

router.get('/', permitirRoles(...TODOS), ctrl.listar);
router.get('/cedula/:cedula', permitirRoles(...TODOS), ctrl.porCedula);
router.get('/:id/historial', permitirRoles(...TODOS), ctrl.historial);
router.get('/:id', permitirRoles(...TODOS), ctrl.obtener);
router.post('/', permitirRoles(...GESTION), v.cliente, validar, ctrl.crear);
router.put('/:id', permitirRoles(...GESTION), v.cliente, validar, ctrl.editar);
router.delete('/:id', permitirRoles(...GESTION), ctrl.eliminar);

module.exports = router;
