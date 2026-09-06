import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { erroresInterceptor } from './core/interceptors/errores.interceptor';
import { refrescoInterceptor } from './core/interceptors/refresco.interceptor';
import { ManejadorErroresGlobales } from './core/services/manejador-errores-globales';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([tokenInterceptor, erroresInterceptor, refrescoInterceptor])),
    { provide: ErrorHandler, useClass: ManejadorErroresGlobales },
    { provide: MAT_DATE_LOCALE, useValue: 'es-EC' }
  ]
};
