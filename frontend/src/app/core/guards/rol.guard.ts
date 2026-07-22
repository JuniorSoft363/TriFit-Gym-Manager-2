import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolNombre } from '../models';

export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolesPermitidos = (route.data['roles'] as RolNombre[]) || [];

  if (!rolesPermitidos.length || auth.tieneRol(...rolesPermitidos)) return true;

  router.navigate(['/app/dashboard']);
  return false;
};
