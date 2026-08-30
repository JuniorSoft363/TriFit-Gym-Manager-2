import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para TriFit Gym Manager.
 *
 * - Asume que el backend (http://localhost:3000) y el frontend
 *   (http://localhost:4200) están disponibles. Si el frontend no
 *   está corriendo, el `webServer` lo levanta automáticamente con
 *   `npm start`. Para el backend, ajusta `reuseExistingServer` o
 *   lánzalo en otra terminal.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 90_000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe'
  }
});
