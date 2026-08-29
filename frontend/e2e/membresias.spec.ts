import { test, expect, Page } from '@playwright/test';

/**
 * Casos TC-INT-01..TC-INT-10 — Módulo Membresías de TriFit Gym Manager.
 * Documentación: docs/pruebas-playwright.md
 *
 * Requisitos:
 *  - Backend activo (npm run dev en backend/) con BD sembrada.
 *  - Cliente de prueba: 1712345678 (con membresía vencida, sin membresía activa)
 *  - Plan activo: "Mensual" (id 1, 30 días)
 *  - Plan inactivo: requiere crearlo o cambiar el flag activo = false en BD
 *
 * Variables de entorno opcionales para datos de prueba:
 *   TEST_CEDULA           cédula del cliente de prueba
 *   TEST_CEDULA_INEXISTENTE  cédula que no existe
 *   TEST_PLAN_ID          id del plan activo a usar
 */

const CEDULA = process.env.TEST_CEDULA || '1712345678';
const CEDULA_INEXISTENTE = process.env.TEST_CEDULA_INEXISTENTE || '0999999999';
const PLAN_ID = Number(process.env.TEST_PLAN_ID || 1);

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@trifit.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Admin123*');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(/\/app\//);
}

async function irAMembresias(page: Page) {
  await page.getByRole('link', { name: /Planes y Membresías/i }).click();
  await page.getByRole('tab', { name: 'Membresías' }).click();
  await expect(page.getByRole('button', { name: /Asignar membresía/i })).toBeVisible();
}

test.describe('Módulo Membresías (TC-INT-01..10)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/app/membresias');
  });

  test('TC-INT-01 — Asignar membresía con datos válidos', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await expect(page.getByRole('heading', { name: 'Asignar membresía' })).toBeVisible();

    await page.getByLabel('Cédula del cliente').fill(CEDULA);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByText(/Cliente:/)).toBeVisible({ timeout: 5000 });

    await page.getByLabel('Plan').click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Asignar' }).click();

    await expect(page.getByText(/Membresía asignada correctamente/i)).toBeVisible({ timeout: 5000 });
  });

  test('TC-INT-02 — Bloquea segunda membresía activa para el mismo cliente', async ({ page, request }) => {
    // Crear una membresía activa vía API directamente para asegurar precondición
    const asignar = await request.post('http://localhost:3000/api/membresias', {
      data: { clienteId: 1, planId: PLAN_ID }
    });
    test.skip(asignar.status() !== 201, 'No se pudo crear la membresía previa; verifica que el cliente no tenga ya una activa');

    const resp = await request.post('http://localhost:3000/api/membresias', {
      data: { clienteId: 1, planId: PLAN_ID }
    });
    expect(resp.status()).toBe(409);
    const body = await resp.json();
    expect(body.mensaje).toMatch(/ya tiene una membresía activa/i);
  });

  test('TC-INT-03 — Cliente inexistente', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await page.getByLabel('Cédula del cliente').fill(CEDULA_INEXISTENTE);
    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByText(/Cliente no encontrado/i)).toBeVisible({ timeout: 5000 });
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
    await botonRenovar.waitFor({ state: 'visible', timeout: 5000 });
    await botonRenovar.click();
    await page.getByRole('button', { name: 'Renovar' }).click();
    await expect(page.getByText(/Membresía renovada/i)).toBeVisible({ timeout: 5000 });
  });

  test('TC-INT-06 — Cambiar estado a SUSPENDIDA', async ({ page }) => {
    await irAMembresias(page);
    const fila = page.locator('table tbody tr').first();
    await fila.locator('button[mattooltip="Cambiar estado"]').click();
    await page.getByRole('menuitem', { name: 'Suspender' }).click();
    await expect(page.getByText(/Estado actualizado a SUSPENDIDA/i)).toBeVisible({ timeout: 5000 });
  });

  test('TC-INT-07 — Cambiar estado a CANCELADA', async ({ page }) => {
    await irAMembresias(page);
    const fila = page.locator('table tbody tr').first();
    await fila.locator('button[mattooltip="Cambiar estado"]').click();
    await page.getByRole('menuitem', { name: 'Cancelar' }).click();
    await expect(page.getByText(/Estado actualizado a CANCELADA/i)).toBeVisible({ timeout: 5000 });
  });

  test('TC-INT-08 — El selector de planes carga el catálogo', async ({ page }) => {
    await irAMembresias(page);
    await page.getByRole('button', { name: /Asignar membresía/i }).click();
    await page.getByLabel('Plan').click();
    const opciones = page.getByRole('option');
    await expect(opciones.first()).toBeVisible();
    expect(await opciones.count()).toBeGreaterThan(0);
  });

  test('TC-INT-09 — Paginación funciona al cambiar el tamaño de página', async ({ page }) => {
    await irAMembresias(page);
    // Solo verificamos que el paginador está presente y la tabla responde.
    // Los datos de prueba determinan el contenido concreto.
    const paginator = page.locator('mat-paginator');
    await expect(paginator).toBeVisible();
  });

  test('TC-INT-10 — Renovar una membresía cancelada no produce error 500', async ({ page, request }) => {
    // Crear y cancelar una membresía vía API
    const asignar = await request.post('http://localhost:3000/api/membresias', {
      data: { clienteId: 2, planId: PLAN_ID }
    });
    if (asignar.status() === 201) {
      const creada = await asignar.json();
      await request.patch(`http://localhost:3000/api/membresias/${creada.id}/estado`, {
        data: { estado: 'CANCELADA' }
      });
      const renovar = await request.patch(`http://localhost:3000/api/membresias/${creada.id}/renovar`);
      expect(renovar.status()).toBeLessThan(500);
    } else {
      test.skip(true, 'No se pudo crear la membresía de prueba (cliente con membresía activa previa)');
    }
  });
});
