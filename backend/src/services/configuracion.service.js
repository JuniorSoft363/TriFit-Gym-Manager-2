// Datos del gimnasio y consulta de auditoría
const prisma = require('../config/prisma');
const { getPaginacion } = require('../utils/paginacion');

async function obtenerGimnasio() {
  let g = await prisma.gimnasio.findFirst();
  if (!g) g = await prisma.gimnasio.create({ data: { nombre: 'TriFit Gym' } });
  return g;
}

async function actualizarGimnasio(data) {
  const g = await obtenerGimnasio();
  return prisma.gimnasio.update({ where: { id: g.id }, data });
}

async function auditoria(query) {
  const { skip, take, page, limit } = getPaginacion(query);
  const where = {};
  if (query.entidad) where.entidad = { contains: query.entidad, mode: 'insensitive' };
  const [total, datos] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({
      where, skip, take,
      include: { usuario: { select: { nombre: true, email: true } } },
      orderBy: { id: 'desc' }
    })
  ]);
  return { datos, total, page, limit };
}

module.exports = { obtenerGimnasio, actualizarGimnasio, auditoria };
