import type { Metadata } from "next";
import { requireOwnerAdmin } from "@/lib/admin";
import { adminEnvironmentLabel } from "@/lib/admin-control-center";
import { AdminV2Nav } from "@/components/admin-v2/nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AP3K Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireOwnerAdmin();

  return (
    <div className="min-h-screen bg-[#060914] text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.08),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.06),transparent_28%)]" />
      <AdminV2Nav email={admin.email} environment={adminEnvironmentLabel()} />
      <main className="relative min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
