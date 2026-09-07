# CLUP — Centro de Lenguas Universidad Panamericana

Plataforma web para gestionar la publicación de exámenes TOEIC/TOEFL, inscripciones de alumnos, revisión de documentos, captura y publicación de resultados, y toda la administración asociada (FAQs, instrucciones, configuración, administradores).

## Stack

- **Next.js 16** (App Router) + **TypeScript** estricto
- **PostgreSQL** + **Prisma 7** (driver adapter `@prisma/adapter-pg`)
- **Clerk** para autenticación (login con Google)
- **Mailgun** para correo transaccional (con fallback a consola en desarrollo)
- **Cloudflare R2** (S3-compatible) para almacenamiento de documentos
- **Tailwind CSS v4** (config CSS-first, sin `tailwind.config.js`)
- **Vitest** para pruebas unitarias
- **Docker Compose** para despliegue (Postgres + app + worker de cron)

Backend íntegramente dentro de Next.js vía Server Actions y Route Handlers — no hay un backend separado.

## Arquitectura

```
prisma/
  schema.prisma        Modelo de datos completo
  migrations/
  seed.ts               Datos de ejemplo (term, exámenes, fechas, FAQs, instrucciones)
prisma7.config.ts        Config de Prisma 7 (schema, migraciones, comando de seed)

src/
  proxy.ts               Middleware de Next.js 16 — solo habilita el contexto de Clerk
  app/
    (public)/            Landing, exámenes, FAQs, instrucciones — sin login
    sign-in/              Login con Clerk (Google)
    (student)/            Dashboard, inscripción, detalle de examen — requiere sesión
    admin/                Dashboard administrativo — requiere rol ADMIN
    api/
      webhooks/clerk/     Sincronización eager de Profile (opcional)
      documents/[id]/     Descarga de documentos con autorización por request
      cron/reminders/     Endpoint idempotente para el recordatorio de examen
      admin/*/export/     Exportación CSV
  components/
    ui/                   Primitivos del design system (Button, Card, Badge, Table, ...)
    layout/               Header, Footer, AdminNav
    exams/                Badges de estado de examen/inscripción
    forms/                Formulario de inscripción + subida de documentos
    admin/                Managers de cada sección del dashboard admin
  lib/
    auth/                 getCurrentProfile(), requireAuth(), requireAdmin(), canAccessDocument()
    db/                   Cliente Prisma (singleton)
    mail/                 Cliente Mailgun + sendMail() + templates
    storage/               Adapter de storage (interfaz + implementación R2)
    validations/          Schemas Zod
    exam-date-status.ts   Estado (UPCOMING/OPEN/CLOSED) derivado, nunca persistido
    errors.ts, audit.ts, csv.ts, constants.ts
  services/               Lógica de negocio pura, DB inyectada (unit-testable sin Postgres real)
  features/                Server Actions + queries por dominio, envuelven los services
  types/

docker/
  app/entrypoint.sh        prisma migrate deploy && next start
  cron/                    Contenedor Alpine + crond, dispara el recordatorio cada hora
tests/unit/                 Suites Vitest (services + lib)
```

## Decisiones de arquitectura relevantes

- **Puntaje mínimo jerárquico**: `Exam.passingScore` es el default general. `ExamPassingScore` lo sobreescribe por **facultad** o por **carrera** (`CHECK num_nonnulls(facultyId, careerId) = 1`). Al calificar, `resolvePassingScore()` (`services/result-service.ts`) elige: carrera exacta → facultad de esa carrera → default. El import CSV de resultados es por fecha de examen y resuelve el mínimo por alumno según su carrera.
- **Catálogo `Faculty` / `Career`**: lista institucional editable en Settings › Catalog. Se siembra en la migración `*_catalog_and_onboarding` (data migration, generada desde `src/lib/catalog-data.ts` con `scripts/gen-catalog-sql.ts`) para que prod la tenga sin pasos manuales; después la DB es la fuente de verdad. `Faculty.isExternal` es el bucket "Docente / Externo" (sin carreras, usa el default del examen).
- **Onboarding obligatorio** (`Profile.onboardedAt`): en el primer login el alumno cae en `/onboarding` (ruta fuera del esquema de locale, como `/admin`) y no avanza a ningún lado hasta capturar matrícula + carrera. Gate = `requireOnboarding()` en el layout de alumno, el layout público y las Server Actions de inscripción. La matrícula se autodetecta del correo si es `NNNN@up.edu.mx` (`lib/student-id.ts`); un profe con correo no-numérico la captura a mano.
- **`Profile.studentId`** (matrícula) y **`Profile.careerId`**: se capturan una sola vez en el onboarding; en inscripciones posteriores solo se muestran. Un admin las corrige.
- **`Profile.clerkUserId` es nullable**: permite "pre-invitar" administradores por email desde `/admin/administradores` antes de su primer login. Al iniciar sesión por primera vez, `lib/auth/current-profile.ts` enlaza automáticamente ese Profile por email, sin pisar el rol ya asignado.
- **Estado de `ExamDate` (`UPCOMING`/`OPEN`/`CLOSED`) nunca se persiste**: se deriva comparando `now()` contra las fechas de inscripción (`lib/exam-date-status.ts`). Evita drift y jobs de sincronización.
- **`registrationStartDate < registrationEndDate < examDate`** se valida en Zod (mensaje amigable) **y** con un `CHECK` constraint a nivel de Postgres (última línea de defensa aunque un bug se salte la capa de servicio).
- **Roles**: `Profile.role` en Postgres es la única fuente de verdad — Clerk solo aporta identidad. El middleware (`src/proxy.ts`) únicamente habilita el contexto de Clerk; la protección real es *resource-based* vía `requireAuth()`/`requireAdmin()` en cada página, Server Action y Route Handler (siguiendo la recomendación actual de Clerk, que deprecó la protección basada en `createRouteMatcher`).
- **Subida de documentos**: presigned POST a R2 (no PUT) — R2 valida `content-length-range` y `Content-Type` exacto en el momento de la subida. El servidor nunca recibe los bytes. Al enviar el formulario de inscripción, el servidor hace `HeadObject` contra R2 para confirmar tamaño/MIME reales antes de crear la inscripción.
- **Visualización de documentos**: `GET /api/documents/[id]` verifica autorización en cada solicitud y solo entonces genera una URL presignada de 60s (redirect 307). Acceso denegado devuelve 404, no 403, para no confirmar la existencia del recurso a quien no debería verlo.
- **Emails**: `sendMail()` nunca lanza — un fallo de Mailgun no debe tumbar la operación principal (ej. aprobar una inscripción). Sin `MAILGUN_API_KEY`, cae a un provider de consola.
- **Recordatorio de examen**: idempotente vía `ReminderLog` con constraint único `(examDateId, registrationId)`. El cron corre cada hora (no una vez al día) para tolerar reinicios/drift sin perder la ventana — es seguro porque el endpoint es idempotente.
- **Importación CSV de resultados**: dos pasos — `previewResultsImport` (no escribe nada, clasifica cada fila en `ok`/`overwrite`/`error`) y `commitResultsImport` (solo tras confirmación explícita del admin, con checkbox obligatorio si hay sobrescrituras). Deja `published: false` — no auto-publica ni auto-envía correo; se reusa la acción individual "Publicar resultado" para eso.

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y complétalo:

```bash
cp .env.example .env
```

### PostgreSQL

Para desarrollo local sin Docker, levanta un Postgres cualquiera y apunta `DATABASE_URL` a él, por ejemplo:

```bash
docker run -d --name clup-db -e POSTGRES_USER=clup -e POSTGRES_PASSWORD=clup -e POSTGRES_DB=clup -p 5432:5432 postgres:16-alpine
```

```
DATABASE_URL="postgresql://clup:clup@localhost:5432/clup?schema=public"
```

### Clerk

1. Crea una aplicación en [dashboard.clerk.com](https://dashboard.clerk.com).
2. En **User & Authentication → Social Connections**, habilita **Google** (y desactiva los demás métodos si quieres login exclusivamente por Google).
3. Copia `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `Secret key` → `CLERK_SECRET_KEY`.
4. (Opcional) En **Webhooks**, crea un endpoint apuntando a `https://tu-dominio/api/webhooks/clerk` suscrito a `user.created` y `user.updated`, y copia el signing secret a `CLERK_WEBHOOK_SIGNING_SECRET`. No es obligatorio: sin esto, el perfil se sincroniza igual (lazy) en cada login.
5. Define `INITIAL_ADMIN_EMAILS` con el/los correos que deben recibir el rol `ADMIN` automáticamente en su primer login. Después de eso, la gestión de administradores se hace desde `/admin/administradores`.

### Mailgun

1. Crea una cuenta y un dominio verificado en [mailgun.com](https://mailgun.com).
2. Copia el API key a `MAILGUN_API_KEY`, el dominio a `MAILGUN_DOMAIN`, y define un remitente en `MAILGUN_FROM`.
3. Si dejas estas variables vacías, los correos se imprimen en la consola del servidor — útil para desarrollo local sin cuenta real.

### Cloudflare R2

1. Crea un bucket **privado** en el dashboard de Cloudflare (R2).
2. Crea un API token con permisos de lectura/escritura sobre ese bucket.
3. Completa `R2_ENDPOINT` (`https://<account_id>.r2.cloudflarestorage.com`), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

## Migraciones y seed

```bash
npm run db:migrate        # crea/aplica migraciones en desarrollo
npm run db:seed           # carga datos de ejemplo (term, TOEIC/TOEFL, fechas, FAQs, instrucciones)
npm run db:studio         # explorador visual de la base de datos
```

En producción/CI, las migraciones se aplican con `prisma migrate deploy` (ya integrado en el entrypoint del contenedor `app`, ver más abajo).

## Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test          # corre toda la suite una vez
npm run test:watch
```

Cobertura mínima incluida: validación de ventana de inscripción, inscripción duplicada, cálculo aprobado/no aprobado, autorización de admin, autorización de acceso a documentos, importación CSV (fila válida, header inválido, alumno no encontrado, inscripción fuera de scope, sobrescritura), exportación CSV (filtros, columnas, escape), y recordatorio de examen (elegibilidad, idempotencia).

## Build

```bash
npm run build
npm run start
```

## Deployment (Docker Compose)

El stack completo (Postgres + app + worker de cron) se levanta con:

```bash
docker compose up -d --build
```

Servicios:

- **`db`**: Postgres 16, con healthcheck y volumen persistente `pgdata`.
- **`app`**: build multi-stage de Next.js. Al arrancar corre `prisma migrate deploy` y luego `next start` (ver `docker/app/entrypoint.sh`).
- **`cron`**: contenedor Alpine minimal con `crond`, dispara `POST /api/cron/reminders` cada hora contra `http://app:3000`, protegido con el header `x-cron-secret` (`CRON_SECRET`).

`docker-compose.yml` lee las variables de `.env` — asegúrate de que `DATABASE_URL` apunte al hostname del servicio (`db`), no a `localhost`:

```
DATABASE_URL="postgresql://clup:clup@db:5432/clup?schema=public"
```

Para sembrar datos de ejemplo en el contenedor ya corriendo:

```bash
docker compose exec app npx prisma db seed
```

## Cron de recordatorios

`POST /api/cron/reminders` busca inscripciones **aprobadas** cuyo examen sea exactamente mañana, envía el correo de recordatorio, y registra el envío en `ReminderLog` (único por `examDateId`+`registrationId`) — llamarlo de más nunca duplica envíos. Requiere el header `x-cron-secret` con el valor de `CRON_SECRET`.

Fuera de Docker Compose (por ejemplo un scheduler administrado), cualquier sistema capaz de hacer un `POST` HTTP con ese header sirve — no depende de la implementación del contenedor `cron`.

## Almacenamiento de documentos

Los 4 documentos requeridos por inscripción (comprobante de pago, credencial, INE frente/vuelta) se suben directamente del navegador a Cloudflare R2 vía POST presignado — el servidor de Next.js nunca recibe los bytes del archivo. Postgres solo guarda la referencia (`storageKey`, `mimeType`, `size`). El adapter de storage (`src/lib/storage/`) está detrás de una interfaz — cambiar de proveedor (S3, Backblaze B2, etc.) implica escribir un nuevo adapter, no tocar el resto de la app.
