import { getAdminV2Stats, getAdminV2RecentActivity } from "@/lib/admin-v2/queries";
import { StatCard } from "@/components/admin-v2/stat-card";
import { V2Badge, eventTone } from "@/components/admin-v2/v2-badge";
import LocalTime from "@/components/global/local-time";

export default async function AdminV2OverviewPage() {
  const [stats, activity] = await Promise.all([
    getAdminV2Stats(),
    getAdminV2RecentActivity(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Overview</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Platform Health</h1>
      </div>

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

      <div>
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-400">
          Latest Activity
        </h2>
        {activity.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-500">
            No activity yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {activity.slice(0, 30).map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5"
              >
                <V2Badge tone={eventTone(event.eventType)}>
                  {event.eventType.replace(/_/g, " ").toLowerCase()}
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
      </div>
    </div>
  );
}
