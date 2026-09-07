import { describe, expect, it } from "vitest";
import { resolvePassingScore, type PassingScoreContext } from "@/services/result-service";

const ctx: PassingScoreContext = {
  examDefault: 700,
  byCareerId: new Map([["car-ciber", 650]]),
  byFacultyId: new Map([["fac-ing", 750]]),
  careerFacultyId: new Map([
    ["car-ciber", "fac-ing"],
    ["car-mecatronica", "fac-ing"],
    ["car-derecho", "fac-derecho"],
  ]),
};

describe("resolvePassingScore", () => {
  it("uses the career-specific override when present", () => {
    expect(resolvePassingScore(ctx, "car-ciber")).toBe(650);
  });

  it("falls back to the faculty override for other careers of that faculty", () => {
    expect(resolvePassingScore(ctx, "car-mecatronica")).toBe(750);
  });

  it("falls back to the exam default when neither career nor faculty has an override", () => {
    expect(resolvePassingScore(ctx, "car-derecho")).toBe(700);
  });

  it("uses the exam default when the student has no career (docente/externo)", () => {
    expect(resolvePassingScore(ctx, null)).toBe(700);
    expect(resolvePassingScore(ctx, undefined)).toBe(700);
  });

  it("uses the exam default for an unknown career id", () => {
    expect(resolvePassingScore(ctx, "car-nope")).toBe(700);
  });
});
