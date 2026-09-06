import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PerfilCompleto, RespuestaLogin, RolNombre, UsuarioSesion } from '../models';

const CLAVE_TOKEN = 'tf_token';
const CLAVE_REFRESH = 'tf_refresh';
const CLAVE_USUARIO = 'tf_usuario';
// Cierre automático tras 30 min sin interacción del usuario.
const LIMITE_INACTIVIDAD_MS = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario = signal<UsuarioSesion | null>(this.leerUsuario());
  private ultimaActividad = Date.now();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.iniciarVigilanciaInactividad();
  }

  private leerUsuario(): UsuarioSesion | null {
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    return crudo ? JSON.parse(crudo) : null;
  }

  login(email: string, password: string) {
    return this.http.post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  guardarSesion(respuesta: RespuestaLogin) {
    this.guardarTokens(respuesta);
    this.usuario.set(respuesta.usuario);
    this.registrarActividad();
  }

  // Almacena los tokens nuevos tras un refresh (usado por el interceptor).
  aplicarTokens(respuesta: RespuestaLogin) {
    this.guardarTokens(respuesta);
    this.registrarActividad();
  }

  private guardarTokens(respuesta: RespuestaLogin) {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_REFRESH, respuesta.refreshToken);
    if (respuesta.usuario) {
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
      this.usuario.set(respuesta.usuario);
    }
  }

  refrescarToken() {
    const refreshToken = this.obtenerRefreshToken();
    if (!refreshToken) throw new Error('Sin refresh token');
    return this.http.post<RespuestaLogin>(`${environment.apiUrl}/auth/refresh`, { refreshToken });
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
    const refreshToken = this.obtenerRefreshToken();
    // Revocación del refresh en el servidor (mejor esfuerzo; no bloquea el logout).
    if (refreshToken) {
      this.http.post<{ ok: boolean }>(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    this.limpiarLocal();
    this.router.navigate(['/login']);
  }

  // Solo limpia la sesión local (sin navegar). Lo usa el flujo de refresh fallido
  // cuando ya se está en /login o para no duplicar redirecciones.
  limpiarLocal() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_REFRESH);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  obtenerRefreshToken(): string | null {
    return localStorage.getItem(CLAVE_REFRESH);
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
    // Las rutas /uploads son mismo origen (nginx o proxy de ng serve).
    return fotoUrl.startsWith('http') ? fotoUrl : fotoUrl;
  }

  private registrarActividad() {
    this.ultimaActividad = Date.now();
  }

  // Cierre por inactividad: 30 min sin clics/teclas/scroll cierra la sesión.
  private iniciarVigilanciaInactividad() {
    const eventos = ['click', 'keydown', 'scroll', 'touchstart', 'wheel'];
    const marcar = () => (this.ultimaActividad = Date.now());
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));

    setInterval(() => {
      if (!this.estaAutenticado()) return;
      if (Date.now() - this.ultimaActividad > LIMITE_INACTIVIDAD_MS) {
        this.limpiarLocal();
        this.router.navigate(['/login']);
      }
    }, 30_000);
  }
}
