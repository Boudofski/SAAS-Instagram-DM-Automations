import { onUserInfo } from "@/actions/user";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import Billing from "@/components/global/billing";
import { getBillingSnapshot } from "@/lib/billing-snapshot";
import type { CustomerPlan } from "@/lib/billing-plans";
import { getStripeSecretKey } from "@/lib/stripe-config";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const customerId = user?.subscription?.customerId ?? null;
  const [usage, billing] = await Promise.all([
    user?.id ? getUserMonthlyUsage(user.id) : undefined,
    getStripeSecretKey() && customerId ? getBillingSnapshot(customerId) : null,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <Billing
        current={(user?.subscription?.plan ?? "FREE") as CustomerPlan}
        usage={usage}
        canManageBilling={Boolean(customerId && getStripeSecretKey())}
        billing={billing}
      />
    </div>
  );
}
