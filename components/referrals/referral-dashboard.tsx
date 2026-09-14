"use client";

import { ReferralShareCard } from "@/components/referrals/referral-share-card";
import type { getReferralDashboard } from "@/lib/referral-program";
import { Check, ChevronDown, CircleDollarSign, Gift, Instagram, Link2, Users } from "lucide-react";
import { LOCALE_DETAILS } from "@/lib/i18n/config";
import { REFERRAL_COPY } from "@/lib/i18n/referrals";
import { useI18n } from "@/providers/i18n-provider";

type Props = { dashboard: Awaited<ReturnType<typeof getReferralDashboard>>; inviteUrl: string; foundingPartnerLimit: number };

export default function ReferralDashboard({ dashboard, inviteUrl, foundingPartnerLimit }: Props) {
  const { locale } = useI18n();
  const copy = REFERRAL_COPY[locale];
  const hasFoundingSpot = Boolean(dashboard.founderRank);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-1 py-3 text-slate-950 dark:text-slate-50 sm:gap-4 sm:px-2 sm:py-5">
      <header className="px-1 sm:px-0">
        <p className="ap3k-kicker">{copy.kicker}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500 dark:text-slate-400">
          {copy.description}
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
                <h2 className="text-lg font-black">{copy.foundingTitle}</h2>
                <FoundingBadge founderRank={dashboard.founderRank} remaining={dashboard.founderSlotsRemaining} foundingPartnerLimit={foundingPartnerLimit} copy={copy} />
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {hasFoundingSpot
                  ? copy.founderSecured
                  : dashboard.founderSlotsRemaining > 0
                    ? copy.spotPending
                    : copy.programFull}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5"><ReferralShareCard inviteUrl={inviteUrl} /></div>
      </section>

      <section className="ap3k-panel p-4 sm:p-5" aria-labelledby="referral-steps">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="ap3k-kicker">{copy.howEarn}</p>
            <h2 id="referral-steps" className="mt-1 text-lg font-black">{copy.stepsTitle}</h2>
          </div>
          <span className="hidden text-xs font-bold text-slate-500 sm:block">{copy.perFriend}</span>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          <Step number="1" title={copy.steps[0].title} text={copy.steps[0].text} stepLabel={copy.step} icon={<Link2 className="h-4 w-4" />} />
          <Step number="2" title={copy.steps[1].title} text={copy.steps[1].text} stepLabel={copy.step} icon={<Instagram className="h-4 w-4" />} />
          <Step number="3" title={copy.steps[2].title} text={copy.steps[2].text} stepLabel={copy.step} icon={<CircleDollarSign className="h-4 w-4" />} />
        </ol>
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-[11px] leading-4 text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">
          {copy.freeCredit}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={copy.activity}>
        <Stat label={copy.summary[0]} value={dashboard.stats.invited} icon={<Users className="h-4 w-4" />} />
        <Stat label={copy.summary[1]} value={dashboard.stats.connected} icon={<Instagram className="h-4 w-4" />} />
        <Stat label={copy.summary[2]} value={dashboard.stats.qualified} icon={<Check className="h-4 w-4" />} />
        <Stat label={copy.summary[3]} value={formatUsd(dashboard.stats.creditEarnedCents, locale)} icon={<CircleDollarSign className="h-4 w-4" />} />
      </section>

      <section className="ap3k-panel p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="ap3k-kicker">{copy.activity}</p><h2 className="mt-1 text-lg font-black">{copy.friends}</h2></div>
          {dashboard.stats.creditPendingCents > 0 ? <span className="ap3k-badge ap3k-badge-amber">{formatUsd(dashboard.stats.creditPendingCents, locale)} {copy.pending}</span> : null}
        </div>

        <div className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
          {dashboard.recentReferrals.length ? dashboard.recentReferrals.map((referral) => (
            <div key={referral.id} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-black"><bdi dir="auto">{referral.name}</bdi></p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{copy.joined} {formatDate(referral.createdAt, locale)}</p>
              </div>
              <Status status={referral.status} copy={copy} />
            </div>
          )) : (
            <div className="py-5 text-center">
              <Users className="mx-auto h-6 w-6 text-violet-500" />
              <p className="mt-2 text-sm font-black">{copy.noFriends}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy.noFriendsDescription}</p>
            </div>
          )}
        </div>
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-3 font-black text-slate-700 marker:content-none dark:text-slate-200">
          {copy.rulesTitle}
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <p className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
          {copy.rulesBody}
        </p>
      </details>
    </div>
  );
}

function FoundingBadge({ founderRank, remaining, foundingPartnerLimit, copy }: { foundingPartnerLimit: number; founderRank: number | null; remaining: number; copy: (typeof REFERRAL_COPY)["en"] }) {
  if (founderRank) return <span className="ap3k-badge ap3k-badge-green">{copy.partner} #{founderRank}</span>;
  if (remaining > 0) return <span className="ap3k-badge ap3k-badge-amber">{remaining}/{foundingPartnerLimit} {copy.spotsOpen}</span>;
  return <span className="ap3k-badge ap3k-badge-slate">{copy.spotsFilled}</span>;
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="ap3k-panel p-3 sm:p-4">
      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300">
        {icon}<p className="text-lg font-black text-slate-950 dark:text-white"><bdi>{value}</bdi></p>
      </div>
      <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function Step({ number, title, text, stepLabel, icon }: { number: string; title: string; text: string; stepLabel: string; icon: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">{stepLabel} {number}</p>
        <p className="mt-0.5 text-sm font-black">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    </li>
  );
}

function Status({ status, copy }: { status: string; copy: (typeof REFERRAL_COPY)["en"] }) {
  if (status === "QUALIFIED") return <span className="ap3k-badge ap3k-badge-green">{copy.statuses.qualified}</span>;
  if (status === "REVERSED") return <span className="ap3k-badge ap3k-badge-red">{copy.statuses.reversed}</span>;
  if (status === "CONNECTED") return <span className="ap3k-badge ap3k-badge-amber">{copy.statuses.connected}</span>;
  if (status === "WAITLISTED") return <span className="ap3k-badge ap3k-badge-slate">{copy.statuses.waitlisted}</span>;
  return <span className="ap3k-badge ap3k-badge-slate">{copy.statuses.invited}</span>;
}

function formatUsd(cents: number, locale: keyof typeof LOCALE_DETAILS) {
  return new Intl.NumberFormat(LOCALE_DETAILS[locale].htmlLang, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(value: string, locale: keyof typeof LOCALE_DETAILS) {
  return new Intl.DateTimeFormat(LOCALE_DETAILS[locale].htmlLang, { month: "short", day: "numeric" }).format(new Date(value));
}
