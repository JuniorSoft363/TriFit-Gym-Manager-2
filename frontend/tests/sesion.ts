/**
 * Sesión compartida para los specs e2e.
 *
 * Un solo POST /auth/login por corrida (respeta el rate-limit de 10/15 min);
 * cada test obtiene su access token vía POST /auth/refresh (rotación).
 */
import { APIRequestContext, expect, Page } from '@playwright/test';

export const API = 'http://localhost:3000/api';

const CREDENCIALES = { email: 'admin@trifit.com', password: 'Admin123*' };

let tokenSesion = '';
let refreshSesion = '';
let usuarioSesion: any = null;

export async function loginReal(request: APIRequestContext) {
  const resp = await request.post(`${API}/auth/login`, { data: CREDENCIALES });
  expect(resp.ok(), `Login API falló: ${resp.status()}`).toBeTruthy();
  const body = await resp.json();
  tokenSesion = body.token;
  refreshSesion = body.refreshToken;
  usuarioSesion = body.usuario;
}

export async function refrescarSesion(request: APIRequestContext) {
  if (!refreshSesion) {
    await loginReal(request);
    return;
  }
  const resp = await request.post(`${API}/auth/refresh`, { data: { refreshToken: refreshSesion } });
  if (!resp.ok()) {
    await loginReal(request);
    return;
  }
  const body = await resp.json();
  tokenSesion = body.token;
  refreshSesion = body.refreshToken;
  usuarioSesion = body.usuario;
}

export async function asegurarToken(request: APIRequestContext) {
  await refrescarSesion(request);
  return tokenSesion;
}

export async function inyectarSesion(page: Page) {
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
