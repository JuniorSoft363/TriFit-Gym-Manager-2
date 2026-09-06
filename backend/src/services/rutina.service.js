// Gestión de rutinas y sus ejercicios (con scoping para ENTRENADOR)
const prisma = require('../config/prisma');
const { getPaginacion } = require('../utils/paginacion');
const { HttpError } = require('../utils/httpError');
const {
  esEntrenador,
  entrenadorIdDe,
  exigirEntrenadorId,
  verificarAccesoCliente,
  verificarRutinaPropia
} = require('../utils/scoping');

const incluir = {
  ejercicios: { include: { ejercicio: true }, orderBy: { orden: 'asc' } },
  cliente: true,
  entrenador: true
};

async function listar(query, usuario) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.busqueda) where.nombre = { contains: query.busqueda, mode: 'insensitive' };
  // Por defecto se ocultan las desactivadas; ?activo=true/false filtra explícito
  where.activo = query.activo !== undefined ? query.activo === 'true' : true;
  if (query.entrenadorId) where.entrenadorId = Number(query.entrenadorId);
  if (query.clienteId) where.clienteId = Number(query.clienteId);
  if (esEntrenador(usuario)) {
    const entId = await entrenadorIdDe(usuario.id);
    if (!entId) return { datos: [], total: 0, page, limit };
    // Propias + de sus clientes + generales (sin dueño ni cliente).
    // El AND con los filtros impide evadir el alcance con query params.
    where.AND = [
      {
        OR: [
          { entrenadorId: entId },
          { cliente: { entrenadores: { some: { entrenadorId: entId, activo: true } } } },
          { entrenadorId: null, clienteId: null }
        ]
      }
    ];
  }
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

async function crear(data, usuario) {
  let { nombre, objetivo, descripcion, entrenadorId, clienteId, ejercicios } = data;
  if (esEntrenador(usuario)) {
    const entId = await exigirEntrenadorId(usuario);
    entrenadorId = entId; // la propiedad no es transferible
    if (clienteId) await verificarAccesoCliente(Number(clienteId), usuario);
  }
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

async function editar(id, data, usuario) {
  let { nombre, objetivo, descripcion, entrenadorId, clienteId, ejercicios } = data;
  if (esEntrenador(usuario)) {
    const entId = await exigirEntrenadorId(usuario);
    await verificarRutinaPropia(id, entId);
    entrenadorId = entId;
    if (clienteId) await verificarAccesoCliente(Number(clienteId), usuario);
  }
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

async function asignar(id, clienteId, usuario) {
  if (esEntrenador(usuario)) {
    const entId = await exigirEntrenadorId(usuario);
    await verificarRutinaPropia(id, entId);
    if (clienteId) await verificarAccesoCliente(Number(clienteId), usuario);
  }
  return prisma.rutina.update({
    where: { id: Number(id) },
    data: { clienteId: clienteId ? Number(clienteId) : null },
    include: incluir
  });
}

async function eliminar(id, usuario) {
  if (esEntrenador(usuario)) {
    await verificarRutinaPropia(id, await exigirEntrenadorId(usuario));
  }
  return prisma.rutina.update({ where: { id: Number(id) }, data: { activo: false } });
}

async function eliminarFisico(id, usuario) {
  if (esEntrenador(usuario)) {
    await verificarRutinaPropia(id, await exigirEntrenadorId(usuario));
  }
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
