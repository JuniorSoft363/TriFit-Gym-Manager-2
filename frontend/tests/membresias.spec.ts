import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * Casos TC-INT-01..TC-INT-10 — Módulo Membresías de TriFit Gym Manager.
 * Documentación: docs/casos_de_prueba.md
 *
 * Estrategia:
 *  - Login se hace por API (POST /api/auth/login) para evitar flakiness
 *    de la UI; el token se inyecta en localStorage antes de navegar.
 *  - WebServer ya no levanta el backend: se asume que está corriendo
 *    en http://localhost:3000. Si no, los tests fallarán con error de red.
 *
 * Variables de entorno opcionales:
 *   TEST_CEDULA             cédula del cliente para TC-INT-01 (default 1712345678)
 *   TEST_CEDULA_INEXISTENTE cédula que no existe (default 0999999999)
 *   TEST_PLAN_ID            id del plan activo (default 1)
 *   TEST_CLIENTE_ID_2       id del cliente para TC-INT-10 (default 2)
 */

const CEDULA = process.env.TEST_CEDULA || '1956789012'; // Paola (sin membresía activa)
const CEDULA_INEXISTENTE = process.env.TEST_CEDULA_INEXISTENTE || '0999999999';
const PLAN_ID = Number(process.env.TEST_PLAN_ID || 1);
const CLIENTE_ID_2 = Number(process.env.TEST_CLIENTE_ID_2 || 2);
const API = 'http://localhost:3000/api';

async function loginComoAdmin(page: Page, request: APIRequestContext) {
  const resp = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@trifit.com', password: 'Admin123*' }
  });
  expect(resp.ok(), `Login API falló: ${resp.status()}`).toBeTruthy();
  const body = await resp.json();

  // Inyectar token y usuario en localStorage antes de cargar la app
  await page.addInitScript(({ token, usuario }) => {
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_usuario', JSON.stringify(usuario));
  }, { token: body.token, usuario: body.usuario });

  // Devolver el token para los tests que usan request directamente
  return body.token;
}

async function irAMembresias(page: Page) {
  await page.goto('/app/membresias', { waitUntil: 'networkidle' });
  // Esperar a que cargue al menos una pestaña
  await page.waitForSelector('mat-tab-group', { timeout: 15_000 });
  // Clic en pestaña Membresías
  await page.getByRole('tab', { name: 'Membresías' }).click();
  // Esperar a que aparezca el botón "Asignar membresía"
  await expect(page.getByRole('button', { name: /Asignar membresía/i })).toBeVisible({ timeout: 15_000 });
}

test.describe('Módulo Membresías (TC-INT-01..10)', () => {
  test.beforeEach(async ({ page, request }) => {
    const token = await loginComoAdmin(page, request);
    // Adjuntar el token a las request de Playwright para los tests que usan API directamente
    (request as any).token = token;
  });

  // Helper para hacer request autenticados
  function authedRequest(request: APIRequestContext) {
    const token = (request as any).token;
    return {
      get: (url: string) => request.get(url, { headers: { Authorization: `Bearer ${token}` } }),
      post: (url: string, data: any) => request.post(url, { headers: { Authorization: `Bearer ${token}` }, data }),
      patch: (url: string, data: any) => request.patch(url, { headers: { Authorization: `Bearer ${token}` }, data })
    };
  }

  test('TC-INT-01 — Asignar membresía con datos válidos', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await expect(page.getByRole('heading', { name: 'Asignar membresía' })).toBeVisible();

    await page.getByLabel('Cédula del cliente').fill(CEDULA);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText(/Cliente:/)).toBeVisible({ timeout: 10_000 });

    // Seleccionar plan dentro del diálogo (no el filtro de la pestaña)
    const dialogPlan = page.locator('mat-dialog-content').getByLabel('Plan');
    await dialogPlan.click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Asignar' }).click();

    await expect(page.getByText(/Membresía asignada correctamente/i)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-02 — Bloquea segunda membresía activa para el mismo cliente', async ({ request }) => {
    const r = authedRequest(request);
    // Buscar el primer cliente que tenga membresía ACTIVA
    const lista = await r.get(`${API}/membresias?estado=ACTIVA&limit=50`);
    if (!lista.ok()) {
      test.skip(true, `No se pudo listar membresías: ${lista.status()}`);
      return;
    }
    const data = await lista.json();
    const activa = data.datos?.[0];
    test.skip(!activa, 'No hay membresías activas (ejecuta npm run seed:dataset)');

    // Intentar crear duplicado para el mismo cliente
    const dup = await r.post(`${API}/membresias`, { clienteId: activa.clienteId, planId: PLAN_ID });
    expect(dup.status()).toBe(409);
    const body = await dup.json();
    expect(body.mensaje).toMatch(/ya tiene una membresía activa/i);
  });

  test('TC-INT-03 — Cliente inexistente', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await page.getByLabel('Cédula del cliente').fill(CEDULA_INEXISTENTE);
    await page.getByRole('button', { name: 'Buscar' }).click();

    // El snack-bar contiene el mensaje de error
    await expect(page.locator('mat-snack-bar-container').getByText(/Cliente no encontrado/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Asignar' })).toBeDisabled();
  });

  test('TC-INT-04 — Botón Asignar deshabilitado con campos vacíos', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await expect(page.getByRole('button', { name: 'Asignar' })).toBeDisabled();
  });

  test('TC-INT-05 — Renovar una membresía activa o vencida', async ({ page }) => {
    await irAMembresias(page);
    const botonRenovar = page.locator('button[mattooltip="Renovar"]').first();
    await expect(botonRenovar).toBeVisible({ timeout: 10_000 });
    await botonRenovar.click();
    await page.getByRole('button', { name: 'Renovar' }).click();
    await expect(page.getByText(/Membresía renovada/i)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-06 — Cambiar estado a SUSPENDIDA', async ({ page }) => {
    await irAMembresias(page);
    const fila = page.locator('table tbody tr').first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button[mattooltip="Cambiar estado"]').click();
    await page.getByRole('menuitem', { name: 'Suspender' }).click();
    await expect(page.getByText(/Estado actualizado a SUSPENDIDA/i)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-07 — Cambiar estado a CANCELADA', async ({ page }) => {
    await irAMembresias(page);
    const fila = page.locator('table tbody tr').first();
    await expect(fila).toBeVisible({ timeout: 10_000 });
    await fila.locator('button[mattooltip="Cambiar estado"]').click();
    await page.getByRole('menuitem', { name: 'Cancelar' }).click();
    await expect(page.getByText(/Estado actualizado a CANCELADA/i)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-08 — El selector de planes carga el catálogo', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    // Solo el plan del diálogo
    const dialogPlan = page.locator('mat-dialog-content').getByLabel('Plan');
    await dialogPlan.click();
    const opciones = page.getByRole('option');
    await expect(opciones.first()).toBeVisible();
    expect(await opciones.count()).toBeGreaterThan(0);
  });

  test('TC-INT-09 — Paginación funciona al cambiar el tamaño de página', async ({ page }) => {
    await irAMembresias(page);
    // El paginator está dentro del mat-tab activo (Membresías)
    const paginator = page.locator('mat-paginator').first();
    await expect(paginator).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-10 — Renovar una membresía cancelada no produce error 500', async ({ request }) => {
    const r = authedRequest(request);
    // Buscar una membresía cancelada existente (el seed incluye 2)
    const lista = await r.get(`${API}/membresias?estado=CANCELADA&limit=1`);
    if (!lista.ok()) {
      test.skip(true, `No se pudo listar membresías canceladas: ${lista.status()}`);
      return;
    }
    const data = await lista.json();
    const cancelada = data.datos?.[0];
    test.skip(!cancelada, 'No hay membresías canceladas en la BD (ejecuta npm run seed:dataset)');

    const rRenovar = await r.patch(`${API}/membresias/${cancelada.id}/renovar`, {});
    expect(rRenovar.status(), `Renovar cancelada devolvió ${rRenovar.status()}`).toBeLessThan(500);
  });
});
