import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRegistrationDetail } from "@/features/admin-registrations/queries";
import { prisma } from "@/lib/db/prisma";
import { buildPassingScoreContext, resolvePassingScore } from "@/services/result-service";
import { Card, CardContent } from "@/components/ui/Card";
import { ResultForm } from "@/components/admin/ResultForm";

interface PageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function AdminResultDetailPage({ params }: PageProps) {
  const { registrationId } = await params;
  const registration = await getRegistrationDetail(registrationId);

  const passingScoreContext = await buildPassingScoreContext(prisma, registration.examDate.examId);
  const passingScore = resolvePassingScore(passingScoreContext, registration.profile.careerId);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/resultados" className="inline-flex items-center gap-1 text-sm text-wine-700 hover:text-wine-800">
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        Result • {registration.profile.name} · {registration.examDate.exam.name}
      </h1>

      <Card className="mt-6">
        <CardContent>
          <ResultForm
            registrationId={registration.id}
            passingScore={passingScore}
            careerName={registration.profile.career?.name ?? null}
            result={registration.result}
          />
        </CardContent>
      </Card>
    </div>
  );
}
