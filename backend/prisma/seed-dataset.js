// Dataset de prueba: 25 clientes, 5 entrenadores, membresías, pagos y asistencias.
// Idempotente: usa upsert por cédula/email/nombre único.
// Uso: node prisma/seed-dataset.js
const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function diasFuturo(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

const CLIENTES = [
  { cedula: '1712345678', nombres: 'Ana Lucia',    apellidos: 'Pérez Mendoza',  telefono: '0991234501', email: 'ana.perez@example.com',     fechaNacimiento: '1995-03-12' },
  { cedula: '1723456789', nombres: 'Carlos Andres',apellidos: 'Gómez Ruiz',     telefono: '0991234502', email: 'carlos.gomez@example.com',  fechaNacimiento: '1990-07-25' },
  { cedula: '1734567890', nombres: 'Maria Fernanda',apellidos: 'López Vega',    telefono: '0991234503', email: 'maria.lopez@example.com',   fechaNacimiento: '1998-11-05' },
  { cedula: '1745678901', nombres: 'Jose Luis',    apellidos: 'Ramírez Torres', telefono: '0991234504', email: 'jose.ramirez@example.com',  fechaNacimiento: '1988-01-19' },
  { cedula: '1756789012', nombres: 'Patricia',     apellidos: 'Salazar Mora',   telefono: '0991234505', email: 'patricia.salazar@example.com', fechaNacimiento: '1996-09-30' },
  { cedula: '1767890123', nombres: 'Diego',        apellidos: 'Castro Villamil',telefono: '0991234506', email: 'diego.castro@example.com',   fechaNacimiento: '1992-04-14' },
  { cedula: '1778901234', nombres: 'Sofia',        apellidos: 'Núñez Bonilla',  telefono: '0991234507', email: 'sofia.nunez@example.com',    fechaNacimiento: '2000-12-22' },
  { cedula: '1789012345', nombres: 'Andrés',       apellidos: 'Vera Cedeño',    telefono: '0991234508', email: 'andres.vera@example.com',    fechaNacimiento: '1985-06-08' },
  { cedula: '1790123456', nombres: 'Valeria',      apellidos: 'Ortega Solís',   telefono: '0991234509', email: 'valeria.ortega@example.com', fechaNacimiento: '1997-08-17' },
  { cedula: '1801234567', nombres: 'Miguel',       apellidos: 'Chávez Rivera',  telefono: '0991234510', email: 'miguel.chavez@example.com',  fechaNacimiento: '1993-02-28' },
  { cedula: '1812345678', nombres: 'Isabel',       apellidos: 'Pino Aguilar',   telefono: '0991234511', email: 'isabel.pino@example.com',    fechaNacimiento: '1991-10-11' },
  { cedula: '1823456789', nombres: 'Roberto',      apellidos: 'Suárez Páez',    telefono: '0991234512', email: 'roberto.suarez@example.com', fechaNacimiento: '1987-05-04' },
  { cedula: '1834567890', nombres: 'Camila',       apellidos: 'Reyes Lara',     telefono: '0991234513', email: 'camila.reyes@example.com',   fechaNacimiento: '1999-11-23' },
  { cedula: '1845678901', nombres: 'Pablo',        apellidos: 'Mendoza Silva',  telefono: '0991234514', email: 'pablo.mendoza@example.com',  fechaNacimiento: '1994-04-09' },
  { cedula: '1856789012', nombres: 'Daniela',      apellidos: 'Acosta Bravo',   telefono: '0991234515', email: 'daniela.acosta@example.com', fechaNacimiento: '1996-12-01' },
  { cedula: '1867890123', nombres: 'Esteban',      apellidos: 'Yánez Carbo',    telefono: '0991234516', email: 'esteban.yanez@example.com',  fechaNacimiento: '1989-08-15' },
  { cedula: '1878901234', nombres: 'Laura',        apellidos: 'Bermúdez Pico',  telefono: '0991234517', email: 'laura.bermudez@example.com', fechaNacimiento: '2001-03-27' },
  { cedula: '1889012345', nombres: 'Federico',     apellidos: 'Ibarra Lombeida',telefono: '0991234518', email: 'federico.ibarra@example.com',fechaNacimiento: '1986-07-02' },
  { cedula: '1890123456', nombres: 'Gisela',       apellidos: 'Parra Zambrano', telefono: '0991234519', email: 'gisela.parra@example.com',   fechaNacimiento: '1995-10-18' },
  { cedula: '1901234567', nombres: 'Héctor',       apellidos: 'Quiroz Medina',  telefono: '0991234520', email: 'hector.quiroz@example.com',  fechaNacimiento: '1990-01-13' },
  { cedula: '1912345678', nombres: 'Lucía',        apellidos: 'Tapia Sotomayor',telefono: '0991234521', email: 'lucia.tapia@example.com',    fechaNacimiento: '1998-06-21' },
  { cedula: '1923456789', nombres: 'Mauricio',     apellidos: 'Delgado Noboa',  telefono: '0991234522', email: 'mauricio.delgado@example.com',fechaNacimiento: '1992-09-09' },
  { cedula: '1934567890', nombres: 'Natalia',      apellidos: 'Cevallos Jara',  telefono: '0991234523', email: 'natalia.cevallos@example.com',fechaNacimiento: '1997-04-30' },
  { cedula: '1945678901', nombres: 'Oscar',        apellidos: 'Pazmiño Lara',   telefono: '0991234524', email: 'oscar.pazmino@example.com',  fechaNacimiento: '1988-12-17' },
  { cedula: '1956789012', nombres: 'Paola',        apellidos: 'Sánchez Ortega', telefono: '0991234525', email: 'paola.sanchez@example.com',  fechaNacimiento: '1993-08-06' }
];

const ENTRENADORES = [
  { cedula: '0911111111', nombres: 'Luis',  apellidos: 'Mendoza Pico',     telefono: '0980000001', email: 'luis.mendoza@trifit.com',   especialidad: 'Fuerza y potencia' },
  { cedula: '0922222222', nombres: 'Karen', apellidos: 'Vera Loor',        telefono: '0980000002', email: 'karen.vera@trifit.com',     especialidad: 'Cardio y resistencia' },
  { cedula: '0933333333', nombres: 'Pedro', apellidos: 'Alcívar Bravo',    telefono: '0980000003', email: 'pedro.alcivar@trifit.com',  especialidad: 'Crossfit funcional' },
  { cedula: '0944444444', nombres: 'María', apellidos: 'Intriago Cedeño',  telefono: '0980000004', email: 'maria.intriago@trifit.com', especialidad: 'Rehabilitación física' },
  { cedula: '0955555555', nombres: 'Jorge', apellidos: 'Salinas Ortega',   telefono: '0980000005', email: 'jorge.salinas@trifit.com',  especialidad: 'Pérdida de peso' }
];

const USUARIOS_RECEPCION = [
  { email: 'recepcion@trifit.com', nombre: 'Recepción' }
];

async function main() {
  console.log('Insertando dataset de prueba...');

  // 1) Roles (por si no se ejecutó el seed base)
  for (const nombre of ['ADMINISTRADOR', 'RECEPCIONISTA', 'ENTRENADOR']) {
    await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMINISTRADOR' } });
  const rolRecep = await prisma.rol.findUnique({ where: { nombre: 'RECEPCIONISTA' } });

  // Admin (por si el seed base no se ejecutó)
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

  // Usuario recepción
  await prisma.usuario.upsert({
    where: { email: 'recepcion@trifit.com' },
    update: {},
    create: {
      nombre: 'Recepción',
      email: 'recepcion@trifit.com',
      passwordHash: await bcrypt.hash('Admin123*', 10),
      rolId: rolRecep.id
    }
  });

  // Gimnasio (idempotente: solo crea si está vacío)
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

  // 2) Planes (Decimal explícito para evitar pérdida de precisión)
  const planMensual  = await prisma.plan.upsert({ where: { nombre: 'Mensual' },    update: {}, create: { nombre: 'Mensual',    descripcion: 'Acceso completo por 30 días',  duracionDias: 30,  precio: new Prisma.Decimal('30.00') } });
  const planTrimestral = await prisma.plan.upsert({ where: { nombre: 'Trimestral' }, update: {}, create: { nombre: 'Trimestral', descripcion: 'Acceso completo por 90 días',  duracionDias: 90,  precio: new Prisma.Decimal('80.00') } });
  const planAnual    = await prisma.plan.upsert({ where: { nombre: 'Anual' },     update: {}, create: { nombre: 'Anual',      descripcion: 'Acceso completo por 365 días', duracionDias: 365, precio: new Prisma.Decimal('280.00') } });

  // Plan inactivo extra (para TC-INT-08)
  await prisma.plan.upsert({
    where: { nombre: 'Promoción Descontinuada' },
    update: { activo: false },
    create: { nombre: 'Promoción Descontinuada', descripcion: 'Plan histórico ya no disponible', duracionDias: 60, precio: new Prisma.Decimal('50.00'), activo: false }
  });

  // 3) Ejercicios base (si el seed no se ejecutó)
  const ejerciciosBase = [
    { nombre: 'Sentadilla', grupoMuscular: 'Piernas' },
    { nombre: 'Press de banca', grupoMuscular: 'Pecho' },
    { nombre: 'Peso muerto', grupoMuscular: 'Espalda' },
    { nombre: 'Press militar', grupoMuscular: 'Hombros' },
    { nombre: 'Curl de bíceps', grupoMuscular: 'Brazos' },
    { nombre: 'Plancha', grupoMuscular: 'Core' },
    { nombre: 'Zancadas', grupoMuscular: 'Piernas' },
    { nombre: 'Dominadas', grupoMuscular: 'Espalda' },
    { nombre: 'Remo con barra', grupoMuscular: 'Espalda' },
    { nombre: 'Extensión de tríceps', grupoMuscular: 'Brazos' }
  ];
  for (const e of ejerciciosBase) {
    await prisma.ejercicio.upsert({ where: { nombre: e.nombre }, update: {}, create: e });
  }

  // 4) Entrenadores con usuario asociado
  const rolEntrenador = await prisma.rol.findUnique({ where: { nombre: 'ENTRENADOR' } });
  for (const ent of ENTRENADORES) {
    const emailUsuario = ent.email;
    const usuario = await prisma.usuario.upsert({
      where: { email: emailUsuario },
      update: {},
      create: {
        nombre: `${ent.nombres} ${ent.apellidos}`,
        email: emailUsuario,
        passwordHash: await bcrypt.hash('Entrenador123*', 10),
        rolId: rolEntrenador.id
      }
    });
    await prisma.entrenador.upsert({
      where: { cedula: ent.cedula },
      update: { telefono: ent.telefono, email: ent.email, especialidad: ent.especialidad, activo: true, usuarioId: usuario.id },
      create: {
        cedula: ent.cedula,
        nombres: ent.nombres,
        apellidos: ent.apellidos,
        telefono: ent.telefono,
        email: ent.email,
        especialidad: ent.especialidad,
        activo: true,
        usuarioId: usuario.id
      }
    });
  }

  // 5) Clientes
  const clientesCreados = [];
  for (const c of CLIENTES) {
    const cli = await prisma.cliente.upsert({
      where: { cedula: c.cedula },
      update: { telefono: c.telefono, email: c.email, fechaNacimiento: new Date(c.fechaNacimiento) },
      create: { ...c, fechaNacimiento: new Date(c.fechaNacimiento) }
    });
    clientesCreados.push(cli);
  }

  // 6) Membresías: estados variados para que la tabla tenga contenido
  // Regla: la BD solo permite 1 ACTIVA por cliente (por servicio). Aquí forzamos limpieza previa.
  console.log('Limpiando membresías previas para reinsertar dataset...');
  await prisma.pago.deleteMany({});
  await prisma.membresia.deleteMany({});

  const planesPorId = { 30: planMensual.id, 90: planTrimestral.id, 365: planAnual.id };

  // Definimos la membresía por cliente (índices 0..24)
  //  - Primeros 10: ACTIVA (vence entre +5 y +60 días)
  //  - Siguientes 6: VENCIDA (vencieron hace entre -5 y -30 días)
  //  - 2 SUSPENDIDA
  //  - 2 CANCELADA
  //  - 5 sin membresía
  const casos = [
    { tipo: 'activa',  plan: 30,  inicio: haceDias(5),  fin: diasFuturo(25) },
    { tipo: 'activa',  plan: 30,  inicio: haceDias(15), fin: diasFuturo(15) },
    { tipo: 'activa',  plan: 30,  inicio: haceDias(20), fin: diasFuturo(10) },
    { tipo: 'activa',  plan: 90,  inicio: haceDias(30), fin: diasFuturo(60) },
    { tipo: 'activa',  plan: 90,  inicio: haceDias(45), fin: diasFuturo(45) },
    { tipo: 'activa',  plan: 90,  inicio: haceDias(60), fin: diasFuturo(30) },
    { tipo: 'activa',  plan: 365, inicio: haceDias(100), fin: diasFuturo(265) },
    { tipo: 'activa',  plan: 365, inicio: haceDias(150), fin: diasFuturo(215) },
    { tipo: 'activa',  plan: 30,  inicio: haceDias(2),  fin: diasFuturo(28) },
    { tipo: 'activa',  plan: 90,  inicio: haceDias(7),  fin: diasFuturo(83) },
    { tipo: 'vencida', plan: 30,  inicio: haceDias(40), fin: haceDias(10) },
    { tipo: 'vencida', plan: 30,  inicio: haceDias(35), fin: haceDias(5) },
    { tipo: 'vencida', plan: 90,  inicio: haceDias(100), fin: haceDias(10) },
    { tipo: 'vencida', plan: 90,  inicio: haceDias(95), fin: haceDias(5) },
    { tipo: 'vencida', plan: 365, inicio: haceDias(380), fin: haceDias(15) },
    { tipo: 'vencida', plan: 365, inicio: haceDias(370), fin: haceDias(5) },
    { tipo: 'suspendida', plan: 30, inicio: haceDias(10), fin: diasFuturo(20) },
    { tipo: 'suspendida', plan: 90, inicio: haceDias(20), fin: diasFuturo(70) },
    { tipo: 'cancelada', plan: 30, inicio: haceDias(50), fin: haceDias(20) },
    { tipo: 'cancelada', plan: 90, inicio: haceDias(120), fin: haceDias(30) }
    // índices 20..24 sin membresía
  ];

  const adminUser = await prisma.usuario.findUnique({ where: { email: 'admin@trifit.com' } });

  for (let i = 0; i < casos.length; i++) {
    const c = casos[i];
    const cliente = clientesCreados[i];
    const planId = planesPorId[c.plan];
    const mem = await prisma.membresia.create({
      data: {
        clienteId: cliente.id,
        planId,
        fechaInicio: c.inicio,
        fechaFin: c.fin,
        estado: c.tipo === 'activa' ? 'ACTIVA' : c.tipo === 'suspendida' ? 'SUSPENDIDA' : c.tipo === 'cancelada' ? 'CANCELADA' : 'VENCIDA'
      }
    });
    // Pago para las activas y vencidas
    if (c.tipo === 'activa' || c.tipo === 'vencida') {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      const metodos = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];
      await prisma.pago.create({
        data: {
          membresiaId: mem.id,
          monto: new Prisma.Decimal(plan.precio.toString()),
          metodo: metodos[i % 3],
          estado: 'PAGADO',
          fecha: c.inicio,
          usuarioId: adminUser.id
        }
      });
    }
  }

  // 7) Asistencias recientes para los primeros 5 clientes activos
  const activosIds = [];
  for (let i = 0; i < 10; i++) {
    if (casos[i]?.tipo === 'activa') activosIds.push(clientesCreados[i].id);
  }
  for (const cid of activosIds.slice(0, 5)) {
    for (let d = 0; d < 5; d++) {
      // Crear copias independientes para no mutar la fecha
      const fechaBase = new Date();
      fechaBase.setDate(fechaBase.getDate() - d);
      const horaEntrada = new Date(fechaBase);
      horaEntrada.setHours(7 + (d % 3), 0, 0, 0);
      await prisma.asistencia.create({
        data: {
          clienteId: cid,
          fecha: fechaBase,
          horaEntrada,
          usuarioId: adminUser.id
        }
      });
    }
  }

  // Resumen
  const counts = {
    clientes: await prisma.cliente.count(),
    entrenadores: await prisma.entrenador.count(),
    planes: await prisma.plan.count(),
    membresias: await prisma.membresia.count(),
    pagos: await prisma.pago.count(),
    asistencias: await prisma.asistencia.count()
  };
  console.log('Dataset insertado:', counts);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
