export const environment = {
  production: false,
  // Mismo origen: nginx (Docker) o el proxy de `ng serve` reenvían /api al
  // backend. Así funciona igual sobre HTTP y HTTPS sin contenido mixto.
  apiUrl: '/api'
};
