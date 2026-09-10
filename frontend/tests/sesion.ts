/**
 * Sesión compartida para los specs e2e.
 *
 * El login de administrador se hace UNA sola vez en ./global-setup.ts, antes de
 * arrancar la suite, y aquí solo se lee el token de ese archivo. Así la corrida
 * completa gasta un único login del presupuesto del backend (10 cada 15 min) en
 * lugar de uno por spec.
 *
 * Los únicos logins reales que quedan son los de auth.spec.ts, donde el
 * formulario de login es justamente el sujeto de la prueba.
 */
import { APIRequestContext, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import { ARCHIVO_SESION } from './global-setup';

export const API = 'http://localhost:3000/api';

const CREDENCIALES = { email: 'admin@trifit.com', password: 'Admin123*' };

let tokenSesion = '';
let refreshSesion = '';
let usuarioSesion: any = null;

/**
 * Login real contra la API. Reservado para los casos que prueban el propio
 * inicio de sesión; el resto debe usar la sesión compartida.
 */
export async function loginApi(request: APIRequestContext, creds = CREDENCIALES) {
  const resp = await request.post(`${API}/auth/login`, { data: creds });
  if (resp.status() === 429) {
    throw new Error(
      'Login bloqueado por rate-limit (429): hubo demasiados logins recientes ' +
        '(corridas o pruebas manuales). Reinicia el backend ' +
        '(docker compose restart backend) y repite la suite.'
    );
  }
  expect(resp.ok(), `Login API falló: ${resp.status()}`).toBeTruthy();
  return resp.json();
}

/**
 * Carga la sesión de administrador creada por global-setup. Es idempotente y no
 * hace ninguna petición de red.
 */
export function cargarSesionAdmin() {
  if (tokenSesion) return;
  if (!fs.existsSync(ARCHIVO_SESION)) {
    throw new Error(
      `No existe ${ARCHIVO_SESION}. Lo crea global-setup.ts al arrancar la ` +
        'suite; si lanzas un spec suelto, hazlo con "npx playwright test" para ' +
        'que se ejecute el global setup.'
    );
  }
  const s = JSON.parse(fs.readFileSync(ARCHIVO_SESION, 'utf8'));
  tokenSesion = s.token;
  refreshSesion = s.refreshToken;
  usuarioSesion = s.usuario;
}

export async function asegurarToken() {
  cargarSesionAdmin();
  return tokenSesion;
}

export async function inyectarSesion(page: Page) {
  cargarSesionAdmin();
  await page.addInitScript(
    ({ token, refresh, usuario }) => {
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_refresh', refresh);
      localStorage.setItem('tf_usuario', JSON.stringify(usuario));
    },
    { token: tokenSesion, refresh: refreshSesion, usuario: usuarioSesion }
  );
}

export function authed(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string) => request.get(url, { headers }),
    post: (url: string, data: any) => request.post(url, { headers, data }),
    patch: (url: string, data: any) => request.patch(url, { headers, data }),
    put: (url: string, data: any) => request.put(url, { headers, data }),
    del: (url: string) => request.delete(url, { headers })
  };
}
