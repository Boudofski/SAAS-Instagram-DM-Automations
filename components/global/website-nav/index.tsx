import AP3kLogo from "@/components/global/ap3k-logo";
import { dashboardPath } from "@/lib/dashboard";
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-rf-bg/72 px-4 py-4 backdrop-blur-2xl sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/">
          <AP3kLogo className="text-base" />
        </Link>
        <ul className="hidden items-center gap-8 text-sm text-rf-muted md:flex">
          <li>
            <Link href="/#features" className="transition-colors hover:text-rf-text">
              Features
            </Link>
          </li>
          <li>
            <Link
              href="/pricing"
              className={current === "pricing" ? "text-rf-text" : "transition-colors hover:text-rf-text"}
            >
              Pricing
            </Link>
          </li>
          {isSignedIn ? (
            <li>
              <Link href={dashboardHref!} className="transition-colors hover:text-rf-text">
                Dashboard
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-rf-text">
                Login
              </Link>
            </li>
          )}
        </ul>
        <Link
          href={dashboardHref ?? "/sign-up"}
          className="ap3k-gradient-button px-5 py-2 text-sm"
        >
          {isSignedIn ? "Go to Dashboard" : "Start free"}
        </Link>
      </div>
    </nav>
  );
}
