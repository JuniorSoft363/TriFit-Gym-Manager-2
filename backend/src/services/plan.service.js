// Gestión de planes de membresía
const prisma = require('../config/prisma');
const { crudService } = require('../utils/crud');

const base = crudService('plan', { camposBusqueda: ['nombre'] });

// Planes activos para la landing pública (sin datos sensibles).
function publicos() {
  return prisma.plan.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, descripcion: true, duracionDias: true, precio: true },
    orderBy: { duracionDias: 'asc' }
  });
}

module.exports = { ...base, publicos };
