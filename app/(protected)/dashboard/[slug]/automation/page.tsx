import AutomationTable from "@/components/dashboard/automation-table";
import EmptyState from "@/components/global/empty-state";
import { getAllAutomation } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { getCampaignTableMetrics } from "@/lib/dashboard-metrics";
import { buildCampaignBindingDiagnostics } from "@/lib/account-webhook-diagnostics";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import Link from "next/link";

type Props = { params: { slug: string } };

export default async function AutomationsPage({ params }: Props) {
  const appReviewMode = isAppReviewMode();
  const [result, userResult] = await Promise.all([getAllAutomation(), onUserInfo()]);
  const automations =
    result.status === 200 && Array.isArray(result.data)
      ? result.data
      : [];
  const metrics = userResult.status === 200 && userResult.data?.id
    ? await getCampaignTableMetrics(userResult.data.id)
    : {};
  const currentIntegration = userResult.status === 200 ? getCanonicalInstagramIntegration(userResult.data?.integrations) : null;
  const bindingDiagnostics = buildCampaignBindingDiagnostics({
    integration: currentIntegration,
    campaigns: automations as any[],
  });
  const automationsWithMetrics = automations.map((automation: any) => ({
    ...automation,
    metrics: metrics[automation.id] ?? { runs: 0, leads: automation._count?.leads ?? 0 },
    currentAccountLabel: currentIntegration?.instagramUsername ? `@${currentIntegration.instagramUsername}` : "Current account",
    stalePost: bindingDiagnostics.find((item) => item.campaignId === automation.id)?.stale ?? false,
  }));

  return (
    <div className="relative flex flex-col gap-6 p-4 text-slate-950 dark:text-slate-50 sm:p-6 lg:p-8">
      <div className="ap3k-page-header">
        <div>
          <p className="ap3k-kicker">{appReviewMode ? "Comment Automation" : "AutoDM"}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {appReviewMode
              ? "Create campaigns that match Instagram comments, send public replies, and track leads."
              : automations.length === 0
                ? "No campaigns yet. Start with Any post and one keyword for the fastest test."
                : `${automations.length} campaign${automations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href={`/dashboard/${params.slug}/automation/new`}
          className="ap3k-gradient-button inline-flex w-full justify-center px-5 py-2.5 text-sm sm:w-auto"
        >
          + Create Campaign
        </Link>
      </div>

      {automations.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-8 shadow-sm dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
          <p className="ap3k-kicker">{appReviewMode ? "AP3k Campaigns" : "AP3k AutoDM"}</p>
          <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
            Turn comments into tracked outcomes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Build official Instagram comment automations, test keyword triggers, and inspect delivery logs from one clean workspace. AP3k uses Meta APIs; no scraping or password sharing.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href={`/dashboard/${params.slug}/automation/new`}
              className="ap3k-gradient-button inline-flex items-center justify-center px-6 py-3 text-sm"
            >
              Create your first campaign →
            </Link>
          </div>
        </div>
      ) : (
        <AutomationTable slug={params.slug} automations={automationsWithMetrics as any[]} />
      )}

      {automations.length === 0 && (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          description="Nothing is listening for comments yet. Create one campaign, choose Any post, add one keyword, and activate it before testing."
          ctaLabel="Launch first campaign →"
          ctaHref={`/dashboard/${params.slug}/automation/new`}
        />
      )}
    </div>
  );
}
