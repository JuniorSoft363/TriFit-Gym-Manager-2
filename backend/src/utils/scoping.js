// Scoping por entrenador: los usuarios con rol ENTRENADOR solo acceden a
// sus clientes asignados (ClienteEntrenador activo) y a sus rutinas.
const prisma = require('../config/prisma');
const { HttpError } = require('./httpError');

function esEntrenador(usuario) {
  return !!usuario && usuario.rol === 'ENTRENADOR';
}

// ID de la ficha Entrenador vinculada al usuario (null si no tiene).
async function entrenadorIdDe(usuarioId) {
  if (!usuarioId) return null;
  const e = await prisma.entrenador.findUnique({
    where: { usuarioId: Number(usuarioId) },
    select: { id: true }
  });
  return e ? e.id : null;
}

// ID exigido: el entrenador sin ficha no puede operar (403 explícito).
async function exigirEntrenadorId(usuario) {
  const entId = await entrenadorIdDe(usuario && usuario.id);
  if (!entId) throw new HttpError(403, 'Tu usuario no tiene ficha de entrenador asignada');
  return entId;
}

// 404 (no 403) para no revelar la existencia de clientes ajenos.
async function verificarAccesoCliente(clienteId, usuario) {
  if (!esEntrenador(usuario)) return;
  const entId = await entrenadorIdDe(usuario.id);
  if (!entId) throw new HttpError(404, 'Cliente no encontrado');
  const a = await prisma.clienteEntrenador.findUnique({
    where: { clienteId_entrenadorId: { clienteId: Number(clienteId), entrenadorId: entId } },
    select: { activo: true }
  });
  if (!a || !a.activo) throw new HttpError(404, 'Cliente no encontrado');
}

// Solo rutinas propias (ni generales ni de otros entrenadores).
async function verificarRutinaPropia(id, entrenadorId) {
  const r = await prisma.rutina.findUnique({
    where: { id: Number(id) },
    select: { id: true, entrenadorId: true }
  });
  if (!r || r.entrenadorId !== entrenadorId) throw new HttpError(404, 'Rutina no encontrada');
  return r;
}

module.exports = { esEntrenador, entrenadorIdDe, exigirEntrenadorId, verificarAccesoCliente, verificarRutinaPropia };
