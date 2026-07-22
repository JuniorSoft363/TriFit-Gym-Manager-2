const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth');
const { validar } = require('../middlewares/validar');
const v = require('../validators');

const router = Router();

router.post('/login', v.login, validar, ctrl.login);
router.get('/perfil', autenticar, ctrl.perfil);

module.exports = router;
