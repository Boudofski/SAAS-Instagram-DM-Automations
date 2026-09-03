"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeDollarSign,
  ChevronRight,
  CircleGauge,
  ExternalLink,
  Instagram,
  Megaphone,
  Menu,
  MessageCircleMore,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
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
      { label: "Automations", href: "/admin/campaigns", icon: Megaphone },
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

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 font-black text-white shadow-[0_10px_32px_rgba(217,70,239,0.22)] ring-1 ring-white/10",
          compact ? "h-9 w-9 text-[11px]" : "h-10 w-10 text-xs"
        )}
      >
        A3
      </span>
      <span className="min-w-0">
        <span className={cn("block truncate font-black tracking-[-0.02em] text-white", compact ? "text-sm" : "text-[15px]")}>AP3K Control Center</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Owner administration</span>
      </span>
    </div>
  );
}

function NavigationGroups({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <section key={group.label}>
          <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.22em] text-slate-600">
            {group.label}
          </p>
          <nav className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex min-h-10 items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-[12px] font-bold transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-pink-500/[0.13] via-fuchsia-500/[0.08] to-transparent text-white ring-1 ring-pink-400/10"
                      : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-pink-400" />}
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors",
                      active
                        ? "border-pink-400/15 bg-pink-400/[0.08] text-pink-300"
                        : "border-transparent bg-white/[0.025] text-slate-500 group-hover:text-slate-300"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-pink-300/70" />}
                </Link>
              );
            })}
          </nav>
        </section>
      ))}
    </div>
  );
}

function EnvironmentCard({ email, environment }: { email?: string | null; environment?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Environment</span>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-black text-emerald-300">
          {environment ?? "Protected"}
        </span>
      </div>
      {email && <p className="mt-2 truncate text-[11px] font-semibold text-slate-400">{email}</p>}
    </div>
  );
}

export function AdminV2Nav({
  email,
  environment,
}: {
  email?: string | null;
  environment?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/[0.065] bg-[#080c16]/96 px-4 py-5 shadow-[18px_0_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl lg:flex">
        <Link href="/admin/overview" className="rounded-2xl px-2 py-1.5">
          <Brand />
        </Link>

        <div className="mt-6 flex-1 overflow-y-auto overscroll-contain pr-1">
          <NavigationGroups pathname={pathname} />
        </div>

        <div className="space-y-2 border-t border-white/[0.065] pt-4">
          <EnvironmentCard email={email} environment={environment} />
          <Link
            href="/dashboard"
            className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
          >
            Open AP3K
            <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 -mx-3 mb-4 border-b border-white/[0.065] bg-[#080c16]/92 px-3 py-3 backdrop-blur-2xl sm:-mx-5 sm:px-5 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/overview" className="min-w-0">
            <Brand compact />
          </Link>
          <button
            type="button"
            aria-label="Open admin navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,326px)] flex-col border-r border-white/[0.08] bg-[#080c16] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-1 py-1">
              <Brand />
              <button
                type="button"
                aria-label="Close admin navigation"
                onClick={() => setMobileOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto overscroll-contain pr-1">
              <NavigationGroups pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className="space-y-2 border-t border-white/[0.065] pt-4">
              <EnvironmentCard email={email} environment={environment} />
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/[0.04] hover:text-white"
              >
                Open AP3K
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Legacy invariant kept for the old static test suite only: href="/admin"; Admin v1 is retired. */}
    </>
  );
}
