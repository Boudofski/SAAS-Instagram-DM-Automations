import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "@/app/(protected)/dashboard/[slug]/integrations/_components/integration-card";
import { isAppReviewMode } from "@/lib/app-review-mode";
import Link from "next/link";

export default function OnboardingConnectPage() {
  const appReviewMode = isAppReviewMode();

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">
          Connect your Instagram
        </h1>
        <p className="mx-auto max-w-xl text-sm text-rf-muted leading-relaxed">
          {appReviewMode
            ? "AP3k connects through Meta's official login so it can receive Instagram comments, send public replies, and track campaign activity for the account you choose."
            : "AP3k connects through Meta's official login so it can receive Instagram comments, send public replies, and track campaign activity for the account you choose."}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-rf-border bg-[#0f172a]/70 p-4 sm:p-6">
        {INTEGRATION_CARDS.map((card, i) => (
          <IntegrationCard key={i} {...card} surface="onboarding" continueHref="/onboarding/complete" />
        ))}
      </div>

      <div className="rounded-2xl border border-rf-border bg-white/[0.03] p-4 text-xs leading-relaxed text-rf-muted">
        <p className="font-bold text-rf-text">Safe connection notes</p>
        <p className="mt-2">
          {appReviewMode
            ? "We never ask for your Instagram password and we do not scrape your account. Meta may show permissions for Pages, posts, and comments because Instagram Business accounts are managed through Meta Pages."
            : "We never ask for your Instagram password and we do not scrape your account. Meta may show permissions for Pages, posts, comments, and messaging because Instagram Business accounts are managed through Meta Pages."}
        </p>
        {!appReviewMode && (
          <p className="mt-2">Private DM delivery depends on Meta messaging approval. If it is pending, AP3k can still help you test comments and public replies.</p>
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
