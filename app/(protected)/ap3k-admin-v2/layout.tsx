import { requireOwnerAdmin } from "@/lib/admin";
import { AdminV2Nav } from "@/components/admin-v2/nav";

export default async function AdminV2Layout({ children }: { children: React.ReactNode }) {
  const admin = await requireOwnerAdmin();

  return (
    <div className="min-h-screen bg-[#050816] text-slate-50">
      <AdminV2Nav email={admin.email} />
      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
