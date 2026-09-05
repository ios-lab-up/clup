import { getTranslations } from "next-intl/server";
import { listActiveFaqs } from "@/features/content/queries";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "FAQs • CLUP" };

export default async function FaqsPage() {
  const [faqs, t] = await Promise.all([listActiveFaqs(), getTranslations("Faqs")]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>

      {faqs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("noFaqs")} />
        </div>
      ) : (
        <dl className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-xl border border-gray-200 bg-white p-6">
              <dt className="font-semibold text-gray-900">{faq.question}</dt>
              <dd className="mt-2 text-sm text-gray-600">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
