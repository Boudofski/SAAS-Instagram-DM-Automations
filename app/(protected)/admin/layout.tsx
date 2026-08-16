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
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#070a12] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden">
        <div className="absolute -left-40 -top-44 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.07] blur-[120px]" />
        <div className="absolute right-[5%] -top-56 h-[34rem] w-[34rem] rounded-full bg-blue-500/[0.055] blur-[140px]" />
        <div className="absolute left-[42%] top-10 h-72 w-72 rounded-full bg-violet-500/[0.035] blur-[120px]" />
      </div>

      <AdminV2Nav email={admin.email} environment={adminEnvironmentLabel()} />

      <main className="relative min-h-screen lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1780px] px-3 pb-12 pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:py-8 xl:px-10 2xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
