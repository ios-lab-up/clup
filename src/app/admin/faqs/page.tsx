import { listAllFaqs } from "@/features/admin-faqs/queries";
import { FaqsManager } from "@/components/admin/FaqsManager";

export const metadata = { title: "FAQs • Admin CLUP" };

export default async function AdminFaqsPage() {
  const faqs = await listAllFaqs();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
      <p className="mt-1 text-gray-600">Manage the FAQs shown on the public page.</p>
      <div className="mt-6">
        <FaqsManager faqs={faqs} />
      </div>
    </div>
  );
}
