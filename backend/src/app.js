const express = require('express');
const cors = require('cors');
const rutas = require('./routes');
const { noEncontrado, manejadorErrores } = require('./middlewares/errores');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, nombre: 'TriFit Gym Manager API' }));
app.use('/api', rutas);

app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
