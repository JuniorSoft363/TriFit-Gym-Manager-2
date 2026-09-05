import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolNombre } from '../models';

export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolesPermitidos = (route.data['roles'] as RolNombre[]) || [];

  if (!rolesPermitidos.length || auth.tieneRol(...rolesPermitidos)) return true;

  // Redirige al inicio propio de cada rol para evitar un bucle
  // (p. ej. ENTRENADOR no tiene acceso a /app/dashboard).
  const destino = auth.usuario()?.rol === 'ENTRENADOR' ? '/app/clientes' : '/app/dashboard';
  router.navigate([destino]);
  return false;
};
