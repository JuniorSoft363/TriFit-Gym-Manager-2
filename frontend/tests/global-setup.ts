/**
 * Un único login de administrador para toda la corrida.
 *
 * Antes cada spec hacía su propio login en beforeAll y la suite pedía 14 en
 * total, por encima del límite de 10/15min del backend: el 429 tumbaba el
 * beforeAll de pagos y se caían sus 6 casos. Aquí se inicia sesión una sola vez
 * y los specs reutilizan el token desde el archivo (ver ./sesion.ts).
 *
 * El token dura 30 minutos y la suite tarda unos 4, así que no hace falta
 * rotarlo durante la corrida.
 */
import { request as peticion } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const API = 'http://localhost:3000/api';
export const ARCHIVO_SESION = path.join(__dirname, '.sesion-admin.json');

const CREDENCIALES = { email: 'admin@trifit.com', password: 'Admin123*' };

async function globalSetup() {
  const ctx = await peticion.newContext({ ignoreHTTPSErrors: true });
  try {
    const resp = await ctx.post(`${API}/auth/login`, { data: CREDENCIALES });

    if (resp.status() === 429) {
      throw new Error(
        'El backend rechazó el login con 429 (rate-limit). Hubo demasiados ' +
          'intentos recientes: reinicia el backend con "docker compose restart ' +
          'backend" y vuelve a lanzar la suite.'
      );
    }
    if (!resp.ok()) {
      throw new Error(
        `Login de administrador falló con ${resp.status()}. Comprueba que el ` +
          'backend responde en http://localhost:3000 y que la base está sembrada ' +
          '(npm run seed en backend/).'
      );
    }

    const body = await resp.json();
    fs.writeFileSync(
      ARCHIVO_SESION,
      JSON.stringify({ token: body.token, refreshToken: body.refreshToken, usuario: body.usuario })
    );
  } catch (e: any) {
    if (e?.message?.includes('connect')) {
      throw new Error(
        'No se pudo conectar con el backend en http://localhost:3000. ' +
          'Levanta la aplicación con "docker compose up -d" antes de la suite.'
      );
    }
    throw e;
  } finally {
    await ctx.dispose();
  }
}

export default globalSetup;
