"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/ap3k-admin-v2/overview" },
  { label: "Users", href: "/ap3k-admin-v2/users" },
  { label: "Accounts", href: "/ap3k-admin-v2/accounts" },
  { label: "Campaigns", href: "/ap3k-admin-v2/campaigns" },
  { label: "Replies", href: "/ap3k-admin-v2/replies" },
  { label: "Activity", href: "/ap3k-admin-v2/activity" },
  { label: "Diagnostics", href: "/ap3k-admin-v2/diagnostics" },
];

export function AdminV2Nav({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/[0.08] bg-[#050816]/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-pink-400">AP3k Admin v2</span>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 sm:inline">
              Read-only · Phase 1
            </span>
          </div>
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden text-[11px] text-slate-500 sm:inline">{email}</span>
            )}
            <Link
              href="/admin"
              className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:border-white/20 hover:text-slate-200"
            >
              ← Admin v1
            </Link>
          </div>
        </div>
        <nav className="-mb-px flex gap-0.5 overflow-x-auto">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-black transition-colors",
                  active
                    ? "border-pink-500 text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
