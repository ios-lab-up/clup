import Link from "next/link";
import { ArrowLeft, CreditCard, Download, FileImage, IdCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getRegistrationDetail } from "@/features/admin-registrations/queries";
import { Card, CardContent } from "@/components/ui/Card";
import { RegistrationStatusBadge } from "@/components/exams/RegistrationStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { RegistrationActions } from "@/components/admin/RegistrationActions";
import { DOCUMENT_TYPE_LABELS, REGISTRATION_STATUS_LABELS } from "@/lib/constants";

const DOCUMENT_ICONS: Record<string, LucideIcon> = {
  PAYMENT_PROOF: CreditCard,
  UNIVERSITY_ID_FRONT: IdCard,
  INE_FRONT: IdCard,
  INE_BACK: IdCard,
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" });

interface PageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function AdminRegistrationDetailPage({ params }: PageProps) {
  const { registrationId } = await params;
  const registration = await getRegistrationDetail(registrationId);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/inscripciones" className="inline-flex items-center gap-1 text-sm text-wine-700 hover:text-wine-800">
        <ArrowLeft className="h-4 w-4" />
        Back to registrations
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Registration for {registration.profile.name}</h1>
        <RegistrationStatusBadge status={registration.status} label={REGISTRATION_STATUS_LABELS[registration.status]} />
      </div>

      {registration.status === "REJECTED" && registration.rejectionReason && (
        <Alert variant="error" title="Rejection reason" className="mt-4">
          {registration.rejectionReason}
        </Alert>
      )}

      <Card className="mt-6">
        <CardContent>
          <h2 className="text-lg font-bold text-gray-900">Student information</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{registration.profile.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{registration.profile.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Student ID</dt>
              <dd className="text-gray-900">{registration.profile.studentId ?? "•"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Clerk User ID</dt>
              <dd className="break-all text-gray-900">{registration.profile.clerkUserId ?? "•"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent>
          <h2 className="text-lg font-bold text-gray-900">Exam information</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Exam</dt>
              <dd className="text-gray-900">{registration.examDate.exam.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Term</dt>
              <dd className="text-gray-900">
                {registration.examDate.term.name} {registration.examDate.term.year}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Date</dt>
              <dd className="text-gray-900">{dateFormatter.format(registration.examDate.examDate)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <FileImage className="h-5 w-5 text-wine-700" />
            Documents
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {registration.documents.map((document) => {
              const Icon = DOCUMENT_ICONS[document.type] ?? FileImage;
              return (
                <a
                  key={document.id}
                  href={`/api/documents/${document.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-wine-300 hover:bg-wine-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-wine-100 text-wine-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-gray-900">
                      {DOCUMENT_TYPE_LABELS[document.type] ?? document.type}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {document.mimeType.split("/")[1]?.toUpperCase()} • view / download
                    </span>
                  </span>
                  <Download className="h-4 w-4 text-gray-400 group-hover:text-wine-700" />
                </a>
              );
            })}
          </div>

          {registration.documents.length > 0 && (
            <a
              href={`/api/admin/registrations/${registration.id}/download`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-wine-700 px-4 py-2 text-sm font-medium text-white hover:bg-wine-800"
            >
              <Download className="h-4 w-4" />
              Download all (ZIP)
            </a>
          )}
        </CardContent>
      </Card>

      {registration.status === "PENDING" && (
        <div className="mt-6">
          <RegistrationActions registrationId={registration.id} />
        </div>
      )}
    </div>
  );
}
