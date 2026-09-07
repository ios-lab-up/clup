import { beforeEach, describe, expect, it } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { captureResult, computePassed } from "@/services/result-service";
import { AppError } from "@/lib/errors";

const db = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(db);
});

describe("computePassed", () => {
  it("passes when score is above the passing score", () => {
    expect(computePassed(785, 700)).toBe(true);
  });

  it("fails when score is below the passing score", () => {
    expect(computePassed(650, 700)).toBe(false);
  });

  it("passes on an exact tie (tie goes to the student)", () => {
    expect(computePassed(700, 700)).toBe(true);
  });
});

describe("captureResult", () => {
  it("computes passed from the resolved passing score and upserts the result", async () => {
    db.registration.findUnique.mockResolvedValue({
      id: "reg-1",
      profile: { careerId: "car-ciber" },
      examDate: { examId: "exam-1" },
    } as never);
    db.exam.findUnique.mockResolvedValue({ passingScore: 700 } as never);
    db.examPassingScore.findMany.mockResolvedValue([
      { facultyId: null, careerId: "car-ciber", score: 650 },
    ] as never);
    db.career.findMany.mockResolvedValue([
      { id: "car-ciber", facultyId: "fac-ing" },
    ] as never);
    db.result.upsert.mockResolvedValue({ score: 660, passed: true } as never);

    // 660 reprobaría con el default 700, pero pasa con el override de carrera (650).
    const result = await captureResult(db, { registrationId: "reg-1", score: 660 });

    expect(result).toEqual({ score: 660, passed: true });
    expect(db.result.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ registrationId: "reg-1", score: 660, passed: true }),
      }),
    );
  });

  it("throws when the registration does not exist", async () => {
    db.registration.findUnique.mockResolvedValue(null);

    await expect(captureResult(db, { registrationId: "missing", score: 500 })).rejects.toThrow(
      AppError,
    );
  });
});
