import { z } from "zod";

export const examPassingScoreSchema = z.object({
  examId: z.string().min(1, { error: "Falta el examen." }),
  scope: z.enum(["FACULTY", "CAREER"], { error: "Selecciona un ámbito." }),
  targetId: z.string().min(1, { error: "Selecciona la facultad o carrera." }),
  score: z.coerce
    .number({ error: "El puntaje debe ser un número." })
    .int()
    .min(0, { error: "El puntaje no puede ser negativo." }),
});

export type ExamPassingScoreInput = z.infer<typeof examPassingScoreSchema>;
