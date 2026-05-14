import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "./_components/integration-card";

type Props = {};

const ERROR_COPY: Record<string, string> = {
  auth_missing: "Instagram returned successfully, but your AP3k session was not available. Sign in again and reconnect Instagram.",
  token_exchange_failed: "Instagram authorization was received, but AP3k could not exchange it for an access token.",
  integration_save_failed: "Instagram authorization succeeded, but AP3k could not save the integration.",
  provider_denied: "Instagram did not authorize the connection.",
  missing_code: "Instagram did not return an authorization code.",
  oauth_failed: "Instagram connection could not be completed.",
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
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-relaxed text-red-200">
            {ERROR_COPY[error] ?? ERROR_COPY.oauth_failed}
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
