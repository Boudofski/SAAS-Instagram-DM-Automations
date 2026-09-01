import { INTEGRATION_CARDS } from "@/constants/integrations";
import { getCurrentInstagramPermissionHealth } from "@/actions/integration/permission-health";
import { onUserInfo } from "@/actions/user";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { isInstagramLoginEnabled } from "@/lib/instagram-login";
import {
  reviewSafeInstagramOAuthErrorMessage,
  standardInstagramOAuthErrorMessage,
} from "@/lib/instagram-integration-save-errors";
import IntegrationCard from "./_components/integration-card";

const ERROR_COPY: Record<string, string> = {
  auth_missing: "Instagram returned successfully, but your AP3K session was not available. Sign in again and reconnect Instagram.",
  token_exchange_failed: "Instagram authorization was received, but AP3K could not complete the connection.",
  page_resolution_failed: "Instagram authorization succeeded, but AP3K could not confirm the selected account. Reconnect and approve the requested Instagram permissions.",
  ig_business_not_linked: "AP3K could not find an eligible Instagram Business or Creator account for this login.",
  page_token_missing: "AP3K could not validate access for the selected Instagram account.",
  no_eligible_facebook_pages: "No eligible Instagram professional account was found for this login.",
  webhook_subscription_failed: "The account connected, but AP3K could not finish comment delivery setup. Reconnect once or contact support.",
  integration_save_failed: "Instagram authorization succeeded, but AP3K could not save the connection. Please try again.",
  database_save_failed: "Instagram authorization succeeded, but AP3K could not save the connection. Please try again.",
  duplicate_instagram_account: "This Instagram account is already connected to another AP3K workspace. Remove it there first or contact support.",
  plan_limit_reached: "AP3K supports one Instagram account per workspace. Reconnect only when you want to replace the current account.",
  missing_local_profile: "Your AP3K workspace could not be found. Sign in again and retry.",
  profile_fetch_failed: "Instagram authorization could not be completed. Please try again.",
  provider_denied: "Instagram did not authorize the connection.",
  insufficient_developer_role: "Instagram connection is not available for this account yet. Contact AP3K support if this continues.",
  missing_code: "Instagram did not return an authorization code.",
  oauth_failed: "Instagram connection could not be completed.",
};

const ERROR_STEPS: Record<string, string[]> = {
  insufficient_developer_role: [
    "Use an Instagram Business or Creator account that is approved for testing.",
    "Reconnect after the account has access.",
  ],
  page_resolution_failed: [
    "Reconnect Instagram and approve all requested Instagram permissions.",
    "Confirm the account is a Business or Creator account.",
  ],
  ig_business_not_linked: [
    "Convert the Instagram account to Business or Creator.",
    "Reconnect with that Instagram account directly.",
  ],
  webhook_subscription_failed: [
    "Reconnect Instagram once.",
    "Contact AP3K support if comments still do not arrive.",
  ],
};

type PageProps = {
  params: { slug: string };
  searchParams?: { integration_error?: string };
};

async function Page({ searchParams }: PageProps) {
  const error = searchParams?.integration_error;
  const appReviewMode = isAppReviewMode();
  const directInstagramLogin = isInstagramLoginEnabled();
  const [user, permissionHealth] = await Promise.all([
    onUserInfo(),
    getCurrentInstagramPermissionHealth(),
  ]);
  const instagram = getCanonicalInstagramIntegration(user.status === 200 ? user.data?.integrations : null);
  const capabilities = permissionHealth.data;
  const oauthSaveFailed = Boolean(error);
  const errorMessage = error
    ? appReviewMode
      ? reviewSafeInstagramOAuthErrorMessage(error)
      : standardInstagramOAuthErrorMessage(error) || ERROR_COPY[error] || ERROR_COPY.oauth_failed
    : null;

  const missingComments = capabilities?.comments === "missing";
  const missingMessages = capabilities?.messages === "missing";
  const missingBasic = capabilities?.basic === "missing";
  const permissionWarning = missingBasic || missingComments || missingMessages;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <p className="font-bold">{errorMessage}</p>
          {instagram && (
            <p className="mt-2 font-semibold">
              New Instagram connection could not be saved. Your current connected account remains{instagram.instagramUsername ? ` @${instagram.instagramUsername}` : " unchanged"}.
            </p>
          )}
          {(!appReviewMode || error === "profile_fetch_failed") && ERROR_STEPS[error] && (
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
            Instagram connection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Connect Instagram
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {directInstagramLogin
              ? "Connect one Business or Creator Instagram account directly. AP3K uses the connection to receive matching comments, reply to comments, and send DMs from your campaigns."
              : "Connect the Business or Creator Instagram account that owns the posts AP3K should monitor."}
          </p>
        </div>

        <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
            Quick setup guide
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2 lg:grid-cols-1">
            {[
              "Connect one Instagram Business or Creator account.",
              "Create a campaign with Any post or choose a specific post.",
              "Set a keyword or use Any comment.",
              "Choose a comment reply, a DM, or both.",
              "Test from a different Instagram account.",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-pink-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {capabilities?.connected && (
        <section className="ap3k-panel overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
                Permission readiness
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                Instagram capabilities
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                AP3K checks what this Instagram account actually granted, not just what the app requested.
              </p>
            </div>
            <span className={[
              "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black",
              permissionWarning
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                : capabilities.authoritative
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
            ].join(" ")}>
              {permissionWarning
                ? "Action required"
                : capabilities.authoritative
                  ? "All permissions ready"
                  : "Permission state unavailable"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <PermissionCard
              title="Profile & media"
              state={capabilities.basic}
              detail="Needed to identify the account and load Instagram posts."
            />
            <PermissionCard
              title="Comments"
              state={capabilities.comments}
              detail="Needed to receive comment triggers and reply to comments."
            />
            <PermissionCard
              title="DMs"
              state={capabilities.messages}
              detail="Needed to send DMs after qualifying Instagram comments."
            />
          </div>

          {permissionWarning && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-black">Reconnect Instagram and enable the missing access.</p>
              <p className="mt-1">
                {missingComments
                  ? "Comment automations cannot run until Access and manage comments is enabled. "
                  : ""}
                {missingMessages
                  ? "DMs cannot be sent until Access and manage messages is enabled. "
                  : ""}
                {missingBasic
                  ? "Profile and media access is required for campaign setup."
                  : ""}
              </p>
            </div>
          )}

          {capabilities.tokenDaysRemaining !== null && capabilities.tokenDaysRemaining <= 7 && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <strong>Instagram access expires soon.</strong> Reconnect Instagram to keep automations running without interruption.
            </div>
          )}
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-300">
        <p className="font-black text-slate-950 dark:text-white">Instagram workflow</p>
        <p className="mt-2">
          AP3K opens Instagram authorization, saves the connected account, and runs comment automation based on your active campaigns.
        </p>
      </div>

      {INTEGRATION_CARDS.map((card, index) => (
        <IntegrationCard
          key={index}
          {...card}
          canonicalConnected={Boolean(instagram)}
          oauthSaveFailed={oauthSaveFailed}
          directInstagramLogin={directInstagramLogin}
        />
      ))}
    </div>
  );
}

function PermissionCard({
  title,
  state,
  detail,
}: {
  title: string;
  state: "granted" | "missing" | "unknown";
  detail: string;
}) {
  const granted = state === "granted";
  const missing = state === "missing";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-slate-950 dark:text-white">{title}</p>
        <span className={[
          "rounded-full border px-2.5 py-1 text-[11px] font-black",
          granted
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            : missing
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
        ].join(" ")}>
          {granted ? "Granted" : missing ? "Missing" : "Unknown"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export default Page;