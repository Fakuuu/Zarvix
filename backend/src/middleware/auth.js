import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    req.admin = true;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
