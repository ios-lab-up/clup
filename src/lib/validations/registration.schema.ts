import { z } from "zod";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/constants";
import { documentTypeSchema } from "@/lib/validations/document.schema";

interface SubmitRegistrationMessages {
  studentIdMinLength: string;
  studentIdMaxLength: string;
  studentIdInvalidChars: string;
  selectExamDate: string;
  mustUploadAllDocuments: string;
}

export function buildStudentIdSchema(messages: Pick<SubmitRegistrationMessages, "studentIdMinLength" | "studentIdMaxLength" | "studentIdInvalidChars">) {
  return z
    .string()
    .trim()
    .min(4, { error: messages.studentIdMinLength })
    .max(20, { error: messages.studentIdMaxLength })
    .regex(/^[A-Za-z0-9-]+$/, { error: messages.studentIdInvalidChars });
}

export const uploadedDocumentSchema = z.object({
  type: documentTypeSchema,
  storageKey: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

// Función en vez de constante: los mensajes vienen de getTranslations("Validation")
// resuelto en el punto de uso (Server Action del lado alumno).
export function buildSubmitRegistrationSchema(messages: SubmitRegistrationMessages) {
  return z.object({
    examDateId: z.string().min(1, { error: messages.selectExamDate }),
    studentId: buildStudentIdSchema(messages),
    documents: z
      .array(uploadedDocumentSchema)
      .refine(
        (documents) =>
          REQUIRED_DOCUMENT_TYPES.every((type) => documents.some((doc) => doc.type === type)),
        { error: messages.mustUploadAllDocuments },
      ),
  });
}

export type SubmitRegistrationInput = z.infer<ReturnType<typeof buildSubmitRegistrationSchema>>;

export const rejectRegistrationSchema = z.object({
  registrationId: z.string().min(1),
  reason: z.string().trim().max(500).nullish(),
});

export const captureResultSchema = z.object({
  registrationId: z.string().min(1),
  score: z.coerce.number().int().min(0, { error: "Score can't be negative." }),
});
