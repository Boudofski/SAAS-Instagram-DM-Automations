import { onUserInfo } from "@/actions/user";
import { ReferralShareCard } from "@/components/referrals/referral-share-card";
import { getApplicationUrl } from "@/lib/app-url";
import { FOUNDING_PARTNER_LIMIT, getReferralDashboard } from "@/lib/referral-program";
import { Check, ChevronDown, CircleDollarSign, Gift, Instagram, Link2, Users } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  if (!user?.id) redirect("/sign-in");

  const dashboard = await getReferralDashboard(user.id);
  const inviteUrl = `${getApplicationUrl()}/r/${dashboard.code}`;
  const hasFoundingSpot = Boolean(dashboard.founderRank);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-1 py-3 text-slate-950 dark:text-slate-50 sm:gap-4 sm:px-2 sm:py-5">
      <header className="px-1 sm:px-0">
        <p className="ap3k-kicker">Refer & earn</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Give free actions. Get $9 credit.</h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500 dark:text-slate-400">
          Invite a friend to AP3K. When they connect Instagram and pay for a plan, you earn $9 toward your next invoice.
        </p>
      </header>

      <section className="ap3k-panel overflow-hidden">
        <div className="border-b border-slate-200 bg-violet-50/80 p-4 dark:border-white/10 dark:bg-violet-500/[0.07] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black">Founding 10 rewards</h2>
                <FoundingBadge founderRank={dashboard.founderRank} remaining={dashboard.founderSlotsRemaining} />
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {hasFoundingSpot
                  ? "Your Founding Partner spot is secured. Every qualifying referral earns another $9 credit."
                  : dashboard.founderSlotsRemaining > 0
                    ? "Your spot is secured when your first referral qualifies. Spots are assigned in payment order."
                    : "All Founding Partner spots are currently claimed. You can still share your link and track referrals."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5"><ReferralShareCard inviteUrl={inviteUrl} /></div>
      </section>

      <section className="ap3k-panel p-4 sm:p-5" aria-labelledby="referral-steps">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="ap3k-kicker">How you earn</p>
            <h2 id="referral-steps" className="mt-1 text-lg font-black">Three simple steps</h2>
          </div>
          <span className="hidden text-xs font-bold text-slate-500 sm:block">$9 per qualified friend</span>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          <Step number="1" title="They join" text="They create a new account using your link." icon={<Link2 className="h-4 w-4" />} />
          <Step number="2" title="They connect" text="They connect a Business or Creator Instagram." icon={<Instagram className="h-4 w-4" />} />
          <Step number="3" title="They subscribe" text="Their first Pro or Business payment earns your credit." icon={<CircleDollarSign className="h-4 w-4" />} />
        </ol>
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-[11px] leading-4 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">
          Your friend gets 500 automated actions each month on Free. Your credit is applied automatically to a future AP3K invoice.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Referral summary">
        <Stat label="Signed up" value={dashboard.stats.invited} icon={<Users className="h-4 w-4" />} />
        <Stat label="Instagram ready" value={dashboard.stats.connected} icon={<Instagram className="h-4 w-4" />} />
        <Stat label="Rewards earned" value={dashboard.stats.qualified} icon={<Check className="h-4 w-4" />} />
        <Stat label="Total credit" value={formatUsd(dashboard.stats.creditEarnedCents)} icon={<CircleDollarSign className="h-4 w-4" />} />
      </section>

      <section className="ap3k-panel p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="ap3k-kicker">Referral activity</p><h2 className="mt-1 text-lg font-black">Your friends</h2></div>
          {dashboard.stats.creditPendingCents > 0 ? <span className="ap3k-badge ap3k-badge-amber">{formatUsd(dashboard.stats.creditPendingCents)} pending</span> : null}
        </div>

        <div className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
          {dashboard.recentReferrals.length ? dashboard.recentReferrals.map((referral) => (
            <div key={referral.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{referral.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Joined {formatDate(referral.createdAt)}</p>
              </div>
              <Status status={referral.status} />
            </div>
          )) : (
            <div className="py-5 text-center">
              <Users className="mx-auto h-6 w-6 text-violet-500" />
              <p className="mt-2 text-sm font-black">No friends yet</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Copy your link above and send your first invitation.</p>
            </div>
          )}
        </div>
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-3 font-black text-slate-700 marker:content-none dark:text-slate-200">
          Eligibility and rules
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <p className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
          A referral qualifies after a new user joins through your link, connects Instagram, and completes a successful Pro or Business payment of at least $9 USD. One reward per referred account. Self-referrals, duplicate accounts, refunded payments, disputes, and fraud do not qualify. Credits are not cash or transferable. Founding spots are assigned in qualifying-payment order.
        </p>
      </details>
    </div>
  );
}

function FoundingBadge({ founderRank, remaining }: { founderRank: number | null; remaining: number }) {
  if (founderRank) return <span className="ap3k-badge ap3k-badge-green">Partner #{founderRank}</span>;
  if (remaining > 0) return <span className="ap3k-badge ap3k-badge-amber">{remaining} of {FOUNDING_PARTNER_LIMIT} spots open</span>;
  return <span className="ap3k-badge ap3k-badge-slate">Spots filled</span>;
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="ap3k-panel p-3 sm:p-4">
      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300">
        {icon}<p className="text-lg font-black text-slate-950 dark:text-white">{value}</p>
      </div>
      <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">Step {number}</p>
        <p className="mt-0.5 text-sm font-black">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    </li>
  );
}

function Status({ status }: { status: string }) {
  if (status === "QUALIFIED") return <span className="ap3k-badge ap3k-badge-green">$9 earned</span>;
  if (status === "CONNECTED") return <span className="ap3k-badge ap3k-badge-amber">Needs a plan</span>;
  if (status === "WAITLISTED") return <span className="ap3k-badge ap3k-badge-slate">Program full</span>;
  return <span className="ap3k-badge ap3k-badge-slate">Needs Instagram</span>;
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
