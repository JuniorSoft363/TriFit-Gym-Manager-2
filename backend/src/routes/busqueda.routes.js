const { Router } = require('express');
const ctrl = require('../controllers/busqueda.controller');
const { autenticar } = require('../middlewares/auth');

const router = Router();

// GET /api/busqueda?q=texto  → resultados agrupados por tipo, filtrados por rol.
router.get('/', autenticar, ctrl.global);

module.exports = router;
