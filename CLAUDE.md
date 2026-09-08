@AGENTS.md

# CLUP — contexto para Claude

Plataforma completa (no un prototipo) para el Centro de Lenguas de la Universidad Panamericana: exámenes TOEIC/TOEFL/personalizados, inscripciones con documentos, resultados, y todo el admin. Construida de cero en esta misma carpeta (antes solo había `instructions.md`, `design.md`, `logo.svg`).

**Antes de asumir que algo no existe, revisa el código** — el stack es más nuevo que el conocimiento base de cualquier modelo (ver sección de gotchas abajo) y es fácil "corregir" algo que en realidad ya está bien.

## Punto de partida

- **Arquitectura completa y decisiones de diseño**: ver `README.md` (sección "Decisiones de arquitectura relevantes") — no lo dupliques aquí, mantenlo actualizado si cambias algo estructural.
- **Plan original de implementación**: `/Users/inakisiguenza/.claude/plans/zippy-weaving-mountain.md`.
- **Postgres de desarrollo local**: contenedor Docker `clup-db` (puerto 5432, user/pass/db `clup`). Ya existe, no lo recrees — solo `docker start clup-db` si no está corriendo.
- **`.env`** ya tiene credenciales reales de Clerk, Mailgun y R2 cargadas por el usuario (no placeholders). Está gitignoreado — nunca lo imprimas completo ni lo pegues en un mensaje/commit.
- **Verificación**: siempre `npm run build` (typecheck real, `tsc --noEmit` solo falla falsos positivos con `LayoutProps`/`RouteContext` porque esos tipos los genera Next en build/dev) + `npx vitest run` + `npx eslint src/ --quiet` antes de dar algo por terminado. Cuando el cambio toca datos, verificar contra `clup-db` real con un script `tsx` desechable (ver patrón de `NODE_OPTIONS="--conditions=react-server"` abajo) — no confiar solo en el build.

## Gotchas del stack (todos con base en next 16 / prisma 7, no en la versión que "recuerdas")

- **Next.js 16**: middleware se renombró a **`proxy.ts`** (`src/proxy.ts`, no `middleware.ts`). `LayoutProps`/`PageProps`/`RouteContext` son tipos ambientales que Next genera en `.next/types` durante build/dev — si corres `tsc` a pelo sin haber hecho `next build`/`next dev` antes, va a marcar error ahí; no es un bug real.
- **Clerk v7**: `createRouteMatcher()` + `auth.protect()` en middleware está **deprecado** (Clerk lo señala explícitamente). Protección real = *resource-based* vía `requireAuth()`/`requireAdmin()` (`src/lib/auth/guards.ts`) en cada página/action/route — `proxy.ts` solo habilita el contexto de Clerk, ya no decide nada.
- **Prisma 7**: requiere **driver adapter explícito**, `new PrismaClient()` sin adapter truena en runtime. Ver `src/lib/db/prisma.ts` (usa `@prisma/adapter-pg`). Además usa `prisma7.config.ts` (no `prisma.config.ts`) para schema/migraciones/seed — el CLI lo detecta solo. El dist-tag `latest` de `prisma` a veces apunta a un RC (8.0.0-rc.x); el proyecto está fijado a `7.10.0` a propósito, no lo actualices sin confirmar con el usuario.
- **Orden de migraciones**: Prisma las aplica en **orden alfabético del nombre de carpeta**, no por el timestamp que llevan dentro del nombre. Si creas/renombras una migración cuidando que el timestamp quede *después* del `_init`, o si editas una migración ya aplicada localmente, actualiza también la fila en `_prisma_migrations` (el checksum es por contenido del `.sql`, no por nombre). Siempre valida el orden real con `migrate deploy` contra una DB desechable (`docker exec clup-db psql -U clup -d postgres -c "CREATE DATABASE clup_migtest"` + `DATABASE_URL=...clup_migtest npx prisma migrate deploy`) antes de dar por buena una migración que vaya a prod.
- **Prod = Dokploy** en el server `ssh ioslab`. Deploy = `git push` + botón Deploy (Dokploy re-clona el repo y reconstruye). El `entrypoint.sh` corre `prisma migrate deploy` al arrancar — por eso el seed del catálogo va **dentro** de la migración (data migration), no en `seed.ts` (que además crea data demo que no queremos en prod). Si una migración falla a medias, el contenedor `app` entra en restart loop (P3009); se sale con `docker compose run --rm --entrypoint "" app npx prisma migrate resolve --rolled-back "<migración>"`.
- **Cloudflare R2**: NO soporta presigned POST (`createPresignedPost` → 501 `NotImplemented`). El upload de documentos usa **presigned PUT** (`PutObjectCommand` + `getSignedUrl`) — ver `src/lib/storage/r2-storage-adapter.ts`. También necesita `forcePathStyle: true` en el `S3Client` o las URLs firmadas devuelven 403. Si algo de subida de archivos deja de funcionar, revisa esto primero, no asumas que es CORS (el error de CORS en consola puede ser solo un síntoma de que R2 respondió sin headers por el 501/403).
- **Tailwind v4**: CSS-first, sin `tailwind.config.js`. La paleta wine/gold vive en `src/app/globals.css` dentro de `@theme inline`.
- **`cn()` (`src/lib/utils.ts`) es concatenación simple, no tailwind-merge** — no le pases className con utilidades que choquen con las clases base del componente (ej. `w-auto` contra un `Select` que ya trae `w-full`), el que gane depende del orden de generación de Tailwind y no es confiable. Envuelve en un `<div>` con ancho propio en su lugar.
- Para correr un script `tsx` suelto contra la DB real (fuera de Next/Vitest) hace falta `NODE_OPTIONS="--conditions=react-server"` (por los `import "server-only"`) y `import "dotenv/config"` al inicio del script (los env vars no se auto-cargan fuera de Next/Prisma CLI).

## Decisiones de producto que ya se tomaron (no las re-abras sin que el usuario lo pida)

- **Puntaje mínimo jerárquico**: `Exam.passingScore` es el default general; `ExamPassingScore` lo sobreescribe por facultad o por carrera (`CHECK num_nonnulls(facultyId, careerId) = 1`). Al calificar se resuelve carrera exacta → facultad de esa carrera → default (`resolvePassingScore` / `buildPassingScoreContext` en `src/services/result-service.ts`). No hay `ExamDate.passingScore`. Los overrides se editan en el modal de `/admin/examenes` como borrador local y se guardan **atómicos con el examen** (`createExam`/`updateExam` reciben `overrides[]` y hacen replace-all en transacción — no hay actions sueltas de upsert/delete de override). Se pueden definir al crear, no solo al editar. Los exámenes se pueden borrar (bloqueado si tienen fechas; overrides en cascada).
- **Catálogo `Faculty`/`Career`**: se edita en **Settings › Catalog** (tab dentro de `/admin/configuracion`, no hay ruta `/admin/catalogo`). Fuente única `src/lib/catalog-data.ts`; se siembra en la migración `*_catalog_and_onboarding` (data migration, SQL generado con `scripts/gen-catalog-sql.ts`). Nombres oficiales en MAYÚSCULAS, variantes de plan colapsadas. `Faculty.isExternal` = bucket "DOCENTE / EXTERNO" (sin carreras, usa el default del examen).
- **Onboarding obligatorio** (`Profile.onboardedAt`): primer login → `/onboarding` (ruta fuera del esquema de locale, como `/admin` — está en `LOCALE_EXCLUDED_PREFIXES` de `src/proxy.ts`), captura matrícula + facultad→carrera en cascada. Gate = `requireOnboarding()` (`src/lib/auth/guards.ts`) en el layout de alumno, el layout público y las actions de inscripción. La matrícula se autodetecta del correo si es `NNNN@up.edu.mx` (`src/lib/student-id.ts`); un correo no-numérico (profe) la captura a mano. El form de inscripción ya **no** pide matrícula ni carrera — las muestra solo lectura. El alumno cambia su carrera después en **`/perfil`** (link "Perfil" en el dropdown de la cuenta); la matrícula sigue siendo solo-admin.
- **`ExamType` incluye `CUSTOM`** — al elegirlo se pide un nombre libre (ej. "IELTS"). `examTypeLabel()` (`src/lib/exam-type.ts`) siempre usa el nombre del examen para `CUSTOM`, nunca la palabra "CUSTOM".
- **No hay página `/admin/fechas` (lista plana)**. Las fechas de examen viven **dentro de Terms**: `/admin/terms` es una sola página con tabs (uno por term, sin fondo blanco) — click en un tab muestra info+acciones del term y, debajo, sus fechas. `/admin/fechas/nueva` y `/admin/fechas/[id]` siguen existiendo como los forms de crear/editar, pero solo se llega a ellos desde ahí, y regresan a `/admin/terms?termId=...` (mismo tab seleccionado).
- **Estado de inscripción "APPROVED" se muestra como "Inscrito"** en toda la UI (no "Aprobado" — eso es el resultado del examen, otra cosa).
- **Correo de resultado publicado NO incluye puntaje ni si aprobó** (por privacidad) — solo avisa que ya está disponible y a revisar el dashboard.
- **Sin emojis** en correos ni en la UI — instrucción explícita del usuario, no los reintroduzcas.
- Separador visual estándar en toda la app: **`•`**, no `—` (el em-dash sigue bien en comentarios de código y flechas tipográficas `→`, eso no se tocó).
- Diseño **sin sombras** (`shadow-*`) en cards de contenido — bordes planos (`border-gray-200`, `rounded-lg`), como la referencia que dio el usuario. Los modales/dropdowns flotantes sí llevan sombra (eso es correcto, son overlays).
- Acciones de tabla = **iconos** (`IconButton`, `src/components/ui/IconButton.tsx`) con `ConfirmDialog` para las destructivas, no texto tipo "Editar" / "Eliminar".
- Filas de tabla con detalle son clickeables (`ClickableRow` + `StopClick` para las celdas de acciones, `src/components/ui/ClickableRow.tsx`).

## Estado actual

Plan original + varias rondas de UX completos y verificados. Encima de eso:

1. **Fix de orden de migraciones** (`20260904000000_move_passingscore…` renombrada para caer después del `_init`) — prod había entrado en restart loop por esto; ya recuperado.
2. **Favicon** = bloque vino "Panamericana" del `logo.svg` (`src/app/icon.svg` + `apple-icon.png` + `favicon.ico`).
3. **Puntaje jerárquico + catálogo + onboarding + `/perfil`** (ver "Decisiones de producto" arriba). Migración `20260907163636_catalog_and_onboarding`.
4. Borrar exámenes, rediseño del modal de examen, catálogo movido a Settings.

Commits `513f004` + `73f437f` en `main` **sin pushear** a la fecha de la última sesión — el usuario hace `git push` + Deploy en Dokploy. Plan de esta fase: `/Users/inakisiguenza/.claude/plans/parallel-spinning-valiant.md`.

Lo único que requiere al usuario (no a Claude): probar login/onboarding/inscripción real en el navegador con sesión de Clerk. Ojo: cualquier alumno ya logueado en prod será mandado a `/onboarding` en su próxima visita hasta capturar matrícula + carrera (comportamiento buscado).
