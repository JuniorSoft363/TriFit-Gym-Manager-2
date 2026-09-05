import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RespuestaPagina } from '../models';

// Convierte un objeto de filtros/paginación en HttpParams, ignorando valores vacíos
function construirParams(query: Record<string, any> = {}): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params = params.set(clave, String(valor));
    }
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private url(recurso: string) {
    return `${environment.apiUrl}/${recurso}`;
  }

  listar<T = any>(recurso: string, query: Record<string, any> = {}) {
    return this.http.get<RespuestaPagina<T>>(this.url(recurso), { params: construirParams(query) });
  }

  obtener<T = any>(recurso: string, id: number | string) {
    return this.http.get<T>(this.url(`${recurso}/${id}`));
  }

  crear<T = any>(recurso: string, data: any) {
    return this.http.post<T>(this.url(recurso), data);
  }

  editar<T = any>(recurso: string, id: number | string, data: any) {
    return this.http.put<T>(this.url(`${recurso}/${id}`), data);
  }

  eliminar<T = any>(recurso: string, id: number | string, definitivo = false) {
    const params = definitivo ? construirParams({ definitivo: true }) : undefined;
    return this.http.delete<T>(this.url(`${recurso}/${id}`), { params });
  }

  patch<T = any>(recurso: string, body: any = {}) {
    return this.http.patch<T>(this.url(recurso), body);
  }

  get<T = any>(recurso: string, query: Record<string, any> = {}) {
    return this.http.get<T>(this.url(recurso), { params: construirParams(query) });
  }

  post<T = any>(recurso: string, body: any = {}) {
    return this.http.post<T>(this.url(recurso), body);
  }

  put<T = any>(recurso: string, body: any = {}) {
    return this.http.put<T>(this.url(recurso), body);
  }
}
