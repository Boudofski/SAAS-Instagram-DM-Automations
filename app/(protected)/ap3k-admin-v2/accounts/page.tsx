import { getAdminV2Accounts, getAdminV2AccountCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge, accountHealth } from "@/components/admin-v2/v2-badge";
import { AdvancedPanel } from "@/components/admin-v2/advanced-panel";
import LocalTime from "@/components/global/local-time";

type Props = { searchParams?: { page?: string } };

export default async function AdminV2AccountsPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [accounts, total] = await Promise.all([
    getAdminV2Accounts(page),
    getAdminV2AccountCount(),
  ]);

  const rows = accounts.map((a) => {
    const health = accountHealth(a);
    return [
      <div key="ig" className="min-w-0">
        <p className="font-bold text-slate-200">
          {a.instagramUsername ? `@${a.instagramUsername}` : "Unknown"}
        </p>
        {a.pageName && <p className="text-[11px] text-slate-500">{a.pageName}</p>}
      </div>,
      <span key="owner" className="text-[11px] text-slate-400">{a.ownerEmail ?? "—"}</span>,
      <V2Badge key="health" tone={health.tone}>{health.label}</V2Badge>,
      <div key="webhook" className="text-[11px]">
        <V2Badge tone={a.webhookSubscriptionMode === "API_SUBSCRIBED" ? "green" : "slate"}>
          {a.webhookSubscriptionMode ?? "Unknown"}
        </V2Badge>
      </div>,
      a.oauthLastError ? (
        <span key="error" className="max-w-[180px] truncate text-[11px] text-amber-400">{a.oauthLastError}</span>
      ) : (
        <span key="error" className="text-[11px] text-slate-600">—</span>
      ),
      <span key="created" className="text-[11px] text-slate-500">
        <LocalTime value={a.createdAt} mode="date" />
      </span>,
      <AdvancedPanel key="ids" label="Meta IDs (internal)">
        <div className="flex flex-col gap-1 font-mono text-[11px] text-slate-400">
          <p>IG ID: {a.instagramId ?? "—"}</p>
          <p>Page ID: {a.pageId ?? "—"}</p>
          <p>Business ID: {a.businessId ?? "—"}</p>
        </div>
      </AdvancedPanel>,
    ];
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Accounts</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          Instagram Accounts{" "}
          <span className="text-base font-bold text-slate-500">({total})</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Raw access tokens are never displayed. Meta IDs are hidden by default inside the Advanced panel.
        </p>
      </div>
      <V2Table
        headers={["Account", "Owner", "Health", "Webhook", "Last error", "Connected", "Meta IDs"]}
        rows={rows}
        empty="No accounts found."
      />
      <V2Pagination page={page} total={total} base="/ap3k-admin-v2/accounts" />
    </div>
  );
}
