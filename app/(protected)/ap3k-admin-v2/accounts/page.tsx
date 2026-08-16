import { getAdminV2Accounts, getAdminV2AccountCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge, accountHealth } from "@/components/admin-v2/v2-badge";
import { AdvancedPanel } from "@/components/admin-v2/advanced-panel";
import { AccountActionsCell } from "@/components/admin-v2/account-actions-cell";
import { AdminPageHeader } from "@/components/admin-v2/page-header";
import LocalTime from "@/components/global/local-time";

type Props = { searchParams?: { page?: string } };

function webhookState(mode: string | null): { label: string; tone: "green" | "amber" | "slate" } {
  if (!mode) return { label: "Unknown", tone: "slate" };
  if (mode === "API_SUBSCRIBED" || mode === "INSTAGRAM_LOGIN_API_SUBSCRIBED") {
    return { label: "Subscribed", tone: "green" };
  }
  if (mode.includes("PENDING") || mode.includes("RETRY")) return { label: "Pending", tone: "amber" };
  return { label: mode.replace(/_/g, " "), tone: "slate" };
}

export default async function AdminV2AccountsPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [accounts, total] = await Promise.all([
    getAdminV2Accounts(page),
    getAdminV2AccountCount(),
  ]);

  const rows = accounts.map((account) => {
    const health = accountHealth(account);
    const webhook = webhookState(account.webhookSubscriptionMode);

    return [
      <div key="ig" className="min-w-0">
        <p className="font-bold text-slate-100">
          {account.instagramUsername ? `@${account.instagramUsername}` : "Unknown account"}
        </p>
        {account.pageName && <p className="mt-0.5 truncate text-[11px] text-slate-500">{account.pageName}</p>}
      </div>,
      <span key="owner" className="break-all text-[11px] text-slate-400 sm:break-normal">{account.ownerEmail ?? "—"}</span>,
      <V2Badge key="health" tone={health.tone}>{health.label}</V2Badge>,
      <V2Badge key="webhook" tone={webhook.tone}>{webhook.label}</V2Badge>,
      account.oauthLastError ? (
        <span
          key="error"
          title={account.oauthLastError}
          className="block max-w-[220px] truncate text-[11px] text-amber-300"
        >
          {account.oauthLastError}
        </span>
      ) : (
        <span key="error" className="text-[11px] text-slate-600">None</span>
      ),
      <span key="created" className="whitespace-nowrap text-[11px] text-slate-500">
        <LocalTime value={account.createdAt} mode="date" />
      </span>,
      <AdvancedPanel key="ids" label="View IDs">
        <div className="flex flex-col gap-1 font-mono text-[11px] text-slate-400">
          <p>IG ID: {account.instagramId ?? "—"}</p>
          <p>Page ID: {account.pageId ?? "—"}</p>
          <p>Business ID: {account.businessId ?? "—"}</p>
        </div>
      </AdvancedPanel>,
      <AccountActionsCell
        key="actions"
        integrationId={account.id}
        instagramUsername={account.instagramUsername}
        status={account.status}
        reconnectRequired={account.reconnectRequired}
      />,
    ];
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <AdminPageHeader
        eyebrow="Accounts"
        title="Instagram accounts"
        count={total}
        description="Connection health, webhook subscription state, and safe account controls. Raw access tokens are never displayed."
      />

      <V2Table
        headers={["Account", "Owner", "Health", "Webhook", "Last error", "Connected", "Meta IDs", "Actions"]}
        rows={rows}
        empty="No Instagram accounts found."
      />
      <V2Pagination page={page} total={total} base="/admin/accounts" />
    </div>
  );
}
