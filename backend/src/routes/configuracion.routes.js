const { Router } = require('express');
const ctrl = require('../controllers/configuracion.controller');
const { autenticar } = require('../middlewares/auth');
const { permitirRoles } = require('../middlewares/roles');

const router = Router();

// Público: datos del gimnasio para la landing page
router.get('/publico', ctrl.publico);

router.get('/gimnasio', autenticar, permitirRoles('ADMINISTRADOR'), ctrl.obtenerGimnasio);
router.put('/gimnasio', autenticar, permitirRoles('ADMINISTRADOR'), ctrl.actualizarGimnasio);
router.get('/auditoria', autenticar, permitirRoles('ADMINISTRADOR'), ctrl.auditoria);

module.exports = router;
