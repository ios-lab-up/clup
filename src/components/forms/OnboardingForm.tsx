"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { completeOnboarding } from "@/features/onboarding/actions";

export interface OnboardingFacultyOption {
  id: string;
  name: string;
  isExternal: boolean;
  careers: { id: string; name: string }[];
}

interface OnboardingFormProps {
  studentName: string;
  studentEmail: string;
  derivedStudentId: string | null;
  existingStudentId: string | null;
  faculties: OnboardingFacultyOption[];
  dashboardHref: string;
}

export function OnboardingForm({
  studentName,
  studentEmail,
  derivedStudentId,
  existingStudentId,
  faculties,
  dashboardHref,
}: OnboardingFormProps) {
  const t = useTranslations("Onboarding");
  const lockedStudentId = existingStudentId ?? derivedStudentId;
  const [studentId, setStudentId] = useState(lockedStudentId ?? "");
  const [facultyId, setFacultyId] = useState("");
  const [careerId, setCareerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFaculty = useMemo(
    () => faculties.find((faculty) => faculty.id === facultyId) ?? null,
    [faculties, facultyId],
  );
  const isExternal = selectedFaculty?.isExternal ?? false;

  const canSubmit =
    studentId.trim().length >= 4 &&
    facultyId.length > 0 &&
    (isExternal || careerId.length > 0) &&
    !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await completeOnboarding({
      studentId,
      facultyId,
      careerId: isExternal ? undefined : careerId,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message);
      return;
    }

    window.location.assign(dashboardHref);
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
      </div>

      <div>
        <Label htmlFor="studentId">{t("studentId")}</Label>
        <Input
          id="studentId"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          disabled={Boolean(lockedStudentId)}
          placeholder={t("studentIdPlaceholder")}
          required
        />
        {lockedStudentId ? (
          <p className="mt-1 text-xs text-gray-500">{t("studentIdFromEmail")}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">{t("studentIdManualHint")}</p>
        )}
      </div>

      <div>
        <Label htmlFor="facultyId">{t("faculty")}</Label>
        <Select
          id="facultyId"
          value={facultyId}
          onChange={(event) => {
            setFacultyId(event.target.value);
            setCareerId("");
          }}
          required
        >
          <option value="">{t("selectFacultyOption")}</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </Select>
      </div>

      {isExternal ? (
        <p className="text-sm text-gray-500">{t("careerExternalNote")}</p>
      ) : (
        <div>
          <Label htmlFor="careerId">{t("career")}</Label>
          <Select
            id="careerId"
            value={careerId}
            onChange={(event) => setCareerId(event.target.value)}
            disabled={!selectedFaculty}
            required
          >
            <option value="">{t("selectCareerOption")}</option>
            {(selectedFaculty?.careers ?? []).map((career) => (
              <option key={career.id} value={career.id}>
                {career.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" disabled={!canSubmit} loading={submitting} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
