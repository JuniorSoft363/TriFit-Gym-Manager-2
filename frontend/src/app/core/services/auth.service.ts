import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PerfilCompleto, RespuestaLogin, RolNombre, UsuarioSesion } from '../models';

const CLAVE_TOKEN = 'tf_token';
const CLAVE_USUARIO = 'tf_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario = signal<UsuarioSesion | null>(this.leerUsuario());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private leerUsuario(): UsuarioSesion | null {
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    return crudo ? JSON.parse(crudo) : null;
  }

  login(email: string, password: string) {
    return this.http.post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  guardarSesion(respuesta: RespuestaLogin) {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this.usuario.set(respuesta.usuario);
  }

  actualizarSesion(datos: Partial<UsuarioSesion>) {
    const actual = this.usuario();
    if (!actual) return;
    const merged: UsuarioSesion = {
      ...actual,
      ...datos,
      id: actual.id,
      rol: actual.rol
    };
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(merged));
    this.usuario.set(merged);
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  tieneRol(...roles: RolNombre[]): boolean {
    const u = this.usuario();
    return !!u && roles.includes(u.rol);
  }

  obtenerPerfil() {
    return this.http.get<PerfilCompleto>(`${environment.apiUrl}/auth/perfil`);
  }

  actualizarPerfil(datos: { nombre?: string; email?: string; telefono?: string; direccion?: string }) {
    return this.http.put<PerfilCompleto>(`${environment.apiUrl}/auth/perfil`, datos);
  }

  cambiarPassword(passwordActual: string, passwordNuevo: string) {
    return this.http.put<{ ok: boolean; mensaje: string }>(`${environment.apiUrl}/auth/perfil/password`, {
      passwordActual,
      passwordNuevo
    });
  }

  subirFoto(archivo: File) {
    const fd = new FormData();
    fd.append('foto', archivo);
    return this.http.post<PerfilCompleto>(`${environment.apiUrl}/auth/perfil/foto`, fd);
  }

  urlFoto(fotoUrl?: string | null): string | null {
    if (!fotoUrl) return null;
    if (fotoUrl.startsWith('http')) return fotoUrl;
    return `http://localhost:3000${fotoUrl}`;
  }
}
