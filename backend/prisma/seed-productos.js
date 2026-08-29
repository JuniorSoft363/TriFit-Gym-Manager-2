// Inserta productos y equipos de ejemplo con descripciones.
// Idempotente: usa upsert por nombre. Las imágenes se suben por separado.
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCTOS = [
  {
    nombre: 'Proteína Whey 1kg',
    tipo: 'PRODUCTO',
    descripcion: 'Suplemento proteico de suero de leche sabor chocolate. Ideal para recuperación post-entreno. Contiene 25g de proteína por porción.',
    precio: 35.00,
    stock: 20,
    stockMinimo: 5
  },
  {
    nombre: 'Creatina Monohidrato 300g',
    tipo: 'PRODUCTO',
    descripcion: 'Creatina micronizada de alta pureza. Aumenta la fuerza y el rendimiento en entrenamientos de alta intensidad.',
    precio: 18.50,
    stock: 30,
    stockMinimo: 10
  },
  {
    nombre: 'Shaker 600ml',
    tipo: 'PRODUCTO',
    descripcion: 'Botella mezcladora con rejilla metálica. Capacidad 600ml, libre de BPA. Ideal para preparar batidos.',
    precio: 6.00,
    stock: 50,
    stockMinimo: 15
  },
  {
    nombre: 'Toalla deportiva',
    tipo: 'PRODUCTO',
    descripcion: 'Toalla de microfibra 40x80cm. Absorción superior, secado rápido. Logo bordado TriFit.',
    precio: 9.00,
    stock: 25,
    stockMinimo: 5
  },
  {
    nombre: 'Camiseta TriFit',
    tipo: 'PRODUCTO',
    descripcion: 'Camiseta deportiva de secado rápido. Tallas S, M, L, XL. Color negro con logo TriFit en pecho.',
    precio: 22.00,
    stock: 15,
    stockMinimo: 5
  },
  {
    nombre: 'Botella de agua 1L',
    tipo: 'PRODUCTO',
    descripcion: 'Botella reutilizable libre de BPA con tapa rosca. Capacidad 1 litro. Marcador de hidratación.',
    precio: 8.00,
    stock: 40,
    stockMinimo: 10
  },
  {
    nombre: 'Mancuerna 10kg',
    tipo: 'EQUIPO',
    descripcion: 'Par de mancuernas hexagonales de hierro fundido con mango ergonómico antideslizante. Peso unitario 10kg.',
    precio: 45.00,
    stock: 8,
    stockMinimo: 2
  },
  {
    nombre: 'Esterilla yoga',
    tipo: 'EQUIPO',
    descripcion: 'Esterilla antideslizante 6mm de grosor. Material ecológico, libre de látex. Incluye correa de transporte.',
    precio: 15.00,
    stock: 12,
    stockMinimo: 3
  },
  {
    nombre: 'Cuerda para saltar',
    tipo: 'EQUIPO',
    descripcion: 'Cuerda de saltar con rodamientos de alta velocidad. Mangos ergonómicos de foam. Longitud ajustable.',
    precio: 7.50,
    stock: 0,
    stockMinimo: 5
  }
];

async function main() {
  console.log('Insertando productos y equipos de ejemplo...');
  let count = 0;
  for (const p of PRODUCTOS) {
    const existente = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    const data = {
      tipo: p.tipo,
      descripcion: p.descripcion,
      precio: new Prisma.Decimal(p.precio.toFixed(2)),
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      activo: true
    };
    if (existente) {
      await prisma.producto.update({ where: { id: existente.id }, data });
    } else {
      await prisma.producto.create({ data: { nombre: p.nombre, ...data } });
    }
    count++;
  }
  console.log(`Productos insertados/actualizados: ${count}`);
  console.log('Total productos:', await prisma.producto.count());
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
