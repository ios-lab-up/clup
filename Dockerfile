# syntax=docker/dockerfile:1

# --- deps: instala dependencias (capa cacheable mientras no cambie package*.json) ---
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: el postinstall (`prisma generate`) necesita prisma/schema.prisma,
# que todavía no existe en esta capa — se genera explícitamente en el stage builder.
RUN npm ci --ignore-scripts

# --- builder: genera el cliente de Prisma y compila Next.js ---
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runner: imagen final ---
# Se parte de la etapa builder completa (no del output "standalone" recortado)
# para conservar el Prisma CLI disponible y poder correr
# `prisma migrate deploy` al arrancar el contenedor — un solo artefacto,
# sin necesitar una imagen/paso de migración separado.
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
ENTRYPOINT ["docker/app/entrypoint.sh"]
