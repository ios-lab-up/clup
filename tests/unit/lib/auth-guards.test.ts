import { beforeEach, describe, expect, it, vi } from "vitest";
import { canAccessDocument } from "@/lib/auth/guards";

const currentUserMock = vi.fn();
const profileFindUniqueMock = vi.fn();
const profileCreateMock = vi.fn();
const profileUpdateMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: () => currentUserMock(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    profile: {
      findUnique: (...args: unknown[]) => profileFindUniqueMock(...args),
      create: (...args: unknown[]) => profileCreateMock(...args),
      update: (...args: unknown[]) => profileUpdateMock(...args),
    },
  },
}));

describe("canAccessDocument", () => {
  const document = { registration: { profileId: "student-owner" } };

  it("allows the owning student", () => {
    expect(canAccessDocument({ id: "student-owner", role: "STUDENT" }, document)).toBe(true);
  });

  it("denies a different student", () => {
    expect(canAccessDocument({ id: "other-student", role: "STUDENT" }, document)).toBe(false);
  });

  it("allows any admin regardless of ownership", () => {
    expect(canAccessDocument({ id: "some-admin", role: "ADMIN" }, document)).toBe(true);
  });
});

describe("requireAdmin / requireAuth", () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    profileFindUniqueMock.mockReset();
    profileCreateMock.mockReset();
    profileUpdateMock.mockReset();
  });

  it("resolves the profile when the user has role ADMIN", async () => {
    currentUserMock.mockResolvedValue({
      id: "clerk-1",
      fullName: "Ana Admin",
      primaryEmailAddress: { emailAddress: "ana@up.edu.mx" },
    });
    profileFindUniqueMock.mockResolvedValue(null); // sin Profile previo (ni por clerkUserId ni por email)
    profileCreateMock.mockResolvedValue({ id: "profile-1", role: "ADMIN" });

    const { requireAdmin } = await import("@/lib/auth/guards");
    const profile = await requireAdmin();

    expect(profile.role).toBe("ADMIN");
  });

  it("throws (404 via notFound()) when the authenticated user is not an admin", async () => {
    currentUserMock.mockResolvedValue({
      id: "clerk-2",
      fullName: "Sara Student",
      primaryEmailAddress: { emailAddress: "sara@up.edu.mx" },
    });
    profileFindUniqueMock.mockResolvedValue(null);
    profileCreateMock.mockResolvedValue({ id: "profile-2", role: "STUDENT" });

    const { requireAdmin } = await import("@/lib/auth/guards");
    await expect(requireAdmin()).rejects.toThrow();
  });

  it("throws (redirect to /sign-in) when there is no authenticated user", async () => {
    currentUserMock.mockResolvedValue(null);

    const { requireAuth } = await import("@/lib/auth/guards");
    await expect(requireAuth()).rejects.toThrow();
    expect(profileCreateMock).not.toHaveBeenCalled();
  });
});
