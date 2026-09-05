import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      const mensaje = error?.error?.mensaje || 'Ocurrió un error inesperado';

      if (error.status === 401) {
        auth.cerrarSesion();
        router.navigate(['/login']);
      }

      if (error.status === 403 && error?.error?.codigo === 'PASSWORD_CAMBIAR_REQUERIDO') {
        auth.actualizarSesion({ debeCambiarPassword: true });
        router.navigate(['/app/perfil']);
      }

      const detalle = Array.isArray(error?.error?.errores) ? `: ${error.error.errores.join(', ')}` : '';
      snackBar.open(mensaje + detalle, 'Cerrar', { duration: 4000 });

      return throwError(() => error);
    })
  );
};
