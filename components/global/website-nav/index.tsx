import AP3kLogo from "@/components/global/ap3k-logo";
import ThemeToggle from "@/components/global/theme-toggle";
import { dashboardPath } from "@/lib/dashboard";
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Menu } from "lucide-react";
import Link from "next/link";

async function getDashboardHref() {
  const user = await currentUser();
  if (!user) return null;

  const profile = await client.user.findUnique({
    where: { clerkId: user.id },
    select: { firstname: true, lastname: true, clerkId: true },
  });

  return dashboardPath(profile?.clerkId ?? user.id);
}

type Props = {
  current?: "home" | "pricing" | "privacy" | "terms" | "data-deletion";
};

export default async function WebsiteNav({ current }: Props) {
  const dashboardHref = await getDashboardHref();
  const isSignedIn = Boolean(dashboardHref);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/78 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-rf-bg/72 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/">
          <AP3kLogo className="text-base text-slate-950 dark:text-white" />
        </Link>
        <ul className="hidden items-center gap-8 text-sm font-semibold text-slate-600 dark:text-rf-muted md:flex">
          <li>
            <Link href="/#features" className="transition-colors hover:text-slate-950 dark:hover:text-rf-text">
              Features
            </Link>
          </li>
          <li>
            <Link href="/#how-it-works" className="transition-colors hover:text-slate-950 dark:hover:text-rf-text">
              How it works
            </Link>
          </li>
          <li>
            <Link
              href="/pricing"
              className={current === "pricing" ? "text-slate-950 dark:text-rf-text" : "transition-colors hover:text-slate-950 dark:hover:text-rf-text"}
            >
              Pricing
            </Link>
          </li>
          {isSignedIn ? (
            <li>
              <Link href={dashboardHref!} className="transition-colors hover:text-slate-950 dark:hover:text-rf-text">
                Dashboard
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-slate-950 dark:hover:text-rf-text">
                Login
              </Link>
            </li>
          )}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle compact />
          <Link
            href={dashboardHref ?? "/sign-up"}
            className="ap3k-gradient-button px-5 py-2 text-sm"
          >
            {isSignedIn ? "Go to Dashboard" : "Start free"}
          </Link>
        </div>
        <details className="group relative md:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-slate-200 bg-white/85 text-slate-800 shadow-sm marker:hidden dark:border-white/10 dark:bg-white/[0.06] dark:text-white">
            <Menu className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#101827]">
            <div className="grid gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href="/#features">Features</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href="/#how-it-works">How it works</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href="/pricing">Pricing</Link>
              <Link className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10" href={dashboardHref ?? "/dashboard"}>{isSignedIn ? "Dashboard" : "Login"}</Link>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
              <ThemeToggle compact />
              <Link href={dashboardHref ?? "/sign-up"} className="ap3k-gradient-button flex-1 px-4 py-2 text-center text-sm">
                {isSignedIn ? "Go to Dashboard" : "Start free"}
              </Link>
            </div>
          </div>
        </details>
      </div>
    </nav>
  );
}
