import { getAdminV2Campaigns, getAdminV2CampaignCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import type { AdminV2Campaign } from "@/lib/admin-v2/queries";
import LocalTime from "@/components/global/local-time";
import { CampaignActionsCell } from "@/components/admin-v2/campaign-action-modal";

type Props = { searchParams?: { page?: string } };

function campaignHealth(c: AdminV2Campaign): { label: string; tone: "green" | "amber" | "red" | "slate" } {
  if (c.archivedAt) return { label: "Archived", tone: "slate" };
  if (c.needsReview) return { label: "Needs review", tone: "amber" };
  if (c.active) return { label: "Active", tone: "green" };
  return { label: "Paused", tone: "red" };
}

export default async function AdminV2CampaignsPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [campaigns, total] = await Promise.all([
    getAdminV2Campaigns(page),
    getAdminV2CampaignCount(),
  ]);

  const rows = campaigns.map((c) => {
    const health = campaignHealth(c);
    const keyword =
      c.triggerMode === "ANY_COMMENT"
        ? <span key="kw" className="text-slate-500 italic text-[11px]">Any comment</span>
        : c.keywords.length > 0
        ? <span key="kw" className="text-[11px] text-slate-300">{c.keywords.slice(0, 2).join(", ")}{c.keywords.length > 2 ? "…" : ""}</span>
        : <span key="kw" className="text-slate-600 text-[11px]">—</span>;

    return [
      <div key="name" className="min-w-0">
        <p className="max-w-[180px] truncate font-bold text-slate-200">{c.name}</p>
        <p className="text-[11px] text-slate-500">{c.ownerEmail ?? "—"}</p>
      </div>,
      <V2Badge key="status" tone={health.tone}>{health.label}</V2Badge>,
      keyword,
      <span key="scope" className="text-[11px] text-slate-400">{c.postScope}</span>,
      <V2Badge key="reply" tone={c.hasPublicReply ? "blue" : "slate"}>
        {c.hasPublicReply ? "Reply on" : "No reply"}
      </V2Badge>,
      <span key="replies" className="tabular-nums text-slate-300">{c.replyCount}</span>,
      <span key="leads" className="tabular-nums text-slate-300">{c.leadCount}</span>,
      c.lastActivity ? (
        <span key="last" className="text-[11px] text-slate-400"><LocalTime value={c.lastActivity} /></span>
      ) : (
        <span key="last" className="text-[11px] text-slate-600">No activity</span>
      ),
      c.needsReview && c.reviewReason ? (
        <span key="reason" className="max-w-[160px] truncate text-[11px] text-amber-400">{c.reviewReason}</span>
      ) : (
        <span key="reason" className="text-[11px] text-slate-600">—</span>
      ),
      <CampaignActionsCell
        key="actions"
        campaignId={c.id}
        campaignName={c.name}
        active={c.active}
        needsReview={c.needsReview}
        archivedAt={c.archivedAt}
      />,
    ];
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Campaigns</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          All Campaigns{" "}
          <span className="text-base font-bold text-slate-500">({total})</span>
        </h1>
      </div>
      <V2Table
        headers={["Campaign", "Health", "Keyword", "Post scope", "Public reply", "Replies", "Leads", "Last activity", "Pause reason", "Actions"]}
        rows={rows}
        empty="No campaigns found."
      />
      <V2Pagination page={page} total={total} base="/ap3k-admin-v2/campaigns" />
    </div>
  );
}
