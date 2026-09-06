import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  // Con cambio de contraseña pendiente, solo se permite el perfil.
  if (auth.usuario()?.debeCambiarPassword && state.url !== '/app/perfil') {
    router.navigate(['/app/perfil']);
    return false;
  }

  return true;
};
