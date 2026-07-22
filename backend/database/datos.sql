-- =====================================================================
-- TriFit Gym Manager — Datos iniciales (seed)
-- Equivalente en SQL a backend/prisma/seed.js
--
-- Ejecutar DESPUÉS de schema.sql:
--   psql -U postgres -d trifit -f datos.sql
--
-- Es idempotente: se puede ejecutar varias veces sin duplicar datos.
--
-- Usuario administrador que crea este script:
--   Correo:     admin@trifit.com
--   Contraseña: Admin123*
-- =====================================================================

-- ============================
-- ROLES
-- ============================

INSERT INTO "Rol" ("nombre") VALUES
  ('ADMINISTRADOR'),
  ('RECEPCIONISTA'),
  ('ENTRENADOR')
ON CONFLICT ("nombre") DO NOTHING;

-- ============================
-- USUARIO ADMINISTRADOR
-- (hash bcrypt de "Admin123*")
-- ============================

INSERT INTO "Usuario" ("nombre", "email", "passwordHash", "activo", "rolId", "actualizadoEn")
SELECT
  'Administrador',
  'admin@trifit.com',
  '$2a$10$JrdzXJScGbJKXJCrQG2jKeBKxjpfdItoZp3Oh329oGbhWDFfdK4Oa',
  true,
  r."id",
  CURRENT_TIMESTAMP
FROM "Rol" r
WHERE r."nombre" = 'ADMINISTRADOR'
ON CONFLICT ("email") DO NOTHING;

-- ============================
-- DATOS DEL GIMNASIO
-- ============================

INSERT INTO "Gimnasio" ("nombre", "descripcion", "direccion", "telefono", "email", "horario")
SELECT
  'TriFit Gym',
  'Centro de entrenamiento integral: fuerza, cardio y acondicionamiento funcional.',
  'Av. Principal y Calle 10, Quevedo',
  '099 999 9999',
  'contacto@trifit.com',
  'Lunes a Sábado 06:00 - 22:00'
WHERE NOT EXISTS (SELECT 1 FROM "Gimnasio");

-- ============================
-- PLANES DE MEMBRESÍA
-- ============================

INSERT INTO "Plan" ("nombre", "descripcion", "duracionDias", "precio") VALUES
  ('Mensual',    'Acceso completo por 30 días',  30,  30.00),
  ('Trimestral', 'Acceso completo por 90 días',  90,  80.00),
  ('Anual',      'Acceso completo por 365 días', 365, 280.00)
ON CONFLICT ("nombre") DO NOTHING;

-- ============================
-- EJERCICIOS BASE
-- ============================

INSERT INTO "Ejercicio" ("nombre", "grupoMuscular") VALUES
  ('Sentadilla',     'Piernas'),
  ('Press de banca', 'Pecho'),
  ('Peso muerto',    'Espalda'),
  ('Press militar',  'Hombros'),
  ('Curl de bíceps', 'Brazos'),
  ('Plancha',        'Core')
ON CONFLICT ("nombre") DO NOTHING;
