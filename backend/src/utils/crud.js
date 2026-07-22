// Fábricas de servicio y controlador CRUD genéricos (reutilizables)
const prisma = require('../config/prisma');
const { getPaginacion } = require('./paginacion');
const { auditar } = require('./auditoria');
const asyncHandler = require('./asyncHandler');

// Convierte cadenas vacías en null para campos opcionales
const limpiarDatos = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k, v === '' ? null : v]));

function crudService(modelo, opciones = {}) {
  const { camposBusqueda = [], incluir, softDelete = true } = opciones;
  const db = () => prisma[modelo];

  return {
    async listar(query) {
      const { skip, take, page, limit } = getPaginacion(query);
      const where = {};
      if (query.busqueda && camposBusqueda.length) {
        where.OR = camposBusqueda.map((c) => ({
          [c]: { contains: query.busqueda, mode: 'insensitive' }
        }));
      }
      if (query.activo !== undefined && softDelete) where.activo = query.activo === 'true';
      const [total, datos] = await Promise.all([
        db().count({ where }),
        db().findMany({ where, skip, take, include: incluir, orderBy: { id: 'desc' } })
      ]);
      return { datos, total, page, limit };
    },
    obtener(id) {
      return db().findUniqueOrThrow({ where: { id: Number(id) }, include: incluir });
    },
    crear(data) {
      return db().create({ data: limpiarDatos(data) });
    },
    editar(id, data) {
      return db().update({ where: { id: Number(id) }, data: limpiarDatos(data) });
    },
    eliminar(id) {
      return softDelete
        ? db().update({ where: { id: Number(id) }, data: { activo: false } })
        : db().delete({ where: { id: Number(id) } });
    }
  };
}

function crudController(servicio, entidad) {
  return {
    listar: asyncHandler(async (req, res) => res.json(await servicio.listar(req.query))),
    obtener: asyncHandler(async (req, res) => res.json(await servicio.obtener(req.params.id))),
    crear: asyncHandler(async (req, res) => {
      const r = await servicio.crear(req.body);
      auditar(req, 'CREAR', entidad, r.id);
      res.status(201).json(r);
    }),
    editar: asyncHandler(async (req, res) => {
      const r = await servicio.editar(req.params.id, req.body);
      auditar(req, 'EDITAR', entidad, r.id);
      res.json(r);
    }),
    eliminar: asyncHandler(async (req, res) => {
      const r = await servicio.eliminar(req.params.id);
      auditar(req, 'DESACTIVAR', entidad, r.id || Number(req.params.id));
      res.json(r);
    })
  };
}

module.exports = { crudService, crudController, limpiarDatos };
