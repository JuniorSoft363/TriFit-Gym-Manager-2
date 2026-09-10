/**
 * Herramienta de auditoría visual (NO es suite de pruebas: no falla por
 * píxeles, solo captura). Genera screenshots de cada ruta en tema dark/light,
 * desktop y móvil, para revisión manual.
 * Uso: npx playwright test tests/auditoria-visual.spec.ts
 */
import test, { expect } from "@playwright/test";
import { inyectarSesion, cargarSesionAdmin } from "./sesion";

const RUTAS = [
  'dashboard',
  'clientes',
  'membresias',
  'pagos',
  'asistencias',
  'entrenadores',
  'rutinas',
  'inventario',
  'reportes',
  'configuracion',
  'perfil'
];
const RUTAS_MOVIL = ['dashboard', 'clientes', 'membresias', 'pagos'];
const TEMAS = ['dark', 'light'] as const;

test.describe.configure({ mode: 'serial' });

test.describe('Auditoría visual — desktop', () => {
  test.beforeAll(() => {
    cargarSesionAdmin();
  });

  for (const tema of TEMAS) {
    test(`desktop/${tema}`, async ({ page, request }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript((t) => localStorage.setItem('tf_theme', t), tema);
      await inyectarSesion(page);
      for (const ruta of RUTAS) {
        await page.goto(`/app/${ruta}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: `tests/auditoria/desktop-${tema}-${ruta}.png` });
      }
      await page.evaluate(() => localStorage.clear());
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `tests/auditoria/desktop-${tema}-login.png` });
      expect(true).toBe(true);
    });
  }
});

test.describe('Auditoría visual — móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeAll(() => {
    cargarSesionAdmin();
  });

  for (const tema of TEMAS) {
    test(`movil/${tema}`, async ({ page, request }) => {
      await page.addInitScript((t) => localStorage.setItem('tf_theme', t), tema);
      await inyectarSesion(page);
      for (const ruta of RUTAS_MOVIL) {
        await page.goto(`/app/${ruta}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: `tests/auditoria/movil-${tema}-${ruta}.png` });
      }
      expect(true).toBe(true);
    });
  }
});
