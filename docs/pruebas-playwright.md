# Integration Test Cases — TriFit Gym Manager
## Módulo de Membresías

> **Nota:** los casos de prueba originales recibidos estaban dirigidos a un sistema PHP/PostgreSQL diferente. Esta versión está adaptada al modelo real de **TriFit Gym Manager** (Angular 17 + Express + Prisma).
>
> **Endpoints reales** (backend en `http://localhost:3000/api`):
> - `GET /api/membresias` (con `page`, `limit`, `estado`, `busqueda`)
> - `POST /api/membresias` (body: `{ clienteId, planId, fechaInicio }`)
> - `PATCH /api/membresias/:id/renovar`
> - `PATCH /api/membresias/:id/estado` (body: `{ estado }`)
>
> **UI real**: `/app/membresias` (pestaña *Membresías*), botón **Asignar membresía**, columna *Acciones* con botones `autorenew` (Renovar) y `more_vert` (menú de estado).
>
> **Reglas de negocio reales**:
> - Un cliente no puede tener dos membresías `ACTIVA` simultáneas (lanza 409).
> - `cambiarEstado` acepta `ACTIVA | VENCIDA | SUSPENDIDA | CANCELADA`.
> - Al listar, las membresías cuya `fechaFin < hoy` y están `ACTIVA` se actualizan automáticamente a `VENCIDA`.
> - Renovar extiende `fechaFin` desde la fecha actual (o desde la fecha fin si aún no venció) y deja la membresía en `ACTIVA`.

---

## TC-INT-01 — Asignar membresía con datos válidos

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-01 |
| **Nombre** | Asignar una nueva membresía a un cliente sin membresía activa y verificar reflejo en el listado |
| **Prioridad** | Alta |
| **Precondiciones** | Cliente existente (con cédula registrada) sin membresía ACTIVA. Plan existente con `activo = true`. |
| **Objetivo** | Comprobar que el alta crea una membresía ACTIVA y aparece en la tabla sin recargar la página. |
| **Subsistema** | Diálogo AsignarMembresiaDialog → POST /api/membresias → Prisma → recargar tabla |
| **Datos de entrada** | cliente (búsqueda por cédula) con membresía no activa; planId del plan elegido; fechaInicio = hoy |
| **Resultado esperado** | POST responde 201 con la membresía (estado = 'ACTIVA', fechaFin = fechaInicio + duracionDias). La tabla muestra la nueva fila con chip verde "ACTIVA" y `snack-bar` "Membresía asignada correctamente". |

**Pasos de ejecución:**
1. Iniciar sesión como `admin@trifit.com` y navegar a `/app/membresias`.
2. Clic en la pestaña **Membresías**.
3. Clic en **Asignar membresía**.
4. En el diálogo, escribir la cédula del cliente y clic en **Buscar**.
5. Seleccionar un plan del dropdown.
6. Mantener la fecha de inicio propuesta (hoy).
7. Clic en **Asignar**.

**Criterio de verificación:**
- Aparece un `mat-snack-bar` con el texto "Membresía asignada correctamente".
- En la tabla aparece una nueva fila con el cliente seleccionado, plan, inicio = hoy, fin = hoy + `duracionDias` y badge verde "ACTIVA".

| Campo | Detalle |
|---|---|
| **Resultados** | Pendiente de ejecución |
| **Estado** | No ejecutado |
| **Evidencias** | Captura del diálogo abierto con datos; captura de la tabla con la nueva fila |

---

## TC-INT-02 — Impedir una segunda membresía activa para el mismo cliente

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-02 |
| **Nombre** | Impedir el alta de una segunda membresía activa para el mismo cliente |
| **Prioridad** | Alta |
| **Precondiciones** | Cliente de prueba con una membresía en estado `ACTIVA`. |
| **Objetivo** | Comprobar que el backend rechaza el alta cuando el cliente ya tiene una membresía activa. |
| **Subsistema** | AsignarMembresiaDialog → POST /api/membresias → `membresiaService.asignar` |
| **Datos de entrada** | cliente con membresía ACTIVA; cualquier plan activo |
| **Resultado esperado** | POST /api/membresias responde 409 con el mensaje "El cliente ya tiene una membresía activa". La UI muestra el error (snack o mensaje) y no crea un segundo registro. |

**Pasos de ejecución:**
1. Identificar un cliente con membresía ACTIVA en la tabla.
2. Abrir **Asignar membresía** y buscarlo por cédula.
3. Seleccionar cualquier plan.
4. Clic en **Asignar**.

**Criterio de verificación:**
- La membresía existente del cliente se mantiene como única ACTIVA.
- La base de datos no registra una segunda fila ACTIVA para el mismo `clienteId`.

---

## TC-INT-03 — Validar cliente inexistente al asignar

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-03 |
| **Nombre** | Rechazar el alta cuando el cliente indicado no existe |
| **Prioridad** | Media |
| **Precondiciones** | Ninguna. |
| **Objetivo** | Comprobar que el flujo de búsqueda no permite avanzar con un cliente inexistente. |
| **Subsistema** | AsignarMembresiaDialog → GET /api/clientes/cedula/:cedula |
| **Datos de entrada** | cédula que no existe en la tabla `Cliente` |
| **Resultado esperado** | GET responde 404; el diálogo muestra snack-bar "Cliente no encontrado"; el botón **Asignar** queda deshabilitado (no hay cliente seleccionado). |

**Pasos de ejecución:**
1. Abrir **Asignar membresía**.
2. Ingresar una cédula inexistente.
3. Clic en **Buscar**.

**Criterio de verificación:**
- No aparece texto "Cliente:" debajo del campo de cédula.
- El botón **Asignar** permanece deshabilitado.

---

## TC-INT-04 — Validar campos obligatorios antes de enviar

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-04 |
| **Nombre** | Impedir el envío con cédula, plan o fecha inválidos |
| **Prioridad** | Media |
| **Precondiciones** | Ninguna. |
| **Objetivo** | Comprobar que el formulario no permite llamar al endpoint si falta algún campo obligatorio. |
| **Subsistema** | AsignarMembresiaDialog (validación con Reactive Forms) |
| **Datos de entrada** | cédula vacía; plan sin seleccionar |
| **Resultado esperado** | El botón **Asignar** queda deshabilitado. En Network no se dispara POST /api/membresias. |

**Pasos de ejecución:**
1. Abrir **Asignar membresía**.
2. Dejar el campo de cédula vacío.
3. No seleccionar plan.
4. Comprobar el estado del botón **Asignar**.

**Criterio de verificación:**
- Botón **Asignar** deshabilitado.
- Sin petición `POST /api/membresias` en Network.

---

## TC-INT-05 — Renovar una membresía activa

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-05 |
| **Nombre** | Renovar una membresía activa o vencida y verificar el nuevo `fechaFin` |
| **Prioridad** | Alta |
| **Precondiciones** | Membresía existente en estado `ACTIVA` o `VENCIDA`. |
| **Objetivo** | Comprobar que `PATCH /renovar` extiende la vigencia y mantiene el estado `ACTIVA`. |
| **Subsistema** | Botón Renovar (icono `autorenew`) → diálogo de confirmación → PATCH /api/membresias/:id/renovar |
| **Datos de entrada** | ID de una membresía activa o vencida |
| **Resultado esperado** | PATCH responde 200 con la membresía actualizada: `fechaFin` extendida, `estado = 'ACTIVA'`. Aparece snack-bar "Membresía renovada". La fila refleja la nueva fecha fin. |

**Pasos de ejecución:**
1. Ubicar una fila de membresía.
2. Clic en el botón con icono `autorenew` (tooltip "Renovar").
3. En el diálogo de confirmación, clic en **Renovar**.

**Criterio de verificación:**
- Snack-bar "Membresía renovada" visible.
- `fechaFin` de la fila es mayor al valor previo.
- Estado de la fila es `ACTIVA` (chip verde).

---

## TC-INT-06 — Cambiar estado a SUSPENDIDA

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-06 |
| **Nombre** | Suspender una membresía activa |
| **Prioridad** | Media |
| **Precondiciones** | Membresía existente en estado `ACTIVA`. |
| **Objetivo** | Comprobar que la acción del menú "Suspender" cambia el estado a `SUSPENDIDA`. |
| **Subsistema** | Menú `more_vert` → PATCH /api/membresias/:id/estado { estado: 'SUSPENDIDA' } |
| **Datos de entrada** | ID de membresía activa |
| **Resultado esperado** | PATCH responde 200; el chip de la fila pasa a color naranja con texto "SUSPENDIDA"; snack-bar "Estado actualizado a SUSPENDIDA". |

**Pasos de ejecución:**
1. Ubicar la fila.
2. Clic en icono `more_vert`.
3. Clic en **Suspender**.

**Criterio de verificación:**
- Chip naranja con texto "SUSPENDIDA".
- La fila sigue existiendo en la tabla (no se elimina).

---

## TC-INT-07 — Cancelar una membresía

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-07 |
| **Nombre** | Cancelar una membresía activa |
| **Prioridad** | Alta |
| **Precondiciones** | Membresía existente en estado distinto a `CANCELADA`. |
| **Objetivo** | Comprobar que la acción "Cancelar" cambia el estado a `CANCELADA`. |
| **Subsistema** | Menú `more_vert` → PATCH /api/membresias/:id/estado { estado: 'CANCELADA' } |
| **Datos de entrada** | ID de membresía activa |
| **Resultado esperado** | PATCH responde 200; el chip de la fila pasa a gris con texto "CANCELADA"; snack-bar "Estado actualizado a CANCELADA". |

**Pasos de ejecución:**
1. Ubicar la fila.
2. Clic en icono `more_vert`.
3. Clic en **Cancelar**.

**Criterio de verificación:**
- Chip gris con texto "CANCELADA".
- Permite volver a asignar una nueva membresía al mismo cliente (ya no tiene ACTIVA).

---

## TC-INT-08 — Carga del catálogo de planes activos

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-08 |
| **Nombre** | El selector de planes solo muestra planes con `activo = true` |
| **Prioridad** | Media |
| **Precondiciones** | Al menos un plan con `activo = true` y al menos uno con `activo = false` en la base. |
| **Objetivo** | Comprobar que el dropdown de planes del diálogo filtra los inactivos. |
| **Subsistema** | AsignarMembresiaDialog → GET /api/planes?limit=100 → filtro interno de la lista |
| **Datos de entrada** | Carga inicial del diálogo (sin interacción) |
| **Resultado esperado** | El `<mat-select>` solo lista los planes con `activo = true`, con formato "Nombre (X días · $Y.YY)". |

**Pasos de ejecución:**
1. Marcar un plan como inactivo desde la pestaña **Planes** (botón desactivar).
2. Abrir **Asignar membresía** y revisar las opciones del dropdown **Plan**.

**Criterio de verificación:**
- El plan inactivo no aparece en el dropdown.
- Cada opción visible respeta el formato "Nombre (X días · $Y.YY)".

**Nota sobre el filtro:** actualmente el dialog consume `GET /api/planes?limit=100` sin filtro. Si se necesita filtrar los inactivos, el backend debe soportar `GET /api/planes?activo=true` o el frontend filtrar en cliente. **Acción derivada:** documentar como mejora.

---

## TC-INT-09 — Paginación del listado de membresías

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-09 |
| **Nombre** | Paginación del listado de membresías |
| **Prioridad** | Baja |
| **Precondiciones** | Más de 10 membresías registradas (el pageSize por defecto es 10). |
| **Objetivo** | Comprobar que la paginación del `mat-paginator` y la API `limit/offset` funcionan correctamente. |
| **Subsistema** | `mat-paginator` → GET /api/membresias?page=N&limit=M |
| **Datos de entrada** | Interacción con el paginador |
| **Resultado esperado** | Cambiar el tamaño de página o la página actual recarga la tabla con los registros correctos. La paginación superior coincide con `res.total`. |

**Pasos de ejecución:**
1. En la pestaña **Membresías**, observar el `mat-paginator` inferior.
2. Cambiar el tamaño de página a 25.
3. Avanzar a la siguiente página.

**Criterio de verificación:**
- La cantidad de filas mostradas coincide con el `pageSize` seleccionado.
- El total de páginas coincide con `total / pageSize`.

---

## TC-INT-10 — Impedir la renovación de una membresía cancelada

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-10 |
| **Nombre** | Renovar una membresía cancelada no debe generar error 500 |
| **Prioridad** | Media |
| **Precondiciones** | Membresía en estado `CANCELADA`. |
| **Objetivo** | Comprobar el comportamiento de renovar una membresía cancelada. |
| **Subsistema** | Botón Renovar sobre fila CANCELADA → PATCH /api/membresias/:id/renovar |
| **Datos de entrada** | ID de una membresía en estado `CANCELADA` |
| **Resultado esperado** | PATCH responde 200 (Prisma `update` no valida estado) y la membresía pasa a `ACTIVA` con nueva `fechaFin`. Decisión de diseño: en la UI se debería deshabilitar el botón "Renovar" si la membresía está cancelada. |

**Pasos de ejecución:**
1. Ubicar una fila con estado `CANCELADA`.
2. Clic en el botón con icono `autorenew`.

**Criterio de verificación:**
- No se produce un error 500.
- Si el botón está habilitado, la respuesta es 200; si está deshabilitado, no se dispara la petición.

**Acción derivada recomendada:** ocultar/deshabilitar el botón "Renovar" cuando `estado === 'CANCELADA'`.
