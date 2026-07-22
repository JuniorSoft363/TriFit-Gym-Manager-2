const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
  console.log(`TriFit Gym Manager API escuchando en http://localhost:${PORT}`);
});
