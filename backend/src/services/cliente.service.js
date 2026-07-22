// Gestión de clientes
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { crudService } = require('../utils/crud');

const base = crudService('cliente', { camposBusqueda: ['cedula', 'nombres', 'apellidos'] });

async function porCedula(cedula) {
  const cliente = await prisma.cliente.findUnique({ where: { cedula } });
  if (!cliente) throw new HttpError(404, 'Cliente no encontrado');
  return cliente;
}

function historial(id) {
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

module.exports = { ...base, porCedula, historial };
