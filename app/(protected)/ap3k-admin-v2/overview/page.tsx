import {
  getAdminV2Stats,
  getAdminV2SystemHealth,
  getAdminV2RecentActivity,
} from "@/lib/admin-v2/queries";
import { StatCard } from "@/components/admin-v2/stat-card";
import { V2Badge, eventTone } from "@/components/admin-v2/v2-badge";
import { humanEvent } from "@/lib/admin-v2/labels";
import LocalTime from "@/components/global/local-time";
import Link from "next/link";

// Overview: 9 parallelized DB queries via 3 function calls in one Promise.all.
export default async function AdminV2OverviewPage() {
  const [stats, health, activity] = await Promise.all([
    getAdminV2Stats(),
    getAdminV2SystemHealth(),
    getAdminV2RecentActivity(),
  ]);

  const needsAttention = health.attentionAccounts > 0 || health.campaignsNeedingReview > 0 || stats.failedToday > 0;

  // Filter out raw webhook noise from the live feed
  const liveActivity = activity
    .filter((e) => e.eventType !== "WEBHOOK_RECEIVED")
    .slice(0, 30);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Overview</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Platform Health</h1>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Connected accounts" value={stats.connectedAccounts} />
        <StatCard label="Active campaigns" value={stats.activeCampaigns} />
        <StatCard label="Replies today" value={stats.repliesToday} />
        <StatCard label="Leads today" value={stats.leadsToday} />
        <StatCard
          label="Failed today"
          value={stats.failedToday}
          sub={stats.failedToday > 0 ? "Check diagnostics" : undefined}
        />
      </div>

      {/* System Health */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">
          System Health
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HealthTile
            label="Accounts needing attention"
            value={health.attentionAccounts}
            ok={health.attentionAccounts === 0}
          />
          <HealthTile
            label="Campaigns needing review"
            value={health.campaignsNeedingReview}
            ok={health.campaignsNeedingReview === 0}
          />
          <HealthTile
            label="Failed actions today"
            value={stats.failedToday}
            ok={stats.failedToday === 0}
          />
          <HealthTile
            label="Active campaigns"
            value={stats.activeCampaigns}
            ok={stats.activeCampaigns > 0}
          />
        </div>
      </section>

      {/* Requires Attention */}
      {needsAttention && (
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-black text-amber-400">⚠ Requires Attention</h2>
            <Link
              href="/ap3k-admin-v2/diagnostics"
              className="text-[11px] font-bold text-slate-500 hover:text-slate-300"
            >
              View diagnostics →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {health.attentionAccounts > 0 && (
              <AttentionRow
                icon="🔌"
                message={`${health.attentionAccounts} Instagram account${health.attentionAccounts !== 1 ? "s" : ""} disconnected, expired, or require reconnection.`}
                href="/ap3k-admin-v2/accounts"
                linkLabel="View accounts →"
              />
            )}
            {health.campaignsNeedingReview > 0 && (
              <AttentionRow
                icon="🚩"
                message={`${health.campaignsNeedingReview} campaign${health.campaignsNeedingReview !== 1 ? "s" : ""} paused and require review before reactivation.`}
                href="/ap3k-admin-v2/campaigns"
                linkLabel="View campaigns →"
              />
            )}
            {stats.failedToday > 0 && (
              <AttentionRow
                icon="❌"
                message={`${stats.failedToday} failed action${stats.failedToday !== 1 ? "s" : ""} recorded today.`}
                href="/ap3k-admin-v2/diagnostics"
                linkLabel="View diagnostics →"
              />
            )}
          </div>
        </section>
      )}

      {/* Live Activity */}
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">
          Live Activity
        </h2>
        {liveActivity.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-500">
            No activity yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {liveActivity.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5"
              >
                <V2Badge tone={eventTone(event.eventType)}>
                  {humanEvent(event.eventType)}
                </V2Badge>
                <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                  {event.campaignName ?? "—"}
                  {event.keyword ? (
                    <>
                      {" · "}
                      <span className="text-slate-300">&ldquo;{event.keyword}&rdquo;</span>
                    </>
                  ) : null}
                </span>
                <span className="shrink-0 text-[11px] text-slate-600">
                  <LocalTime value={event.createdAt} />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HealthTile({ label, value, ok }: { label: string; value: number; ok: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        ok
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-amber-500/25 bg-amber-500/[0.06]"
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${ok ? "text-emerald-400" : "text-amber-400"}`}>
        {value}
      </p>
    </div>
  );
}

function AttentionRow({
  icon,
  message,
  href,
  linkLabel,
}: {
  icon: string;
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-2.5">
      <span className="shrink-0 text-sm">{icon}</span>
      <span className="min-w-0 flex-1 text-xs text-slate-300">{message}</span>
      <a href={href} className="shrink-0 text-[11px] font-bold text-amber-400 hover:text-amber-300">
        {linkLabel}
      </a>
    </div>
  );
}
