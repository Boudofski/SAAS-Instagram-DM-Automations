import Link from "next/link";
import { getAdminV2BillingOverview } from "@/lib/admin-v2/operations-queries";
import { stripeCustomerDashboardUrl } from "@/lib/admin-control-center";
import { StatCard } from "@/components/admin-v2/stat-card";
import { V2Badge, statusTone } from "@/components/admin-v2/v2-badge";
import { V2Table } from "@/components/admin-v2/v2-table";
import LocalTime from "@/components/global/local-time";

export default async function AdminBillingPage() {
  const { stats, rows: subscriptions } = await getAdminV2BillingOverview();

  const rows = subscriptions.map((subscription) => {
    const stripeUrl = stripeCustomerDashboardUrl(subscription.customerId);
    const overrideExpired = Boolean(
      subscription.overrideExpiresAt && subscription.overrideExpiresAt.getTime() <= Date.now()
    );

    return [
      <div key="user" className="min-w-0">
        {subscription.userId ? (
          <Link
            href={`/admin/users/${subscription.userId}`}
            className="font-bold text-slate-200 hover:text-pink-300"
          >
            {subscription.email ?? "Unknown user"}
          </Link>
        ) : (
          <span className="font-bold text-slate-400">{subscription.email ?? "Unlinked subscription"}</span>
        )}
      </div>,
      <V2Badge key="plan" tone={subscription.plan === "PRO" ? "pink" : "slate"}>
        {subscription.plan === "PRO" ? "Creator" : "Free"}
      </V2Badge>,
      stripeUrl ? (
        <a
          key="stripe"
          href={stripeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-sky-400 hover:text-sky-300"
        >
          Open Stripe ↗
        </a>
      ) : (
        <span key="stripe" className="text-[11px] text-slate-600">No Stripe customer</span>
      ),
      subscription.hasOverrides ? (
        <div key="override" className="flex flex-col gap-1">
          <V2Badge tone={overrideExpired ? "slate" : "amber"}>
            {overrideExpired ? "Expired override" : "Custom limits"}
          </V2Badge>
          {subscription.overrideReason && (
            <span className="max-w-[220px] truncate text-[10px] text-slate-500">
              {subscription.overrideReason}
            </span>
          )}
        </div>
      ) : (
        <span key="override" className="text-[11px] text-slate-600">Plan defaults</span>
      ),
      <V2Badge key="status" tone={statusTone(subscription.userStatus ?? "UNKNOWN")}>
        {subscription.userStatus ?? "Unknown"}
      </V2Badge>,
      <span key="updated" className="whitespace-nowrap text-[11px] text-slate-500">
        <LocalTime value={subscription.updatedAt} />
      </span>,
    ];
  });

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-pink-400">Billing</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Plans &amp; Revenue Access</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
          Platform-wide subscription visibility. Billing mutations stay on the individual user page so every sensitive action remains contextual and auditable.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subscriptions" value={stats.total} sub="All internal subscription records" />
        <StatCard label="Creator plans" value={stats.pro} tone="pink" />
        <StatCard label="Free plans" value={stats.free} />
        <StatCard label="Stripe linked" value={stats.stripeLinked} tone="blue" />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Recent subscriptions</h2>
            <p className="mt-1 text-[11px] text-slate-600">Showing the 100 most recently updated records.</p>
          </div>
        </div>
        <V2Table
          headers={["User", "Plan", "Stripe", "Limits", "User status", "Updated"]}
          rows={rows}
          empty="No subscription records found."
        />
      </section>
    </div>
  );
}
