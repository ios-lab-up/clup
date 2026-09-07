import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Solo habilita el contexto de auth de Clerk para que auth()/currentUser()
// funcionen en el resto de la app. La protección real es resource-based:
// requireAuth()/requireAdmin() (lib/auth/guards.ts) en cada página/Server
// Action/Route Handler — createRouteMatcher()+auth.protect() está deprecado
// por Clerk precisamente porque el path-matching puede divergir del
// enrutamiento real de Next.js y dejar recursos protegidos alcanzables.
const intlMiddleware = createIntlMiddleware(routing);

// admin/sign-in/api quedan fuera del esquema de locale a propósito (ver plan
// de i18n): admin es fijo en inglés sin selector, sign-in y api no deben
// llevar prefijo de idioma. /health NO está en esta lista porque ni siquiera
// llega a este middleware — está excluido directamente en `config.matcher`
// de abajo, para que el healthcheck de Docker/Dokploy nunca dependa de que
// Clerk esté bien configurado (una env var de Clerk mala en el host no debe
// poder tumbar el healthcheck).
const LOCALE_EXCLUDED_PREFIXES = ["/admin", "/sign-in", "/onboarding", "/api", "/trpc"];

export default clerkMiddleware((_auth, req) => {
  const { pathname } = req.nextUrl;
  const isExcluded = LOCALE_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isExcluded) return;

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next|health(?:/|$)|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
