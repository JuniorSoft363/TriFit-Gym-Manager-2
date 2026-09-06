// Gestión de clientes (con scoping: el ENTRENADOR solo ve sus asignados)
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { crudService } = require('../utils/crud');
const { getPaginacion } = require('../utils/paginacion');
const { esEntrenador, entrenadorIdDe, verificarAccesoCliente } = require('../utils/scoping');

const base = crudService('cliente', { camposBusqueda: ['cedula', 'nombres', 'apellidos'] });

async function listar(query, usuario) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.busqueda) {
    where.OR = ['cedula', 'nombres', 'apellidos'].map((c) => ({
      [c]: { contains: query.busqueda, mode: 'insensitive' }
    }));
  }
  where.activo = query.activo !== undefined ? query.activo === 'true' : true;
  if (esEntrenador(usuario)) {
    const entId = await entrenadorIdDe(usuario.id);
    if (!entId) return { datos: [], total: 0, page, limit };
    where.entrenadores = { some: { entrenadorId: entId, activo: true } };
  }
  const [total, datos] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({ where, skip, take, orderBy: { id: 'desc' } })
  ]);
  return { datos, total, page, limit };
}

async function obtener(id, usuario) {
  const c = await base.obtener(id);
  await verificarAccesoCliente(c.id, usuario);
  return c;
}

async function porCedula(cedula, usuario) {
  const cliente = await prisma.cliente.findUnique({ where: { cedula } });
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  await verificarAccesoCliente(cliente.id, usuario);
  return cliente;
}

async function historial(id, usuario) {
  await verificarAccesoCliente(Number(id), usuario);
  return prisma.cliente.findUniqueOrThrow({
    where: { id: Number(id) },
    include: {
      membresias: { include: { plan: true, pagos: true }, orderBy: { id: 'desc' } },
      asistencias: { orderBy: { id: 'desc' }, take: 30 },
      rutinas: { where: { activo: true } },
      entrenadores: { where: { activo: true }, include: { entrenador: true } }
    }
  });
}

module.exports = { ...base, listar, obtener, porCedula, historial };
