import { describe, expect, it } from "vitest";
import { deriveStudentIdFromEmail } from "@/lib/student-id";

describe("deriveStudentIdFromEmail", () => {
  it("extracts a numeric local part from an @up.edu.mx address", () => {
    expect(deriveStudentIdFromEmail("0218982@up.edu.mx")).toBe("0218982");
    expect(deriveStudentIdFromEmail("0218982@UP.EDU.MX")).toBe("0218982");
    expect(deriveStudentIdFromEmail("  0218982@up.edu.mx  ")).toBe("0218982");
  });

  it("returns null for staff/professor addresses (non-numeric local part)", () => {
    expect(deriveStudentIdFromEmail("isiguenza@up.edu.mx")).toBeNull();
    expect(deriveStudentIdFromEmail("i.siguenza2@up.edu.mx")).toBeNull();
  });

  it("returns null for non-institutional domains", () => {
    expect(deriveStudentIdFromEmail("0218982@gmail.com")).toBeNull();
    expect(deriveStudentIdFromEmail("0218982@alumnos.up.edu.mx")).toBeNull();
  });
});
