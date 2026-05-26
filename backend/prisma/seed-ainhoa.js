import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HORARIOS = [
  // ── Semana 25/05 – 31/05 ────────────────────────────────────────────────────
  { fecha: '2026-05-25', turnoNum: 1, horaEntrada: '16:00', horaSalida: '21:30' },
  { fecha: '2026-05-26', turnoNum: 1, horaEntrada: '17:00', horaSalida: '20:30' },
  { fecha: '2026-05-27', turnoNum: 1, horaEntrada: '17:00', horaSalida: '21:30' },
  { fecha: '2026-05-28', turnoNum: 1, horaEntrada: '16:00', horaSalida: '21:30' },
  { fecha: '2026-05-29', turnoNum: 1, horaEntrada: '17:00', horaSalida: '21:30' },
  { fecha: '2026-05-30', turnoNum: 1, horaEntrada: '10:30', horaSalida: '13:30' },
  { fecha: '2026-05-30', turnoNum: 2, horaEntrada: '15:00', horaSalida: '20:30' },
  // domingo 31/05: libre

  // ── Semana 01/06 – 07/06 ────────────────────────────────────────────────────
  { fecha: '2026-06-01', turnoNum: 1, horaEntrada: '10:30', horaSalida: '14:00' },
  { fecha: '2026-06-01', turnoNum: 2, horaEntrada: '17:00', horaSalida: '21:30' },
  { fecha: '2026-06-02', turnoNum: 1, horaEntrada: '10:30', horaSalida: '14:00' },
  { fecha: '2026-06-02', turnoNum: 2, horaEntrada: '17:00', horaSalida: '21:30' },
  { fecha: '2026-06-03', turnoNum: 1, horaEntrada: '16:00', horaSalida: '20:30' },
  { fecha: '2026-06-04', turnoNum: 1, horaEntrada: '17:00', horaSalida: '21:30' },
  { fecha: '2026-06-05', turnoNum: 1, horaEntrada: '16:00', horaSalida: '21:30' },
  { fecha: '2026-06-06', turnoNum: 1, horaEntrada: '12:30', horaSalida: '15:30' },
  { fecha: '2026-06-06', turnoNum: 2, horaEntrada: '17:00', horaSalida: '20:00' },
  // domingo 07/06: libre

  // ── Semana 08/06 – 14/06 ────────────────────────────────────────────────────
  { fecha: '2026-06-08', turnoNum: 1, horaEntrada: '12:00', horaSalida: '20:30' },
  { fecha: '2026-06-09', turnoNum: 1, horaEntrada: '17:00', horaSalida: '21:00' },
  { fecha: '2026-06-10', turnoNum: 1, horaEntrada: '10:30', horaSalida: '14:30' },
  { fecha: '2026-06-10', turnoNum: 2, horaEntrada: '17:00', horaSalida: '21:00' },
  // jueves 11/06: libre
  { fecha: '2026-06-12', turnoNum: 1, horaEntrada: '13:30', horaSalida: '20:00' },
  { fecha: '2026-06-13', turnoNum: 1, horaEntrada: '17:00', horaSalida: '20:30' },
  // domingo 14/06: libre
];

async function main() {
  // Buscar empleado sin distinción de mayúsculas
  const emp = await prisma.empleado.findFirst({
    where: { nombre: { equals: 'Ainhoa Vaz', mode: 'insensitive' } },
  });

  if (!emp) {
    console.error('Error: no se encontró ningún empleado con nombre "Ainhoa Vaz".');
    process.exit(1);
  }

  console.log(`Empleado encontrado: "${emp.nombre}" (id: ${emp.id})`);

  // Eliminar todos sus horarios existentes
  const { count: eliminados } = await prisma.horario.deleteMany({
    where: { empleadoId: emp.id },
  });
  console.log(`Horarios eliminados: ${eliminados}`);

  // Insertar los nuevos horarios
  const data = HORARIOS.map((h) => ({
    empleadoId:  emp.id,
    fecha:       new Date(h.fecha),
    turnoNum:    h.turnoNum,
    horaEntrada: h.horaEntrada,
    horaSalida:  h.horaSalida,
  }));

  const { count: insertados } = await prisma.horario.createMany({ data });
  console.log(`Horarios insertados: ${insertados}`);
}

main()
  .catch((e) => { console.error('Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
