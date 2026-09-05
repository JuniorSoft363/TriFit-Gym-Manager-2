const express = require('express');
const path = require('path');
const fs = require('fs');
const rutas = require('./routes');
const { noEncontrado, manejadorErrores } = require('./middlewares/errores');
const { cabeceras, corsRestringido, limiteApi } = require('./middlewares/seguridad');

const app = express();

// Un solo salto de proxy (nginx del frontend) para req.ip real en rate-limit.
app.set('trust proxy', 1);

const carpetaUploads = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(carpetaUploads)) fs.mkdirSync(carpetaUploads, { recursive: true });
const carpetaTmp = path.join(carpetaUploads, 'tmp');
if (fs.existsSync(carpetaTmp)) {
  for (const f of fs.readdirSync(carpetaTmp)) fs.unlinkSync(path.join(carpetaTmp, f));
}

app.use(cabeceras);
app.use(corsRestringido);
app.use(express.json());
app.use('/uploads', express.static(carpetaUploads));

app.get('/', (req, res) => res.json({ ok: true, nombre: 'TriFit Gym Manager API' }));
app.use('/api', limiteApi, rutas);

app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
