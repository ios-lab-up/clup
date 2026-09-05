-- Agrega el valor CUSTOM al enum de tipos de examen.
ALTER TYPE "ExamType" ADD VALUE 'CUSTOM';

-- El passing score ahora vive en Exam (no en ExamDate).
ALTER TABLE "Exam" ADD COLUMN "passingScore" INTEGER NOT NULL DEFAULT 0;

-- Backfill: conserva el passing score existente tomando el de sus fechas de examen.
UPDATE "Exam" e
SET "passingScore" = sub.max_score
FROM (
  SELECT "examId", MAX("passingScore") AS max_score
  FROM "ExamDate"
  GROUP BY "examId"
) sub
WHERE e.id = sub."examId";

-- Elimina la columna de ExamDate.
ALTER TABLE "ExamDate" DROP COLUMN "passingScore";
