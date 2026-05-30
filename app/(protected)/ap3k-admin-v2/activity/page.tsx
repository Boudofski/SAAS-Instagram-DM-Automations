import { getAdminV2Activity, getAdminV2ActivityCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge, eventTone } from "@/components/admin-v2/v2-badge";
import LocalTime from "@/components/global/local-time";

type Props = { searchParams?: { page?: string } };

const HUMAN_EVENT: Record<string, string> = {
  COMMENT_RECEIVED: "Comment received",
  WEBHOOK_RECEIVED: "Webhook received",
  KEYWORD_MATCHED: "Keyword matched",
  PUBLIC_REPLY_SENT: "Public reply sent",
  DM_SENT: "DM sent",
  DM_FAILED: "DM failed",
  DM_SKIPPED: "DM skipped",
  PUBLIC_REPLY_FAILED: "Reply failed",
  DUPLICATE_SKIPPED: "Duplicate skipped",
  SELF_COMMENT_SKIPPED: "Self-comment skipped",
  COMMENT_SKIPPED: "Comment skipped",
  LOOP_GUARD_TRIGGERED: "Loop guard triggered",
  LOOP_GUARD_PAUSED_CAMPAIGN: "Campaign auto-paused",
  NO_MATCH: "No keyword match",
};

export default async function AdminV2ActivityPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [events, total] = await Promise.all([
    getAdminV2Activity(page),
    getAdminV2ActivityCount(),
  ]);

  const rows = events.map((e) => [
    <span key="time" className="tabular-nums text-[11px] text-slate-500">
      <LocalTime value={e.createdAt} />
    </span>,
    <V2Badge key="type" tone={eventTone(e.eventType)}>
      {HUMAN_EVENT[e.eventType] ?? e.eventType.replace(/_/g, " ").toLowerCase()}
    </V2Badge>,
    <span key="campaign" className="max-w-[160px] truncate text-[11px] text-slate-300">
      {e.campaignName ?? "—"}
    </span>,
    <span key="owner" className="text-[11px] text-slate-500">{e.ownerEmail ?? "—"}</span>,
    <span key="keyword" className="text-[11px] text-slate-400">{e.keyword ?? "—"}</span>,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Activity</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          Activity Feed{" "}
          <span className="text-base font-bold text-slate-500">({total})</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Human-readable event log. Raw payloads are not shown by default.
        </p>
      </div>
      <V2Table
        headers={["Time", "Event", "Campaign", "Owner", "Keyword"]}
        rows={rows}
        empty="No activity events found."
      />
      <V2Pagination page={page} total={total} limit={100} base="/ap3k-admin-v2/activity" />
    </div>
  );
}
