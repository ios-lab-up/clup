import { listTermsWithExamDates } from "@/features/admin-terms/queries";
import { TermsTabsManager } from "@/components/admin/TermsTabsManager";

export const metadata = { title: "Terms • Admin CLUP" };

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function AdminTermsPage({ searchParams }: PageProps) {
  const [{ termId }, terms] = await Promise.all([searchParams, listTermsWithExamDates()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Terms</h1>
      <p className="mt-1 text-gray-600">Manage CLUP terms and their exam dates.</p>
      <div className="mt-6">
        <TermsTabsManager terms={terms} initialTermId={termId} />
      </div>
    </div>
  );
}
