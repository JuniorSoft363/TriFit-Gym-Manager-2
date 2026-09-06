import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const ES_LOGIN = /\/auth\/login$/;
const ES_AUTH = /\/auth\/(refresh|logout)/;

export const erroresInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      const esLogin = ES_LOGIN.test(req.url);
      const esAuthInterno = ES_AUTH.test(req.url);
      const sesionExpirada = error?.error?.sesionExpirada === true;

      // 401 no manejado por el flujo de refresh (login con credenciales malas,
      // o un usuario desactivado): cerrar sesión.
      if (error.status === 401 && !esLogin && !esAuthInterno && !sesionExpirada) {
        auth.limpiarLocal();
        router.navigate(['/login']);
      }

      // Cambio de contraseña pendiente: llevar al perfil.
      if (error.status === 403 && error?.error?.codigo === 'PASSWORD_CAMBIAR_REQUERIDO') {
        auth.actualizarSesion({ debeCambiarPassword: true });
        router.navigate(['/app/perfil']);
      }

      const mensaje = error?.error?.mensaje || 'Ocurrió un error inesperado';

      if (!esLogin && !esAuthInterno && !sesionExpirada) {
        const detalle = Array.isArray(error?.error?.errores) ? `: ${error.error.errores.join(', ')}` : '';
        snackBar.open(mensaje + detalle, 'Cerrar', { duration: 4000 });
      }

      return throwError(() => error);
    })
  );
};
