import type { ExamType } from "@/generated/prisma/client";

/**
 * Etiqueta a mostrar para el tipo de examen. Para CUSTOM se usa el nombre del
 * examen (ej. "IELTS"), ya que "CUSTOM" no significa nada para el usuario.
 * `fallback` cubre el caso (raro) de CUSTOM sin nombre — el caller lo resuelve
 * en el idioma correcto (admin usa el default en inglés; público/alumno pasa
 * la traducción de su namespace).
 */
export function examTypeLabel(type: ExamType, name?: string, fallback = "Exam"): string {
  if (type === "CUSTOM") return name ?? fallback;
  return type;
}
