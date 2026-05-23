import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.empleado.count();

  if (total > 0) {
    console.log(`Seed omitido: ya existen ${total} empleado(s).`);
    return;
  }

  const empleado = await prisma.empleado.create({
    data: { nombre: process.env.SEED_EMPLEADO_NOMBRE ?? 'Empleado 1' },
  });
  console.log(`Empleado creado: "${empleado.nombre}" (id: ${empleado.id})`);
}

main()
  .catch((e) => { console.error('Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
