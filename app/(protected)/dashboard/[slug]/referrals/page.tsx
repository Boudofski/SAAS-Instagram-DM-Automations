import { onUserInfo } from "@/actions/user";
import { ReferralShareCard } from "@/components/referrals/referral-share-card";
import { getApplicationUrl } from "@/lib/app-url";
import { FOUNDING_PARTNER_LIMIT, getReferralDashboard } from "@/lib/referral-program";
import { BadgeDollarSign, CheckCircle2, ChevronDown, Gift, Instagram, Link2, Users } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  if (!user?.id) redirect("/sign-in");

  const dashboard = await getReferralDashboard(user.id);
  const inviteUrl = `${getApplicationUrl()}/r/${dashboard.code}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-6">
      <header className="ap3k-page-header">
        <div>
          <p className="ap3k-kicker">Founding 10 referral program</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Refer friends. Earn Pro credits.</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">They get 50 replies for 14 days. You earn $9 when they become a paid customer.</p>
        </div>
        <span className={`ap3k-badge ${dashboard.founderRank ? "ap3k-badge-green" : dashboard.founderSlotsRemaining > 0 ? "ap3k-badge-amber" : "ap3k-badge-slate"}`}>
          {dashboard.founderRank
            ? `Founding Partner #${dashboard.founderRank}`
            : `${dashboard.founderSlotsRemaining} of ${FOUNDING_PARTNER_LIMIT} spots left`}
        </span>
      </header>

      <section className="overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.14),transparent_28%),linear-gradient(135deg,#5521c9_0%,#7132df_48%,#b832b0_100%)] p-5 text-white shadow-[0_20px_55px_rgba(91,33,182,0.2)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-white/70"><Gift className="h-4 w-4" /> Limited launch offer</div>
            <h2 className="mt-2 max-w-xl text-2xl font-black leading-tight">One paid referral earns a $9 credit.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Credits apply automatically to a future AP3K invoice. The first 10 qualifying partners lock in Founding Partner status.</p>
          </div>
          <ReferralShareCard inviteUrl={inviteUrl} />
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Friends signed up" value={dashboard.stats.invited} icon={<Users className="h-4 w-4" />} />
        <Stat label="Instagram connected" value={dashboard.stats.connected} icon={<Instagram className="h-4 w-4" />} />
        <Stat label="Qualified referrals" value={dashboard.stats.qualified} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Stat label="AP3K credit earned" value={formatUsd(dashboard.stats.creditEarnedCents)} icon={<BadgeDollarSign className="h-4 w-4" />} />
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="ap3k-panel p-4 sm:p-5">
          <p className="ap3k-kicker">How it works</p>
          <h2 className="mt-1 text-xl font-black">Four steps to your credit</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Step number="1" title="Share your tracked link" text="The referral must create a new AP3K account through your link." icon={<Link2 className="h-4 w-4" />} />
            <Step number="2" title="They connect Instagram" text="A real Business or Creator account unlocks their 14-day, 50-reply trial." icon={<Instagram className="h-4 w-4" />} />
            <Step number="3" title="They buy Pro or Business" text="Stripe must confirm a successful USD payment of at least $9." icon={<BadgeDollarSign className="h-4 w-4" />} />
            <Step number="4" title="Your $9 credit is issued" text="The credit is attached to your AP3K Stripe customer and applies to a future invoice." icon={<Gift className="h-4 w-4" />} />
          </div>
        </div>

        <div className="ap3k-panel p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ap3k-kicker">Referral activity</p>
              <h2 className="mt-1 text-xl font-black">Your progress</h2>
            </div>
            {dashboard.stats.creditPendingCents > 0 && (
              <span className="ap3k-badge ap3k-badge-amber">{formatUsd(dashboard.stats.creditPendingCents)} pending</span>
            )}
          </div>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
            {dashboard.recentReferrals.length ? dashboard.recentReferrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{referral.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Joined {formatDate(referral.createdAt)}</p>
                </div>
                <Status status={referral.status} />
              </div>
            )) : (
              <div className="py-8 text-center">
                <Gift className="mx-auto h-7 w-7 text-violet-500" />
                <p className="mt-3 text-sm font-black">No referrals yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Share your link to start your Founding 10 run.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black text-slate-700 marker:content-none dark:text-slate-200">
          Referral rules
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <p className="mt-2 border-t border-slate-200 pt-2 dark:border-white/10">
          One reward per referred AP3K account. Self-referrals, duplicate accounts, refunded payments, disputes, fraud, and accounts without a connected Instagram profile do not qualify. Credits are not cash, cannot be transferred, and apply only to AP3K invoices. The Founding 10 spots are assigned in payment-confirmation order.
        </p>
      </details>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="ap3k-panel flex items-center gap-3 p-3.5 transition-all duration-300 hover:-translate-y-0.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <div className="min-w-0">
        <p className="text-lg font-black">{value}</p>
        <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="flex min-h-[108px] gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-violet-500/30">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">Step {number}</p>
        <p className="mt-1 text-sm font-black">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function Status({ status }: { status: string }) {
  if (status === "QUALIFIED") return <span className="ap3k-badge ap3k-badge-green">Reward earned</span>;
  if (status === "CONNECTED") return <span className="ap3k-badge ap3k-badge-amber">Connected</span>;
  if (status === "WAITLISTED") return <span className="ap3k-badge ap3k-badge-slate">Waitlisted</span>;
  return <span className="ap3k-badge ap3k-badge-slate">Signed up</span>;
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
