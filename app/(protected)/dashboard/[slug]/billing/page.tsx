import Billing from "@/components/global/billing";
import { onUserInfo } from "@/actions/user";
import { getUserMonthlyUsage } from "@/actions/usage/queries";

async function BillingPage() {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const usage = user?.id ? await getUserMonthlyUsage(user.id) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <Billing current={user?.subscription?.plan ?? "FREE"} usage={usage} />
    </div>
  );
}

export default BillingPage;
