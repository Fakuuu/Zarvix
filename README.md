# Zarvix

Gestor de horarios laborales mensuales con soporte multi-empleado, turnos partidos y dos modos de acceso.

## Stack tecnologico

| Capa       | Tecnologia                                   |
|------------|----------------------------------------------|
| Backend    | Node.js 20 + Express + Prisma ORM            |
| Base datos | PostgreSQL 16                                |
| Frontend   | React 18 + Vite + Tailwind CSS + PWA         |
| Deploy     | Docker + Easypanel                           |
| Dominio    | zarvix.myarkadia.es                          |

## Caracteristicas principales

- **Vista Admin** — acceso con contrasena, permite crear/editar/eliminar horarios
- **Vista Consulta** — acceso publico de solo lectura
- **Horario mensual** — navegacion por mes con calendario completo
- **Jornada partida** — hasta 2 turnos por dia (manana y tarde)
- **Turnos detallados** — hora de entrada, hora de salida y notas opcionales
- **Multi-empleado** — arquitectura preparada desde el inicio para varios empleados
- **PWA** — instalable en movil/escritorio, funciona con conectividad limitada

## Estructura del proyecto

```
Zarvix/
├── backend/           # API REST con Express y Prisma
│   ├── prisma/        # Schema y migraciones de base de datos
│   └── src/           # Codigo fuente del servidor
├── frontend/          # SPA con React y Vite
│   ├── public/        # Assets estaticos y manifest PWA
│   └── src/           # Codigo fuente del cliente
├── docker-compose.yml # Orquestacion de servicios
├── Dockerfile         # Imagen de produccion
└── .env.example       # Variables de entorno de referencia
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:

```
POSTGRES_USER=zarvix
POSTGRES_PASSWORD=tu_contrasena_segura
POSTGRES_DB=zarvix
JWT_SECRET=clave_jwt_muy_secreta
ADMIN_PASSWORD=contrasena_panel_admin
```

## Desarrollo local

```bash
# Levantar base de datos
docker compose up postgres -d

# Backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## Produccion (Easypanel)

```bash
docker compose up -d
```

La aplicacion queda disponible en `http://localhost:3000` (o el dominio configurado en Easypanel).
