import { z } from "zod";

export const examDateSchema = z
  .object({
    termId: z.string().min(1, { error: "Selecciona un term." }),
    examId: z.string().min(1, { error: "Selecciona un examen." }),
    examDate: z.coerce.date({ error: "Fecha de examen inválida." }),
    registrationStartDate: z.coerce.date({ error: "Fecha de inicio de inscripción inválida." }),
    registrationEndDate: z.coerce.date({ error: "Fecha de fin de inscripción inválida." }),
    capacity: z.coerce
      .number()
      .int()
      .positive({ error: "La capacidad debe ser un número positivo." })
      .nullish(),
    instructions: z.string().trim().nullish(),
    info: z.string().trim().nullish(),
    active: z.coerce.boolean().default(true),
  })
  .refine((data) => data.registrationStartDate < data.registrationEndDate, {
    error: "El inicio de inscripción debe ser anterior al fin de inscripción.",
    path: ["registrationEndDate"],
  })
  .refine((data) => data.registrationEndDate < data.examDate, {
    error: "El fin de inscripción debe ser anterior a la fecha del examen.",
    path: ["examDate"],
  });

export type ExamDateInput = z.infer<typeof examDateSchema>;
