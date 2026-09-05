# TriFit Gym Manager

Sistema web de gestión de gimnasios desarrollado como proyecto universitario.

**Stack:** Angular 17 (standalone) + Angular Material · Node.js + Express · PostgreSQL + Prisma ORM · JWT + bcrypt · Docker

## Estructura

```
TriFit-Gym-Manager/
├── backend/            API REST (Node/Express/Prisma)
├── frontend/           Aplicación Angular
├── docker-compose.yml  Orquestación de los 3 servicios
├── backend/Dockerfile  Imagen del backend (Node 20 alpine + Prisma)
├── frontend/Dockerfile Imagen del frontend (build Angular + nginx)
├── frontend/nginx.conf Configuración de nginx (proxy a /api)
└── .env.example        Variables de entorno para Docker
```

## Opción 1: Ejecución con Docker (recomendada)

Única forma de garantizar que la app corra igual en cualquier máquina sin instalar Node, Angular ni PostgreSQL localmente.

**Requisitos:** Docker Desktop o Docker Engine + Docker Compose v2.

### Pasos

```bash
# 1. (Opcional) Copiar y ajustar variables de entorno
cp .env.example .env

# 2. Construir y levantar los servicios
docker compose up -d --build

# 3. Esperar ~30 segundos a que todo arranque

# 4. Abrir en el navegador
#    http://localhost:4200
#    Usuario: admin@trifit.com
#    Contraseña: Admin123*
```

Los datos iniciales (planes, ejercicios, cliente admin) se crean automáticamente al arrancar el backend. Si necesitas el dataset completo de 25 clientes, 5 entrenadores y 20 membresías, ejecuta dentro del contenedor del backend:

```bash
docker exec trifit-backend node prisma/seed-dataset.js
docker exec trifit-backend node prisma/seed-productos.js
```

### Comandos útiles

| Acción | Comando |
|---|---|
| Ver logs en vivo | `docker compose logs -f` |
| Ver logs solo del backend | `docker compose logs -f backend` |
| Detener todo | `docker compose down` |
| Detener y borrar volúmenes (BD) | `docker compose down -v` |
| Reconstruir tras cambios | `docker compose up -d --build` |
| Reiniciar un servicio | `docker compose restart backend` |

### Servicios incluidos

| Servicio | Puerto (host) | Puerto (contenedor) | Descripción |
|---|---|---|---|
| `trifit-frontend` | 4200 | 80 (nginx) | App Angular servida por nginx, hace proxy a /api y /uploads al backend |
| `trifit-backend` | 3000 | 3000 | API REST en Node 20 (alpine) + Prisma + OpenSSL |
| `trifit-postgres` | (no expuesto) | 5432 | PostgreSQL 16 alpine, solo accesible dentro de la red Docker |
| `trifit-backup` | — | — | Respaldo automático diario de la BD en `./backups/` (retención 14 días) |

**Volúmenes persistentes:**
- `postgres_data` — datos de la base
- `backend_uploads` — fotos de perfil y productos subidas
- `./backups/` — dumps `trifit_AAAAMMDD_HHMMSS.dump.gz` (NO se suben a git)

### Respaldos y restauración

El servicio `backup` genera un dump comprimido al arrancar y luego cada 24 h.
Variables opcionales en `.env`: `BACKUP_RETENTION_DAYS` (defecto 14),
`BACKUP_INTERVAL_SECONDS` (defecto 86400).

```bash
# Ver dumps disponibles
ls backups/

# Restaurar un dump en una BD de prueba (verificación)
docker compose exec postgres psql -U postgres -d postgres -c "CREATE DATABASE restauro_prueba;"
docker run --rm --network trifit-gym-manager_trifit-net -v ./backups:/backups:ro \
  -e PGPASSWORD=postgres postgres:16-alpine \
  sh -c "gunzip -c /backups/trifit_AAAAMMDD_HHMMSS.dump.gz | pg_restore -h postgres -U postgres -d restauro_prueba"

# Restauración total ante desastre (detiene el backend primero)
docker compose stop backend backup
docker run --rm --network trifit-gym-manager_trifit-net -v ./backups:/backups:ro \
  -e PGPASSWORD=postgres postgres:16-alpine \
  sh -c "gunzip -c /backups/trifit_AAAAMMDD_HHMMSS.dump.gz | pg_restore -h postgres -U postgres -d trifit -c"
docker compose start backend backup
```

> Ajusta `-U`, `-e PGPASSWORD` y `-d` si cambiaste `POSTGRES_USER`,
> `POSTGRES_PASSWORD` o `POSTGRES_DB`. Guarda copias de `./backups/`
> fuera del servidor periódicamente.

---

## Opción 2: Ejecución local (sin Docker)

Requiere instalar Node.js 18+ y PostgreSQL 16 localmente.

## 1. Backend

### Requisitos
- Node.js 18+
- PostgreSQL corriendo localmente (o accesible por red)

### Pasos

```bash
cd backend
cp .env.example .env
```

Edita `.env` y ajusta `DATABASE_URL` con tus credenciales de PostgreSQL, por ejemplo:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trifit"
JWT_SECRET="cambia_este_valor_por_uno_seguro"
JWT_EXPIRES="8h"
PORT=3000
```

Crea la base de datos (si no existe) y luego:

```bash
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`. La API vive bajo `http://localhost:3000/api`.

### Alternativa: crear la base de datos con scripts SQL

Si prefieres (o necesitas entregar) los scripts SQL en lugar de usar Prisma Migrate, están en `backend/database/`:

| Script | Contenido |
|---|---|
| `database/schema.sql` | Creación de todas las tablas, enums, índices y llaves foráneas |
| `database/datos.sql` | Datos iniciales: roles, usuario admin, gimnasio, planes y ejercicios |

```bash
# Con psql (usuario y base según tu instalación):
createdb trifit
psql -U postgres -d trifit -f database/schema.sql
psql -U postgres -d trifit -f database/datos.sql
```

También puedes abrir ambos archivos en pgAdmin (Query Tool) y ejecutarlos en ese orden. Ambos scripts fueron probados contra PostgreSQL 16 y `datos.sql` es idempotente (se puede ejecutar varias veces sin duplicar).

Si creas la base con los scripts SQL, en `backend/` solo ejecuta `npm install`, `npx prisma generate` y `npm run dev` (ya no hace falta `migrate` ni `seed`).

### Usuario administrador inicial (creado por el seed)

- **Correo:** admin@trifit.com
- **Contraseña:** Admin123*

El seed también crea los 3 roles (ADMINISTRADOR, RECEPCIONISTA, ENTRENADOR), los datos base del gimnasio, 3 planes de membresía (Mensual, Trimestral, Anual) y 6 ejercicios base.

## 2. Frontend

### Requisitos
- Node.js 18+
- Backend corriendo (ver paso 1)

### Pasos

```bash
cd frontend
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

Si el backend corre en una URL distinta a `http://localhost:3000/api`, edítala en `frontend/src/environments/environment.ts`.

## 3. Uso

1. Abre `http://localhost:4200` → landing page pública del gimnasio.
2. Clic en "Iniciar Sesión" → ingresa con el usuario administrador.
3. Desde **Configuración → Usuarios** puedes crear cuentas de RECEPCIONISTA y ENTRENADOR.
4. Cada rol ve solo los módulos que le corresponden (el menú lateral se filtra automáticamente).

### Resumen de módulos

| Módulo | Roles con acceso |
|---|---|
| Dashboard | Administrador, Recepcionista |
| Clientes | Administrador, Recepcionista, Entrenador (solo lectura) |
| Planes y Membresías | Administrador (planes), Administrador + Recepcionista (membresías) |
| Pagos | Administrador, Recepcionista |
| Asistencias (por cédula) | Administrador, Recepcionista |
| Entrenadores | Administrador |
| Rutinas y Ejercicios | Administrador, Entrenador |
| Inventario | Administrador |
| Reportes (con exportación PDF) | Administrador, Recepcionista |
| Configuración (usuarios, datos del gimnasio, auditoría) | Administrador |

## Notas técnicas

- Las eliminaciones son lógicas (soft-delete vía campo `activo`); los registros no se borran físicamente.
- Las membresías vencidas se recalculan automáticamente en cada consulta relevante.
- El registro de asistencia es únicamente por número de cédula (sin QR, según alcance del proyecto).
- La exportación a PDF se genera en el navegador con `jsPDF` + `jspdf-autotable`, tomando hasta 1000 registros filtrados.
- Toda acción de creación/edición/desactivación queda registrada en la tabla de Auditoría.
