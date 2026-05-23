import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/:empleadoId/:anyo/:mes', async (req, res) => {
  const empleadoId = parseInt(req.params.empleadoId);
  const anyo = parseInt(req.params.anyo);
  const mes = parseInt(req.params.mes);

  if (isNaN(empleadoId) || isNaN(anyo) || isNaN(mes) || mes < 1 || mes > 12) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const primerDia = new Date(anyo, mes - 1, 1);
  const ultimoDia = new Date(anyo, mes, 0);

  try {
    const horarios = await prisma.horario.findMany({
      where: {
        empleadoId,
        fecha: { gte: primerDia, lte: ultimoDia },
      },
      orderBy: [{ fecha: 'asc' }, { turnoNum: 'asc' }],
    });
    res.json(horarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { empleadoId, fecha, turnoNum, horaEntrada, horaSalida, notas } = req.body;

  if (!empleadoId || !fecha || !turnoNum || !horaEntrada || !horaSalida) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  if (turnoNum !== 1 && turnoNum !== 2) {
    return res.status(400).json({ error: 'turnoNum debe ser 1 o 2' });
  }

  try {
    const horario = await prisma.horario.upsert({
      where: {
        empleadoId_fecha_turnoNum: {
          empleadoId,
          fecha: new Date(fecha),
          turnoNum,
        },
      },
      update: { horaEntrada, horaSalida, notas: notas ?? null },
      create: {
        empleadoId,
        fecha: new Date(fecha),
        turnoNum,
        horaEntrada,
        horaSalida,
        notas: notas ?? null,
      },
    });
    res.status(201).json(horario);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar horario' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    await prisma.horario.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    // P2025: registro no encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    res.status(500).json({ error: 'Error al eliminar horario' });
  }
});

export default router;
