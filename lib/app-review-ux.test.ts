import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { filterAppReviewActivity, groupCampaignActivity } from "./campaign-activity-format";
import { getCampaignModeLabel } from "./campaign-mode-label";
import { formatAppReviewActivitySubtitle } from "./app-review-activity-copy";
import { formatKeywordDisplay } from "./keyword-display";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("App Review-safe UX", () => {
  it("keeps account debug labels behind review mode conditionals", () => {
    const source = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");

    expect(source).toContain("Profile sync debug");
    expect(source).toContain("const showProfileSyncDebug = !appReviewMode");
    expect(source).toContain('ReviewStatusCard label="Instagram connected"');
    expect(source).toContain('ReviewStatusCard label="Comments active"');
    expect(source).toContain('ReviewStatusCard label="Public replies active"');
    expect(source).not.toContain("Private replies pending Meta approval");
  });

  it("filters failed and skipped technical activity from review-mode recent activity", () => {
    const grouped = groupCampaignActivity([
      event("COMMENT_RECEIVED"),
      event("KEYWORD_MATCHED", { keyword: "guide" }),
      event("PUBLIC_REPLY_SENT", { meta: { sourceCommentId: "comment-1" } }),
      event("DM_SKIPPED", { errorMessage: "external_dm_tool_enabled", meta: { sourceCommentId: "comment-2" } }),
      event("DM_FAILED", { errorMessage: "dm_capability_missing", meta: { sourceCommentId: "comment-3" } }),
      event("COMMENT_RECEIVED", { meta: { sourceCommentId: "comment-4" } }),
    ]);

    const review = filterAppReviewActivity(grouped);

    expect(review.length).toBeGreaterThan(0);
    expect(review.map((item) => `${item.title} ${item.subtitle}`).join(" ")).not.toMatch(/skipped|failed|blocked|no trigger/i);
  });

  it("hides External DM wording from campaign labels in review mode", () => {
    expect(getCampaignModeLabel(true)).toEqual({ short: "External", full: "External DM" });
    expect(getCampaignModeLabel(true, true)).toEqual({ short: "Public", full: "Public reply mode" });
  });

  it("keeps normal operational controls while adding review-mode guards", () => {
    const account = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");
    const settings = readRepoFile("app/(protected)/dashboard/[slug]/settings/page.tsx");

    expect(account).toContain("AccountConnectionActions");
    expect(account).toContain("!appReviewMode");
    expect(settings).toContain("MCP / Personal Access Tokens");
    expect(settings).toContain("!appReviewMode");
  });

  it("uses review-safe landing copy in review mode", () => {
    const source = readRepoFile("app/(website)/page.tsx");

    expect(source).toContain("Official Meta Login");
    expect(source).toContain("Launch Instagram comment automations that receive real comments");
    expect(source).toContain("Connect Instagram");
    expect(source).toContain("Send public replies");
  });

  it("uses review-safe billing and campaign wording in review mode", () => {
    const billing = readRepoFile("components/global/billing/index.tsx");
    const paymentCard = readRepoFile("components/global/billing/payment-card.tsx");
    const campaignNew = readRepoFile("app/(protected)/dashboard/[slug]/automation/new/page.tsx");
    const sidebar = readRepoFile("components/global/sidebar/index.tsx");

    expect(billing).toContain("Successful public replies count toward your monthly limit.");
    expect(paymentCard).toContain("5,000 public replies/month");
    expect(campaignNew).toContain("Public reply mode");
    expect(campaignNew).toContain("AP3k listens for matching comments, sends public replies, and tracks leads.");
    expect(sidebar).toContain("Unlock more public replies and campaigns");
  });

  it("clarifies keyword triggers and exposes clean account disconnect in review mode", () => {
    const account = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");
    const disconnect = readRepoFile("components/dashboard/review-disconnect-instagram-button.tsx");
    const integrationQueries = readRepoFile("actions/integration/queries.ts");

    expect(formatKeywordDisplay("AI", true)).toBe("Keyword: ai");
    expect(formatAppReviewActivitySubtitle('Trigger matched "AI"', true)).toBe('Trigger matched keyword "ai"');
    expect(account).toContain("ReviewInstagramAccountProfile");
    expect(account).toContain("getCanonicalInstagramIntegration");
    expect(account).toContain("isCanonicalInstagramConnected");
    expect(account).toContain("No Instagram account connected");
    expect(account).toContain("connected && syncBadge");
    expect(account).not.toContain("No Instagram account is connected");
    expect(disconnect).toContain("Remove connection");
    expect(disconnect).toContain("Remove Instagram connection?");
    expect(disconnect).toContain("AP3k will stop using this Instagram account. Campaign history, leads, and activity stay saved.");
    expect(disconnect).toContain("Remove this Instagram account from AP3k. Campaign history is preserved.");
    expect(integrationQueries).toContain("softDisconnectIntegrationForUser");
    expect(integrationQueries).toContain('status: "DISCONNECTED"');
    expect(integrationQueries).toContain("active: false");
    expect(integrationQueries).toContain("needsReview: true");
    expect(integrationQueries).not.toContain("client.integrations.delete");
  });

  it("uses review-safe campaign page header wording", () => {
    const campaigns = readRepoFile("app/(protected)/dashboard/[slug]/automation/page.tsx");
    const breadcrumb = readRepoFile("components/global/bread-crumb/main-bread-crumbs/index.tsx");

    expect(campaigns).toContain("Create campaigns that match Instagram comments, send public replies, and track leads.");
    expect(campaigns).not.toContain("comment-to-DM");
    expect(breadcrumb).not.toContain("comment-to-DM");
    expect(breadcrumb).toContain("Create and manage Instagram comment automation campaigns.");
  });

  it("keeps connected and disconnected dashboard warnings separated by canonical integration state", () => {
    const dashboard = readRepoFile("app/(protected)/dashboard/[slug]/page.tsx");
    const sidebar = readRepoFile("components/global/sidebar/index.tsx");
    const account = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");
    const reviewAccountProfile = readRepoFile("components/dashboard/review-instagram-account-profile.tsx");

    expect(dashboard).toContain("getCanonicalInstagramIntegration");
    expect(dashboard).toContain("const instagramDisconnected = !instagramConnected");
    expect(dashboard).toContain("const activeCampaigns = automations.filter");
    expect(dashboard).toContain("automation.active && !automation.needsReview && !automation.archivedAt");
    expect(dashboard).toContain("const hasNeedsReviewCampaign");
    expect(dashboard).toContain("Review required");
    expect(dashboard).toContain("Paused until campaign is activated/reviewed");
    expect(dashboard).toContain("Instagram account disconnected");
    expect(dashboard).toContain("Instagram account changed. Review campaigns before reactivating.");
    expect(sidebar).toContain("getCanonicalInstagramIntegration");
    expect(sidebar).toContain("Connect to start");
    expect(account).toContain("connected && <StatusBadge");
    expect(account).toContain("connected && syncBadge");
    expect(account).toContain("ReviewInstagramAccountProfile");
    expect(reviewAccountProfile).toContain("const liveConnected = connected && !removed");
    expect(reviewAccountProfile).toContain("No Instagram account connected");
  });

  it("refreshes client and server state after review-mode disconnect", () => {
    const disconnectButton = readRepoFile("components/dashboard/review-disconnect-instagram-button.tsx");
    const integrationAction = readRepoFile("actions/integration/index.ts");
    const integrationQueries = readRepoFile("actions/integration/queries.ts");

    expect(disconnectButton).toContain("queryClient.invalidateQueries");
    expect(disconnectButton).toContain("queryClient.setQueriesData");
    expect(disconnectButton).toContain("setRemoved(true)");
    expect(disconnectButton).toContain("onDisconnected?.()");
    expect(disconnectButton).toContain('[\"user-profile\"]');
    expect(disconnectButton).toContain('[\"user-integrations\"]');
    expect(disconnectButton).toContain('[\"instagram-integration\"]');
    expect(disconnectButton).toContain('[\"user-automation\"]');
    expect(disconnectButton).toContain('[\"instagram-media\"]');
    expect(disconnectButton).toContain('[\"webhook-health\"]');
    expect(disconnectButton).toContain('[\"onboarding-connect\"]');
    expect(disconnectButton).toContain("Instagram connection could not be removed. Please try again.");
    expect(integrationAction).toContain('revalidatePath("/dashboard", "layout")');
    expect(integrationAction).toContain('revalidatePath(`/dashboard/${user.id}/account`)');
    expect(integrationAction).toContain('revalidatePath(`/dashboard/${user.id}/integrations`)');
    expect(integrationAction).toContain('revalidatePath(`/dashboard/${user.id}/automation`)');
    expect(integrationAction).toContain('revalidatePath("/onboarding/connect")');
    expect(integrationQueries).toContain("getCanonicalInstagramIntegration");
    expect(integrationQueries).not.toContain("client.integrations.delete");
  });

  it("keeps onboarding connect review-safe and responsive", () => {
    const onboarding = readRepoFile("app/(protected)/onboarding/connect/page.tsx");
    const complete = readRepoFile("app/(protected)/onboarding/complete/page.tsx");
    const layout = readRepoFile("app/(protected)/onboarding/layout.tsx");
    const integrationCard = readRepoFile("app/(protected)/dashboard/[slug]/integrations/_components/integration-card/index.tsx");
    const integrationsPage = readRepoFile("app/(protected)/dashboard/[slug]/integrations/page.tsx");

    expect(onboarding).toContain("getCanonicalInstagramIntegration");
    expect(onboarding).toContain("const connected = Boolean(instagram)");
    expect(onboarding).toContain("Instagram connected");
    expect(onboarding).toContain("Create my first campaign");
    expect(onboarding).toContain("Explore dashboard");
    expect(onboarding).toContain("receive Instagram comments, send public replies");
    expect(onboarding).toContain("Safe connection notes");
    expect(onboarding).toContain('surface="onboarding"');
    expect(onboarding).not.toContain("You're all set");
    expect(onboarding).not.toContain("You’re all set");
    expect(onboarding).not.toMatch(/\bDMs?\b/i);
    expect(onboarding).not.toMatch(/\bprivate\b/i);
    expect(onboarding).not.toMatch(/\bmessaging\b/i);
    expect(onboarding).not.toMatch(/\bwebhook\b/i);
    expect(onboarding).not.toMatch(/\btoken\b/i);
    expect(onboarding).not.toMatch(/\bdiagnostic\b/i);
    expect(onboarding).not.toMatch(/\bdebug\b/i);
    expect(onboarding).not.toContain("approved replies");
    expect(onboarding).not.toContain("Contact support to disconnect");
    expect(complete).toContain("getCanonicalInstagramIntegration");
    expect(complete).toContain('redirect("/onboarding/connect")');
    expect(complete).toContain("Instagram connected");
    expect(complete).toContain("Your Instagram Business or Creator account is connected. Create a campaign to test public replies.");
    expect(complete).toContain("Create my first campaign");
    expect(complete).toContain("Explore dashboard");
    expect(complete).not.toContain("You're all set");
    expect(complete).not.toContain("You’re all set");
    expect(layout).toContain("max-w-2xl");
    expect(integrationCard).toContain("Instagram connected");
    expect(integrationCard).toContain("AP3k can now receive Instagram comments, send public replies, and track campaign activity for this account.");
    expect(integrationCard).toContain("Create my first campaign");
    expect(integrationCard).toContain("!oauthSaveFailed");
    expect(integrationCard).toContain("Current saved connection");
    expect(integrationsPage).toContain("const oauthSaveFailed = Boolean(error)");
    expect(integrationsPage).toContain("New Instagram connection could not be saved. Your current connected account remains");
    expect(integrationsPage).toContain("oauthSaveFailed={oauthSaveFailed}");
    expect(integrationCard).toContain("flex w-full flex-col gap-5 sm:flex-row");
    expect(integrationCard).toContain("w-14 shrink-0");
    expect(integrationCard).toContain("sm:w-auto sm:min-w-52");
    expect(integrationCard).toContain("!appReviewMode && !onboarding");
  });

  it("uses browser-local timestamp rendering for dashboard timestamps", () => {
    const localTime = readRepoFile("components/global/local-time.tsx");
    const dashboard = readRepoFile("app/(protected)/dashboard/[slug]/page.tsx");
    const account = readRepoFile("app/(protected)/dashboard/[slug]/account/page.tsx");
    const detail = readRepoFile("app/(protected)/dashboard/[slug]/automation/[id]/page.tsx");

    expect(localTime).toContain("date.toLocaleString(undefined");
    expect(dashboard).toContain("<LocalTime value={item.createdAt} mode=\"time\" />");
    expect(account).toContain("<LocalTime value={snapshot?.fetchedAt} empty=\"Never refreshed\" />");
    expect(detail).toContain("<LocalTime value={item.createdAt} />");
  });

  it("loop guard never pauses campaigns in app review mode", () => {
    const route = readRepoFile("app/api/webhooks/meta/route.ts");

    // Rate-limit loop guard pause requires review-mode guard
    expect(route).toContain("LOOP_GUARD_PAUSE_THRESHOLD && !isAppReviewMode()");
    // Self-comment pause is also review-mode guarded and keyword-campaign safe
    expect(route).toContain('automation.triggerMode === "ANY_COMMENT" && !isAppReviewMode()');
    // Neither pause site is unguarded (old form must not exist)
    expect(route).not.toContain("LOOP_GUARD_PAUSE_THRESHOLD) {");
    // Both pause sites call pauseAutomationForLoopGuard only inside the guard
    const guardedBlock = route.split("LOOP_GUARD_PAUSE_THRESHOLD && !isAppReviewMode()")[1] ?? "";
    expect(guardedBlock.indexOf("pauseAutomationForLoopGuard")).toBeLessThan(
      guardedBlock.indexOf("LOOP_GUARD_PAUSE_THRESHOLD") === -1
        ? Infinity
        : guardedBlock.indexOf("LOOP_GUARD_PAUSE_THRESHOLD")
    );
  });

  it("loop guard does not pause keyword campaigns for self-comments", () => {
    const route = readRepoFile("app/api/webhooks/meta/route.ts");

    // Self-comment auto-pause is scoped to ANY_COMMENT only — keyword campaigns are safe
    expect(route).toContain('automation.triggerMode === "ANY_COMMENT" && !isAppReviewMode()');
    // The actual threshold check appears only after the ANY_COMMENT+review guard
    const guardPos = route.indexOf('automation.triggerMode === "ANY_COMMENT" && !isAppReviewMode()');
    const thresholdCheckPos = route.indexOf("recentSelfCommentSkips >= SELF_COMMENT_PAUSE_THRESHOLD");
    expect(guardPos).toBeGreaterThan(-1);
    expect(thresholdCheckPos).toBeGreaterThan(guardPos);
  });

  it("uses browser-local time rendering in admin dashboard", () => {
    const admin = readRepoFile("app/(protected)/admin/page.tsx");

    // No server-side formatAdminDate calls remain in the admin page render
    expect(admin).not.toContain("formatAdminDate(");
    // Admin imports LocalTime for client-side rendering
    expect(admin).toContain('import LocalTime from "@/components/global/local-time"');
    // Key table time columns use LocalTime (key prop present)
    expect(admin).toContain('value={event.createdAt} empty="Never"');
    expect(admin).toContain('value={log.createdAt} empty="Never"');
    // Webhook health panels use LocalTime
    expect(admin).toContain('value={lastPostRaw?.createdAt} empty="Never"');
    expect(admin).toContain('value={lastRealComment?.createdAt} empty="Never"');
    // Loop guard recommendation copy is not alarmist
    expect(admin).not.toContain("Pause Any Comment campaigns until review");
    expect(admin).toContain("Review repeated loop-guard events. Valid external comments should continue processing.");
  });
});

function event(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `${type}-${Math.random()}`,
    type,
    commentId: "comment-1",
    mediaId: "media-1",
    igUserId: "user-1",
    createdAt: new Date("2026-05-28T10:00:00Z"),
    ...overrides,
  };
}
