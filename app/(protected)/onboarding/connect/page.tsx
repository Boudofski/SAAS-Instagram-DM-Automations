import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "@/app/(protected)/dashboard/[slug]/integrations/_components/integration-card";
import { onUserInfo } from "@/actions/user";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import Link from "next/link";

export default async function OnboardingConnectPage() {
  const appReviewMode = isAppReviewMode();
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const instagram = getCanonicalInstagramIntegration(user?.integrations);
  const connected = Boolean(instagram);

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">
          {connected ? "Instagram connected" : "Connect your Instagram"}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-rf-muted leading-relaxed">
          {connected
            ? "AP3k can now receive Instagram comments, send public replies, and track campaign activity for this account."
            : "AP3k connects through Meta's official login to receive Instagram comments, send public replies, and track campaign activity for the account you choose."}
        </p>
      </div>

      {connected ? (
        <div className="mx-auto mb-4 w-full max-w-3xl rounded-2xl border border-rf-border bg-[#0f172a]/70 p-4 sm:p-6">
          <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ap3k-gradient text-lg font-black text-white">
              IG
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black leading-tight text-rf-text sm:text-2xl">Instagram connected</h2>
              <p className="mt-2 text-sm leading-relaxed text-rf-muted">
                AP3k can now receive Instagram comments, send public replies, and track campaign activity for this account.
              </p>
              {instagram?.instagramUsername && (
                <p className="mt-3 truncate text-sm font-black text-rf-green">@{instagram.instagramUsername}</p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-52">
              <Link
                href="/onboarding/complete"
                className="ap3k-gradient-button inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-black text-white"
              >
                Create my first campaign
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-rf-muted hover:bg-white/[0.08] hover:text-rf-text"
              >
                Explore dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto mb-4 w-full max-w-3xl rounded-2xl border border-rf-border bg-[#0f172a]/70 p-4 sm:p-6">
          {INTEGRATION_CARDS.map((card, i) => (
            <IntegrationCard key={i} {...card} surface="onboarding" continueHref="/onboarding/complete" />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl rounded-2xl border border-rf-border bg-white/[0.03] p-4 text-xs leading-relaxed text-rf-muted">
        <p className="font-bold text-rf-text">Safe connection notes</p>
        <p className="mt-2">
          {appReviewMode
            ? "We never ask for your Instagram password and we do not scrape your account. Meta may show permissions for Pages, posts, and comments because Instagram Business accounts are managed through Meta Pages."
            : "We never ask for your Instagram password and we do not scrape your account. Meta may show permissions for Pages, posts, and comments because Instagram Business accounts are managed through Meta Pages."}
        </p>
        {!appReviewMode && (
          <p className="mt-2">Some Meta permissions may require additional approval. AP3k can still help you test comments and public replies.</p>
        )}
      </div>

      {!appReviewMode && (
        <Link
          href="/onboarding/complete"
          className="block mt-6 text-center text-xs text-rf-muted hover:text-rf-text transition-colors"
        >
          Already connected? Continue →
        </Link>
      )}
    </div>
  );
}
