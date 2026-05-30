import { getAdminV2Campaigns, getAdminV2CampaignCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import type { AdminV2Campaign } from "@/lib/admin-v2/queries";
import LocalTime from "@/components/global/local-time";

type Props = { searchParams?: { page?: string } };

function campaignStatusTone(c: AdminV2Campaign) {
  if (c.archivedAt) return "slate" as const;
  if (c.needsReview) return "amber" as const;
  if (c.active) return "green" as const;
  return "red" as const;
}

function campaignStatusLabel(c: AdminV2Campaign) {
  if (c.archivedAt) return "Archived";
  if (c.needsReview) return "Needs review";
  if (c.active) return "Active";
  return "Paused";
}

export default async function AdminV2CampaignsPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [campaigns, total] = await Promise.all([
    getAdminV2Campaigns(page),
    getAdminV2CampaignCount(),
  ]);

  const rows = campaigns.map((c) => [
    <div key="name" className="min-w-0">
      <p className="max-w-[200px] truncate font-bold text-slate-200">{c.name}</p>
      <p className="text-[11px] text-slate-500">{c.ownerEmail ?? "—"}</p>
    </div>,
    <V2Badge key="status" tone={campaignStatusTone(c)}>
      {campaignStatusLabel(c)}
    </V2Badge>,
    <div key="trigger" className="text-[11px]">
      <p className="text-slate-300">
        {c.triggerMode === "ANY_COMMENT" ? "Any comment" : "Keyword"}
      </p>
      {c.keywords.length > 0 && (
        <p className="text-slate-500">
          {c.keywords.slice(0, 2).join(", ")}
          {c.keywords.length > 2 ? "…" : ""}
        </p>
      )}
    </div>,
    <span key="scope" className="text-[11px] text-slate-400">{c.postScope}</span>,
    <V2Badge key="reply" tone={c.hasPublicReply ? "blue" : "slate"}>
      {c.hasPublicReply ? "Reply on" : "No reply"}
    </V2Badge>,
    <span key="replies" className="tabular-nums text-slate-300">{c.replyCount}</span>,
    <span key="leads" className="tabular-nums text-slate-300">{c.leadCount}</span>,
    <span key="created" className="text-[11px] text-slate-500">
      <LocalTime value={c.createdAt} mode="date" />
    </span>,
  ]);

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
        headers={["Campaign", "Status", "Trigger", "Post scope", "Public reply", "Replies", "Leads", "Created"]}
        rows={rows}
        empty="No campaigns found."
      />
      <V2Pagination page={page} total={total} base="/ap3k-admin-v2/campaigns" />
    </div>
  );
}
