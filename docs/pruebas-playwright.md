# Casos de prueba (Playwright)

> **Pendiente:** sube aquí el archivo del docente con los casos de prueba a realizar (o reemplaza este archivo).

## Convención sugerida

- Un archivo Markdown por suite o módulo.
- Tabla con: ID, descripción, precondiciones, pasos, resultado esperado.
- Numeración: `TC-<modulo>-<numero>` (ej. `TC-LOGIN-01`).

## Plantilla de caso

```markdown
### TC-LOGIN-01 — Inicio de sesión válido
- **Precondiciones:** usuario `admin@trifit.com` activo en la base.
- **Pasos:**
  1. Ir a `/login`.
  2. Ingresar correo y contraseña válidos.
  3. Hacer clic en "Ingresar".
- **Resultado esperado:** redirige a `/app/dashboard` (o `/app/clientes` si es ENTRENADOR).
```

Cuando subas el documento, lo paso a `e2e/*.spec.ts` siguiendo la misma estructura.
