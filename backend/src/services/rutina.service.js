// Gestión de rutinas y sus ejercicios
const prisma = require('../config/prisma');
const { getPaginacion } = require('../utils/paginacion');
const { HttpError } = require('../utils/httpError');

const incluir = {
  ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } },
  cliente: true,
  entrenador: true
};

async function listar(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.busqueda) where.nombre = { contains: query.busqueda, mode: 'insensitive' };
  // Por defecto se ocultan las desactivadas; ?activo=true/false filtra explícito
  where.activo = query.activo !== undefined ? query.activo === 'true' : true;
  if (query.entrenadorId) where.entrenadorId = Number(query.entrenadorId);
  if (query.clienteId) where.clienteId = Number(query.clienteId);
  const [total, datos] = await Promise.all([
    prisma.rutina.count({ where }),
    prisma.rutina.findMany({ where, skip, take, include: incluir, orderBy: { id: 'desc' } })
  ]);
  return { datos, total, page, limit };
}

function mapearEjercicios(lista) {
  return (lista || []).map((e, i) => ({
    ejercicioId: Number(e.ejercicioId),
    series: Number(e.series) || 3,
    repeticiones: Number(e.repeticiones) || 10,
    orden: i + 1,
    observacion: e.observacion || null
  }));
}

function crear({ nombre, objetivo, descripcion, entrenadorId, clienteId, ejercicios }) {
  return prisma.rutina.create({
    data: {
      nombre,
      objetivo: objetivo || null,
      descripcion: descripcion || null,
      entrenadorId: entrenadorId ? Number(entrenadorId) : null,
      clienteId: clienteId ? Number(clienteId) : null,
      ejercicios: { create: mapearEjercicios(ejercicios) }
    },
    include: incluir
  });
}

async function editar(id, { nombre, objetivo, descripcion, entrenadorId, clienteId, ejercicios }) {
  const rutinaId = Number(id);
  return prisma.$transaction(async (tx) => {
    if (ejercicios) {
      await tx.rutinaEjercicio.deleteMany({ where: { rutinaId } });
      await tx.rutinaEjercicio.createMany({
        data: mapearEjercicios(ejercicios).map((e) => ({ ...e, rutinaId }))
      });
    }
    return tx.rutina.update({
      where: { id: rutinaId },
      data: {
        nombre,
        objetivo: objetivo || null,
        descripcion: descripcion || null,
        entrenadorId: entrenadorId ? Number(entrenadorId) : null,
        clienteId: clienteId ? Number(clienteId) : null
      },
      include: incluir
    });
  });
}

function asignar(id, clienteId) {
  return prisma.rutina.update({
    where: { id: Number(id) },
    data: { clienteId: clienteId ? Number(clienteId) : null },
    include: incluir
  });
}

function eliminar(id) {
  return prisma.rutina.update({ where: { id: Number(id) }, data: { activo: false } });
}

async function eliminarFisico(id) {
  try {
    // RutinaEjercicio tiene onDelete Cascade: se borran sus ejercicios asociados
    return await prisma.rutina.delete({ where: { id: Number(id) } });
  } catch (e) {
    if (e.code === 'P2003')
      throw new HttpError(409, 'No se puede eliminar: la rutina tiene datos relacionados');
    throw e;
  }
}

module.exports = { listar, crear, editar, asignar, eliminar, eliminarFisico };
