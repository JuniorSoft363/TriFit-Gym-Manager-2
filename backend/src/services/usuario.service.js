// Gestión de usuarios del sistema y roles
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/httpError');
const { hashPassword, validarPolitica } = require('../utils/password');
const { crudService, limpiarDatos } = require('../utils/crud');
const sesionService = require('./sesion.service');

const base = crudService('usuario', { camposBusqueda: ['nombre', 'email'], incluir: { rol: true } });

const sinHash = ({ passwordHash, ...resto }) => resto;

async function listar(query) {
  const r = await base.listar(query);
  return { ...r, datos: r.datos.map(sinHash) };
}

async function crear(data) {
  const { password, ...resto } = limpiarDatos(data);
  if (!password) throw new HttpError(400, 'La contraseña es obligatoria');
  const motivoCrear = validarPolitica(password);
  if (motivoCrear) throw new HttpError(400, motivoCrear);
  const usuario = await prisma.usuario.create({
    data: { ...resto, passwordHash: await hashPassword(password), debeCambiarPassword: true },
    include: { rol: true }
  });
  return sinHash(usuario);
}

async function editar(id, data) {
  const { password, ...resto } = limpiarDatos(data);
  const cambios = { ...resto };
  if (password) {
    const motivoEditar = validarPolitica(password);
    if (motivoEditar) throw new HttpError(400, motivoEditar);
    cambios.passwordHash = await hashPassword(password);
    // Si el admin resetea la contraseña, el usuario debe cambiarla al entrar.
    cambios.debeCambiarPassword = true;
  }
  const usuario = await prisma.usuario.update({
    where: { id: Number(id) },
    data: cambios,
    include: { rol: true }
  });
  // Si el admin cambió la contraseña, se cierran las sesiones del usuario.
  if (password) await sesionService.revocarTodas(Number(id));
  return sinHash(usuario);
}

const roles = () => prisma.rol.findMany({ orderBy: { id: 'asc' } });

module.exports = { ...base, listar, crear, editar, roles };
