"use client";

import { useQueryUser } from "@/hooks/user-queries";
import PaymentCard from "./payment-card";

type Props = {};

function Billing({}: Props) {
  const { data } = useQueryUser();
  const current = data?.data?.subscription?.plan ?? "FREE";

  return (
    <div className="container flex w-full flex-col gap-5 lg:w-10/12 xl:w-8/12">
      <div className="rounded-3xl border border-white/10 bg-ap3k-gradient-soft p-6">
        <p className="ap3k-kicker">Billing</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-rf-text">
          AP3k plans
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-rf-muted">
          Your database plan currently supports FREE and PRO. PRO is displayed as Creator while Agency billing remains available from the pricing page.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <PaymentCard label="FREE" current={current} />
        <PaymentCard label="PRO" current={current} />
        <PaymentCard label="AGENCY" current={current} />
      </div>
    </div>
  );
}

export default Billing;
