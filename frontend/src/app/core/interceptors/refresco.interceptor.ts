import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';
import { RespuestaLogin } from '../models';
import { AuthService } from '../services/auth.service';

const ES_AUTH = /\/auth\/(login|refresh|logout)/;

let refrescoEnCurso: Observable<RespuestaLogin> | null = null;
let sesionCerrada = false;

export const refrescoInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error): Observable<any> => {
      const http = error as HttpErrorResponse;
      const es401 = http?.status === 401;
      // Ya reintentado, ruta de auth o no es 401: no hacer refresh.
      if (!es401 || ES_AUTH.test(req.url) || req.headers.has('X-TF-Reintento')) {
        return throwError(() => error as never);
      }
      return manejar401(req, next, auth, router, snackBar);
    })
  );
};

function manejar401(
  req: Parameters<HttpInterceptorFn>[0],
  next: Parameters<HttpInterceptorFn>[1],
  auth: AuthService,
  router: Router,
  snackBar: MatSnackBar
): Observable<any> {
  if (!auth.obtenerRefreshToken()) {
    return cerrarSesionExpirada(auth, router, snackBar);
  }

  if (!refrescoEnCurso) {
    refrescoEnCurso = auth.refrescarToken().pipe(
      finalize(() => {
        refrescoEnCurso = null;
      })
    );
  }

  return refrescoEnCurso.pipe(
    switchMap((res) => {
      auth.aplicarTokens(res);
      sesionCerrada = false;
      const reintento = req.clone({
        setHeaders: { Authorization: `Bearer ${auth.obtenerToken()}`, 'X-TF-Reintento': 'true' }
      });
      return next(reintento);
    }),
    catchError(() => cerrarSesionExpirada(auth, router, snackBar))
  );
}

// Devuelve un error 401 marcado para que el interceptor de errores no
// duplique el aviso/logout.
function cerrarSesionExpirada(auth: AuthService, router: Router, snackBar: MatSnackBar) {
  if (!sesionCerrada) {
    sesionCerrada = true;
    auth.limpiarLocal();
    router.navigate(['/login']);
    snackBar.open('Tu sesión expiró. Inicia sesión nuevamente.', 'Cerrar', { duration: 4000 });
  }
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 401,
        statusText: 'Sesión expirada',
        error: { mensaje: 'Tu sesión expiró. Inicia sesión nuevamente.', sesionExpirada: true }
      }) as never
  );
}
