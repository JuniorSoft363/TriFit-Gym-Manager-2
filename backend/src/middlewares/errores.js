// Manejo centralizado de errores sin exponer información sensible
function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
}

function manejadorErrores(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ mensaje: err.message });
  if (err.code === 'P2002') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos únicos' });
  }
  if (err.code === 'P2025' || err.name === 'NotFoundError') {
    return res.status(404).json({ mensaje: 'Registro no encontrado' });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ mensaje: 'La operación viola una relación existente' });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejadorErrores };
