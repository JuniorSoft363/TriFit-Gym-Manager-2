import { test, expect, Page } from '@playwright/test';

/**
 * Tests E2E de TriFit Gym Manager.
 *
 * Credenciales por defecto (las del seed del backend):
 *   admin@trifit.com / Admin123*
 *
 * Si el backend no está corriendo, los tests fallarán con timeout
 * al intentar comunicarse con http://localhost:3000/api.
 */

const ADMIN_EMAIL = 'admin@trifit.com';
const ADMIN_PASSWORD = 'Admin123*';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test.describe('Login', () => {
  test('muestra la landing page al iniciar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ingresar/i })).toBeVisible();
  });

  test('inicia sesión con credenciales válidas y redirige al dashboard', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/app\/(dashboard|clientes)/);
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@trifit.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText(/Credenciales incorrectas/i)).toBeVisible();
  });
});

test.describe('Perfil de usuario', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/app/perfil');
  });

  test('carga el formulario de datos personales', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
    await expect(page.getByLabel('Nombre completo')).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Teléfono')).toBeVisible();
    await expect(page.getByLabel('Dirección')).toBeVisible();
  });

  test('actualiza el teléfono y muestra mensaje de éxito', async ({ page }) => {
    const telefono = page.getByLabel('Teléfono');
    await telefono.fill('0991234567');
    await page.getByRole('button', { name: /Guardar cambios/i }).click();
    await expect(page.getByText(/Datos actualizados correctamente/i)).toBeVisible();
  });
});
