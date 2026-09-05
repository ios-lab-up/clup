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
- **Cloudflare R2**: NO soporta presigned POST (`createPresignedPost` → 501 `NotImplemented`). El upload de documentos usa **presigned PUT** (`PutObjectCommand` + `getSignedUrl`) — ver `src/lib/storage/r2-storage-adapter.ts`. También necesita `forcePathStyle: true` en el `S3Client` o las URLs firmadas devuelven 403. Si algo de subida de archivos deja de funcionar, revisa esto primero, no asumas que es CORS (el error de CORS en consola puede ser solo un síntoma de que R2 respondió sin headers por el 501/403).
- **Tailwind v4**: CSS-first, sin `tailwind.config.js`. La paleta wine/gold vive en `src/app/globals.css` dentro de `@theme inline`.
- **`cn()` (`src/lib/utils.ts`) es concatenación simple, no tailwind-merge** — no le pases className con utilidades que choquen con las clases base del componente (ej. `w-auto` contra un `Select` que ya trae `w-full`), el que gane depende del orden de generación de Tailwind y no es confiable. Envuelve en un `<div>` con ancho propio en su lugar.
- Para correr un script `tsx` suelto contra la DB real (fuera de Next/Vitest) hace falta `NODE_OPTIONS="--conditions=react-server"` (por los `import "server-only"`) y `import "dotenv/config"` al inicio del script (los env vars no se auto-cargan fuera de Next/Prisma CLI).

## Decisiones de producto que ya se tomaron (no las re-abras sin que el usuario lo pida)

- **`Exam.passingScore`**, no en `ExamDate` — el mismo examen puede repetirse en varias fechas con el mismo passing score; se define al crear/editar el examen.
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

Todas las fases del plan original están completas y verificadas (build/lint/tests en verde, flujos probados contra `clup-db` real). Después se hicieron varias rondas de ajustes de UX/diseño a pedido del usuario (ver historial de conversación si necesitas el detalle de *por qué* algo quedó como quedó). Lo único que requiere al usuario, no a Claude, es probar el flujo de login/inscripción real en el navegador con sesión de Clerk real — eso no se puede automatizar desde aquí.
