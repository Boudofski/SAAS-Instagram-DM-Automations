import { INTEGRATION_CARDS } from "@/constants/integrations";
import IntegrationCard from "./_components/integration-card";

type Props = {};

function Page({}: Props) {
  return (
    <div className="flex justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-3xl flex-col gap-y-5">
        <div className="rounded-3xl border border-white/10 bg-ap3k-gradient-soft p-6">
          <p className="ap3k-kicker">Official Meta connection</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-rf-text">
            Connect Instagram
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-rf-muted">
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
