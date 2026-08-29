# Resultados de pruebas manuales — Módulo Membresías

> Documento para registrar el resultado de la ejecución manual de los 10 casos TC-INT-01 a TC-INT-10 definidos en `docs/casos_de_prueba.md`.
>
> **Metodología:** cada caso se ejecuta manualmente siguiendo los pasos de `casos_de_prueba.md`. Se completa esta tabla con el resultado obtenido, el estado final y la referencia a la(s) evidencia(s).

## Resumen

| ID | Nombre | Estado | Resultado obtenido | Evidencia |
|---|---|---|---|---|
| TC-INT-01 | Asignar membresía con datos válidos | ⏳ Pendiente | — | — |
| TC-INT-02 | Impedir segunda membresía activa | ⏳ Pendiente | — | — |
| TC-INT-03 | Rechazar cliente inexistente | ⏳ Pendiente | — | — |
| TC-INT-04 | Validar campos obligatorios | ⏳ Pendiente | — | — |
| TC-INT-05 | Renovar membresía activa | ⏳ Pendiente | — | — |
| TC-INT-06 | Suspender membresía | ⏳ Pendiente | — | — |
| TC-INT-07 | Cancelar membresía | ⏳ Pendiente | — | — |
| TC-INT-08 | Catálogo de planes activos | ⏳ Pendiente | — | — |
| TC-INT-09 | Paginación del listado | ⏳ Pendiente | — | — |
| TC-INT-10 | Renovar membresía cancelada | ⏳ Pendiente | — | — |

**Estados posibles:** ✅ APROBADO · ❌ FALLIDO · ⏳ Pendiente

---

## Detalle por caso

### TC-INT-01 — Asignar membresía con datos válidos
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Precondiciones verificadas:** [ ] Cliente sin membresía activa · [ ] Plan activo disponible
- **Datos de prueba usados:** cédula = __________ · planId = __________ · fechaInicio = __________
- **Pasos ejecutados:** (resumir si hay desviación)
- **Resultado obtenido:** _______________________________________________________________
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-01/01-dialogo.png`, `02-tabla.png`, `03-snack.png`
- **Observaciones:** _________________________________________________________________

### TC-INT-02 — Impedir segunda membresía activa
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Precondiciones verificadas:** [ ] Cliente con membresía ACTIVA
- **Datos de prueba usados:** cédula = __________
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-02/01-error.png`
- **Observaciones:**

### TC-INT-03 — Rechazar cliente inexistente
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Datos de prueba usados:** cédula inexistente = __________
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-03/01-busqueda.png`, `02-snack-error.png`
- **Observaciones:**

### TC-INT-04 — Validar campos obligatorios
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-04/01-dialogo-vacio.png`
- **Observaciones:**

### TC-INT-05 — Renovar membresía activa
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Precondiciones verificadas:** [ ] Membresía ACTIVA o VENCIDA
- **Datos de prueba usados:** idMembresia = __________
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-05/01-antes.png`, `02-confirmacion.png`, `03-despues.png`
- **Observaciones:**

### TC-INT-06 — Suspender membresía
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-06/01-menu.png`, `02-despues.png`
- **Observaciones:**

### TC-INT-07 — Cancelar membresía
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-07/01-menu.png`, `02-despues.png`
- **Observaciones:**

### TC-INT-08 — Catálogo de planes activos
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Precondiciones verificadas:** [ ] Al menos un plan activo y uno inactivo
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-08/01-dropdown.png`
- **Observaciones:**

### TC-INT-09 — Paginación del listado
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Precondiciones verificadas:** [ ] Más de 10 membresías registradas
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-09/01-pagina1.png`, `02-pagina2.png`, `03-pageSize-25.png`
- **Observaciones:**

### TC-INT-10 — Renovar membresía cancelada
- **Ejecutado por:** ____________________
- **Fecha:** ____/____/________
- **Precondiciones verificadas:** [ ] Membresía en estado CANCELADA
- **Pasos ejecutados:**
- **Resultado obtenido:**
- **Estado:** ✅ APROBADO / ❌ FALLIDO
- **Evidencia:** `docs/evidencias/TC-INT-10/01-fila-cancelada.png`
- **Observaciones:**

---

## Análisis de errores

> A completar después de ejecutar todos los casos. Documentar causa probable y sugerencia de corrección.

| Caso | Error observado | Causa probable | Sugerencia de corrección |
|---|---|---|---|
| TC-INT-__ | | | |
| TC-INT-__ | | | |
| TC-INT-__ | | | |

---

## Conclusiones

> Resumen final: porcentaje de aprobación, observaciones generales, próximos pasos.

- Total de casos ejecutados: __/10
- APROBADOS: __
- FALLIDOS: __
- Porcentaje de éxito: __%

Fecha de cierre: ____/____/________
Firma del responsable: ____________________
