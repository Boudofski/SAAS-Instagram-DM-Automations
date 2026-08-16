import Link from "next/link";
import { getAdminV2SystemSnapshot } from "@/lib/admin-v2/operations-queries";
import {
  adminDangerZoneStatus,
  adminEnvironmentLabel,
} from "@/lib/admin-control-center";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { StatCard } from "@/components/admin-v2/stat-card";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import LocalTime from "@/components/global/local-time";

function configTone(value: boolean) {
  return value ? "green" as const : "amber" as const;
}

export default async function AdminSystemPage() {
  const snapshot = await getAdminV2SystemSnapshot();
  const guardrails = adminDangerZoneStatus();
  const environment = adminEnvironmentLabel();
  const emailAllowlistConfigured = Boolean(process.env.ADMIN_EMAILS?.trim());
  const clerkAllowlistConfigured = Boolean(process.env.ADMIN_CLERK_USER_IDS?.trim());
  const instagramLoginEnabled = process.env.INSTAGRAM_LOGIN_ENABLED === "true";
  const appReviewMode = isAppReviewMode();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-pink-400">System &amp; Safety</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Operational Control</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
          High-level health, environment state, and admin guardrails. Secrets and raw access tokens are intentionally excluded from this dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Meta events · 24h" value={snapshot.realMetaEvents24h} />
        <StatCard
          label="Signature failures"
          value={snapshot.signatureFailures24h}
          tone={snapshot.signatureFailures24h > 0 ? "red" : "green"}
        />
        <StatCard
          label="Failed sends"
          value={snapshot.failedMessages24h}
          tone={snapshot.failedMessages24h > 0 ? "amber" : "green"}
        />
        <StatCard
          label="Loop guard · 24h"
          value={snapshot.loopGuardEvents24h}
          tone={snapshot.loopGuardEvents24h > 0 ? "red" : "green"}
        />
        <StatCard
          label="Accounts to review"
          value={snapshot.reconnectRequired}
          tone={snapshot.reconnectRequired > 0 ? "amber" : "green"}
        />
        <StatCard label="Admin actions · 24h" value={snapshot.adminActions24h} tone="blue" />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1220]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Configuration</p>
              <h2 className="mt-1 text-base font-black text-white">Runtime state</h2>
            </div>
            <V2Badge tone={environment === "Production" ? "green" : "amber"}>{environment}</V2Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ConfigItem label="Admin email allowlist" value={emailAllowlistConfigured ? "Configured" : "Not configured"} ok={emailAllowlistConfigured} />
            <ConfigItem label="Admin Clerk-ID allowlist" value={clerkAllowlistConfigured ? "Configured" : "Optional / not set"} ok={emailAllowlistConfigured || clerkAllowlistConfigured} />
            <ConfigItem label="Instagram Login" value={instagramLoginEnabled ? "Enabled" : "Disabled"} ok={instagramLoginEnabled} />
            <ConfigItem label="App Review mode" value={appReviewMode ? "Enabled" : "Disabled"} ok />
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-3 text-xs text-slate-400">
            Last real Meta webhook:{" "}
            <span className="font-bold text-slate-200">
              {snapshot.lastRealWebhook ? <LocalTime value={snapshot.lastRealWebhook.createdAt} /> : "None recorded"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1220]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.18)]">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Guardrails</p>
          <h2 className="mt-1 text-base font-black text-white">Sensitive admin operations</h2>
          <div className="mt-5 divide-y divide-white/[0.06]">
            {Object.entries(guardrails).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="text-xs font-bold text-slate-400">{key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}</span>
                <V2Badge tone={value === "Disabled" ? "slate" : "green"}>{value}</V2Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <QuickLink href="/admin/diagnostics" title="Diagnostics" detail="Inspect webhook and delivery failures." />
        <QuickLink href="/admin/accounts" title="Accounts" detail="Review connection and webhook health." />
        <QuickLink href="/admin/audit" title="Audit log" detail="Review every sensitive admin action." />
      </section>
    </div>
  );
}

function ConfigItem({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{label}</p>
      <div className="mt-2"><V2Badge tone={configTone(ok)}>{value}</V2Badge></div>
    </div>
  );
}

function QuickLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-pink-500/30 hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">{title}</span>
        <span className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-pink-400">→</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Link>
  );
}
