# TriFit Gym Manager — Guion de presentación

Documento de apoyo para exponer el proyecto. Resume **qué hace la aplicación**,
**cómo está construida** y **qué se demuestra en vivo**.

---

## 1. En una frase

> **TriFit Gym Manager** es un sistema web para administrar un gimnasio de punta a
> punta: socios, membresías, pagos, asistencias, entrenadores, rutinas,
> inventario y reportes; con control de acceso por rol y auditoría de cambios.

**Tipo:** aplicación web (SPA + API REST).
**Contexto:** proyecto universitario.
**Despliegue:** Docker (un solo comando levanta los 3 servicios).

---

## 2. El problema que resuelve

Un gimnasio maneja a diario: altas de clientes, cobros, control de quién puede
entrenar (membresía vigente), asignación de entrenadores, rutinas y venta de
productos. Hacerlo en papel o en Excel es lento, propenso a errores y no deja
rastro de quién hizo qué. TriFit centraliza todo eso en una plataforma con
roles, validaciones y trazabilidad.

---

## 3. Roles y para quién es

| Rol | Qué puede hacer |
|---|---|
| **Administrador** | Todo: configuración, usuarios, entrenadores, inventario, planes, reportes. |
| **Recepcionista** | Operación diaria: clientes, membresías, pagos, asistencias, reportes. |
| **Entrenador** | Solo sus clientes asignados y sus propias rutinas (acceso restringido). |

El menú lateral se filtra automáticamente según el rol: cada usuario ve solo lo
que le corresponde.

---

## 4. Módulos

| Módulo | Función |
|---|---|
| **Dashboard** | Indicadores en vivo (clientes activos, membresías, ingresos día/mes, asistencias) y **sección "Tendencias"** con gráficas: ingresos por mes, distribución de planes, asistencias por día, top entrenadores, stock bajo. |
| **Clientes** | Alta/edición/baja de socios por cédula. **Ficha 360**: pantalla de detalle con avatar, KPIs (total pagado, asistencias, rutinas, antigüedad), línea de tiempo de membresías, gráfica de asistencias y entrenadores asignados. |
| **Planes y Membresías** | Planes (nombre, duración, precio) y asignación / renovación / suspensión de membresías. Las membresías vencidas se recalculan automáticamente. |
| **Pagos** | Registro y anulación de pagos por membresía (efectivo, tarjeta, transferencia), con filtros y totales. |
| **Asistencias** | Check-in / check-out por número de cédula (valida membresía activa). **Panel "Dentro ahora"**: quién está en el gimnasio, aforo del día y hora pico. |
| **Entrenadores** | Fichas de entrenadores y asignación de clientes. |
| **Rutinas y Ejercicios** | Rutinas con ejercicios (series, repeticiones, orden), asignadas a cliente y entrenador. |
| **Inventario** | Catálogo de productos y equipos **con imágenes reales**, proveedores, movimientos de stock (entrada / salida / ajuste) y alertas de stock mínimo. Alta de producto **por código de barras** (consulta a Open Food Facts). |
| **Reportes** | Tablas exportables a PDF (clientes, membresías, ingresos, asistencias, inventario) y **pestaña "Resumen visual"** con KPIs y 4 gráficas. |
| **Configuración** | Usuarios del sistema, datos del gimnasio y **auditoría** (quién creó / editó / desactivó qué y cuándo). |

**Transversal:** buscador global en la barra superior (clientes, planes,
membresías, entrenadores, inventario, ejercicios), tema claro / oscuro, landing
page pública con planes y precios.

---

## 5. Arquitectura y tecnología

```
Navegador ── HTTPS ──> nginx (frontend) ──> API REST (Node/Express) ──> PostgreSQL
                          │
                          └── sirve la SPA de Angular + /assets + proxy /api y /uploads
```

| Capa | Stack |
|---|---|
| **Frontend** | Angular 17 (standalone components, signals) + Angular Material. Gráficas propias en **SVG puro** (sin librerías externas). |
| **Backend** | Node.js + Express, arquitectura en capas (rutas → controladores → servicios). |
| **Base de datos** | PostgreSQL 16 + Prisma ORM (migraciones y seed). |
| **Autenticación** | JWT de acceso corto + refresh token opaco con rotación; bcrypt para contraseñas. |
| **Infra** | Docker Compose: frontend (nginx + TLS), backend, PostgreSQL y un servicio de **respaldo automático diario** de la BD. CI en GitHub Actions (build + validación de esquema + e2e). |
| **Pruebas** | Suite end-to-end con Playwright (login, membresías, pagos, casos de integración). |

---

## 6. Seguridad (puntos a destacar)

- **Control de acceso por rol** en backend (middleware) y frontend (menú + guards).
- **Scoping de entrenador**: la API filtra por asignación activa; el detalle de un
  cliente ajeno responde 404 (no revela su existencia).
- **JWT corto + refresh con rotación**: si se detecta el reuso de un refresh ya
  rotado, se revocan **todas** las sesiones del usuario (protección ante robo).
- **Bloqueo por intentos**: 5 ingresos fallidos bloquean la cuenta 15 minutos.
- **Rate-limit** en `/auth/login` y en la API general.
- **Helmet** (cabeceras seguras: CSP, HSTS, anti-clickjacking) y **CORS restringido**.
- **Contraseñas iniciales obligatorias de cambiar**; el backend no arranca en
  producción con un `JWT_SECRET` de ejemplo.
- **Eliminaciones lógicas** (campo `activo`): nada se borra físicamente por defecto.
- **Auditoría**: toda creación / edición / desactivación queda registrada.
- **HTTPS obligatorio** (TLS 1.2/1.3), respaldos diarios con retención.

---

## 7. Mejoras incorporadas en esta iteración

| Área | Qué se agregó |
|---|---|
| **APIs nuevas** | Búsqueda global, métricas ampliadas del dashboard, aforo de asistencias (dentro ahora / hora pico), resumen de vencimientos, catálogo público de planes, consulta de producto por código de barras (Open Food Facts). |
| **Visualización** | 3 componentes de gráfica en SVG puro (área, dona, barras) animados, accesibles y con tema claro/oscuro. Usados en Dashboard, Reportes y Ficha del cliente. |
| **Ficha 360 del cliente** | Pantalla nueva `/app/clientes/:id` con toda la información del socio en una vista. |
| **Landing** | Sección de **membresías con precios reales** traídos de la API. |
| **Inventario** | **Imágenes reales** de productos + alta por **código de barras** con autocompletado desde una base de datos abierta. |
| **Fix de infraestructura** | Corrección en nginx que también reparó la subida manual de imágenes de producto en Docker. |

**Validación:** compilación de producción sin errores; suite e2e en verde
(26 pasan + 1 con reintento); probado desde un **clon limpio** del repositorio.

---

## 8. Demo sugerida (orden para exponer)

1. **Landing pública** → mostrar planes y precios (sin iniciar sesión).
2. **Login** como Administrador → el dashboard con indicadores y **gráficas** (pasar el mouse por encima).
3. **Buscador global** (barra superior) → escribir un apellido → abre la **Ficha 360** del cliente.
4. **Asistencias** → registrar una entrada por cédula → ver el panel **"Dentro ahora"** actualizarse.
5. **Inventario** → catálogo con fotos → "Nuevo producto" → escribir un **código de barras** → autocompleta nombre e imagen.
6. **Reportes → Resumen visual** → las 4 gráficas + exportar un PDF.
7. **Configuración → Auditoría** → mostrar el rastro de las acciones hechas en la demo.
8. Cambiar a un usuario **Recepcionista** o **Entrenador** → mostrar cómo cambia el menú y los permisos.

**Acceso:** `https://localhost:8443`
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@trifit.com` | `Admin123*` |
| Recepcionista | `recepcion@trifit.com` | `Admin123*` |
| Entrenador | `luis.mendoza@trifit.com` | `Entrenador123*` |

Datos de prueba (25 clientes, 5 entrenadores, membresías, pagos, asistencias,
9 productos con foto):

```bash
docker compose exec backend npm run seed:dataset
docker compose exec backend node prisma/seed-productos.js
```
