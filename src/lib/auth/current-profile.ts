import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { Role, type Profile } from "@/generated/prisma/client";

function resolveInitialRole(email: string): Role {
  const initialAdmins = (process.env.INITIAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return initialAdmins.includes(email.toLowerCase()) ? Role.ADMIN : Role.STUDENT;
}

interface ClerkUserData {
  clerkUserId: string;
  email: string;
  name: string;
}

/**
 * Upsert compartido por el lazy-upsert de getCurrentProfile() y por el
 * webhook de Clerk (sincronización eager, ver app/api/webhooks/clerk).
 *
 * Resuelve por clerkUserId primero; si no existe, busca por email — esto
 * enlaza automáticamente a un admin "pre-invitado" (creado desde
 * /admin/administradores antes de su primer login) sin pisar el rol que ya
 * se le asignó.
 */
export async function upsertProfileFromClerkUser({ clerkUserId, email, name }: ClerkUserData) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingByClerkId = await prisma.profile.findUnique({ where: { clerkUserId } });
  if (existingByClerkId) {
    return prisma.profile.update({
      where: { id: existingByClerkId.id },
      data: { name, email: normalizedEmail },
    });
  }

  const existingByEmail = await prisma.profile.findUnique({ where: { email: normalizedEmail } });
  if (existingByEmail) {
    return prisma.profile.update({
      where: { id: existingByEmail.id },
      data: { clerkUserId, name },
    });
  }

  return prisma.profile.create({
    data: { clerkUserId, email: normalizedEmail, name, role: resolveInitialRole(normalizedEmail) },
  });
}

/**
 * Devuelve el Profile del usuario autenticado, creándolo (find-or-create) a
 * partir de los datos de Clerk la primera vez que se le ve. Nombre y email
 * siempre vienen de Clerk — el usuario nunca los teclea a mano.
 *
 * Este lazy-upsert es la fuente de verdad; el webhook de Clerk (Fase 4) es
 * solo una optimización de sincronización temprana, no una dependencia dura.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await currentUser();
  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  const name = user.fullName?.trim() || email;

  return upsertProfileFromClerkUser({ clerkUserId: user.id, email, name });
}
