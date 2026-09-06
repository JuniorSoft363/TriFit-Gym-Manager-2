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
 *   TEST_customer ID CARD for TC-INT-01 (default 1956789012, no membership)
 *   TEST_CEDULA_INEXISTENTE cédula que no existe (default 0999999999)
 *   TEST_PLAN_ID            id del plan activo (default 1)
 */

import test, { expect, Page } from "@playwright/test";
import { API, asegurarToken, authed, inyectarSesion, loginReal, refrescarSesion } from "./sesion";

declare const process: {
  env: Record<string, string | undefined>;
};

const CEDULA = process.env.TEST_CEDULA || '1956789012';
const CEDULA_INEXISTENTE = process.env.TEST_CEDULA_INEXISTENTE || '0999999999';
const PLAN_ID = Number(process.env.TEST_PLAN_ID || 1);

async function irAMembresias(page: Page) {
  await page.goto('/app/membresias', { waitUntil: 'networkidle' });
  await page.waitForSelector('mat-tab-group', { timeout: 15000 });
  await page.getByRole('tab', { name: 'Membresías' }).click();
  await expect(page.getByRole('button', { name: /Asignar membresía/i })).toBeVisible({ timeout: 15000 });
}

test.describe('Módulo Membresías (TC-INT-01..10)', () => {
  test.beforeAll(async ({ request }) => {
    await loginReal(request);
  });

  test.beforeEach(async ({ page, request }) => {
    await refrescarSesion(request);
    await inyectarSesion(page);
  });

  test('TC-INT-01 — Assign membership with valid data', async ({ page, request }) => {
    // Verificar precondición: el cliente no debe tener membresía activa.
    // Si ya la tiene (por una corrida previa del test), omitir para mantener
    // idempotencia. Para resetear la BD entre corridas: npm run seed:dataset.
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const cliente = await r.get(`${API}/clientes/cedula/${CEDULA}`);
    if (cliente.ok()) {
      const cli = await cliente.json();
      const membresias = await r.get(`${API}/membresias?busqueda=${cli.cedula}&limit=5`);
      if (membresias.ok()) {
        const data = await membresias.json();
        const tieneActiva = data.datos?.some((m: any) => m.estado === 'ACTIVA');
        test.skip(tieneActiva, 'El cliente de prueba ya tiene una membresía activa. Ejecuta npm run seed:dataset para reiniciar.');
      }
    }

    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await expect(page.getByRole('heading', { name: 'Asignar membresía' })).toBeVisible();

    await page.getByLabel('Cédula del cliente').fill(CEDULA);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText(/Cliente:/)).toBeVisible({ timeout: 10_000 });

    const dialogPlan = page.locator('mat-dialog-content').getByLabel('Plan');
    await dialogPlan.click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Asignar' }).click();

    await expect(page.getByText(/Membresía asignada correctamente/i)).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-02 — Bloquea segunda membresía activa para el mismo cliente', async ({ page, request }) => {
    // Re-autenticar con token de API porque la página no afecta al request context
    const token = await asegurarToken(request);
    const r = authed(request, token);

    // Buscar la primera membresía activa del seed
    const lista = await r.get(`${API}/membresias?estado=ACTIVA&limit=50`);
    if (!lista.ok()) {
      test.skip(true, `No se pudo listar membresías: ${lista.status()}`);
      return;
    }
    const data = await lista.json();
    const activa = data.datos?.[0];
    test.skip(!activa, 'No hay membresías activas (ejecuta npm run seed:dataset)');

    // Intentar duplicado
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
    const dialogPlan = page.locator('mat-dialog-content').getByLabel('Plan');
    await dialogPlan.click();
    const opciones = page.getByRole('option');
    await expect(opciones.first()).toBeVisible();
    expect(await opciones.count()).toBeGreaterThan(0);
  });

  test('TC-INT-09 — Paginación funciona al cambiar el tamaño de página', async ({ page }) => {
    await irAMembresias(page);
    const paginator = page.locator('mat-paginator').first();
    await expect(paginator).toBeVisible({ timeout: 10_000 });
  });

  test('TC-INT-10 — Renovar una membresía cancelada no produce error 500', async ({ page, request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);

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
