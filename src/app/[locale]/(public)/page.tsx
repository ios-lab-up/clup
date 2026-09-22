import { ArrowRight, HelpCircle, Megaphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { listPublicExamDates } from "@/features/exams/queries";
import { listActiveAnnouncements, listActiveFaqs } from "@/features/content/queries";
import { ExamDateCard } from "@/components/exams/ExamDateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImageWithLightbox } from "@/components/ui/ImageWithLightbox";
import { Link } from "@/i18n/navigation";

export default async function LandingPage() {
  const [examDates, faqs, announcements, t] = await Promise.all([
    listPublicExamDates(),
    listActiveFaqs(),
    listActiveAnnouncements(),
    getTranslations("HomePage"),
  ]);

  const upcoming = examDates.slice(0, 3);

  return (
    <div>
      <section className="bg-wine-700">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-300">{t("eyebrow")}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold text-white sm:text-4xl">{t("heroTitle")}</h1>
          <p className="mt-4 max-w-2xl text-wine-100">{t("heroSubtitle")}</p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-wine-700 hover:bg-gray-100"
            >
              {t("goToDashboard")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="bg-gold-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Megaphone className="h-6 w-6 text-wine-700" />
              {t("announcementsTitle")}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {announcement.imageUrl && (
                    <div className="flex h-40 items-center justify-center bg-gray-100">
                      <ImageWithLightbox
                        src={announcement.imageUrl}
                        alt=""
                        className="h-full w-full cursor-zoom-in object-contain"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{announcement.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t("upcomingExams")}</h2>
          <Link href="/examenes" className="text-sm font-medium text-wine-700 hover:text-wine-800">
            {t("viewAll")}
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState title={t("noExamsScheduled")} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((examDate) => (
              <ExamDateCard key={examDate.id} examDate={examDate} />
            ))}
          </div>
        )}
      </section>

      {faqs.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <HelpCircle className="h-6 w-6 text-wine-700" />
                {t("faqsTitle")}
              </h2>
              <Link href="/faqs" className="text-sm font-medium text-wine-700 hover:text-wine-800">
                {t("viewAll")}
              </Link>
            </div>
            <dl className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {faqs.slice(0, 4).map((faq) => (
                <div key={faq.id} className="rounded-lg border border-gray-200 p-5">
                  <dt className="font-semibold text-gray-900">{faq.question}</dt>
                  <dd className="mt-1 text-sm text-gray-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}
