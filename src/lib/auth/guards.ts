import "server-only";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import type { Profile } from "@/generated/prisma/client";

/**
 * Exige una sesión válida. Redirige a /sign-in si no la hay.
 * Punto único reusado en páginas, Server Actions y Route Handlers.
 */
export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  return profile;
}

/**
 * Exige rol ADMIN. Un usuario autenticado pero no-admin recibe 404 (no 403)
 * para no confirmar la existencia de la ruta a quien no debería verla.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== "ADMIN") notFound();
  return profile;
}

/**
 * Exige que el alumno haya completado la encuesta inicial obligatoria
 * (matrícula + carrera). Mientras `onboardedAt` sea null lo regresa a
 * `/onboarding`. Los admins no pasan por aquí. Se usa en el layout del área
 * de alumno y en las Server Actions de inscripción.
 */
export async function requireOnboarding(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role === "STUDENT" && !profile.onboardedAt) redirect("/onboarding");
  return profile;
}

interface DocumentOwnerCheck {
  registration: { profileId: string };
}

/**
 * Un alumno solo puede ver sus propios documentos; un admin puede ver todos.
 */
export function canAccessDocument(
  profile: Pick<Profile, "id" | "role">,
  document: DocumentOwnerCheck,
): boolean {
  return profile.role === "ADMIN" || profile.id === document.registration.profileId;
}
