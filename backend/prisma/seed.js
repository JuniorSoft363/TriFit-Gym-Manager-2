// Datos iniciales: roles, usuario administrador, datos del gimnasio, planes y ejercicios base
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  for (const nombre of ['ADMINISTRADOR', 'RECEPCIONISTA', 'ENTRENADOR']) {
    await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMINISTRADOR' } });
  await prisma.usuario.upsert({
    where: { email: 'admin@trifit.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@trifit.com',
      passwordHash: await bcrypt.hash('Admin123*', 10),
      rolId: rolAdmin.id
    }
  });

  if (!(await prisma.gimnasio.findFirst())) {
    await prisma.gimnasio.create({
      data: {
        nombre: 'TriFit Gym',
        descripcion: 'Centro de entrenamiento integral: fuerza, cardio y acondicionamiento funcional.',
        direccion: 'Av. Principal y Calle 10, Quevedo',
        telefono: '099 999 9999',
        email: 'contacto@trifit.com',
        horario: 'Lunes a Sábado 06:00 - 22:00'
      }
    });
  }

  const planes = [
    { nombre: 'Mensual', descripcion: 'Acceso completo por 30 días', duracionDias: 30, precio: 30 },
    { nombre: 'Trimestral', descripcion: 'Acceso completo por 90 días', duracionDias: 90, precio: 80 },
    { nombre: 'Anual', descripcion: 'Acceso completo por 365 días', duracionDias: 365, precio: 280 }
  ];
  for (const p of planes) {
    await prisma.plan.upsert({ where: { nombre: p.nombre }, update: {}, create: p });
  }

  const ejercicios = [
    { nombre: 'Sentadilla', grupoMuscular: 'Piernas' },
    { nombre: 'Press de banca', grupoMuscular: 'Pecho' },
    { nombre: 'Peso muerto', grupoMuscular: 'Espalda' },
    { nombre: 'Press militar', grupoMuscular: 'Hombros' },
    { nombre: 'Curl de bíceps', grupoMuscular: 'Brazos' },
    { nombre: 'Plancha', grupoMuscular: 'Core' }
  ];
  for (const e of ejercicios) {
    await prisma.ejercicio.upsert({ where: { nombre: e.nombre }, update: {}, create: e });
  }

  console.log('Seed ejecutado correctamente.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
