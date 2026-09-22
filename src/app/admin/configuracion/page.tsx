import { listSettings, SETTING_LABELS } from "@/features/admin-settings/queries";
import { listCatalog } from "@/features/admin-catalog/queries";
import { listAllCampuses } from "@/features/admin-campus/queries";
import { listEmailSettings, listReminderSchedules } from "@/features/admin-email-settings/queries";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { EmailTestButtons } from "@/components/admin/EmailTestButtons";
import { CatalogManager } from "@/components/admin/CatalogManager";
import { CampusManager } from "@/components/admin/CampusManager";
import { EmailSettingsManager } from "@/components/admin/EmailSettingsManager";
import { Tabs } from "@/components/ui/Tabs";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Settings • Admin CLUP" };

export default async function AdminSettingsPage() {
  const [settings, faculties, campuses, emailSettings, reminderSchedules, admin] = await Promise.all([
    listSettings(),
    listCatalog(),
    listAllCampuses(),
    listEmailSettings(),
    listReminderSchedules(),
    requireAdmin(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-gray-600">Global platform settings and the faculty / program catalog.</p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        <Tabs
          items={[
            {
              value: "general",
              label: "General",
              content: (
                <div className="max-w-xl space-y-6">
                  <SettingsForm settings={settings} labels={SETTING_LABELS} />
                </div>
              ),
            },
            {
              value: "emails",
              label: "Emails",
              content: (
                <div className="max-w-2xl space-y-8">
                  <div>
                    <p className="mb-4 text-sm text-gray-600">
                      Every email the platform sends, listed here. Turn any of them off, and configure how
                      many times (and how long before the exam) the reminder goes out.
                    </p>
                    <EmailSettingsManager emailSettings={emailSettings} reminderSchedules={reminderSchedules} />
                  </div>
                  <div className="border-t border-gray-200 pt-6">
                    <EmailTestButtons adminEmail={admin.email} />
                  </div>
                </div>
              ),
            },
            {
              value: "catalog",
              label: "Catalog",
              content: (
                <div>
                  <p className="mb-4 text-sm text-gray-600">
                    Faculties and their programs. Students pick one during onboarding; the passing
                    minimum can be overridden per faculty or per program on each exam.
                  </p>
                  <CatalogManager
                    faculties={faculties.map((faculty) => ({
                      id: faculty.id,
                      name: faculty.name,
                      order: faculty.order,
                      isExternal: faculty.isExternal,
                      active: faculty.active,
                      careers: faculty.careers.map((career) => ({
                        id: career.id,
                        name: career.name,
                        order: career.order,
                        active: career.active,
                      })),
                    }))}
                  />

                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">Campus</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      Campus the student picks during onboarding, editable later from their profile.
                    </p>
                    <CampusManager
                      campuses={campuses.map((campus) => ({
                        id: campus.id,
                        name: campus.name,
                        order: campus.order,
                        active: campus.active,
                      }))}
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
