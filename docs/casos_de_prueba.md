# Integration Test Cases
## Sistema de Gestión de Gym — Módulo de Membresías

---

## TC-INT-01

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-01 |
| **Nombre del caso de prueba** | Registrar alta de membresía con datos válidos y verificar reflejo en el listado |
| **Prioridad** | Alta |
| **Precondiciones** | Debe existir al menos un socio registrado en la tabla socios (sin membresía activa) y al menos un tipo de membresía activo en tipos_membresia. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que una nueva membresía se registra correctamente y se refleja de inmediato en la tabla de membresías sin recargar la página. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL > Listado (tabla HTML) |
| **Datos de entrada** | socio_id = 1<br>tipo_membresia_id = 2 ('Estándar') |
| **Resultado esperado** | POST /api/membresias responde 201 con la nueva membresía (fecha_inicio = hoy, fecha_fin = hoy + 30 días, estado = 'activa', precio_aplicado = 40.00). La tabla se recarga automáticamente y muestra el nuevo registro. |

**Pasos de ejecución:**
- Acceder a public/membresias.html
- Verificar que el select 'Plan' cargó las opciones desde /api/tipos-membresia
- Ingresar el ID del socio en el campo correspondiente
- Seleccionar el plan 'Estándar'
- Dar clic en 'Registrar alta'
- Verificar el mensaje de confirmación mostrado en pantalla
- Verificar que la tabla de membresías muestra el nuevo registro sin recargar la página

**Criterio de verificación:**
- La tabla de membresías cuenta con un nuevo registro para el socio indicado
- La columna Vigencia muestra fecha_inicio → fecha_fin correspondiente a 30 días
- El badge de estado del nuevo registro muestra 'activa'
- Las acciones 'Renovar' y 'Dar de baja' están disponibles en la fila creada

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — registration form with socio_id and plan selected — Number of captures: 1
- [IMAGEN PENDIENTE] Módulo Membresías — tabla de membresías con el nuevo registro visible — Cantidad de capturas: 1
- [IMAGEN PENDIENTE] Módulo Membresías — mensaje de confirmación tras el alta — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-02

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-02 |
| **Nombre del caso de prueba** | Impedir el alta de una segunda membresía activa para el mismo socio |
| **Prioridad** | Alta |
| **Precondiciones** | El socio de prueba ya debe contar con una membresía en estado 'activa' (protegida por el índice único uq_membresia_activa_por_socio). |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que el sistema rechaza el alta de una membresía cuando el socio ya tiene una membresía activa vigente. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL |
| **Datos de entrada** | socio_id = (socio con membresía activa existente)<br>tipo_membresia_id = 1 ('Básica') |
| **Resultado esperado** | POST /api/membresias responde 409 con el mensaje 'El socio ya tiene una membresía activa.'. No se crea un segundo registro en la tabla membresias. |

**Pasos de ejecución:**
- Go to public/membresias.html
- Ingresar el ID de un socio que ya posee una membresía activa
- Seleccionar cualquier plan disponible
- Dar clic en 'Registrar alta'
- Verificar el mensaje de error mostrado en pantalla
- Verificar que la tabla de membresías no incorpora un nuevo registro para ese socio

**Criterio de verificación:**
- El mensaje de error corresponde a 'El socio ya tiene una membresía activa.'
- El socio continúa con una única membresía en estado 'activa'
- No se genera una fila adicional en la tabla de membresías

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — duplicate registration attempt with the entered data — Number of captures: 1
- [IMAGEN PENDIENTE] Módulo Membresías — mensaje de error 'El socio ya tiene una membresía activa' — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Verificar en la base de datos que el índice uq_membresia_activa_por_socio efectivamente impidió la inserción (código PDO 23505). |

---

## TC-INT-03

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-03 |
| **Nombre del caso de prueba** | Rechazar el alta de membresía cuando el socio indicado no existe |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir un ID de socio garantizado inexistente en la tabla socios (por ejemplo, un ID mayor al máximo actual). |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que el sistema valida la existencia del socio antes de registrar la membresía, respetando la integridad referencial. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL |
| **Datos de entrada** | socio_id = 999999 (no existe)<br>tipo_membresia_id = 1 |
| **Resultado esperado** | POST /api/membresias responde 422 con el mensaje 'El socio indicado no existe.'. No se inserta ningún registro en membresias. |

**Pasos de ejecución:**
- Acceder a public/membresias.html
- Ingresar un socio_id que no exista en la base de datos
- Seleccionar un plan disponible
- Dar clic en 'Registrar alta'
- Verificar el mensaje de error devuelto
- Verificar que la tabla de membresías permanece sin cambios

**Criterio de verificación:**
- El mensaje de error corresponde a 'El socio indicado no existe.'
- La tabla de membresías no agrega ninguna fila nueva
- La violación de llave foránea (código PDO 23503) es capturada y no expone detalles internos al usuario

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — form with a non-existent partner_id — Number of captures: 1
- [IMAGEN PENDIENTE] Módulo Membresías — mensaje de error 'El socio indicado no existe' — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-04

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-04 |
| **Nombre del caso de prueba** | Validar campos obligatorios y numéricos antes de enviar el alta |
| **Prioridad** | Media |
| **Precondiciones** | Ninguna; solo requiere tener cargado el formulario de alta. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que el frontend impide el envío de la petición cuando el socio o el plan no son válidos, sin llegar a consultar la API. |
| **Subsistema/s** | Formulario de Membresías > Validación JS (membresias.js) |
| **Datos de entrada** | socio_id = (vacío)<br>tipoMembresia = (sin seleccionar) |
| **Resultado esperado** | El JS detecta valores no numéricos (Number.isNaN) y muestra el mensaje 'Indica el ID del socio y selecciona un plan.' sin invocar el endpoint POST /api/membresias. |

**Pasos de ejecución:**
- Go to public/membresias.html
- Dejar vacío el campo 'ID del socio'
- No seleccionar ningún plan en el select
- Dar clic en 'Registrar alta'
- Verificar el mensaje mostrado en pantalla
- Verificar en las herramientas de red del navegador que no se realizó la petición POST

**Criterio de verificación:**
- Se muestra el mensaje 'Indica el ID del socio y selecciona un plan.'
- No se registra ninguna petición POST hacia /api/membresias
- La tabla de membresías permanece sin cambios

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — registration form with empty fields — Number of captures: 1
- [IMAGEN PENDIENTE] Módulo Membresías — mensaje de validación en pantalla — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Repetir la prueba ingresando texto no numérico en el campo socio_id para confirmar el mismo comportamiento. |

---

## TC-INT-05

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-05 |
| **Nombre del caso de prueba** | Renovación encadenada de una membresía activa |
| **Prioridad** | Alta |
| **Precondiciones** | Debe existir una membresía en estado 'activa' o 'vencida' asociada a un socio de prueba. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que la renovación crea una nueva membresía enlazada a la anterior mediante membresia_anterior_id, sin infringir el índice de membresía activa única por socio. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL > Botón Renovar |
| **Datos de entrada** | id de una membresía existente en estado 'activa' |
| **Resultado esperado** | POST /api/membresias/{id}/renovar responde 201 con una nueva membresía: fecha_inicio = hoy, fecha_fin = hoy + duración del plan, estado = 'activa' y membresia_anterior_id apuntando al id original. |

**Pasos de ejecución:**
- Go to public/membresias.html
- Ubicar una fila con una membresía en estado 'activa'
- Dar clic en el botón 'Renovar' de esa fila
- Verificar el mensaje de confirmación mostrado
- Verificar que la tabla se actualiza mostrando la nueva membresía

**Criterio de verificación:**
- Aparece una nueva fila con la nueva vigencia calculada
- El mensaje muestra el texto 'Renovada: nueva membresía #X vigente hasta ...'
- No quedan dos membresías en estado 'activa' simultáneas para el mismo socio

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGEN PENDIENTE] Módulo Membresías — fila con el botón 'Renovar' antes de la acción — Cantidad de capturas: 1
- [IMAGEN PENDIENTE] Módulo Membresías — tabla actualizada con la nueva membresía tras renovar — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Verificar en la base de datos que la membresía original queda enlazada como membresia_anterior_id de la nueva. |

---

## TC-INT-06

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-06 |
| **Nombre del caso de prueba** | Impedir la baja de una membresía sin motivo |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir al menos una membresía en estado distinto de 'cancelada'. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que el sistema exige un motivo obligatorio antes de dar de baja una membresía, tanto en frontend como en backend. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL > Botón Dar de baja |
| **Datos de entrada** | id de una membresía no cancelada<br>motivo = (vacío / cuadro de diálogo cancelado) |
| **Resultado esperado** | Si el motivo queda vacío, el JS no envía la petición; si se fuerza el envío vacío a la API, DELETE /api/membresias/{id} responde 422 con 'El motivo de la baja es obligatorio.'. |

**Pasos de ejecución:**
- Go to public/membresias.html
- Dar clic en 'Dar de baja' sobre una membresía no cancelada
- En el cuadro de diálogo (prompt), dejar el motivo vacío y aceptar
- Verificar que no se realiza ningún cambio en la tabla
- Repetir la acción cancelando el cuadro de diálogo y confirmar el mismo resultado

**Criterio de verificación:**
- La membresía conserva su estado original
- No se registra petición DELETE exitosa hacia /api/membresias/{id}
- La tabla de membresías no sufre cambios

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — empty reason dialog — Number of captures: 1
- [IMAGEN PENDIENTE] Módulo Membresías — tabla sin cambios después del intento — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-07

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-07 |
| **Nombre del caso de prueba** | Dar de baja una membresía con motivo válido y verificar reflejo en la interfaz |
| **Prioridad** | Alta |
| **Precondiciones** | Debe existir al menos una membresía en estado distinto de 'cancelada'. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que la baja lógica cambia el estado de la membresía a 'cancelada' y actualiza las acciones disponibles en la fila correspondiente. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL > Botón Dar de baja |
| **Datos de entrada** | id de una membresía activa<br>motivo = 'Solicitud del socio' |
| **Resultado esperado** | DELETE /api/membresias/{id} responde 200 con el mensaje 'Membresía dada de baja.'. El badge de estado cambia a 'cancelada' y los botones 'Renovar' y 'Dar de baja' dejan de mostrarse en esa fila. |

**Pasos de ejecución:**
- Go to public/membresias.html
- Dar clic en 'Dar de baja' sobre una membresía activa
- Ingresar el motivo 'Solicitud del socio' en el cuadro de diálogo
- Confirmar la acción
- Verificar el mensaje de confirmación mostrado
- Verificar el nuevo estado de la fila en la tabla

**Criterio de verificación:**
- El badge de la fila muestra el estado 'cancelada'
- La fila ya no muestra los botones 'Renovar' ni 'Dar de baja'
- El mensaje de confirmación indica 'Membresía #X dada de baja.'

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — dialog box with reason entered — Number of captures: 1
- [IMAGEN PENDIENTE] Módulo Membresías — fila actualizada con estado 'cancelada' y sin botones de acción — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Ninguna. |

---

## TC-INT-08

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-08 |
| **Nombre del caso de prueba** | Carga del catálogo de planes activos en el formulario de alta |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir al menos un tipo de membresía con activo = true y al menos uno con activo = false en tipos_membresia. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que el select de planes solo muestra los tipos de membresía activos, con el formato de precio y duración correcto. |
| **Subsistema/s** | Formulario de Membresías > API /api/tipos-membresia > Modelo Membresia > PostgreSQL |
| **Datos de entrada** | Carga inicial de public/membresias.html (sin interacción del usuario) |
| **Resultado esperado** | GET /api/tipos-membresia retorna únicamente los planes con activo = true. El select 'Plan' muestra cada opción como '<nombre> — <precio en USD> / <duración> días'. |

**Pasos de ejecución:**
- Mark a membership type as inactive directly in the database (active = false)
- Acceder a public/membresias.html
- Verificar las opciones disponibles en el select 'Plan'
- Confirmar el formato de cada opción (nombre, precio en USD, duración en días)

**Criterio de verificación:**
- El plan marcado como inactivo no aparece en el select
- Cada opción visible respeta el formato '<nombre> — $XX.XX / YY días'
- La primera opción del select es 'Seleccione un plan…'

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGEN PENDIENTE] Módulo Membresías — select de planes desplegado con las opciones cargadas — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Restaurar el estado activo del plan modificado al finalizar la prueba. |

---

## TC-INT-09

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-09 |
| **Nombre del caso de prueba** | Paginación del listado de membresías |
| **Prioridad** | Baja |
| **Precondiciones** | Debe haber más de 50 membresías registradas en la tabla membresias para superar el límite por defecto. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable mediante peticiones directas a la API (por ejemplo con curl o Postman) sobre /api/membresias, dado que la vista membresias.html no expone controles de paginación en la interfaz. |
| **Objetivo** | Comprobar que el endpoint de listado respeta los parámetros limit y offset, y que los límites configurados en el controlador se aplican correctamente. |
| **Subsistema/s** | API /api/membresias > Modelo Membresia > PostgreSQL |
| **Datos de entrada** | GET /api/membresias (sin parámetros)<br>GET /api/membresias?limit=10&offset=10 |
| **Resultado esperado** | La primera petición retorna como máximo 50 registros (límite por defecto). La segunda retorna un bloque de 10 registros distintos al primer bloque, sin ids repetidos entre ambas respuestas. |

**Pasos de ejecución:**
- Realizar una petición GET a /api/membresias sin parámetros
- Contar la cantidad de registros devueltos y verificar que no supera 50
- Realizar una petición GET a /api/membresias?limit=10&offset=10
- Comparar los ids devueltos contra los primeros 10 ids de la petición sin parámetros

**Criterio de verificación:**
- La respuesta sin parámetros no excede 50 registros
- La respuesta con limit=10 retorna exactamente 10 registros
- Los ids del segundo bloque no coinciden con los de las posiciones 1-10 del primer bloque

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] GET JSON response/api/memberships without parameters (API testing tool) — Number of captures: 1
- [IMAGEN PENDIENTE] Respuesta JSON de GET /api/membresias?limit=10&offset=10 — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Prueba orientada a backend; no requiere interacción con la interfaz gráfica. |

---

## TC-INT-10

| Campo | Detalle |
|---|---|
| **ID** | TC-INT-10 |
| **Nombre del caso de prueba** | Impedir la renovación de una membresía cancelada |
| **Prioridad** | Media |
| **Precondiciones** | Debe existir una membresía en estado 'cancelada'. |
| **Tipo de prueba** | Integración |
| **Estado de implementación** | Ejecutable con el archivo public/membresias.html (requiere API PHP activa y PostgreSQL inicializada con database/init.sql) |
| **Objetivo** | Comprobar que ni la interfaz ni la API permiten renovar una membresía que ya fue cancelada. |
| **Subsistema/s** | Formulario de Membresías > API /api/membresias > Modelo Membresia (PDO) > PostgreSQL > Botón Renovar |
| **Datos de entrada** | id de una membresía en estado 'cancelada' |
| **Resultado esperado** | La fila correspondiente no muestra el botón 'Renovar' (regla de renderizado del frontend). Si se invoca directamente POST /api/membresias/{id}/renovar sobre ese id, la API responde con un error controlado (422) y no con una excepción no manejada (500). |

**Pasos de ejecución:**
- Go to public/membresias.html
- Ubicar en la tabla una fila con estado 'cancelada'
- Verificar los botones de acción disponibles en esa fila
- Invocar manualmente POST /api/membresias/{id}/renovar con el id de la membresía cancelada
- Verificar la respuesta de la API

**Criterio de verificación:**
- La fila con estado 'cancelada' no muestra el botón 'Renovar'
- La petición forzada a la API responde con un error controlado (código 4xx), no con un error 500
- No se crea ninguna membresía nueva a partir del id cancelado

| Campo | Detalle |
|---|---|
| **Resultados obtenidos** | Pendiente de ejecución. |
| **Estado** | No ejecutado |

**Evidencias:**
- [IMAGE PENDING] Memberships Module — row with 'cancelled' status without 'Renew' button — Number of captures: 1
- [IMAGEN PENDIENTE] Respuesta de la API al forzar la renovación de una membresía cancelada — Cantidad de capturas: 1

| Campo | Detalle |
|---|---|
| **Tiempo de ejecución** | - |
| **Observaciones** | Confirmar con el equipo de desarrollo si el modelo Membresia valida explícitamente el estado antes de renovar. |
