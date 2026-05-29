import { INTEGRATION_CARDS } from "@/constants/integrations";
import { onUserInfo } from "@/actions/user";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import {
  reviewSafeInstagramOAuthErrorMessage,
  standardInstagramOAuthErrorMessage,
} from "@/lib/instagram-integration-save-errors";
import IntegrationCard from "./_components/integration-card";

const ERROR_COPY: Record<string, string> = {
  auth_missing: "Instagram returned successfully, but your AP3k session was not available. Sign in again and reconnect Instagram.",
  token_exchange_failed: "Instagram authorization was received, but AP3k could not exchange it for an access token.",
  page_resolution_failed: "Meta authorization succeeded, but AP3k could not fetch Facebook Pages. Confirm pages_show_list and pages_read_engagement are approved/enabled for this app.",
  ig_business_not_linked: "Meta returned Facebook Pages, but none had a linked Instagram Business account.",
  page_token_missing: "Meta returned a Page, but AP3k could not validate a Page access token for it.",
  webhook_subscription_failed: "The account connected, but AP3k could not subscribe the Facebook Page to comment/message webhooks.",
  integration_save_failed: "Instagram authorization succeeded, but AP3k could not save the connection. Please try again.",
  database_save_failed: "Instagram authorization succeeded, but AP3k could not save the connection. Please try again.",
  duplicate_instagram_account: "This Instagram account is already connected to another AP3k workspace. Remove it there first or contact support.",
  plan_limit_reached: "Your current plan supports one Instagram account. Remove the existing account before connecting another.",
  missing_local_profile: "Your AP3k workspace could not be found. Sign in again and retry.",
  profile_fetch_failed: "Instagram authorization could not be completed. Please try again.",
  provider_denied: "Instagram did not authorize the connection.",
  insufficient_developer_role: "Meta rejected the connection because this Facebook/Instagram account does not have enough role access for this app while it is in development mode.",
  missing_code: "Instagram did not return an authorization code.",
  oauth_failed: "Instagram connection could not be completed.",
};

const ERROR_STEPS: Record<string, string[]> = {
  insufficient_developer_role: [
    "Add the Facebook user as Developer or Administrator in Meta Developers -> App Roles.",
    "Make sure the user has Business Manager access to the Instagram asset.",
    "Make sure the Instagram tester invitation is accepted.",
    "Or publish the app after App Review.",
  ],
  page_resolution_failed: [
    "Reconnect after confirming pages_show_list and pages_read_engagement are available to the Meta app.",
    "Make sure the Facebook user has access to the Page that owns the Instagram Business account.",
  ],
  ig_business_not_linked: [
    "Open the Facebook Page settings and confirm the Instagram Business or Creator account is linked.",
    "Reconnect using the Facebook user that manages that Page.",
  ],
  page_token_missing: [
    "Reconnect and approve all requested permissions.",
    "Confirm the Facebook user has Page access in Meta Business settings.",
  ],
  webhook_subscription_failed: [
    "Reconnect or use Resubscribe Webhooks after confirming Page access.",
    "Check admin diagnostics for the safe Meta error from subscribed_apps.",
  ],
};

const REVIEW_ERROR_COPY: Record<string, string> = {
  auth_missing: "Instagram returned successfully, but your AP3k session was not available. Sign in again and reconnect Instagram.",
  token_exchange_failed: "Instagram authorization was received, but AP3k could not complete the connection.",
  page_resolution_failed: "AP3k could not find the Instagram Business or Creator account for this Meta login.",
  ig_business_not_linked: "No Instagram Business or Creator account was linked to the selected Meta account.",
  page_token_missing: "AP3k could not validate access for the selected Instagram account.",
  webhook_subscription_failed: "Instagram connected, but comments are not ready yet. Reconnect Instagram and try again.",
  integration_save_failed: "Instagram authorization succeeded, but AP3k could not save the connection. Please try again.",
  database_save_failed: "Instagram authorization succeeded, but AP3k could not save the connection. Please try again.",
  duplicate_instagram_account: "This Instagram account is already connected to another AP3k workspace. Remove it there first or contact support.",
  plan_limit_reached: "Your current plan supports one Instagram account. Remove the existing account before connecting another.",
  missing_local_profile: "Instagram authorization could not be completed. Please try again.",
  profile_fetch_failed: "Instagram authorization could not be completed. Please try again.",
  provider_denied: "Instagram did not authorize the connection.",
  insufficient_developer_role: "This account is not authorized to connect to this Meta app yet.",
  missing_code: "Instagram did not return an authorization code.",
  oauth_failed: "Instagram connection could not be completed.",
};

type PageProps = {
  searchParams?: {
    integration_error?: string;
  };
};

async function Page({ searchParams }: PageProps) {
  const error = searchParams?.integration_error;
  const appReviewMode = isAppReviewMode();
  const user = await onUserInfo();
  const instagram = getCanonicalInstagramIntegration(user.status === 200 ? user.data?.integrations : null);
  const errorMessage = error
    ? appReviewMode
      ? reviewSafeInstagramOAuthErrorMessage(error)
      : standardInstagramOAuthErrorMessage(error) || ERROR_COPY[error] || ERROR_COPY.oauth_failed
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <p className="font-bold">
              {errorMessage}
            </p>
            {instagram && (
              <p className="mt-2 font-semibold">
                The new Instagram account could not be saved. Your current connected account was not changed.
              </p>
            )}
            {!appReviewMode && ERROR_STEPS[error] && (
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {ERROR_STEPS[error].map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="ap3k-panel p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
              Official Meta connection
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Connect Instagram
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Connect the Business or Creator Instagram account that owns the posts AP3k should monitor. Meta may mention Facebook Pages because Instagram professional accounts are managed through Pages.
            </p>
          </div>

          <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
              {appReviewMode ? "Quick setup guide" : "First successful test"}
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-1">
              {[
                "Connect the Instagram Business or Creator account.",
                "Create one campaign with Any post and a clear keyword.",
                "Comment the keyword from a different Instagram account.",
                "Check dashboard activity before changing settings.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-pink-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300">
          <p className="font-black text-slate-950 dark:text-white">Official Meta workflow</p>
          <p className="mt-2">
            {appReviewMode
              ? "AP3k connects your Instagram Business or Creator account securely through official Meta APIs."
              : "AP3k redirects you to Meta, stores the returned access token, and connects your Instagram Business or Creator account through official Meta APIs."}
          </p>
          {!appReviewMode && (
            <p className="mt-2">Private DM sending is available only when Meta messaging permissions are approved. Until then, use public replies and activity logs to verify comment matching.</p>
          )}
        </div>

        {INTEGRATION_CARDS.map((card, index) => (
          <IntegrationCard key={index} {...card} canonicalConnected={Boolean(instagram)} />
        ))}
        {error && instagram && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100">
            Current connected account{instagram.instagramUsername ? `: @${instagram.instagramUsername}` : ""}
          </div>
        )}
    </div>
  );
}

export default Page;
