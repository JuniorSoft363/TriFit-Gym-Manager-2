// Manejo centralizado de errores sin exponer información sensible.
// Los controlados (4xx) se registran como aviso; los inesperados (500)
// como error con pila (solo en el log, nunca al cliente).
const logger = require('../utils/logger');

function contexto(req) {
  return {
    reqId: req.id,
    metodo: req.method,
    ruta: (req.originalUrl || '').split('?')[0],
    usuarioId: req.usuario && req.usuario.id
  };
}

function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
}

function manejadorErrores(err, req, res, next) {
  const ctx = contexto(req);
  let estado = 500;
  let mensaje = 'Error interno del servidor';
  let codigo;

  if (err.status) {
    estado = err.status;
    mensaje = err.message;
    codigo = err.codigo;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    estado = 400;
    mensaje = 'La imagen no puede superar 5MB';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    estado = 400;
    mensaje = 'Campo de archivo inválido';
  } else if (err.code === 'P2002') {
    estado = 409;
    mensaje = 'Ya existe un registro con esos datos únicos';
  } else if (err.code === 'P2025' || err.name === 'NotFoundError') {
    estado = 404;
    mensaje = 'Registro no encontrado';
  } else if (err.code === 'P2003') {
    estado = 409;
    mensaje = 'La operación viola una relación existente';
  }

  const cuerpo = { mensaje };
  if (codigo) cuerpo.codigo = codigo;

  if (estado >= 500) {
    logger.error('error_no_controlado', { ...ctx, estado, detalle: err.message, pila: err.stack });
  } else {
    logger.warn('error_controlado', { ...ctx, estado, codigo });
  }
  res.status(estado).json(cuerpo);
}

module.exports = { noEncontrado, manejadorErrores };
