// Error controlado con código de estado HTTP
class HttpError extends Error {
  constructor(status, message, codigo) {
    super(message);
    this.status = status;
    if (codigo) this.codigo = codigo;
  }
}
module.exports = { HttpError };
