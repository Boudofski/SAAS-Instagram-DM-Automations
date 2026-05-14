import { onUserInfo } from "@/actions/user";
import Link from "next/link";

export default async function OnboardingCompletePage() {
  const user = await onUserInfo();
  const slug = user.data?.clerkId ?? "";

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-rf-green/20 bg-rf-green/10 text-5xl shadow-[0_0_30px_rgba(16,185,129,0.18)]">🎉</div>
      <h1 className="text-2xl font-black tracking-tight mb-3">
        You&apos;re all set!
      </h1>
      <p className="text-rf-muted mb-10">
        Your Instagram is connected. Let&apos;s launch your first campaign.
      </p>

      <Link
        href={`/dashboard/${slug}/automation/new`}
        className="ap3k-gradient-button block w-full py-4 text-sm"
      >
        🚀 Create my first campaign
      </Link>

      <Link
        href={`/dashboard/${slug}`}
        className="block mt-3 text-xs text-rf-muted hover:text-rf-text transition-colors"
      >
        I&apos;ll explore first →
      </Link>
    </div>
  );
}
