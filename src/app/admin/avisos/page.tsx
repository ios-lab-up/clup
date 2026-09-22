import { listAllAnnouncements } from "@/features/admin-announcements/queries";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";

export const metadata = { title: "Announcements • Admin CLUP" };

export default async function AdminAnnouncementsPage() {
  const announcements = await listAllAnnouncements();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
      <p className="mt-1 text-gray-600">Manage the announcements shown on the public homepage.</p>
      <div className="mt-6">
        <AnnouncementsManager announcements={announcements} />
      </div>
    </div>
  );
}
