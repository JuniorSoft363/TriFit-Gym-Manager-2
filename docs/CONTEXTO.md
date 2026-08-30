# Contexto del proyecto TriFit Gym Manager

> Resumen para colaboradores que se unen al proyecto. Toda la información técnica está en el repositorio y en este documento.

## Información del proyecto

- **Nombre:** TriFit Gym Manager 2
- **Repositorio:** https://github.com/JuniorSoft363/TriFit-Gym-Manager-2
- **Tipo:** Sistema de gestión de gimnasios (proyecto universitario)
- **Stack:** Angular 17 + Material · Node 20 + Express · Prisma + PostgreSQL · JWT · Playwright · Docker

## Estado actual (al 30/08/2026)

### Funcionalidades implementadas

- **Autenticación** con JWT (`admin@trifit.com` / `Admin123*`)
- **Módulo de Membresías** completo: asignación, renovación, cambio de estado (ACTIVA, VENCIDA, SUSPENDIDA, CANCELADA)
- **Módulo de Clientes** con cédula ecuatoriana
- **Módulo de Entrenadores**
- **Módulo de Pagos** y Asistencias
- **Módulo de Inventario** con catálogo visual, productos, proveedores, movimientos
- **Módulo de Configuración** (usuarios, datos del gimnasio, auditoría)
- **Módulo de Reportes** con exportación PDF
- **Módulo de Perfil de Usuario** con foto, edición de datos, cambio de contraseña con validación
- **Dashboard** con KPIs

### Pruebas automatizadas (Playwright)

- 10 casos de prueba TC-INT-01 a TC-INT-10 en `frontend/tests/membresias.spec.ts`
- Configuración en `frontend/playwright.config.ts`
- Ejecución: `npx playwright test` (requiere backend + frontend corriendo)
- Script todo-en-uno: `npm run e2e:fresh` (restaurar seed + tests)

### Docker

- 3 servicios en `docker-compose.yml`: postgres, backend, frontend
- Rama: `feature/docker`
- Levantar: `docker compose up -d --build`
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

## Ramas del repositorio

| Rama | Propósito |
|---|---|
| `main` | Producción con todo el código, pruebas y seeds |
| `feature/docker` | Soporte para Docker (mergeable a main cuando se apruebe) |

## Estructura del repositorio

```
TriFit-Gym-Manager-2/TriFit-Gym-Manager/
├── backend/                    API REST
│   ├── src/
│   │   ├── controllers/         (incluye perfil.controller.js)
│   │   ├── services/            (incluye perfil.service.js)
│   │   ├── routes/
│   │   ├── middlewares/         (incluye uploads.js para multer)
│   │   ├── validators/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma        (modelo de datos)
│   │   ├── seed.js              (seed base)
│   │   ├── seed-dataset.js      (25 clientes, 5 entrenadores, 20 membresías)
│   │   └── seed-productos.js    (9 productos de inventario)
│   ├── .env                     (credenciales reales, NO en git)
│   └── Dockerfile
├── frontend/                   Angular 17
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/            (auth, services, guards, interceptors, models)
│   │   │   ├── features/        (clientes, membresias, entrenadores, etc.)
│   │   │   ├── pages/           (landing, login, perfil)
│   │   │   ├── layout/          (shell con menú de usuario)
│   │   │   └── shared/          (componentes reutilizables, material.ts)
│   │   ├── environments/
│   │   └── styles.scss
│   ├── tests/                  (10 specs de Playwright, antes e2e/)
│   │   └── membresias.spec.ts
│   ├── playwright.config.ts
│   └── Dockerfile
├── docs/
│   ├── README.md
│   ├── casos_de_prueba.md      (10 casos TC-INT con datos reales)
│   ├── resultados-pruebas.md   (plantilla para informe)
│   └── CONTEXTO.md             (este archivo)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Configuración inicial (para el amigo)

```bash
# 1. Clonar
git clone https://github.com/JuniorSoft363/TriFit-Gym-Manager-2.git
cd TriFit-Gym-Manager-2/TriFit-Gym-Manager

# 2. Backend
cd backend
npm install
cp .env.example .env       # editar DATABASE_URL si es necesario
npx prisma migrate dev
npm run seed
npm run dev

# 3. Frontend (en otra terminal)
cd ../frontend
npm install
npm start

# 4. Login: http://localhost:4200
#    admin@trifit.com / Admin123*
```

### Con Docker (más fácil)

```bash
# Rama con soporte Docker
git checkout feature/docker
docker compose up -d --build

# Abrir http://localhost:4200
```

## Scripts útiles

| Comando | Función |
|---|---|
| `npm run seed` | Seed base (planes, ejercicios, admin) |
| `npm run seed:dataset` | 25 clientes + 5 entrenadores + 20 membresías |
| `npm run seed:productos` | 9 productos de inventario |
| `npm run e2e:fresh` | (en frontend) Restaurar seed + ejecutar tests |
| `npx prisma studio` | GUI para inspeccionar la BD |

## Decisiones de diseño importantes

1. **Idempotencia de pruebas**: TC-INT-01 usa la cédula `1956789012` (Paola) que NO tiene membresía en el seed. Si se ejecuta la prueba dos veces seguidas, la segunda falla porque ya tiene membresía activa. Solución: ejecutar `npm run seed:dataset` antes de cada corrida.

2. **Login via API en tests**: para evitar flakiness de la UI, los tests hacen login via `POST /api/auth/login` e inyectan el token en `localStorage` antes de cargar la app.

3. **Subida de imágenes**: multer con almacenamiento en disco en `backend/uploads/`. Sirve como archivos estáticos en `/uploads/`.

4. **Paginación**: pageSize por defecto 10. El componente usa `mat-paginator` de Angular Material.

5. **Catálogo de inventario**: vista de tarjetas en grid con filtros, búsqueda, modal de detalle, subida de imagen y descripción.

## Problemas conocidos / acciones derivadas

1. **TC-INT-01 no es idempotente** entre corridas. Solución documentada: ejecutar `seed:dataset` antes.
2. **Backend no filtra planes inactivos** en el dropdown de membresías (TC-INT-08). Mejora sugerida: agregar `?activo=true` al endpoint o filtrar en cliente.
3. **UI no deshabilita botón "Renovar"** cuando la membresía está CANCELADA (TC-INT-10). El backend maneja la solicitud correctamente, pero la UI podría mejorar la UX.
4. **Falta endpoint DELETE para membresías**: no se pueden limpiar membresías específicas sin resetear toda la BD.

## Endpoints principales del backend

```
POST   /api/auth/login
GET    /api/auth/perfil          (autenticado)
PUT    /api/auth/perfil          (actualizar)
PUT    /api/auth/perfil/password (cambiar contraseña)
POST   /api/auth/perfil/foto     (subir foto de perfil)

GET    /api/membresias?estado=&busqueda=&page=&limit=
POST   /api/membresias           { clienteId, planId, fechaInicio }
PATCH  /api/membresias/:id/renovar
PATCH  /api/membresias/:id/estado { estado }

GET    /api/clientes
GET    /api/clientes/cedula/:cedula
POST   /api/clientes
...

GET    /api/inventario/productos
POST   /api/inventario/productos
PUT    /api/inventario/productos/:id
POST   /api/inventario/productos/:id/imagen (multipart)
```

## Credenciales

- **Admin:** admin@trifit.com / Admin123*
- **Recepción:** recepcion@trifit.com / Admin123*
- **Entrenadores:** {nombre}.{apellido}@trifit.com / Entrenador123*
- **BD (desarrollo):** postgresql://postgres@localhost:5432/trifit

## Trabajo pendiente

1. Informe de pruebas (en `docs/resultados-pruebas.md` o Word)
2. Decidir si se mergea `feature/docker` a `main`
3. (Opcional) Implementar los fixes sugeridos arriba
