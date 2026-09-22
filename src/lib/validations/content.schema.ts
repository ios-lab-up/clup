import { z } from "zod";
import { IMAGE_ALLOWED_MIME_TYPES, IMAGE_MAX_SIZE_BYTES } from "@/lib/constants";

const contentImageKeySchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const faqSchema = z.object({
  question: z.string().trim().min(1, { error: "La pregunta es requerida." }),
  answer: z.string().trim().min(1, { error: "La respuesta es requerida." }),
  imageKey: contentImageKeySchema,
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
});

export const instructionSchema = z.object({
  title: z.string().trim().min(1, { error: "El título es requerido." }),
  body: z.string().trim().min(1, { error: "El contenido es requerido." }),
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, { error: "El título es requerido." }),
  body: z.string().trim().min(1, { error: "El contenido es requerido." }),
  imageKey: contentImageKeySchema,
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
});

export const contentImageUploadPolicySchema = z.object({
  kind: z.enum(["announcement", "faq"]),
  mimeType: z.enum(IMAGE_ALLOWED_MIME_TYPES, { error: "Tipo de archivo no permitido." }),
  size: z
    .number()
    .int()
    .positive()
    .max(IMAGE_MAX_SIZE_BYTES, { error: "El archivo no puede pesar más de 5 MB." }),
});

export const termSchema = z.object({
  name: z.string().trim().min(1, { error: "El nombre es requerido." }),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.string().trim().nullish(),
  active: z.coerce.boolean().default(true),
});

export const examOverrideInputSchema = z.object({
  scope: z.enum(["FACULTY", "CAREER"], { error: "Selecciona un ámbito." }),
  targetId: z.string().min(1, { error: "Selecciona la facultad o carrera." }),
  score: z.coerce
    .number({ error: "El puntaje debe ser un número." })
    .int()
    .min(0, { error: "El puntaje no puede ser negativo." }),
});

export const examSchema = z.object({
  type: z.enum(["TOEIC", "TOEFL", "CUSTOM"], { error: "Selecciona un tipo de examen." }),
  name: z.string().trim().min(1, { error: "El nombre es requerido." }),
  description: z.string().trim().nullish(),
  passingScore: z.coerce
    .number({ error: "El passing score debe ser un número." })
    .int()
    .min(0, { error: "El passing score no puede ser negativo." }),
  active: z.coerce.boolean().default(true),
  overrides: z.array(examOverrideInputSchema).default([]),
});
