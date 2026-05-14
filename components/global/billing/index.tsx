"use client";

import { useQueryUser } from "@/hooks/user-queries";
import PaymentCard from "./payment-card";

type Props = {};

function Billing({}: Props) {
  const { data } = useQueryUser();
  const current = data?.data?.subscription?.plan ?? "FREE";

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="ap3k-kicker">Billing</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          AP3k plans
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
