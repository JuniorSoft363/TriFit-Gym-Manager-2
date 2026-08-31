# Etapa 1: instalar dependencias y generar el cliente de Prisma
FROM node:20-alpine AS deps
# OpenSSL es requerido por Prisma en alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

# Etapa 2: imagen final de runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production

# Dependencias de producción + Prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/

# Generar cliente de Prisma en runtime
RUN npx prisma generate

# Puerto por defecto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Script de inicio: aplica el schema y arranca el server
CMD sh -c "npx prisma db push --skip-generate --accept-data-loss && node src/server.js"
