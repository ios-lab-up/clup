import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { exportRegistrationsCsv, exportResultsCsv } from "@/services/csv-export-service";

const db = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(db);
});

const registration = {
  status: "APPROVED",
  profile: { studentId: "0272150", name: 'Ana "Popular" Pérez, Jr.', email: "ana@example.com" },
  examDate: {
    exam: { name: "TOEIC" },
    term: { name: "Otoño", year: 2026 },
    examDate: new Date("2026-09-15T14:00:00.000Z"),
  },
  result: { score: 785, passed: true },
};

describe("exportRegistrationsCsv", () => {
  it("applies the given filters to the query", async () => {
    db.registration.findMany.mockResolvedValue([registration] as never);

    await exportRegistrationsCsv(db, { termId: "term-1", status: "APPROVED" as never });

    expect(db.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "APPROVED",
          examDate: expect.objectContaining({ termId: "term-1" }),
        }),
      }),
    );
  });

  it("produces the expected column set and order", async () => {
    db.registration.findMany.mockResolvedValue([registration] as never);

    const csv = await exportRegistrationsCsv(db, {});
    const [header] = csv.split("\r\n");

    expect(header).toBe("ID,Nombre,Email,Examen,Term,Fecha,Estado");
  });

  it("escapes values containing commas and quotes", async () => {
    db.registration.findMany.mockResolvedValue([registration] as never);

    const csv = await exportRegistrationsCsv(db, {});

    expect(csv).toContain('"Ana ""Popular"" Pérez, Jr."');
  });
});

describe("exportResultsCsv", () => {
  it("includes score and pass/fail columns", async () => {
    db.registration.findMany.mockResolvedValue([registration] as never);

    const csv = await exportResultsCsv(db, {});
    const [header, row] = csv.split("\r\n");

    expect(header).toBe("ID,Nombre,Email,Examen,Term,Fecha,Puntaje,Resultado");
    expect(row).toContain("785");
    expect(row).toContain("APROBADO");
  });
});
