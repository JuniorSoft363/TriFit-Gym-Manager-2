# Integration Test Cases
## TriFit Gym Manager — Módulo de Membresías

> **Nota:** los casos de prueba originales recibidos estaban dirigidos a un sistema PHP/PostgreSQL diferente (con `socios`, `tipos_membresia`, `public/membresias.html` y API PHP). Esta versión está **adaptada al modelo real de TriFit Gym Manager** (Angular 17 + Express + Prisma + PostgreSQL).
>
> **Endpoints reales** (backend en `http://localhost:3000/api`):
> - `GET /api/membresias` (con `page`, `limit`, `estado`, `busqueda`)
> - `POST /api/membresias` (body: `{ clienteId, planId, fechaInicio }`)
> - `PATCH /api/membresias/:id/renovar`
> - `PATCH /api/membresias/:id/estado` (body: `{ estado }`)
>
> **UI real**: `/app/membresias` (pestaña *Membresías*), botón **Asignar membresía**, columna *Acciones* con `autorenew` (Renovar) y `more_vert` (menú de estado).
>
> **Reglas de negocio reales**:
> - Un cliente no puede tener dos membresías `ACTIVA` simultáneas (lanza 409).
> - `cambiarEstado` acepta `ACTIVA | VENCIDA | SUSPENDIDA | CANCELADA`.
> - Al listar, las membresías con `fechaFin < hoy` en estado `ACTIVA` se actualizan automáticamente a `VENCIDA`.
> - Renovar extiende `fechaFin` desde la fecha actual (o desde la fecha fin si aún no venció) y deja la membresía en `ACTIVA`.
>
> **Credenciales de prueba**: `admin@trifit.com` / `Admin123*`

---

## TC-INT-01

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-01 |
| **Nombre del caso de prueba** | Asignar una nueva membresía a un cliente sin membresía activa y verificar reflejo en el listado |
| **Prioridad** | Alta |
| **Precondiciones** | Cliente existente (con cédula registrada) sin membresía ACTIVA. Plan existente con `activo = true`. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` (requiere backend activo y BD inicializada con `npm run seed:dataset`) |
| **Objetivo** | Comprobar que una nueva membresía se registra correctamente y se refleja de inmediato en la tabla de membresías. |
| **Subsistema/s** | Diálogo AsignarMembresiaDialog → POST /api/membresias → Prisma → recargar tabla |
| **Datos de entrada** | cliente (búsqueda por cédula) sin membresía activa; planId del plan elegido; fechaInicio = hoy |
| **Resultado esperado** | POST responde 201 con la membresía (estado = 'ACTIVA', fechaFin = fechaInicio + duracionDias). La tabla muestra la nueva fila con chip verde "ACTIVA" y snack-bar "Membresía asignada correctamente". |

**Pasos de ejecución:**
- Iniciar sesión como admin y navegar a `/app/membresias`
- Clic en la pestaña **Membresías**
- Clic en **Asignar membresía**
- En el diálogo, escribir la cédula del cliente y clic en **Buscar**
- Seleccionar un plan del dropdown
- Mantener la fecha de inicio propuesta (hoy)
- Clic en **Asignar**

**Criterio de verificación:**
- Aparece snack-bar "Membresía asignada correctamente"
- En la tabla aparece una nueva fila con el cliente seleccionado, plan, inicio = hoy, fin = hoy + duracionDias y badge verde "ACTIVA"

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-02

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-02 |
| **Nombre del caso de prueba** | Impedir el alta de una segunda membresía activa para el mismo cliente |
| **Prioridad** | Alta |
| **Precondiciones** | El cliente de prueba ya debe contar con una membresía en estado `ACTIVA`. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` y la API REST |
| **Objetivo** | Comprobar que el sistema rechaza el alta de una membresía cuando el cliente ya tiene una membresía activa vigente. |
| **Subsistema/s** | AsignarMembresiaDialog → POST /api/membresias → `membresiaService.asignar` → Prisma |
| **Datos de entrada** | cliente con membresía ACTIVA existente; cualquier plan activo |
| **Resultado esperado** | POST /api/membresias responde 409 con el mensaje "El cliente ya tiene una membresía activa". No se crea un segundo registro. |

**Pasos de ejecución:**
- Identificar un cliente con membresía ACTIVA en la tabla
- Abrir **Asignar membresía** y buscarlo por cédula
- Seleccionar cualquier plan
- Clic en **Asignar**

**Criterio de verificación:**
- La membresía existente del cliente se mantiene como única ACTIVA
- La base de datos no registra una segunda fila ACTIVA para el mismo `clienteId`

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Verificar que la respuesta del backend es controlada (no 500). |

---

## TC-INT-03

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-03 |
| **Nombre del caso de prueba** | Rechazar el alta de membresía cuando el cliente indicado no existe |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir un ID de cliente (cédula) garantizado inexistente. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` |
| **Objetivo** | Comprobar que el sistema valida la existencia del cliente antes de permitir el alta. |
| **Subsistema/s** | AsignarMembresiaDialog → GET /api/clientes/cedula/:cedula |
| **Datos de entrada** | cédula = 0999999999 (no existe) |
| **Resultado esperado** | GET responde 404; el diálogo muestra snack-bar "Cliente no encontrado"; el botón **Asignar** queda deshabilitado. |

**Pasos de ejecución:**
- Abrir **Asignar membresía**
- Ingresar una cédula inexistente
- Clic en **Buscar**

**Criterio de verificación:**
- Aparece snack-bar "Cliente no encontrado"
- No aparece texto "Cliente:" debajo del campo
- El botón **Asignar** permanece deshabilitado

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-04

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-04 |
| **Nombre del caso de prueba** | Validar campos obligatorios y de selección antes de enviar el alta |
| **Prioridad** | Media |
| **Precondiciones** | Ninguna; solo requiere tener cargado el formulario de alta. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` |
| **Objetivo** | Comprobar que el frontend impide el envío cuando el cliente o el plan no son válidos, sin llegar a consultar la API. |
| **Subsistema/s** | AsignarMembresiaDialog (validación con Reactive Forms) |
| **Datos de entrada** | cédula = (vacía); plan = (sin seleccionar) |
| **Resultado esperado** | El botón **Asignar** queda deshabilitado. En Network no se dispara POST /api/membresias. |

**Pasos de ejecución:**
- Abrir **Asignar membresía**
- Dejar el campo de cédula vacío
- No seleccionar plan
- Comprobar el estado del botón **Asignar**

**Criterio de verificación:**
- Botón **Asignar** deshabilitado
- Sin petición POST a /api/membresias en la pestaña Network

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Repetir ingresando texto no numérico en cédula para confirmar validación. |

---

## TC-INT-05

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-05 |
| **Nombre del caso de prueba** | Renovación de una membresía activa o vencida |
| **Prioridad** | Alta |
| **Precondiciones** | Debe existir una membresía en estado `ACTIVA` o `VENCIDA` asociada a un cliente de prueba. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` |
| **Objetivo** | Comprobar que la renovación extiende la fecha de fin y mantiene el estado `ACTIVA`. |
| **Subsistema/s** | Botón Renovar (icono `autorenew`) → diálogo de confirmación → PATCH /api/membresias/:id/renovar → Prisma |
| **Datos de entrada** | ID de una membresía activa o vencida |
| **Resultado esperado** | PATCH responde 200 con la membresía actualizada: `fechaFin` extendida, `estado = 'ACTIVA'`. Aparece snack-bar "Membresía renovada". La fila refleja la nueva fecha fin. |

**Pasos de ejecución:**
- Ubicar una fila con membresía activa o vencida
- Clic en el botón con icono `autorenew` (tooltip "Renovar")
- En el diálogo de confirmación, clic en **Renovar**

**Criterio de verificación:**
- Snack-bar "Membresía renovada" visible
- `fechaFin` de la fila es mayor al valor previo
- Estado de la fila es `ACTIVA` (chip verde)

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Verificar en la base de datos que la membresía queda con `fechaFin` extendida. |

---

## TC-INT-06

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-06 |
| **Nombre del caso de prueba** | Cambiar estado de una membresía a SUSPENDIDA |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir al menos una membresía en estado `ACTIVA`. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` |
| **Objetivo** | Comprobar que la acción del menú "Suspender" cambia el estado a `SUSPENDIDA`. |
| **Subsistema/s** | Menú `more_vert` → PATCH /api/membresias/:id/estado { estado: 'SUSPENDIDA' } → Prisma |
| **Datos de entrada** | ID de una membresía activa |
| **Resultado esperado** | PATCH responde 200; el chip de la fila pasa a color naranja con texto "SUSPENDIDA"; snack-bar "Estado actualizado a SUSPENDIDA". |

**Pasos de ejecución:**
- Ubicar la fila de una membresía activa
- Clic en el icono `more_vert`
- Clic en **Suspender**

**Criterio de verificación:**
- Chip naranja con texto "SUSPENDIDA"
- La fila sigue existiendo en la tabla (no se elimina)
- Aparece snack-bar de confirmación

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-07

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-07 |
| **Nombre del caso de prueba** | Cancelar una membresía (baja lógica) y verificar reflejo en la interfaz |
| **Prioridad** | Alta |
| **Precondiciones** | Debe existir al menos una membresía en estado distinto de `CANCELADA`. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` |
| **Objetivo** | Comprobar que la acción "Cancelar" cambia el estado a `CANCELADA` y permite reasignar una nueva membresía al cliente. |
| **Subsistema/s** | Menú `more_vert` → PATCH /api/membresias/:id/estado { estado: 'CANCELADA' } → Prisma |
| **Datos de entrada** | ID de una membresía activa |
| **Resultado esperado** | PATCH responde 200; el chip de la fila pasa a gris con texto "CANCELADA"; snack-bar "Estado actualizado a CANCELADA". El cliente ya puede recibir una nueva membresía. |

**Pasos de ejecución:**
- Ubicar la fila de una membresía activa
- Clic en el icono `more_vert`
- Clic en **Cancelar**

**Criterio de verificación:**
- Chip gris con texto "CANCELADA"
- La fila sigue existiendo (baja lógica, no se elimina)
- Aparece snack-bar "Estado actualizado a CANCELADA"
- Al intentar asignar nueva membresía al mismo cliente, la operación es exitosa

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-08

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-08 |
| **Nombre del caso de prueba** | Carga del catálogo de planes en el formulario de alta |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir al menos un plan con `activo = true` y al menos uno con `activo = false` en la tabla `Plan`. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la UI `/app/membresias` (requiere BD inicializada) |
| **Objetivo** | Comprobar que el select de planes carga las opciones y respeta el formato esperado. |
| **Subsistema/s** | AsignarMembresiaDialog → GET /api/planes?limit=100 |
| **Datos de entrada** | Carga inicial del diálogo (sin interacción del usuario) |
| **Resultado esperado** | El `<mat-select>` muestra los planes con el formato "Nombre (X días · $Y.YY)". La primera carga puede incluir todos los planes (activos e inactivos) si el backend no filtra. |

**Pasos de ejecución:**
- Marcar un plan como inactivo desde la pestaña **Planes** (botón desactivar)
- Abrir **Asignar membresía** y revisar las opciones del dropdown **Plan**

**Criterio de verificación:**
- Las opciones del dropdown respetan el formato "Nombre (X días · $Y.YY)"
- El plan inactivo puede o no aparecer según el filtro del backend (acción derivada documentar)

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Si se requiere filtrar los inactivos, el backend debe soportar `GET /api/planes?activo=true` o el frontend debe filtrar en cliente. |

---

## TC-INT-09

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-09 |
| **Nombre del caso de prueba** | Paginación del listado de membresías |
| **Prioridad** | Baja |
| **Precondiciones** | Debe haber más de 10 membresías registradas (el pageSize por defecto es 10). |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable mediante la UI `/app/membresias` y la API REST |
| **Objetivo** | Comprobar que el endpoint de listado respeta los parámetros limit y offset, y que el paginador refleja los límites configurados. |
| **Subsistema/s** | `mat-paginator` → GET /api/membresias?page=N&limit=M |
| **Datos de entrada** | GET /api/membresias (sin parámetros)<br>GET /api/membresias?page=2&limit=10 |
| **Resultado esperado** | La primera petición retorna el pageSize por defecto (10). La segunda retorna un bloque de 10 registros distintos, sin ids repetidos entre ambas respuestas. |

**Pasos de ejecución:**
- En la pestaña **Membresías**, observar el `mat-paginator` inferior
- Cambiar el tamaño de página a 25
- Avanzar a la siguiente página

**Criterio de verificación:**
- La cantidad de filas mostradas coincide con el `pageSize` seleccionado
- El total de páginas coincide con `total / pageSize`

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | El dataset de prueba (20 membresías) es suficiente para validar la paginación. |

---

## TC-INT-10

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-10 |
| **Nombre del caso de prueba** | Comportamiento de la API al renovar una membresía cancelada |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir una membresía en estado `CANCELADA`. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con la API REST y/o la UI |
| **Objetivo** | Comprobar el comportamiento de la API y la UI al intentar renovar una membresía cancelada. |
| **Subsistema/s** | Botón Renovar sobre fila CANCELADA → PATCH /api/membresias/:id/renovar |
| **Datos de entrada** | ID de una membresía en estado `CANCELADA` |
| **Resultado esperado** | PATCH responde 200 (Prisma `update` no valida estado) y la membresía pasa a `ACTIVA` con nueva `fechaFin`. Decisión de diseño: la UI debería deshabilitar el botón "Renovar" si la membresía está cancelada. |

**Pasos de ejecución:**
- Ubicar una fila con estado `CANCELADA`
- Clic en el botón con icono `autorenew`

**Criterio de verificación:**
- No se produce un error 500
- Si el botón está habilitado, la respuesta es 200; si está deshabilitado, no se dispara la petición

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |
| **Tiempo de ejecución** | - |
| **Observaciones** | Acción derivada recomendada: ocultar/deshabilitar el botón "Renovar" cuando `estado === 'CANCELADA'`. |
