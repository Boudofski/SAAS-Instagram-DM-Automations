import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminV2UserDetail } from "@/lib/admin-v2/queries";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import { V2Badge, statusTone } from "@/components/admin-v2/v2-badge";
import { UsageBar } from "@/components/admin-v2/usage-bar";
import { UserActionsPanel } from "@/components/admin-v2/user-actions-panel";
import { InternalOverridesCard } from "@/components/admin-v2/internal-overrides-card";
import {
  usageTone,
  formatUsageMetricValue,
  isUnlimited,
  getPlanLabel,
  type ProductPlan,
} from "@/lib/plan-limits";
import { stripe } from "@/lib/stripe";
import LocalTime from "@/components/global/local-time";

type Props = { params: Promise<{ userId: string }> };

export default async function AdminV2UserDetailPage({ params }: Props) {
  const { userId } = await params;

  const [user, usage] = await Promise.all([
    getAdminV2UserDetail(userId),
    getUserMonthlyUsage(userId).catch(() => null),
  ]);

  if (!user) notFound();

  // Safe Stripe subscription lookup — falls back gracefully when key absent or API errors
  let stripeStatus: string | null = null;
  if (user.customerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: user.customerId,
        limit: 1,
      });
      stripeStatus = subs.data[0]?.status ?? null;
    } catch {
      stripeStatus = "unknown";
    }
  }

  const planLabel = getPlanLabel(user.plan as ProductPlan);
  const displayName = [user.firstname, user.lastname].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <div>
        <Link
          href="/ap3k-admin-v2/users"
          className="text-xs font-bold text-slate-500 hover:text-slate-300"
        >
          ← All Users
        </Link>
      </div>

      {/* Page header */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">
          User Detail
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          {user.email}
        </h1>
        {displayName && (
          <p className="mt-1 text-sm text-slate-400">{displayName}</p>
        )}
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
        <h2 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-500">
          Identity
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField
            label="Clerk ID"
            value={
              <span className="break-all font-mono text-[11px] text-slate-300">
                {user.clerkId}
              </span>
            }
          />
          <DetailField
            label="Status"
            value={
              <V2Badge tone={statusTone(user.status)}>{user.status}</V2Badge>
            }
          />
          <DetailField
            label="Created"
            value={<LocalTime value={user.createdAt} mode="date" />}
          />
          <DetailField
            label="Last activity"
            value={
              user.lastActivity ? (
                <LocalTime value={user.lastActivity} />
              ) : (
                <span className="text-slate-600">No activity</span>
              )
            }
          />
          {user.status === "SUSPENDED" && user.suspendedReason && (
            <DetailField
              label="Suspend reason"
              value={
                <span className="text-xs text-amber-400">
                  {user.suspendedReason}
                </span>
              }
            />
          )}
        </dl>
      </div>

      {/* Plan & Billing card */}
      {usage ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
          <h2 className="mb-4 text-[11px] font-black uppercase tracking-widest text-slate-500">
            Plan &amp; Billing
          </h2>

          {/* Plan + period row */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <V2Badge tone={user.plan === "PRO" ? "pink" : "slate"}>
              {planLabel}
            </V2Badge>
            <span className="text-xs text-slate-500">
              Period: {usage.periodLabel}
            </span>
          </div>

          {/* Usage metrics grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricTile
              label="Static replies"
              value={formatUsageMetricValue(usage.staticReplies)}
              bar={
                <UsageBar
                  percent={usage.staticReplies.percent}
                  tone={usageTone(
                    usage.staticReplies.percent,
                    usage.staticReplies.blocked,
                  )}
                />
              }
              sub={`${usage.staticReplies.percent}% used this period`}
            />
            <MetricTile
              label="AI replies"
              value={formatUsageMetricValue(usage.aiReplies)}
              bar={
                isUnlimited(usage.aiReplies.limit) ? undefined : (
                  <UsageBar
                    percent={usage.aiReplies.percent}
                    tone={usageTone(
                      usage.aiReplies.percent,
                      usage.aiReplies.blocked,
                    )}
                  />
                )
              }
            />
            <MetricTile
              label="Connected accounts"
              value={formatUsageMetricValue(usage.connectedAccounts)}
              bar={
                <UsageBar
                  percent={usage.connectedAccounts.percent}
                  tone={usageTone(
                    usage.connectedAccounts.percent,
                    usage.connectedAccounts.blocked,
                  )}
                />
              }
            />
            <MetricTile
              label="Active campaigns"
              value={formatUsageMetricValue(usage.activeCampaigns)}
            />
            <MetricTile
              label="All campaigns"
              value={`${user.totalCampaigns} total · ${user.activeCampaigns} active · ${user.campaignsNeedingReview} needs review`}
            />
          </div>

          {/* Billing state */}
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
              Billing
            </h3>
            {user.customerId ? (
              <div className="flex flex-wrap gap-2">
                <V2Badge tone="green">Stripe customer exists</V2Badge>
                {stripeStatus && (
                  <V2Badge
                    tone={
                      stripeStatus === "active" || stripeStatus === "trialing"
                        ? "green"
                        : stripeStatus === "past_due"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {stripeStatus}
                  </V2Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No external billing record
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
          <p className="text-sm text-slate-500">
            Plan &amp; billing data unavailable.
          </p>
        </div>
      )}

      <InternalOverridesCard user={user} usage={usage} />

      <UserActionsPanel
        userId={user.id}
        email={user.email}
        status={user.status}
        plan={user.plan}
      />
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-300">{value}</div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  bar,
  sub,
}: {
  label: string;
  value: string;
  bar?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
      {bar && <div className="mt-2">{bar}</div>}
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
