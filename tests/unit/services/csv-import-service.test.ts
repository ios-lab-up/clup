import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { commitResultsImport, previewResultsImport } from "@/services/csv-import-service";
import { AppError } from "@/lib/errors";

const db = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

const examDateId = "examdate-1";
const examDate = { id: examDateId, termId: "term-1", examId: "exam-1", exam: { passingScore: 700 } };

beforeEach(() => {
  mockReset(db);
  db.examDate.findUnique.mockResolvedValue(examDate as never);
});

describe("previewResultsImport", () => {
  it("throws when required headers are missing", async () => {
    await expect(
      previewResultsImport(db, examDateId, "matricula,puntaje\n0272150,785"),
    ).rejects.toThrow(AppError);
  });

  it("throws when the exam date no longer exists", async () => {
    db.examDate.findUnique.mockResolvedValue(null);

    await expect(
      previewResultsImport(db, examDateId, "student_id,score\n0272150,785"),
    ).rejects.toThrow(/ya no existe/);
  });

  it("flags a row as error when the student is not found", async () => {
    db.profile.findUnique.mockResolvedValue(null);

    const result = await previewResultsImport(db, examDateId, "student_id,score\n0272150,785");

    expect(result.rows[0]).toMatchObject({ status: "error", message: "Alumno no encontrado." });
    expect(result.summary).toEqual({ ok: 0, overwrite: 0, error: 1 });
  });

  it("flags a row as error when there is no registration for that exam date", async () => {
    db.profile.findUnique.mockResolvedValue({ id: "profile-1", name: "Ana" } as never);
    db.registration.findUnique.mockResolvedValue(null);

    const result = await previewResultsImport(db, examDateId, "student_id,score\n0272150,785");

    expect(result.rows[0]).toMatchObject({
      status: "error",
      message: "Sin inscripción en este examen/fecha.",
    });
  });

  it("flags a row as error when the registration is not APPROVED", async () => {
    db.profile.findUnique.mockResolvedValue({ id: "profile-1", name: "Ana" } as never);
    db.registration.findUnique.mockResolvedValue({
      id: "reg-1",
      status: "PENDING",
      result: null,
    } as never);

    const result = await previewResultsImport(db, examDateId, "student_id,score\n0272150,785");

    expect(result.rows[0]).toMatchObject({ status: "error", message: "Inscripción no aprobada." });
  });

  it("flags a row as overwrite when a Result already exists, without discarding the previous score", async () => {
    db.profile.findUnique.mockResolvedValue({ id: "profile-1", name: "Ana" } as never);
    db.registration.findUnique.mockResolvedValue({
      id: "reg-1",
      status: "APPROVED",
      result: { score: 650 },
    } as never);

    const result = await previewResultsImport(db, examDateId, "student_id,score\n0272150,785");

    expect(result.rows[0]).toMatchObject({
      status: "overwrite",
      previousScore: 650,
      score: 785,
      passed: true,
      studentName: "Ana",
    });
    expect(result.summary.overwrite).toBe(1);
  });

  it("computes passed correctly for a fresh, valid row", async () => {
    db.profile.findUnique.mockResolvedValue({ id: "profile-1", name: "Ana" } as never);
    db.registration.findUnique.mockResolvedValue({
      id: "reg-1",
      status: "APPROVED",
      result: null,
    } as never);

    const result = await previewResultsImport(db, examDateId, "student_id,score\n0272150,650");

    expect(result.rows[0]).toMatchObject({
      status: "ok",
      passed: false,
      registrationId: "reg-1",
      studentName: "Ana",
    });
    expect(result.summary).toEqual({ ok: 1, overwrite: 0, error: 0 });
  });
});

describe("commitResultsImport", () => {
  it("upserts the result and writes an audit log only when overwriting", async () => {
    (db.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => unknown) => cb(db),
    );
    db.result.findUnique.mockResolvedValue({ score: 600 } as never);
    db.result.upsert.mockResolvedValue({} as never);
    db.auditLog.create.mockResolvedValue({} as never);

    await commitResultsImport(db, [{ registrationId: "reg-1", score: 700, passed: true }], "admin-1");

    expect(db.result.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { registrationId: "reg-1" },
        update: { score: 700, passed: true },
      }),
    );
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "result.import_overwrite" }),
      }),
    );
  });

  it("does not write an audit log for a brand-new result", async () => {
    (db.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (cb: (tx: unknown) => unknown) => cb(db),
    );
    db.result.findUnique.mockResolvedValue(null);
    db.result.upsert.mockResolvedValue({} as never);

    await commitResultsImport(db, [{ registrationId: "reg-2", score: 700, passed: true }], "admin-1");

    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
});
