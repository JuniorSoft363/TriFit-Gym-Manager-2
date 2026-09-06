/**
 * TC-PAG-01..06 — Módulo Pagos de TriFit Gym Manager.
 *
 * Cubre: registro válido por UI, validaciones (400), anulación por UI
 * verificada por API, idempotencia de anular, filtros y smoke de la vista.
 * Sesión compartida vía ./sesion.ts (un solo login por corrida).
 */
import test, { expect, Page } from "@playwright/test";
import { API, asegurarToken, authed, inyectarSesion, loginReal, refrescarSesion } from "./sesion";

async function irAPagos(page: Page) {
  await page.goto('/app/pagos', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Pagos' })).toBeVisible({ timeout: 15000 });
}

test.describe('Módulo Pagos (TC-PAG-01..06)', () => {
  test.beforeAll(async ({ request }) => {
    await loginReal(request);
  });

  test.beforeEach(async ({ page, request }) => {
    await refrescarSesion(request);
    await inyectarSesion(page);
  });

  test('TC-PAG-01 — Registrar pago válido por UI', async ({ page, request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/membresias?estado=ACTIVA&limit=1`);
    test.skip(!lista.ok(), `No se pudo listar membresías: ${lista.status()}`);
    const activa = (await lista.json()).datos?.[0];
    test.skip(!activa, 'No hay membresías activas (ejecuta npm run seed:dataset)');

    await irAPagos(page);
    await page.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page.getByRole('heading', { name: 'Registrar pago' })).toBeVisible();

    const dlg = page.locator('mat-dialog-container');
    await dlg.getByLabel('Cédula del cliente').fill(activa.cliente.cedula);
    await dlg.getByRole('button', { name: 'Buscar' }).click();
    await expect(dlg.getByText(/Cliente:/)).toBeVisible({ timeout: 10000 });

    await dlg.getByLabel('Monto').fill('30');
    await dlg.getByLabel('Método de pago').click();
    await page.getByRole('option', { name: 'Efectivo' }).click();
    await dlg.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByText(/Pago registrado correctamente/i)).toBeVisible({ timeout: 10000 });
  });

  test('TC-PAG-02 — Validaciones devuelven 400 sin error 500', async ({ request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/membresias?estado=ACTIVA&limit=1`);
    test.skip(!lista.ok(), `No se pudo listar membresías: ${lista.status()}`);
    const activa = (await lista.json()).datos?.[0];
    test.skip(!activa, 'No hay membresías activas (ejecuta npm run seed:dataset)');

    const montoCero = await r.post(`${API}/pagos`, {
      membresiaId: activa.id,
      monto: 0,
      metodo: 'EFECTIVO'
    });
    expect(montoCero.status()).toBe(400);

    const metodoMalo = await r.post(`${API}/pagos`, {
      membresiaId: activa.id,
      monto: 30,
      metodo: 'TRUEQUE'
    });
    expect(metodoMalo.status()).toBe(400);

    const sinMembresia = await r.post(`${API}/pagos`, {
      membresiaId: 999999,
      monto: 30,
      metodo: 'EFECTIVO'
    });
    expect(sinMembresia.status(), `Membresía inexistente devolvió ${sinMembresia.status()}`).toBeLessThan(
      500
    );
  });

  test('TC-PAG-03 — Anular pago por UI queda ANULADO en la API', async ({ page, request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/pagos?estado=PAGADO&limit=1`);
    test.skip(!lista.ok(), `No se pudo listar pagos: ${lista.status()}`);
    const pago = (await lista.json()).datos?.[0];
    test.skip(!pago, 'No hay pagos en estado PAGADO para anular');
    const cedula = pago.membresia?.cliente?.cedula;
    test.skip(!cedula, 'El pago no trae cliente para buscarlo en la UI');

    await irAPagos(page);
    await page.getByLabel('Buscar por cliente').fill(cedula);
    const fila = page.locator('table tbody tr').first();
    await expect(fila).toBeVisible({ timeout: 10000 });
    const btnAnular = fila.locator('button[mattooltip="Anular"]');
    await expect(btnAnular).toBeEnabled();
    await btnAnular.click();

    const dlg = page.locator('mat-dialog-container');
    await dlg.getByRole('button', { name: 'Anular' }).click();
    await expect(page.getByText(/Pago anulado/i)).toBeVisible({ timeout: 10000 });

    const verif = await r.get(`${API}/pagos?estado=ANULADO&busqueda=${cedula}&limit=5`);
    expect(verif.ok()).toBeTruthy();
    const anulados = (await verif.json()).datos ?? [];
    expect(anulados.some((p: any) => p.id === pago.id)).toBe(true);
  });

  test('TC-PAG-04 — Anular un pago ya anulado no produce error 500', async ({ request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const lista = await r.get(`${API}/pagos?estado=ANULADO&limit=1`);
    test.skip(!lista.ok(), `No se pudo listar pagos: ${lista.status()}`);
    const pago = (await lista.json()).datos?.[0];
    test.skip(!pago, 'No hay pagos anulados (anula uno primero)');

    const reintento = await r.patch(`${API}/pagos/${pago.id}/anular`, {});
    expect(reintento.status(), `Re-anular devolvió ${reintento.status()}`).toBeLessThan(500);
    expect((await reintento.json()).estado).toBe('ANULADO');
  });

  test('TC-PAG-05 — Filtro por estado solo trae ese estado', async ({ request }) => {
    const token = await asegurarToken(request);
    const r = authed(request, token);
    const resp = await r.get(`${API}/pagos?estado=ANULADO&limit=25`);
    expect(resp.ok(), `Listar anulados falló: ${resp.status()}`).toBeTruthy();
    const datos = (await resp.json()).datos ?? [];
    expect(datos.length).toBeGreaterThan(0);
    expect(datos.every((p: any) => p.estado === 'ANULADO')).toBe(true);
  });

  test('TC-PAG-06 — Vista muestra total y paginador', async ({ page }) => {
    await irAPagos(page);
    await expect(page.getByText(/Total en resultados:/)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('mat-paginator').first()).toBeVisible();
  });
});
