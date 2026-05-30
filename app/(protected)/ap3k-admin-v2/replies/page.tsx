import { getAdminV2ReplyTemplates } from "@/lib/admin-v2/queries";
import { V2Table } from "@/components/admin-v2/v2-table";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import { ReplyEditModal } from "@/components/admin-v2/reply-edit-modal";

export default async function AdminV2RepliesPage() {
  const templates = await getAdminV2ReplyTemplates(0);

  const rows = templates.map((t) => [
    <div key="campaign" className="min-w-0">
      <p className="max-w-[180px] truncate font-bold text-slate-200">{t.campaignName}</p>
      <p className="text-[11px] text-slate-500">{t.ownerEmail ?? "—"}</p>
    </div>,
    <V2Badge key="status" tone={t.active ? "green" : "slate"}>
      {t.active ? "Active" : "Paused"}
    </V2Badge>,
    <p key="r1" className="max-w-[220px] truncate text-[11px] text-slate-300">{t.reply1 ?? "—"}</p>,
    <p key="r2" className="max-w-[220px] truncate text-[11px] text-slate-400">{t.reply2 ?? "—"}</p>,
    <p key="r3" className="max-w-[220px] truncate text-[11px] text-slate-400">{t.reply3 ?? "—"}</p>,
    <ReplyEditModal
      key="actions"
      campaignId={t.campaignId}
      campaignName={t.campaignName}
      initialReplies={{
        commentReply: t.reply1,
        commentReply2: t.reply2,
        commentReply3: t.reply3,
      }}
    />,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Replies</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Replies (Templates &amp; Usage)</h1>
        <p className="mt-1 text-xs text-slate-500">
          Sourced from campaign listener configurations. No separate reply template model exists.
        </p>
      </div>
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] px-6 py-10 text-center text-sm text-slate-500">
          No campaigns with public reply templates found.
        </div>
      ) : (
        <V2Table
          headers={["Campaign", "Status", "Reply variant 1", "Reply variant 2", "Reply variant 3", "Actions"]}
          rows={rows}
          empty="No reply templates found."
        />
      )}
    </div>
  );
}
