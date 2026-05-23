FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de producción (prisma incluido para migraciones en runtime)
COPY package*.json ./
RUN npm ci --omit=dev

# Generar el cliente Prisma (requiere el schema, no la BD)
COPY prisma ./prisma
RUN npx prisma generate

# Copiar código fuente
COPY src ./src

EXPOSE 3000

# Ejecutar migraciones + seed + servidor al arrancar el contenedor
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
