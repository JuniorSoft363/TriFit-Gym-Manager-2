// Manejo centralizado de errores sin exponer información sensible
function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
}

function manejadorErrores(err, req, res, next) {
  if (err.status) {
    const cuerpo = { mensaje: err.message };
    if (err.codigo) cuerpo.codigo = err.codigo;
    return res.status(err.status).json(cuerpo);
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ mensaje: 'La imagen no puede superar 5MB' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ mensaje: 'Campo de archivo inválido' });
  }
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
