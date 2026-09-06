/**
 * TC-AUTH-01..06 — Autenticación y sesiones de TriFit Gym Manager.
 *
 * Cubre: login válido/inválido por UI, guard de rutas, cambio forzado de
 * contraseña inicial (UI + API) y logout con revocación del refresh.
 * Usa UN solo login API por corrida (ver ./sesion.ts) para respetar el
 * rate-limit; los logins por UI son solo donde el formulario es el sujeto.
 */
import test, { expect } from "@playwright/test";
import { API, asegurarToken, authed, loginReal } from "./sesion";

const TEMP = {
  nombre: 'TMP Auth',
  email: 'tmp.auth@trifit.com',
  pass: 'Temporal123*',
  nueva: 'NuevaClave456*',
  rolId: 2
};

// Sesión del temporal capturada del localStorage en TC-AUTH-04.
let sesionTemp: { token: string; refresh: string } | null = null;
let tempId = 0;

async function irAlLogin(page: any) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible({ timeout: 15000 });
}

test.describe('Autenticación y sesiones (TC-AUTH-01..06)', () => {
  test.beforeAll(async ({ request }) => {
    await loginReal(request);
    const admin = authed(request, await asegurarToken(request));
    // Asegurar temporal con contraseña conocida (idempotente entre corridas).
    const creado = await admin.post(`${API}/usuarios`, {
      nombre: TEMP.nombre,
      email: TEMP.email,
      password: TEMP.pass,
      rolId: TEMP.rolId
    });
    if (creado.status() === 409) {
      const lista = await admin.get(`${API}/usuarios?busqueda=${TEMP.email}&limit=5`);
      const datos = (await lista.json()).datos ?? [];
      tempId = datos[0]?.id;
      // Resetear contraseña conocida (también reactiva el cambio obligatorio).
      await admin.put(`${API}/usuarios/${tempId}`, { password: TEMP.pass });
    } else {
      expect(creado.ok(), `Crear temporal falló: ${creado.status()}`).toBeTruthy();
      tempId = (await creado.json()).id;
    }
  });

  test.afterAll(async ({ request }) => {
    if (!tempId) return;
    const admin = authed(request, await asegurarToken(request));
    await admin.del(`${API}/usuarios/${tempId}?definitivo=true`);
  });

  test('TC-AUTH-01 — Login válido por UI llega al dashboard', async ({ page }) => {
    await irAlLogin(page);
    await page.getByLabel('Correo electrónico').fill('admin@trifit.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('Admin123*');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('TC-AUTH-02 — Login inválido muestra error y no navega', async ({ page }) => {
    await irAlLogin(page);
    await page.getByLabel('Correo electrónico').fill('admin@trifit.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('ClaveIncorrecta123*');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.locator('.tf-login-error')).toContainText(/Credenciales incorrectas/i, {
      timeout: 10000
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-03 — Ruta protegida sin sesión redirige a login', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('TC-AUTH-04 — Cambio forzado: login lleva a perfil y bloquea lo demás', async ({
    page,
    request
  }) => {
    await irAlLogin(page);
    await page.getByLabel('Correo electrónico').fill(TEMP.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(TEMP.pass);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/app\/perfil/, { timeout: 15000 });
    await expect(page.locator('.tf-perfil-aviso')).toContainText(/contraseña inicial/i);

    // Intentar otra ruta vuelve al perfil.
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/app\/perfil/, { timeout: 15000 });

    // La API también bloquea (403 con código), excepto perfil/password.
    sesionTemp = await page.evaluate(() => ({
      token: localStorage.getItem('tf_token')!,
      refresh: localStorage.getItem('tf_refresh')!
    }));
    const r = authed(request, sesionTemp.token);
    const bloqueado = await r.get(`${API}/clientes?limit=1`);
    expect(bloqueado.status()).toBe(403);
    expect((await bloqueado.json()).codigo).toBe('PASSWORD_CAMBIAR_REQUERIDO');
    const perfil = await r.get(`${API}/auth/perfil`);
    expect(perfil.ok()).toBeTruthy();
  });

  test('TC-AUTH-05 — Tras cambiar la contraseña se libera el acceso', async ({ page, request }) => {
    test.skip(!sesionTemp, 'TC-AUTH-04 debe pasar primero (sesión del temporal)');
    await page.addInitScript(({ token, refresh }) => {
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_refresh', refresh);
      localStorage.setItem(
        'tf_usuario',
        JSON.stringify({
          id: 0,
          nombre: 'TMP',
          email: TEMP.email,
          rol: 'RECEPCIONISTA',
          debeCambiarPassword: true
        })
      );
    }, sesionTemp);
    await page.goto('/app/perfil', { waitUntil: 'networkidle' });
    await expect(page.locator('.tf-perfil-aviso')).toBeVisible({ timeout: 15000 });

    await page.getByLabel('Contraseña actual', { exact: true }).fill(TEMP.pass);
    await page.getByLabel('Nueva contraseña', { exact: true }).fill(TEMP.nueva);
    await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(TEMP.nueva);
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
    await expect(page.getByText(/Contraseña actualizada correctamente/i)).toBeVisible({
      timeout: 10000
    });
    await expect(page.locator('.tf-perfil-aviso')).toHaveCount(0);

    // Ya puede navegar y la API responde.
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 15000 });
    const r = authed(request, sesionTemp!.token);
    const perfil = await r.get(`${API}/auth/perfil`);
    expect(perfil.ok()).toBeTruthy();
    expect((await perfil.json()).debeCambiarPassword).toBe(false);
  });

  test('TC-AUTH-06 — Logout cierra sesión y revoca el refresh', async ({ page, request }) => {
    // Sesión fresca (TC-AUTH-05 revocó las anteriores al cambiar la contraseña).
    // Si TC-AUTH-05 no corrió, la contraseña sigue siendo la inicial.
    let login = await request.post(`${API}/auth/login`, {
      data: { email: TEMP.email, password: TEMP.nueva }
    });
    if (!login.ok()) {
      login = await request.post(`${API}/auth/login`, {
        data: { email: TEMP.email, password: TEMP.pass }
      });
    }
    expect(login.ok(), `Login temporal falló: ${login.status()}`).toBeTruthy();
    const body = await login.json();
    sesionTemp = { token: body.token, refresh: body.refreshToken };
    await page.addInitScript(
      ({ token, refresh, usuario }) => {
        localStorage.setItem('tf_token', token);
        localStorage.setItem('tf_refresh', refresh);
        localStorage.setItem('tf_usuario', JSON.stringify(usuario));
      },
      { token: body.token, refresh: body.refreshToken, usuario: body.usuario }
    );
    await page.goto('/app/dashboard', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    const vacio = await page.evaluate(() => localStorage.getItem('tf_token'));
    expect(vacio).toBeNull();

    // El refresh quedó revocado en el servidor.
    const reuso = await request.post(`${API}/auth/refresh`, {
      data: { refreshToken: sesionTemp!.refresh }
    });
    expect(reuso.status()).toBe(401);
  });
});
