// Gestión de entrenadores y asignación de clientes
const prisma = require('../config/prisma');
const { crudService } = require('../utils/crud');

const base = crudService('entrenador', { camposBusqueda: ['cedula', 'nombres', 'apellidos'] });

function clientesDe(entrenadorId) {
  return prisma.clienteEntrenador.findMany({
    where: { entrenadorId: Number(entrenadorId), activo: true },
    include: { cliente: true },
    orderBy: { id: 'desc' }
  });
}

function asignarCliente(entrenadorId, clienteId) {
  return prisma.clienteEntrenador.upsert({
    where: {
      clienteId_entrenadorId: { clienteId: Number(clienteId), entrenadorId: Number(entrenadorId) }
    },
    update: { activo: true, fechaAsignacion: new Date() },
    create: { clienteId: Number(clienteId), entrenadorId: Number(entrenadorId) },
    include: { cliente: true }
  });
}

function quitarCliente(entrenadorId, clienteId) {
  return prisma.clienteEntrenador.update({
    where: {
      clienteId_entrenadorId: { clienteId: Number(clienteId), entrenadorId: Number(entrenadorId) }
    },
    data: { activo: false }
  });
}

module.exports = { ...base, clientesDe, asignarCliente, quitarCliente };
