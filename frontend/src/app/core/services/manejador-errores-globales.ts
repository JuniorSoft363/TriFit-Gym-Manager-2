import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

// Los errores HTTP ya los gestiona el interceptor (snackbar + sesión);
// aquí solo se registran los no controlados (plantillas, código, promesas).
@Injectable()
export class ManejadorErroresGlobales implements ErrorHandler {
  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) return;
    const detalle =
      error instanceof Error ? { mensaje: error.message, pila: error.stack } : { error };
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ ts: new Date().toISOString(), origen: 'frontend', ...detalle }));
  }
}
