import { z } from "zod";

export const faqSchema = z.object({
  question: z.string().trim().min(1, { error: "La pregunta es requerida." }),
  answer: z.string().trim().min(1, { error: "La respuesta es requerida." }),
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
});

export const instructionSchema = z.object({
  title: z.string().trim().min(1, { error: "El título es requerido." }),
  body: z.string().trim().min(1, { error: "El contenido es requerido." }),
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
});

export const termSchema = z.object({
  name: z.string().trim().min(1, { error: "El nombre es requerido." }),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.string().trim().nullish(),
  active: z.coerce.boolean().default(true),
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
});
