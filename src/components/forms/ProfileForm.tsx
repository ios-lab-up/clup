"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { updateMyCareer } from "@/features/profile/actions";
import type { OnboardingFacultyOption } from "@/components/forms/OnboardingForm";

interface ProfileFormProps {
  studentName: string;
  studentEmail: string;
  studentId: string;
  faculties: OnboardingFacultyOption[];
  currentFacultyId: string | null;
  currentCareerId: string | null;
}

export function ProfileForm({
  studentName,
  studentEmail,
  studentId,
  faculties,
  currentFacultyId,
  currentCareerId,
}: ProfileFormProps) {
  const t = useTranslations("Profile");
  const tOnboarding = useTranslations("Onboarding");
  const router = useRouter();
  const [facultyId, setFacultyId] = useState(currentFacultyId ?? "");
  const [careerId, setCareerId] = useState(currentCareerId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => faculty.id === facultyId) ?? null,
    [faculties, facultyId],
  );
  const isExternal = selectedFaculty?.isExternal ?? false;
  const canSubmit = facultyId.length > 0 && (isExternal || careerId.length > 0) && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const result = await updateMyCareer({
      facultyId,
      careerId: isExternal ? undefined : careerId,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("name")}</Label>
          <Input value={studentName} disabled />
        </div>
        <div>
          <Label>{t("institutionalEmail")}</Label>
          <Input value={studentEmail} disabled />
        </div>
        <div>
          <Label>{t("studentId")}</Label>
          <Input value={studentId} disabled />
        </div>
      </div>

      <p className="text-xs text-gray-500">{t("studentIdLocked")}</p>

      <div className="border-t border-gray-200 pt-6">
        <div>
          <Label htmlFor="facultyId">{tOnboarding("faculty")}</Label>
          <Select
            id="facultyId"
            value={facultyId}
            onChange={(event) => {
              setFacultyId(event.target.value);
              setCareerId("");
              setSaved(false);
            }}
            required
          >
            <option value="">{tOnboarding("selectFacultyOption")}</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </Select>
        </div>

        {isExternal ? (
          <p className="mt-4 text-sm text-gray-500">{tOnboarding("careerExternalNote")}</p>
        ) : (
          <div className="mt-4">
            <Label htmlFor="careerId">{tOnboarding("career")}</Label>
            <Select
              id="careerId"
              value={careerId}
              onChange={(event) => {
                setCareerId(event.target.value);
                setSaved(false);
              }}
              disabled={!selectedFaculty}
              required
            >
              <option value="">{tOnboarding("selectCareerOption")}</option>
              {(selectedFaculty?.careers ?? []).map((career) => (
                <option key={career.id} value={career.id}>
                  {career.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">{t("saved")}</Alert>}

      <Button type="submit" disabled={!canSubmit} loading={submitting}>
        {t("save")}
      </Button>
    </form>
  );
}
