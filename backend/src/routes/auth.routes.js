const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const perfilCtrl = require('../controllers/perfil.controller');
const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validar');
const { limiteLogin } = require('../middlewares/seguridad');
const upload = require('../middlewares/uploads');
const v = require('../validators');

const router = Router();

router.post('/login', limiteLogin, v.login, validar, ctrl.login);
router.post('/refresh', v.refreshToken, validar, ctrl.refrescar);
router.post('/logout', ctrl.cerrarSesion);
router.get('/perfil', autenticar, ctrl.perfil);
router.put('/perfil', autenticar, v.actualizarPerfil, validar, perfilCtrl.actualizar);
router.put('/perfil/password', autenticar, v.cambiarPassword, validar, perfilCtrl.cambiarPassword);
router.post('/perfil/foto', autenticar, upload.single('foto'), perfilCtrl.subirFoto);

module.exports = router;
