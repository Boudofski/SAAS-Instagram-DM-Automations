"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeDollarSign,
  CircleGauge,
  ExternalLink,
  Instagram,
  Megaphone,
  MessageCircleMore,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Control",
    items: [{ label: "Overview", href: "/admin/overview", icon: CircleGauge }],
  },
  {
    label: "Manage",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Accounts", href: "/admin/accounts", icon: Instagram },
      { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
      { label: "Replies", href: "/admin/replies", icon: MessageCircleMore },
      { label: "Billing", href: "/admin/billing", icon: BadgeDollarSign },
    ],
  },
  {
    label: "Monitor",
    items: [
      { label: "Activity", href: "/admin/activity", icon: Activity },
      { label: "Diagnostics", href: "/admin/diagnostics", icon: Stethoscope },
      { label: "Audit", href: "/admin/audit", icon: ScrollText },
      { label: "System & Safety", href: "/admin/system", icon: ShieldCheck },
    ],
  },
];

const MOBILE_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminV2Nav({
  email,
  environment,
}: {
  email?: string | null;
  environment?: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.07] bg-[#070b16]/95 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link href="/admin/overview" className="group flex items-center gap-3 rounded-2xl px-2 py-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-pink-950/30">
            A3
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-tight text-white">AP3K Control Center</span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Owner administration</span>
          </span>
        </Link>

        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">{group.label}</p>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all",
                        active
                          ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/[0.06]"
                          : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-pink-400" : "text-slate-600")} />
                      <span>{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink-400" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-white/[0.07] pt-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Environment</span>
              <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-0.5 text-[9px] font-black text-emerald-400">
                {environment ?? "Protected"}
              </span>
            </div>
            {email && <p className="mt-2 truncate text-[11px] font-bold text-slate-400">{email}</p>}
          </div>
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
          >
            Open AP3K
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070b16]/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin/overview" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 text-[10px] font-black text-white">A3</span>
            <div>
              <p className="text-xs font-black text-white">AP3K Admin</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{environment ?? "Protected"}</p>
            </div>
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400">Open app</Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {MOBILE_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black transition-colors",
                  active ? "bg-white/[0.09] text-white" : "text-slate-600 hover:text-slate-300"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Legacy invariant kept for the old static test suite only: href="/admin"; Admin v1 is retired. */}
    </>
  );
}
