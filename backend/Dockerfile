FROM node:20-slim

WORKDIR /app

# OpenSSL requerido por Prisma en Debian/slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ── Backend ──────────────────────────────────────────────────────────────────
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/prisma ./backend/prisma
RUN cd backend && npx prisma generate

COPY backend/src ./backend/src

# ── Frontend (build) ─────────────────────────────────────────────────────────
# Resultado queda en /app/frontend/dist, accesible como ../../frontend/dist
# desde /app/backend/src/index.js
COPY frontend ./frontend
RUN cd frontend && npm install && npm run build

EXPOSE 3000

CMD ["sh", "-c", "cd /app/backend && npx prisma migrate deploy && node src/index.js"]
