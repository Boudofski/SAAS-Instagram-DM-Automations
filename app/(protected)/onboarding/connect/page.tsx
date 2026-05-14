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
          We need access to your posts and messages to run your automations.
          We never post on your behalf.
        </p>
      </div>

      <div className="bg-rf-surface border border-rf-border rounded-2xl p-6 mb-4">
        {INTEGRATION_CARDS.map((card, i) => (
          <IntegrationCard key={i} {...card} />
        ))}
      </div>

      <p className="text-xs text-center text-rf-subtle">
        🔒 Your data is encrypted. We only request the permissions needed.
      </p>

      <Link
        href="/onboarding/complete"
        className="block mt-6 text-center text-xs text-rf-muted hover:text-rf-text transition-colors"
      >
        Already connected? Continue →
      </Link>
    </div>
  );
}
