/** TEMPORAL — capturas de toolbars para ver solapes. Eliminar. */
import test, { APIRequestContext, expect, Page } from "@playwright/test";

const API = 'http://localhost:3000/api';

async function loginAdmin(page: Page, request: APIRequestContext) {
  const resp = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@trifit.com', password: 'Admin123*' }
  });
  const body = await resp.json();
  await page.addInitScript(({ token, usuario }) => {
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_usuario', JSON.stringify(usuario));
  }, { token: body.token, usuario: body.usuario });
}

test('capturas toolbars', async ({ page, request }) => {
  await loginAdmin(page, request);

  await page.goto('/app/membresias', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Membresías' }).click();
  await page.waitForTimeout(800);
  await page.locator('.tf-toolbar-filtros').first().screenshot({ path: 'test-results/tb-membresias2.png' });

  await page.goto('/app/asistencias', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.locator('mat-card.tf-card').first().screenshot({ path: 'test-results/tb-asistencias.png' });

  await page.goto('/app/configuracion', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/tb-config-full.png' });
  const tab = page.getByRole('tab', { name: /auditor/i });
  if (await tab.count()) {
    await tab.first().click();
    await page.waitForTimeout(800);
    await page.locator('.tf-toolbar-filtros').first().screenshot({ path: 'test-results/tb-auditoria.png' });
  }
});
