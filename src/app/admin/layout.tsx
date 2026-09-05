import { requireAdmin } from "@/lib/auth/guards";
import { Header } from "@/components/layout/Header";
import { AdminNav } from "@/components/layout/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <Header />
      <AdminNav />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
}
