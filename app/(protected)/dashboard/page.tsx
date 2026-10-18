import { onboardUser } from "@/actions/user";
import { dashboardDestinationPath } from "@/lib/dashboard";
import { redirect } from "next/navigation";
import Link from "next/link";

type Props = {
  searchParams?: Promise<{ next?: string | string[] }>;
};

async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const user = await onboardUser();

  if (user.status === 200 || user.status === 201) {
    const requestedDestination = Array.isArray(searchParams?.next)
      ? searchParams?.next[0]
      : searchParams?.next;
    return redirect(
      dashboardDestinationPath(user.data?.clerkId, requestedDestination)
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950 dark:bg-[#050816] dark:text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-[#0f172a] dark:shadow-black/20 sm:p-9">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-rf-pink">AP3K</span>
        <h1 className="mt-3 text-2xl font-black">Your workspace needs another moment</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Your sign-in is active, but AP3K could not finish preparing the dashboard. Nothing was deleted. Try again once, and contact support if this message remains.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className="ap3k-gradient-button justify-center px-5 py-3 text-sm">Try again</Link>
          <a href="mailto:support@ap3k.com?subject=AP3K%20workspace%20setup" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold dark:border-white/15">Contact support</a>
        </div>
      </section>
    </main>
  );
}

export default Page;
