import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const empleado = await prisma.empleado.create({
      data: { nombre: nombre.trim() },
    });
    res.status(201).json(empleado);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

export default router;
