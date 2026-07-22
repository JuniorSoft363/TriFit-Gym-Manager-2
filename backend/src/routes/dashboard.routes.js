const { Router } = require('express');
const ctrl = require('../controllers/dashboard.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');

const router = Router();

router.get('/resumen', autenticar, permitirRoles('ADMINISTRADOR', 'RECEPCIONISTA'), ctrl.resumen);

module.exports = router;
