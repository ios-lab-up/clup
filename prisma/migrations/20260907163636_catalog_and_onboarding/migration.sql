-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "careerId" TEXT,
ADD COLUMN     "onboardedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamPassingScore" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "facultyId" TEXT,
    "careerId" TEXT,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamPassingScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_name_key" ON "Faculty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_slug_key" ON "Faculty"("slug");

-- CreateIndex
CREATE INDEX "Faculty_order_idx" ON "Faculty"("order");

-- CreateIndex
CREATE INDEX "Career_facultyId_idx" ON "Career"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "Career_facultyId_name_key" ON "Career"("facultyId", "name");

-- CreateIndex
CREATE INDEX "ExamPassingScore_examId_idx" ON "ExamPassingScore"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPassingScore_examId_facultyId_key" ON "ExamPassingScore"("examId", "facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamPassingScore_examId_careerId_key" ON "ExamPassingScore"("examId", "careerId");

-- CreateIndex
CREATE INDEX "Profile_careerId_idx" ON "Profile"("careerId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPassingScore" ADD CONSTRAINT "ExamPassingScore_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPassingScore" ADD CONSTRAINT "ExamPassingScore_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPassingScore" ADD CONSTRAINT "ExamPassingScore_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Un override apunta a EXACTAMENTE un ámbito: facultad XOR carrera.
ALTER TABLE "ExamPassingScore"
  ADD CONSTRAINT "exam_passing_score_scope_check"
  CHECK (num_nonnulls("facultyId", "careerId") = 1);

-- Catálogo institucional inicial (facultades + carreras).
-- Generado desde src/lib/catalog-data.ts (scripts/gen-catalog-sql.ts).
-- Los cambios posteriores se hacen desde /admin/catalogo, NO re-seedeando.

INSERT INTO "Faculty" ("id", "name", "slug", "order", "isExternal", "active", "updatedAt") VALUES
  ('fac-bellas-artes', 'BELLAS ARTES', 'bellas-artes', 0, false, true, CURRENT_TIMESTAMP),
  ('fac-ciencias-de-la-salud', 'CIENCIAS DE LA SALUD', 'ciencias-de-la-salud', 1, false, true, CURRENT_TIMESTAMP),
  ('fac-ciencias-empresariales', 'CIENCIAS EMPRESARIALES', 'ciencias-empresariales', 2, false, true, CURRENT_TIMESTAMP),
  ('fac-comunicacion', 'COMUNICACIÓN', 'comunicacion', 3, false, true, CURRENT_TIMESTAMP),
  ('fac-derecho', 'DERECHO', 'derecho', 4, false, true, CURRENT_TIMESTAMP),
  ('fac-empresariales', 'EMPRESARIALES', 'empresariales', 5, false, true, CURRENT_TIMESTAMP),
  ('fac-esdai', 'ESDAI', 'esdai', 6, false, true, CURRENT_TIMESTAMP),
  ('fac-filosofia', 'FILOSOFÍA', 'filosofia', 7, false, true, CURRENT_TIMESTAMP),
  ('fac-gobierno-y-economia', 'GOBIERNO Y ECONOMÍA', 'gobierno-y-economia', 8, false, true, CURRENT_TIMESTAMP),
  ('fac-ingenieria', 'INGENIERÍA', 'ingenieria', 9, false, true, CURRENT_TIMESTAMP),
  ('fac-pedagogia', 'PEDAGOGÍA', 'pedagogia', 10, false, true, CURRENT_TIMESTAMP),
  ('fac-docente-externo', 'DOCENTE / EXTERNO', 'docente-externo', 99, true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Career" ("id", "facultyId", "name", "order", "active", "updatedAt") VALUES
  ('car-bellas-artes-musica-e-innovacion', 'fac-bellas-artes', 'LICENCIATURA EN MÚSICA E INNOVACIÓN', 0, true, CURRENT_TIMESTAMP),
  ('car-ciencias-de-la-salud-enfermeria', 'fac-ciencias-de-la-salud', 'LICENCIATURA EN ENFERMERÍA', 0, true, CURRENT_TIMESTAMP),
  ('car-ciencias-de-la-salud-medico-cirujano', 'fac-ciencias-de-la-salud', 'LICENCIATURA EN MÉDICO CIRUJANO', 1, true, CURRENT_TIMESTAMP),
  ('car-ciencias-de-la-salud-psicologia', 'fac-ciencias-de-la-salud', 'LICENCIATURA EN PSICOLOGÍA', 2, true, CURRENT_TIMESTAMP),
  ('car-ciencias-empresariales-administracion-y-direccion', 'fac-ciencias-empresariales', 'LICENCIATURA EN ADMINISTRACIÓN Y DIRECCIÓN', 0, true, CURRENT_TIMESTAMP),
  ('car-ciencias-empresariales-finanzas-cuantitativas', 'fac-ciencias-empresariales', 'LICENCIATURA EN FINANZAS CUANTITATIVAS', 1, true, CURRENT_TIMESTAMP),
  ('car-ciencias-empresariales-mercadotecnia-y-estrategia-de-datos', 'fac-ciencias-empresariales', 'LICENCIATURA EN MERCADOTECNIA Y ESTRATEGIA DE DATOS', 2, true, CURRENT_TIMESTAMP),
  ('car-comunicacion-comunicacion', 'fac-comunicacion', 'LICENCIATURA EN COMUNICACIÓN', 0, true, CURRENT_TIMESTAMP),
  ('car-derecho-derecho', 'fac-derecho', 'LICENCIATURA EN DERECHO', 0, true, CURRENT_TIMESTAMP),
  ('car-empresariales-administracion-y-direccion-del-talento', 'fac-empresariales', 'LICENCIATURA EN ADMINISTRACIÓN Y DIRECCIÓN DEL TALENTO', 0, true, CURRENT_TIMESTAMP),
  ('car-empresariales-administracion-y-finanzas', 'fac-empresariales', 'LICENCIATURA EN ADMINISTRACIÓN Y FINANZAS', 1, true, CURRENT_TIMESTAMP),
  ('car-empresariales-administracion-y-mercadotecnia', 'fac-empresariales', 'LICENCIATURA EN ADMINISTRACIÓN Y MERCADOTECNIA', 2, true, CURRENT_TIMESTAMP),
  ('car-empresariales-administracion-y-negocios-internacionales', 'fac-empresariales', 'LICENCIATURA EN ADMINISTRACIÓN Y NEGOCIOS INTERNACIONALES', 3, true, CURRENT_TIMESTAMP),
  ('car-empresariales-administracion-y-recursos-humanos', 'fac-empresariales', 'LICENCIATURA EN ADMINISTRACIÓN Y RECURSOS HUMANOS', 4, true, CURRENT_TIMESTAMP),
  ('car-empresariales-contaduria', 'fac-empresariales', 'LICENCIATURA EN CONTADURÍA', 5, true, CURRENT_TIMESTAMP),
  ('car-empresariales-inteligencia-de-negocios', 'fac-empresariales', 'LICENCIATURA EN INTELIGENCIA DE NEGOCIOS', 6, true, CURRENT_TIMESTAMP),
  ('car-empresariales-mercadotecnia-y-estrategia-de-datos', 'fac-empresariales', 'LICENCIATURA EN MERCADOTECNIA Y ESTRATEGIA DE DATOS', 7, true, CURRENT_TIMESTAMP),
  ('car-esdai-administracion-y-hospitalidad', 'fac-esdai', 'LICENCIATURA EN ADMINISTRACIÓN Y HOSPITALIDAD', 0, true, CURRENT_TIMESTAMP),
  ('car-esdai-direccion-de-negocios-gastronomicos', 'fac-esdai', 'LICENCIATURA EN DIRECCIÓN DE NEGOCIOS GASTRONÓMICOS', 1, true, CURRENT_TIMESTAMP),
  ('car-esdai-hospitalidad-y-direccion', 'fac-esdai', 'LICENCIATURA EN HOSPITALIDAD Y DIRECCIÓN', 2, true, CURRENT_TIMESTAMP),
  ('car-filosofia-filosofia', 'fac-filosofia', 'LICENCIATURA EN FILOSOFÍA', 0, true, CURRENT_TIMESTAMP),
  ('car-gobierno-y-economia-economia', 'fac-gobierno-y-economia', 'LICENCIATURA EN ECONOMÍA', 0, true, CURRENT_TIMESTAMP),
  ('car-gobierno-y-economia-gobierno', 'fac-gobierno-y-economia', 'LICENCIATURA EN GOBIERNO', 1, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-en-animacion-y-videojuegos', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA EN ANIMACIÓN Y VIDEOJUEGOS', 0, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-en-industrial-e-innovacion-basada-en-datos', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA EN INDUSTRIAL E INNOVACIÓN BASADA EN DATOS', 1, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-en-innovacion-y-diseno', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA EN INNOVACIÓN Y DISEÑO', 2, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-en-inteligencia-de-datos-y-ciberseguridad', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA EN INTELIGENCIA DE DATOS Y CIBERSEGURIDAD', 3, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-industrial-y-gestion-de-la-innovacion', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA INDUSTRIAL Y GESTIÓN DE LA INNOVACIÓN', 4, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-mecanica', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA MECÁNICA', 5, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-ingenieria-mecatronica', 'fac-ingenieria', 'LICENCIATURA EN INGENIERÍA MECATRÓNICA', 6, true, CURRENT_TIMESTAMP),
  ('car-ingenieria-matematicas-aplicadas', 'fac-ingenieria', 'LICENCIATURA EN MATEMÁTICAS APLICADAS', 7, true, CURRENT_TIMESTAMP),
  ('car-pedagogia-pedagogia', 'fac-pedagogia', 'LICENCIATURA EN PEDAGOGÍA', 0, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
