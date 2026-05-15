import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "./_components/integration-card";

type Props = {};

const ERROR_COPY: Record<string, string> = {
  auth_missing: "Instagram returned successfully, but your AP3k session was not available. Sign in again and reconnect Instagram.",
  token_exchange_failed: "Instagram authorization was received, but AP3k could not exchange it for an access token.",
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
      <div className="flex w-full max-w-3xl flex-col gap-y-5">
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="ap3k-kicker">Official Meta connection</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Connect Instagram
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            AP3k uses Meta&apos;s official Instagram APIs to listen for comments on your selected posts and send private replies only to people who interact with your account.
          </p>
        </div>
        {INTEGRATION_CARDS.map((card, index) => (
          <IntegrationCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}

export default Page;
