import { z } from "zod";

export const CSV_RESULTS_REQUIRED_HEADERS = ["student_id", "score"] as const;

export const csvResultsSelectionSchema = z.object({
  examDateId: z.string().min(1, { error: "Selecciona una fecha de examen." }),
});

export const csvResultRowSchema = z.object({
  student_id: z.string().trim().min(1, { error: "student_id es requerido." }),
  score: z.coerce.number({ error: "score debe ser un número." }).int().min(0),
});

export type CsvResultRow = z.infer<typeof csvResultRowSchema>;
