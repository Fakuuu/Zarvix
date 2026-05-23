import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  // ADMIN_PASSWORD puede estar en texto plano o como hash bcrypt
  let valid = false;
  if (adminPassword.startsWith('$2')) {
    valid = await bcrypt.compare(password, adminPassword);
  } else {
    valid = password === adminPassword;
  }

  if (!valid) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = jwt.sign({ admin: true }, jwtSecret, { expiresIn: '24h' });
  return res.json({ token });
});

export default router;
