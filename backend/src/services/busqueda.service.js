// Búsqueda global: un solo término consulta clientes, planes, membresías,
// entrenadores, productos y ejercicios. Cada grupo respeta el rol del usuario
// (y el scoping por entrenador en clientes).
const prisma = require('../config/prisma');
const { esEntrenador, entrenadorIdDe } = require('../utils/scoping');

const LIMITE_GRUPO = 5;
const MIN_TERMINO = 2;

const like = (campo, q) => ({ [campo]: { contains: q, mode: 'insensitive' } });

async function global(termino, usuario) {
  const q = (termino || '').trim();
  if (q.length < MIN_TERMINO) return { termino: q, total: 0, grupos: [] };

  const rol = usuario.rol;
  const tareas = [];

  // --- Clientes (todos los roles; el entrenador solo sus asignados) ---
  const whereCliente = {
    activo: true,
    OR: [like('nombres', q), like('apellidos', q), { cedula: { contains: q } }]
  };
  if (esEntrenador(usuario)) {
    const entId = await entrenadorIdDe(usuario.id);
    if (!entId) whereCliente.id = -1;
    else whereCliente.entrenadores = { some: { entrenadorId: entId, activo: true } };
  }
  tareas.push(
    prisma.cliente
      .findMany({ where: whereCliente, take: LIMITE_GRUPO, orderBy: { nombres: 'asc' } })
      .then((datos) => ({
        tipo: 'cliente',
        etiqueta: 'Clientes',
        ruta: '/app/clientes',
        datos: datos.map((c) => ({
          id: c.id,
          titulo: `${c.nombres} ${c.apellidos}`.trim(),
          subtitulo: `Cédula ${c.cedula}`
        }))
      }))
  );

  // --- Planes y membresías (administrador y recepcionista) ---
  if (rol === 'ADMINISTRADOR' || rol === 'RECEPCIONISTA') {
    tareas.push(
      prisma.plan
        .findMany({
          where: { activo: true, OR: [like('nombre', q), like('descripcion', q)] },
          take: LIMITE_GRUPO,
          orderBy: { nombre: 'asc' }
        })
        .then((datos) => ({
          tipo: 'plan',
          etiqueta: 'Planes',
          ruta: '/app/membresias',
          datos: datos.map((p) => ({
            id: p.id,
            titulo: p.nombre,
            subtitulo: `${p.duracionDias} días · $${p.precio}`
          }))
        }))
    );
    tareas.push(
      prisma.membresia
        .findMany({
          where: {
            cliente: {
              OR: [like('nombres', q), like('apellidos', q), { cedula: { contains: q } }]
            }
          },
          take: LIMITE_GRUPO,
          include: { cliente: true, plan: true },
          orderBy: { id: 'desc' }
        })
        .then((datos) => ({
          tipo: 'membresia',
          etiqueta: 'Membresías',
          ruta: '/app/membresias',
          datos: datos.map((m) => ({
            id: m.id,
            titulo: `${m.cliente.nombres} ${m.cliente.apellidos}`.trim(),
            subtitulo: `${m.plan.nombre} · ${m.estado}`
          }))
        }))
    );
  }

  // --- Entrenadores, inventario y ejercicios (solo administrador) ---
  if (rol === 'ADMINISTRADOR') {
    tareas.push(
      prisma.entrenador
        .findMany({
          where: {
            activo: true,
            OR: [like('nombres', q), like('apellidos', q), { cedula: { contains: q } }, like('especialidad', q)]
          },
          take: LIMITE_GRUPO,
          orderBy: { nombres: 'asc' }
        })
        .then((datos) => ({
          tipo: 'entrenador',
          etiqueta: 'Entrenadores',
          ruta: '/app/entrenadores',
          datos: datos.map((e) => ({
            id: e.id,
            titulo: `${e.nombres} ${e.apellidos}`.trim(),
            subtitulo: e.especialidad || `Cédula ${e.cedula}`
          }))
        }))
    );
    tareas.push(
      prisma.producto
        .findMany({
          where: { activo: true, OR: [like('nombre', q), like('descripcion', q)] },
          take: LIMITE_GRUPO,
          orderBy: { nombre: 'asc' }
        })
        .then((datos) => ({
          tipo: 'producto',
          etiqueta: 'Inventario',
          ruta: '/app/inventario',
          datos: datos.map((p) => ({
            id: p.id,
            titulo: p.nombre,
            subtitulo: `Stock ${p.stock}${p.precio != null ? ` · $${p.precio}` : ''}`
          }))
        }))
    );
    tareas.push(
      prisma.ejercicio
        .findMany({
          where: { activo: true, OR: [like('nombre', q), like('grupoMuscular', q)] },
          take: LIMITE_GRUPO,
          orderBy: { nombre: 'asc' }
        })
        .then((datos) => ({
          tipo: 'ejercicio',
          etiqueta: 'Ejercicios',
          ruta: '/app/rutinas',
          datos: datos.map((e) => ({
            id: e.id,
            titulo: e.nombre,
            subtitulo: e.grupoMuscular || 'Ejercicio'
          }))
        }))
    );
  }

  const grupos = (await Promise.all(tareas)).filter((g) => g.datos.length);
  const total = grupos.reduce((s, g) => s + g.datos.length, 0);
  return { termino: q, total, grupos };
}

module.exports = { global };
