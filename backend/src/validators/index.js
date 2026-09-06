// Reglas de validación de datos (express-validator)
const { body } = require('express-validator');
const { validarPolitica } = require('../utils/password');

const reglaPassword = (campo = 'password', mensajeVacio = 'La contraseña es obligatoria') =>
  body(campo)
    .notEmpty()
    .withMessage(mensajeVacio)
    .bail()
    .custom((v) => {
      const motivo = validarPolitica(v);
      if (motivo) throw new Error(motivo);
      return true;
    });

// Para edición de usuarios: solo valida si se envía contraseña.
const reglaPasswordOpcional = body('password')
  .optional({ values: 'falsy' })
  .bail()
  .custom((v) => {
    const motivo = validarPolitica(v);
    if (motivo) throw new Error(motivo);
    return true;
  });

const cedulaRegla = (campo = 'cedula') =>
  body(campo)
    .trim()
    .isLength({ min: 10, max: 10 }).withMessage('La cédula debe tener 10 dígitos')
    .isNumeric().withMessage('La cédula solo debe contener números');

const login = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

const refreshToken = [
  body('refreshToken').notEmpty().withMessage('refreshToken es obligatorio')
];

const cliente = [
  cedulaRegla(),
  body('nombres').trim().notEmpty().withMessage('Los nombres son obligatorios'),
  body('apellidos').trim().notEmpty().withMessage('Los apellidos son obligatorios'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email inválido')
];

const plan = [
  body('nombre').trim().notEmpty().withMessage('El nombre del plan es obligatorio'),
  body('duracionDias').isInt({ min: 1 }).withMessage('La duración debe ser un entero mayor a 0').toInt(),
  body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0').toFloat()
];

const membresia = [
  body('clienteId').isInt().withMessage('Cliente inválido').toInt(),
  body('planId').isInt().withMessage('Plan inválido').toInt()
];

const estadoMembresia = [
  body('estado').isIn(['ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA']).withMessage('Estado inválido')
];

const pago = [
  body('membresiaId').isInt().withMessage('Membresía inválida').toInt(),
  body('monto').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0').toFloat(),
  body('metodo').isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).withMessage('Método de pago inválido')
];

const asistencia = [cedulaRegla()];

const entrenador = [
  cedulaRegla(),
  body('nombres').trim().notEmpty().withMessage('Los nombres son obligatorios'),
  body('apellidos').trim().notEmpty().withMessage('Los apellidos son obligatorios')
];

const usuario = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  reglaPasswordOpcional,
  body('rolId').isInt().withMessage('Rol inválido').toInt()
];

const rutina = [
  body('nombre').trim().notEmpty().withMessage('El nombre de la rutina es obligatorio'),
  body('ejercicios').optional().isArray().withMessage('Los ejercicios deben ser una lista')
];

const ejercicio = [body('nombre').trim().notEmpty().withMessage('El nombre del ejercicio es obligatorio')];

const producto = [
  body('nombre').trim().notEmpty().withMessage('El nombre del producto es obligatorio'),
  body('tipo').isIn(['PRODUCTO', 'EQUIPO']).withMessage('Tipo inválido'),
  body('precio').optional({ values: 'falsy' }).isFloat({ min: 0 }).toFloat(),
  body('stock').optional({ values: 'falsy' }).isInt({ min: 0 }).toInt(),
  body('stockMinimo').optional({ values: 'falsy' }).isInt({ min: 0 }).toInt()
];

const proveedor = [body('nombre').trim().notEmpty().withMessage('El nombre del proveedor es obligatorio')];

const movimiento = [
  body('productoId').isInt().withMessage('Producto inválido').toInt(),
  body('tipo').isIn(['ENTRADA', 'SALIDA', 'AJUSTE']).withMessage('Tipo de movimiento inválido'),
  body('cantidad').isInt({ min: 0 }).withMessage('La cantidad debe ser un entero mayor o igual a 0').toInt()
];

const actualizarPerfil = [
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('telefono').optional({ values: 'falsy' }).isString().isLength({ max: 30 }).withMessage('Teléfono demasiado largo'),
  body('direccion').optional({ values: 'falsy' }).isString().isLength({ max: 200 }).withMessage('Dirección demasiado larga')
];

const cambiarPassword = [
  body('passwordActual').notEmpty().withMessage('La contraseña actual es obligatoria'),
  reglaPassword('passwordNuevo', 'La nueva contraseña es obligatoria')
];

module.exports = {
  login, refreshToken, cliente, plan, membresia, estadoMembresia, pago, asistencia,
  entrenador, usuario, rutina, ejercicio, producto, proveedor, movimiento,
  actualizarPerfil, cambiarPassword
};
