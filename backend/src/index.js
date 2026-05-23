import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import empleadosRouter from './routes/empleados.js';
import horariosRouter from './routes/horarios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/empleados', empleadosRouter);
app.use('/api/horarios', horariosRouter);

// Servir el frontend compilado (ruta relativa al contenedor: /app/frontend/dist)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
