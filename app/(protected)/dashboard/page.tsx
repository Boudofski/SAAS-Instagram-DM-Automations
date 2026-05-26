import { onboardUser } from "@/actions/user";
import { dashboardPath } from "@/lib/dashboard";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {};

async function Page({}: Props) {
  const user = await onboardUser();

  if (user.status === 200 || user.status === 201) {
    return redirect(dashboardPath(user.data?.clerkId));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950 dark:bg-[#050816] dark:text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">AP3k setup</p>
        <h1 className="mt-2 text-2xl font-black">We could not finish your dashboard setup</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Your Clerk session is active, but AP3k could not load or create the local workspace profile. Refresh once, or return home and try again.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">
            Retry setup
          </Link>
          <Link href="/" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.08]">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Page;
