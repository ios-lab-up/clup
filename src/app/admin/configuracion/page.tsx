import { listSettings, SETTING_LABELS } from "@/features/admin-settings/queries";
import { listCatalog } from "@/features/admin-catalog/queries";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { EmailTestButtons } from "@/components/admin/EmailTestButtons";
import { CatalogManager } from "@/components/admin/CatalogManager";
import { Tabs } from "@/components/ui/Tabs";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Settings • Admin CLUP" };

export default async function AdminSettingsPage() {
  const [settings, faculties, admin] = await Promise.all([
    listSettings(),
    listCatalog(),
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
                  <EmailTestButtons adminEmail={admin.email} />
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
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
