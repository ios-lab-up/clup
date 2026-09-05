import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ExamType } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const term = await prisma.term.upsert({
    where: { name_year: { name: "Otoño", year: 2026 } },
    update: {},
    create: {
      name: "Otoño",
      year: 2026,
      description: "Ciclo Otoño 2026",
      active: true,
    },
  });

  const toeic = await prisma.exam.upsert({
    where: { id: "seed-exam-toeic" },
    update: {},
    create: {
      id: "seed-exam-toeic",
      type: ExamType.TOEIC,
      name: "TOEIC",
      description: "Test of English for International Communication",
      active: true,
    },
  });

  const toefl = await prisma.exam.upsert({
    where: { id: "seed-exam-toefl" },
    update: {},
    create: {
      id: "seed-exam-toefl",
      type: ExamType.TOEFL,
      name: "TOEFL",
      description: "Test of English as a Foreign Language",
      active: true,
    },
  });

  const examDates: {
    id: string;
    examId: string;
    registrationStartDate: Date;
    registrationEndDate: Date;
    examDate: Date;
    capacity?: number;
    instructions: string;
  }[] = [
    // Cerrada: inscripciones ya terminaron y el examen ya se presentó.
    {
      id: "seed-examdate-toeic-1",
      examId: toeic.id,
      registrationStartDate: new Date("2026-08-15T00:00:00.000Z"),
      registrationEndDate: new Date("2026-08-21T23:59:59.000Z"),
      examDate: new Date("2026-08-30T14:00:00.000Z"),
      instructions:
        "Preséntate 30 minutos antes en el Aula Magna con tu credencial vigente e identificación oficial.",
    },
    // Abierta: dentro del periodo de inscripción.
    {
      id: "seed-examdate-toeic-2",
      examId: toeic.id,
      registrationStartDate: new Date("2026-08-25T00:00:00.000Z"),
      registrationEndDate: new Date("2026-09-10T23:59:59.000Z"),
      examDate: new Date("2026-09-15T14:00:00.000Z"),
      capacity: 60,
      instructions:
        "Preséntate 30 minutos antes en el Aula Magna con tu credencial vigente e identificación oficial.",
    },
    // Abierta: dentro del periodo de inscripción.
    {
      id: "seed-examdate-toefl-1",
      examId: toefl.id,
      registrationStartDate: new Date("2026-09-01T00:00:00.000Z"),
      registrationEndDate: new Date("2026-09-18T23:59:59.000Z"),
      examDate: new Date("2026-09-25T14:00:00.000Z"),
      capacity: 40,
      instructions:
        "El examen se presenta en formato ITP. Trae calculadora no programable y dos lápices del número 2.",
    },
    // Próximamente: las inscripciones aún no abren.
    {
      id: "seed-examdate-toeic-3",
      examId: toeic.id,
      registrationStartDate: new Date("2026-09-20T00:00:00.000Z"),
      registrationEndDate: new Date("2026-09-30T23:59:59.000Z"),
      examDate: new Date("2026-10-10T14:00:00.000Z"),
      capacity: 60,
      instructions:
        "Preséntate 30 minutos antes en el Aula Magna con tu credencial vigente e identificación oficial.",
    },
  ];

  for (const ed of examDates) {
    await prisma.examDate.upsert({
      where: { id: ed.id },
      update: {},
      create: {
        id: ed.id,
        termId: term.id,
        examId: ed.examId,
        registrationStartDate: ed.registrationStartDate,
        registrationEndDate: ed.registrationEndDate,
        examDate: ed.examDate,
        capacity: ed.capacity,
        instructions: ed.instructions,
        info: "Costo del examen: consulta el portal de pagos. Resultados disponibles aproximadamente 3 semanas después del examen.",
        active: true,
      },
    });
  }

  const faqs = [
    {
      question: "¿Qué necesito para inscribirme?",
      answer:
        "Necesitas iniciar sesión con tu cuenta institucional de Google y tener a la mano tu comprobante de pago, credencial de la universidad e INE.",
    },
    {
      question: "¿Cuándo puedo inscribirme?",
      answer:
        "Cada fecha de examen tiene su propio periodo de inscripción. Consulta las fechas de inicio y fin en la sección de próximos exámenes.",
    },
    {
      question: "¿Qué documentos necesito?",
      answer:
        "Comprobante de pago, credencial de la universidad (frente) e INE (frente y vuelta).",
    },
    {
      question: "¿Dónde realizo el pago?",
      answer:
        "A través del portal de pagos institucional, accesible desde el botón \"Pagar examen\" en la página principal.",
    },
    {
      question: "¿Cuándo recibiré mis resultados?",
      answer:
        "Los resultados se publican aproximadamente 3 semanas después de la fecha del examen y podrás consultarlos en tu dashboard.",
    },
  ];

  for (const [index, faq] of faqs.entries()) {
    await prisma.fAQ.upsert({
      where: { id: `seed-faq-${index + 1}` },
      update: {},
      create: { id: `seed-faq-${index + 1}`, order: index, active: true, ...faq },
    });
  }

  const instructions = [
    {
      title: "Documentos requeridos",
      body: "Debes presentar tu credencial de la Universidad Panamericana vigente y una identificación oficial (INE) el día del examen. Sin estos documentos no podrás presentar la evaluación.",
    },
    {
      title: "Política de llegada",
      body: "Preséntate al menos 30 minutos antes de la hora programada. No se permitirá el acceso a alumnos que lleguen después de iniciado el examen.",
    },
    {
      title: "Formato del examen",
      body: "El examen es de opción múltiple y se presenta en las instalaciones del Centro de Lenguas. No se permite el uso de teléfonos celulares durante la aplicación.",
    },
  ];

  for (const [index, instruction] of instructions.entries()) {
    await prisma.instruction.upsert({
      where: { id: `seed-instruction-${index + 1}` },
      update: {},
      create: {
        id: `seed-instruction-${index + 1}`,
        order: index,
        active: true,
        ...instruction,
      },
    });
  }

  const settings: { key: string; value: string }[] = [
    {
      key: "payment_portal_url",
      value: "https://pagos.up.edu.mx/clup",
    },
    { key: "contact_email", value: "clup@up.edu.mx" },
    { key: "institution_name", value: "Universidad Panamericana" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
