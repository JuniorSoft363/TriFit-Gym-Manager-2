const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rutas = require('./routes');
const { noEncontrado, manejadorErrores } = require('./middlewares/errores');

const app = express();

const carpetaUploads = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(carpetaUploads)) fs.mkdirSync(carpetaUploads, { recursive: true });
const carpetaTmp = path.join(carpetaUploads, 'tmp');
if (fs.existsSync(carpetaTmp)) {
  for (const f of fs.readdirSync(carpetaTmp)) fs.unlinkSync(path.join(carpetaTmp, f));
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(carpetaUploads));

app.get('/', (req, res) => res.json({ ok: true, nombre: 'TriFit Gym Manager API' }));
app.use('/api', rutas);

app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
