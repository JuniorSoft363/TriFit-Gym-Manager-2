// Registro de auditoría para acciones importantes (no bloqueante)
const prisma = require('../config/prisma');

function auditar(req, accion, entidad, entidadId, detalle) {
  prisma.auditoria
    .create({
      data: {
        usuarioId: req.usuario ? req.usuario.id : null,
        accion,
        entidad,
        entidadId: entidadId != null ? Number(entidadId) : null,
        detalle: detalle || null
      }
    })
    .catch(() => {});
}
module.exports = { auditar };
