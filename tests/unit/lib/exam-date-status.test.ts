import { describe, expect, it } from "vitest";
import { getExamDateStatus } from "@/lib/exam-date-status";

describe("getExamDateStatus", () => {
  const window = {
    registrationStartDate: new Date("2026-08-25T00:00:00.000Z"),
    registrationEndDate: new Date("2026-09-10T23:59:59.000Z"),
  };

  it("returns UPCOMING before the registration window opens", () => {
    const now = new Date("2026-08-20T00:00:00.000Z");
    expect(getExamDateStatus(window, now)).toBe("UPCOMING");
  });

  it("returns OPEN inside the registration window", () => {
    const now = new Date("2026-09-01T00:00:00.000Z");
    expect(getExamDateStatus(window, now)).toBe("OPEN");
  });

  it("returns CLOSED after the registration window ends", () => {
    const now = new Date("2026-09-15T00:00:00.000Z");
    expect(getExamDateStatus(window, now)).toBe("CLOSED");
  });

  it("treats the exact start instant as OPEN", () => {
    expect(getExamDateStatus(window, window.registrationStartDate)).toBe("OPEN");
  });

  it("treats the exact end instant as OPEN", () => {
    expect(getExamDateStatus(window, window.registrationEndDate)).toBe("OPEN");
  });

  it("treats the instant right after the end as CLOSED", () => {
    const now = new Date(window.registrationEndDate.getTime() + 1);
    expect(getExamDateStatus(window, now)).toBe("CLOSED");
  });
});
