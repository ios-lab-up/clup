import { listAdmins } from "@/features/admin-admins/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminsManager } from "@/components/admin/AdminsManager";

export const metadata = { title: "Administrators • Admin CLUP" };

export default async function AdminAdminsPage() {
  const [admins, currentProfile] = await Promise.all([listAdmins(), requireAdmin()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Administrators</h1>
      <p className="mt-1 text-gray-600">Add or remove platform administrators.</p>
      <div className="mt-6">
        <AdminsManager admins={admins} currentProfileId={currentProfile.id} />
      </div>
    </div>
  );
}
