import { z } from "zod";

export const facultySchema = z.object({
  name: z.string().trim().min(1, { error: "El nombre es requerido." }),
  order: z.coerce.number().int().default(0),
  isExternal: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
});

export const careerSchema = z.object({
  facultyId: z.string().min(1, { error: "Selecciona una facultad." }),
  name: z.string().trim().min(1, { error: "El nombre es requerido." }),
  order: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
});

export type FacultyInput = z.infer<typeof facultySchema>;
export type CareerInput = z.infer<typeof careerSchema>;
