import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { getOverviewStats, getRecentRegistrations } from "@/features/admin-overview/queries";
import { Card, CardContent } from "@/components/ui/Card";
import { RegistrationStatusBadge } from "@/components/exams/RegistrationStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { REGISTRATION_STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Overview • Admin CLUP" };

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function AdminOverviewPage() {
  const [stats, recent] = await Promise.all([getOverviewStats(), getRecentRegistrations()]);

  const cards = [
    { label: "Active terms", value: stats.activeTerms, icon: BookOpen, chip: "bg-wine-700" },
    { label: "Active exam dates", value: stats.activeExamDates, icon: GraduationCap, chip: "bg-gold-500" },
    { label: "Pending registrations", value: stats.pendingRegistrations, icon: Clock, chip: "bg-wine-900" },
    { label: "Published results", value: stats.publishedResults, icon: CheckCircle2, chip: "bg-gold-300" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
      <p className="mt-1 text-gray-600">Overview of CLUP activity.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.chip}`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent registrations</h2>
            <Link href="/admin/inscripciones" className="text-sm font-medium text-wine-700 hover:text-wine-800">
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState title="No registrations yet" />
          ) : (
            <div className="space-y-3">
              {recent.map((registration) => (
                <Link
                  key={registration.id}
                  href={`/admin/inscripciones/${registration.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{registration.profile.name}</p>
                    <p className="text-xs text-gray-500">
                      {registration.examDate.exam.name} • {registration.examDate.term.name}{" "}
                      {registration.examDate.term.year} · {dateFormatter.format(registration.createdAt)}
                    </p>
                  </div>
                  <RegistrationStatusBadge status={registration.status} label={REGISTRATION_STATUS_LABELS[registration.status]} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
