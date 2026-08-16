import Link from "next/link";
import {
  AlertTriangle,
  Instagram,
  Megaphone,
  MessageCircleMore,
  ShieldCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import {
  getAdminV2Stats,
  getAdminV2SystemHealth,
  getAdminV2RecentActivity,
} from "@/lib/admin-v2/queries";
import { StatCard } from "@/components/admin-v2/stat-card";
import { V2Badge, eventTone } from "@/components/admin-v2/v2-badge";
import {
  AdminPageHeader,
  AdminSectionHeader,
  AdminSurface,
} from "@/components/admin-v2/page-header";
import { humanEvent } from "@/lib/admin-v2/labels";
import LocalTime from "@/components/global/local-time";

export default async function AdminV2OverviewPage() {
  const [stats, health, activity] = await Promise.all([
    getAdminV2Stats(),
    getAdminV2SystemHealth(),
    getAdminV2RecentActivity(),
  ]);

  const needsAttention = health.attentionAccounts > 0 || health.campaignsNeedingReview > 0 || stats.failedToday > 0;
  const liveActivity = activity
    .filter((event) => event.eventType !== "WEBHOOK_RECEIVED")
    .slice(0, 12);

  return (
    <div className="flex flex-col gap-7 sm:gap-8">
      <AdminPageHeader
        eyebrow="Overview"
        title="Platform health"
        description="A focused view of AP3K usage, automation health, and the signals that need owner attention."
        actions={
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${
              needsAttention
                ? "border-amber-500/20 bg-amber-500/[0.08] text-amber-200"
                : "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
            }`}
          >
            {needsAttention ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {needsAttention ? "Review recommended" : "All systems healthy"}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total users" value={stats.totalUsers} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Connected accounts" value={stats.connectedAccounts} icon={<Instagram className="h-4 w-4" />} tone="pink" />
        <StatCard label="Active campaigns" value={stats.activeCampaigns} icon={<Megaphone className="h-4 w-4" />} tone="blue" />
        <StatCard label="Replies today" value={stats.repliesToday} icon={<MessageCircleMore className="h-4 w-4" />} tone="green" />
        <StatCard label="Leads today" value={stats.leadsToday} icon={<UserRoundPlus className="h-4 w-4" />} tone="green" />
        <StatCard
          label="Failed today"
          value={stats.failedToday}
          sub={stats.failedToday > 0 ? "Open diagnostics for details" : "No failed sends today"}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={stats.failedToday > 0 ? "red" : "slate"}
        />
      </div>

      <section>
        <AdminSectionHeader
          title="System health"
          description="Fast checks for the areas most likely to affect customer automations."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HealthTile
            label="Accounts needing attention"
            value={health.attentionAccounts}
            ok={health.attentionAccounts === 0}
            href="/admin/accounts"
          />
          <HealthTile
            label="Campaigns needing review"
            value={health.campaignsNeedingReview}
            ok={health.campaignsNeedingReview === 0}
            href="/admin/campaigns"
          />
          <HealthTile
            label="Failed actions today"
            value={stats.failedToday}
            ok={stats.failedToday === 0}
            href="/admin/diagnostics"
          />
          <HealthTile
            label="Active campaigns"
            value={stats.activeCampaigns}
            ok={stats.activeCampaigns > 0}
            href="/admin/campaigns"
          />
        </div>
      </section>

      {needsAttention && (
        <section>
          <AdminSectionHeader
            title="Requires attention"
            action={
              <Link href="/admin/diagnostics" className="text-[11px] font-bold text-pink-300 hover:text-pink-200">
                Open diagnostics →
              </Link>
            }
          />
          <div className="grid gap-2">
            {health.attentionAccounts > 0 && (
              <AttentionRow
                message={`${health.attentionAccounts} Instagram account${health.attentionAccounts !== 1 ? "s" : ""} disconnected, expired, or require reconnection.`}
                href="/admin/accounts"
                linkLabel="Review accounts"
              />
            )}
            {health.campaignsNeedingReview > 0 && (
              <AttentionRow
                message={`${health.campaignsNeedingReview} campaign${health.campaignsNeedingReview !== 1 ? "s" : ""} require owner review before reactivation.`}
                href="/admin/campaigns"
                linkLabel="Review campaigns"
              />
            )}
            {stats.failedToday > 0 && (
              <AttentionRow
                message={`${stats.failedToday} failed action${stats.failedToday !== 1 ? "s" : ""} recorded today.`}
                href="/admin/diagnostics"
                linkLabel="Inspect failures"
              />
            )}
          </div>
        </section>
      )}

      <section>
        <AdminSectionHeader
          title="Live activity"
          description="The latest meaningful automation events. Webhook receipt noise is intentionally hidden here."
          action={
            <Link href="/admin/activity" className="text-[11px] font-bold text-pink-300 hover:text-pink-200">
              View full activity →
            </Link>
          }
        />

        <AdminSurface className="overflow-hidden">
          {liveActivity.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">No activity yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {liveActivity.map((event) => (
                <div
                  key={event.id}
                  className="flex min-w-0 flex-col gap-2 px-4 py-3 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-3 sm:px-5"
                >
                  <V2Badge tone={eventTone(event.eventType)}>{humanEvent(event.eventType)}</V2Badge>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">{event.campaignName ?? "Unknown campaign"}</span>
                    {event.keyword ? (
                      <>
                        {" · "}
                        <span className="text-slate-500">keyword “{event.keyword}”</span>
                      </>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-slate-600 sm:text-[11px]">
                    <LocalTime value={event.createdAt} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </AdminSurface>
      </section>
    </div>
  );
}

function HealthTile({
  label,
  value,
  ok,
  href,
}: {
  label: string;
  value: number;
  ok: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5 ${
        ok
          ? "border-emerald-500/15 bg-emerald-500/[0.045] hover:border-emerald-500/25"
          : "border-amber-500/20 bg-amber-500/[0.055] hover:border-amber-500/35"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase leading-4 tracking-[0.13em] text-slate-500">{label}</p>
        <span className="text-xs text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400">→</span>
      </div>
      <p className={`mt-3 text-2xl font-black tabular-nums ${ok ? "text-emerald-300" : "text-amber-200"}`}>{value}</p>
    </Link>
  );
}

function AttentionRow({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-amber-500/18 bg-amber-500/[0.045] px-4 py-3 sm:flex-row sm:items-center">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-amber-500/20 bg-amber-500/[0.08] text-amber-300">
        <AlertTriangle className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-xs leading-5 text-slate-300">{message}</span>
      <Link href={href} className="shrink-0 text-[11px] font-bold text-amber-200 hover:text-white">
        {linkLabel} →
      </Link>
    </div>
  );
}
