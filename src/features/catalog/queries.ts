import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Facultades activas con sus carreras activas, ordenadas. Data de catálogo
 * (no sensible) — la usan el onboarding del alumno y el editor de puntajes
 * por facultad/carrera del admin.
 */
export async function listActiveFacultiesWithCareers() {
  return prisma.faculty.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      careers: { where: { active: true }, orderBy: { order: "asc" } },
    },
  });
}
