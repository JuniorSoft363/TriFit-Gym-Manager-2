const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth.routes'));
router.use('/clientes', require('./cliente.routes'));
router.use('/planes', require('./plan.routes'));
router.use('/membresias', require('./membresia.routes'));
router.use('/pagos', require('./pago.routes'));
router.use('/asistencias', require('./asistencia.routes'));
router.use('/entrenadores', require('./entrenador.routes'));
router.use('/rutinas', require('./rutina.routes'));
router.use('/ejercicios', require('./ejercicio.routes'));
router.use('/inventario', require('./inventario.routes'));
router.use('/reportes', require('./reporte.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/configuracion', require('./configuracion.routes'));

module.exports = router;
