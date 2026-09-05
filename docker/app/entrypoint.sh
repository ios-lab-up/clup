#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Iniciando Next.js..."
exec npm run start
