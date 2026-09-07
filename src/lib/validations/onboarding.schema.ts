import { z } from "zod";
import { buildStudentIdSchema } from "@/lib/validations/registration.schema";

interface OnboardingMessages {
  studentIdMinLength: string;
  studentIdMaxLength: string;
  studentIdInvalidChars: string;
  selectFaculty: string;
  selectCareer: string;
}

// Función (no constante): los mensajes vienen de getTranslations("Onboarding")
// resueltos en el punto de uso (Server Action del lado alumno).
export function buildOnboardingSchema(messages: OnboardingMessages) {
  return z.object({
    studentId: buildStudentIdSchema(messages),
    facultyId: z.string().min(1, { error: messages.selectFaculty }),
    // Se valida contra la facultad (obligatoria salvo facultad externa) en la action.
    careerId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
  });
}

export type OnboardingInput = z.infer<ReturnType<typeof buildOnboardingSchema>>;
