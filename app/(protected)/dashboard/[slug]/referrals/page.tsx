import { onUserInfo } from "@/actions/user";
import { ReferralShareCard } from "@/components/referrals/referral-share-card";
import { getApplicationUrl } from "@/lib/app-url";
import { FOUNDING_PARTNER_LIMIT, getReferralDashboard } from "@/lib/referral-program";
import { ArrowRight, BadgeDollarSign, CheckCircle2, Gift, Instagram, Link2, Users } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  if (!user?.id) redirect("/sign-in");

  const dashboard = await getReferralDashboard(user.id);
  const inviteUrl = `${getApplicationUrl()}/r/${dashboard.code}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-7">
      <header className="ap3k-page-header">
        <div>
          <p className="ap3k-kicker">Founding 10 referral program</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Refer friends. Earn Pro credits.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your friend gets 500 automated replies for 14 days after connecting Instagram. A qualified paid referral earns you a $9 AP3K credit.
          </p>
        </div>
        <span className={`ap3k-badge ${dashboard.founderRank ? "ap3k-badge-green" : dashboard.founderSlotsRemaining > 0 ? "ap3k-badge-amber" : "ap3k-badge-slate"}`}>
          {dashboard.founderRank
            ? `Founding Partner #${dashboard.founderRank}`
            : `${dashboard.founderSlotsRemaining} of ${FOUNDING_PARTNER_LIMIT} spots left`}
        </span>
      </header>

      <section className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#5521c9_0%,#7132df_48%,#b832b0_100%)] p-5 text-white shadow-[0_24px_70px_rgba(91,33,182,0.24)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black">
              <Gift className="h-4 w-4" /> Limited launch offer
            </div>
            <h2 className="mt-4 max-w-xl text-2xl font-black leading-tight sm:text-3xl">
              One paying friend equals one Pro month in credit.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">
              The first 10 partners who generate a qualifying paid referral lock in Founding Partner status. Credits apply automatically to your next Stripe invoice.
            </p>
          </div>
          <ReferralShareCard inviteUrl={inviteUrl} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Friends signed up" value={dashboard.stats.invited} icon={<Users className="h-4 w-4" />} />
        <Stat label="Instagram connected" value={dashboard.stats.connected} icon={<Instagram className="h-4 w-4" />} />
        <Stat label="Qualified referrals" value={dashboard.stats.qualified} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Stat label="AP3K credit earned" value={formatUsd(dashboard.stats.creditEarnedCents)} icon={<BadgeDollarSign className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="ap3k-panel p-5 sm:p-6">
          <p className="ap3k-kicker">How it works</p>
          <h2 className="mt-2 text-2xl font-black">Four events. One real reward.</h2>
          <div className="mt-5 grid gap-3">
            <Step number="1" title="Share your tracked link" text="The referral must create a new AP3K account through your link." icon={<Link2 className="h-4 w-4" />} />
            <Step number="2" title="They connect Instagram" text="A real Business or Creator account unlocks their 14-day, 500-reply trial." icon={<Instagram className="h-4 w-4" />} />
            <Step number="3" title="They buy Pro or Business" text="Stripe must confirm a successful USD payment of at least $9." icon={<BadgeDollarSign className="h-4 w-4" />} />
            <Step number="4" title="Your $9 credit is issued" text="The credit is attached to your AP3K Stripe customer and applies to a future invoice." icon={<Gift className="h-4 w-4" />} />
          </div>
        </div>

        <div className="ap3k-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ap3k-kicker">Referral activity</p>
              <h2 className="mt-2 text-2xl font-black">Your progress</h2>
            </div>
            {dashboard.stats.creditPendingCents > 0 && (
              <span className="ap3k-badge ap3k-badge-amber">{formatUsd(dashboard.stats.creditPendingCents)} pending</span>
            )}
          </div>
          <div className="mt-5 divide-y divide-slate-200 dark:divide-white/10">
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

      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        <p className="font-black text-slate-700 dark:text-slate-200">Clear rules</p>
        <p className="mt-1">
          One reward per referred AP3K account. Self-referrals, duplicate accounts, refunded payments, disputes, fraud, and accounts without a connected Instagram profile do not qualify. Credits are not cash, cannot be transferred, and apply only to AP3K invoices. The Founding 10 spots are assigned in payment-confirmation order.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="ap3k-panel flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <div className="min-w-0">
        <p className="text-xl font-black">{value}</p>
        <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">Step {number}</p>
        <p className="mt-1 text-sm font-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      <ArrowRight className="ml-auto mt-2 hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
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
