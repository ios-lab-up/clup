import { listSettings, SETTING_LABELS } from "@/features/admin-settings/queries";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { EmailTestButtons } from "@/components/admin/EmailTestButtons";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Settings • Admin CLUP" };

export default async function AdminSettingsPage() {
  const [settings, admin] = await Promise.all([listSettings(), requireAdmin()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-gray-600">Global platform settings.</p>
      <div className="mt-6 max-w-xl space-y-6">
        <SettingsForm settings={settings} labels={SETTING_LABELS} />
        <EmailTestButtons adminEmail={admin.email} />
      </div>
    </div>
  );
}
