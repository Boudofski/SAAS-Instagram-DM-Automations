import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "./_components/integration-card";

const ERROR_COPY: Record<string, string> = {
  auth_missing: "Instagram returned successfully, but your AP3k session was not available. Sign in again and reconnect Instagram.",
  token_exchange_failed: "Instagram authorization was received, but AP3k could not exchange it for an access token.",
  page_resolution_failed: "Meta authorization succeeded, but AP3k could not fetch Facebook Pages. Confirm pages_show_list and pages_read_engagement are approved/enabled for this app.",
  ig_business_not_linked: "Meta returned Facebook Pages, but none had a linked Instagram Business account.",
  page_token_missing: "Meta returned a Page, but AP3k could not validate a Page access token for it.",
  webhook_subscription_failed: "The account connected, but AP3k could not subscribe the Facebook Page to comment/message webhooks.",
  integration_save_failed: "Instagram authorization succeeded, but AP3k could not save the integration.",
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

type PageProps = {
  searchParams?: {
    integration_error?: string;
  };
};

function Page({ searchParams }: PageProps) {
  const error = searchParams?.integration_error;

  return (
    <div className="flex justify-center p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
            <p className="font-bold">
              {ERROR_COPY[error] ?? ERROR_COPY.oauth_failed}
            </p>
            {ERROR_STEPS[error] && (
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {ERROR_STEPS[error].map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
              Official Meta connection
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Instagram account
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Connect the Business or Creator Instagram account that owns the posts AP3k should monitor. Webhook health appears below after subscription attempts and real comment tests.
            </p>
          </div>

          <div className="rounded-3xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
              Test checklist
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {[
                "Connected IG account is Business or Creator.",
                "Webhook subscription shows a recent success.",
                "Tester account is separate and accepted in Meta.",
                "Test comment is on media owned by this IG account.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/70 bg-white/70 p-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-pink-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {INTEGRATION_CARDS.map((card, index) => (
          <IntegrationCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}

export default Page;
