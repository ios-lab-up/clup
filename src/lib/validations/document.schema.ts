import { z } from "zod";
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_SIZE_BYTES,
  REQUIRED_DOCUMENT_TYPES,
} from "@/lib/constants";

export const documentTypeSchema = z.enum(REQUIRED_DOCUMENT_TYPES);

interface UploadPolicyMessages {
  invalidFileType: string;
  fileTooLarge: string;
}

// Función en vez de constante: los mensajes de error se resuelven en el
// punto de uso vía getTranslations("DocumentUpload") (namespace compartido
// con el mensaje de error que ve el usuario en el cliente).
export function buildUploadPolicyRequestSchema(messages: UploadPolicyMessages) {
  return z.object({
    examDateId: z.string().min(1),
    documentType: documentTypeSchema,
    mimeType: z.enum(DOCUMENT_ALLOWED_MIME_TYPES, {
      error: messages.invalidFileType,
    }),
    size: z
      .number()
      .int()
      .positive()
      .max(DOCUMENT_MAX_SIZE_BYTES, { error: messages.fileTooLarge }),
  });
}

export type UploadPolicyRequest = z.infer<ReturnType<typeof buildUploadPolicyRequestSchema>>;
