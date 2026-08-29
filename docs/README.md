# Documentación

En esta carpeta se guardan los documentos del proyecto:

- `casos_de_prueba.md` — Casos de prueba definidos para el módulo Membresías (10 casos TC-INT-01..10).
- `resultados-pruebas.md` — Plantilla para registrar los resultados de la ejecución manual de los casos.
- `evidencias/` — (excluida de git) Carpeta local con capturas de pantalla de la ejecución.

## Convención de archivos

- Nombres en minúsculas, sin espacios, con guiones (kebab-case).
- Markdown (`.md`) para documentos de texto.
- Evidencias (capturas) en `evidencias/<TC-INT-XX>/` con numeración `01-`, `02-`, etc.

## Cómo ejecutar las pruebas manualmente

1. Asegúrate de que el backend y el frontend estén corriendo.
2. Abre `casos_de_prueba.md` y lee las precondiciones de cada caso.
3. Para cada caso, sigue los pasos y compara con el resultado esperado.
4. Captura pantalla del estado final.
5. Llena la fila correspondiente en `resultados-pruebas.md` con:
   - Resultado obtenido
   - Estado (APROBADO / FALLIDO)
   - Ruta de la evidencia
6. Tras ejecutar todos los casos, completa la sección **Análisis de errores** y **Conclusiones** de `resultados-pruebas.md`.
