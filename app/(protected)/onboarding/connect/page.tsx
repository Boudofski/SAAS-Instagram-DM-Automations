import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "@/app/(protected)/dashboard/[slug]/integrations/_components/integration-card";
import Link from "next/link";

export default function OnboardingConnectPage() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">
          Connect your Instagram
        </h1>
        <p className="text-sm text-rf-muted leading-relaxed">
          AP3k connects through Meta&apos;s official login so it can monitor comments
          and send approved replies for the Instagram account you choose.
        </p>
      </div>

      <div className="bg-rf-surface border border-rf-border rounded-2xl p-6 mb-4">
        {INTEGRATION_CARDS.map((card, i) => (
          <IntegrationCard key={i} {...card} />
        ))}
      </div>

      <div className="rounded-2xl border border-rf-border bg-white/[0.03] p-4 text-xs leading-relaxed text-rf-muted">
        <p className="font-bold text-rf-text">Safe connection notes</p>
        <p className="mt-2">We never ask for your Instagram password and we do not scrape your account. Meta may show permissions for Pages, posts, comments, and messaging because Instagram Business accounts are managed through Meta Pages.</p>
        <p className="mt-2">Private DM delivery depends on Meta messaging approval. If it is pending, AP3k can still help you test comments and public replies.</p>
      </div>

      <Link
        href="/onboarding/complete"
        className="block mt-6 text-center text-xs text-rf-muted hover:text-rf-text transition-colors"
      >
        Already connected? Continue →
      </Link>
    </div>
  );
}
