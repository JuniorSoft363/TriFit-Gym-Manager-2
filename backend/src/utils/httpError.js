// Error controlado con código de estado HTTP
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
module.exports = { HttpError };
