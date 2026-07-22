-- =====================================================================
-- TriFit Gym Manager — Script de creación de base de datos
-- PostgreSQL 14+
--
-- Este script crea exactamente el mismo esquema que generaría
-- `npx prisma migrate dev` a partir de backend/prisma/schema.prisma.
-- Úsalo si necesitas crear la base de datos manualmente (por ejemplo,
-- para la entrega del proyecto) sin depender del CLI de Prisma.
--
-- Uso:
--   1. createdb trifit          (o: CREATE DATABASE trifit; en psql)
--   2. psql -U postgres -d trifit -f schema.sql
--
-- Después de ejecutarlo, en backend/ corre:
--   npx prisma generate
--   npm run seed
-- (NO ejecutes "npx prisma migrate dev" sobre esta base ya creada
--  manualmente, o intentará crear las tablas de nuevo. Si vas a usar
--  Prisma Migrate en el futuro, marca esta migración como aplicada con:
--  npx prisma migrate resolve --applied <nombre_migracion>)
-- =====================================================================

-- ============================
-- ENUMS
-- ============================

CREATE TYPE "EstadoMembresia" AS ENUM ('ACTIVA', 'VENCIDA', 'SUSPENDIDA', 'CANCELADA');
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');
CREATE TYPE "EstadoPago" AS ENUM ('PAGADO', 'PENDIENTE', 'ANULADO');
CREATE TYPE "TipoProducto" AS ENUM ('PRODUCTO', 'EQUIPO');
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- ============================
-- TABLAS
-- ============================

CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "rolId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionDias" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membresia" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoMembresia" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membresia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "membresiaId" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PAGADO',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,
    "usuarioId" INTEGER,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaEntrada" TIMESTAMP(3) NOT NULL,
    "horaSalida" TIMESTAMP(3),
    "usuarioId" INTEGER,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Entrenador" (
    "id" SERIAL NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "especialidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" INTEGER,

    CONSTRAINT "Entrenador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClienteEntrenador" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "entrenadorId" INTEGER NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClienteEntrenador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rutina" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "entrenadorId" INTEGER,
    "clienteId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ejercicio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoMuscular" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Ejercicio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RutinaEjercicio" (
    "id" SERIAL NOT NULL,
    "rutinaId" INTEGER NOT NULL,
    "ejercicioId" INTEGER NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticiones" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "observacion" TEXT,

    CONSTRAINT "RutinaEjercicio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'PRODUCTO',
    "precio" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "proveedorId" INTEGER,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "observacion" TEXT,
    "usuarioId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gimnasio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "horario" TEXT,

    CONSTRAINT "Gimnasio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Auditoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" INTEGER,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- ============================
-- ÍNDICES ÚNICOS
-- ============================

CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Cliente_cedula_key" ON "Cliente"("cedula");
CREATE UNIQUE INDEX "Plan_nombre_key" ON "Plan"("nombre");
CREATE UNIQUE INDEX "Entrenador_cedula_key" ON "Entrenador"("cedula");
CREATE UNIQUE INDEX "Entrenador_usuarioId_key" ON "Entrenador"("usuarioId");
CREATE UNIQUE INDEX "ClienteEntrenador_clienteId_entrenadorId_key" ON "ClienteEntrenador"("clienteId", "entrenadorId");
CREATE UNIQUE INDEX "Ejercicio_nombre_key" ON "Ejercicio"("nombre");
CREATE UNIQUE INDEX "RutinaEjercicio_rutinaId_ejercicioId_key" ON "RutinaEjercicio"("rutinaId", "ejercicioId");
CREATE UNIQUE INDEX "Proveedor_ruc_key" ON "Proveedor"("ruc");

-- ============================
-- ÍNDICES DE APOYO (llaves foráneas)
-- ============================

CREATE INDEX "Usuario_rolId_idx" ON "Usuario"("rolId");
CREATE INDEX "Membresia_clienteId_idx" ON "Membresia"("clienteId");
CREATE INDEX "Membresia_planId_idx" ON "Membresia"("planId");
CREATE INDEX "Pago_membresiaId_idx" ON "Pago"("membresiaId");
CREATE INDEX "Pago_usuarioId_idx" ON "Pago"("usuarioId");
CREATE INDEX "Asistencia_clienteId_idx" ON "Asistencia"("clienteId");
CREATE INDEX "Asistencia_usuarioId_idx" ON "Asistencia"("usuarioId");
CREATE INDEX "ClienteEntrenador_entrenadorId_idx" ON "ClienteEntrenador"("entrenadorId");
CREATE INDEX "Rutina_entrenadorId_idx" ON "Rutina"("entrenadorId");
CREATE INDEX "Rutina_clienteId_idx" ON "Rutina"("clienteId");
CREATE INDEX "RutinaEjercicio_ejercicioId_idx" ON "RutinaEjercicio"("ejercicioId");
CREATE INDEX "Producto_proveedorId_idx" ON "Producto"("proveedorId");
CREATE INDEX "Inventario_productoId_idx" ON "Inventario"("productoId");
CREATE INDEX "Inventario_usuarioId_idx" ON "Inventario"("usuarioId");
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- ============================
-- LLAVES FORÁNEAS
-- ============================

ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Membresia" ADD CONSTRAINT "Membresia_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Pago" ADD CONSTRAINT "Pago_membresiaId_fkey" FOREIGN KEY ("membresiaId") REFERENCES "Membresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Entrenador" ADD CONSTRAINT "Entrenador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClienteEntrenador" ADD CONSTRAINT "ClienteEntrenador_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClienteEntrenador" ADD CONSTRAINT "ClienteEntrenador_entrenadorId_fkey" FOREIGN KEY ("entrenadorId") REFERENCES "Entrenador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_entrenadorId_fkey" FOREIGN KEY ("entrenadorId") REFERENCES "Entrenador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RutinaEjercicio" ADD CONSTRAINT "RutinaEjercicio_rutinaId_fkey" FOREIGN KEY ("rutinaId") REFERENCES "Rutina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RutinaEjercicio" ADD CONSTRAINT "RutinaEjercicio_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "Ejercicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
