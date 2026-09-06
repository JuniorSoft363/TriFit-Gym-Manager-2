// Logger estructurado sin dependencias: líneas JSON a stdout/stderr.
// Nivel por LOG_LEVEL (debug|info|warn|error). Por defecto: debug en
// desarrollo, info en producción.
const NIVELES = { debug: 0, info: 1, warn: 2, error: 3 };

function nivelActivo() {
  const pedido = (process.env.LOG_LEVEL || '').toLowerCase();
  if (pedido && NIVELES[pedido] !== undefined) return NIVELES[pedido];
  return process.env.NODE_ENV === 'production' ? NIVELES.info : NIVELES.debug;
}

const UMBRAL = nivelActivo();

function escribir(nivel, mensaje, meta) {
  if (NIVELES[nivel] < UMBRAL) return;
  const salida = nivel === 'error' ? process.stderr : process.stdout;
  salida.write(JSON.stringify({ ts: new Date().toISOString(), nivel, mensaje, ...(meta || {}) }) + '\n');
}

module.exports = {
  debug: (mensaje, meta) => escribir('debug', mensaje, meta),
  info: (mensaje, meta) => escribir('info', mensaje, meta),
  warn: (mensaje, meta) => escribir('warn', mensaje, meta),
  error: (mensaje, meta) => escribir('error', mensaje, meta)
};
