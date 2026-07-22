// Helper de paginación para listados
function getPaginacion(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 1000);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
module.exports = { getPaginacion };
