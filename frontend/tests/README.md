# E2E (Playwright)

Tests end-to-end de TriFit Gym Manager usando Playwright.

## Requisitos
- Backend (`http://localhost:3000`) con la base de datos sembrada (`npm run seed` en `backend/`).
- Si el frontend no está corriendo, `playwright.config.ts` lo levanta automáticamente con `npm start`.

## Comandos

| Comando | Descripción |
|---|---|
| `npx playwright test` | Ejecuta todos los tests |
| `npx playwright test --ui` | Modo UI (depuración interactiva) |
| `npx playwright test --headed` | Ver el navegador mientras corre |
| `npx playwright test --debug` | Paso a paso |
| `npx playwright codegen http://localhost:4200` | Graba interacciones y genera código |
| `npx playwright show-report` | Abre el reporte HTML |

## Estructura
- `playwright.config.ts` — Configuración global (base URL, navegadores, webServer).
- `e2e/*.spec.ts` — Suites de pruebas. Aquí se agregan las que recibas del docente.
- `playwright-report/` — Reporte HTML generado tras cada corrida.
- `test-results/` — Capturas y traces de fallos.

## Notas
- Las pruebas del proyecto se suben como archivo adicional. Colócalas en `e2e/` y ejecútalas con `npx playwright test <archivo>`.
- Selectores recomendados: `getByRole`, `getByLabel`, `getByText` (evitan depender de clases CSS internas de Angular Material).
- Para tests con sesión activa, usa `context.addInitScript()` para inyectar el token en `localStorage` y evitar el login repetido.
