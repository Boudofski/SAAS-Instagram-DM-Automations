import { onUserInfo } from "@/actions/user";
import Link from "next/link";

export default async function OnboardingCompletePage() {
  const user = await onUserInfo();
  const slug = user.data?.clerkId ?? "";

  return (
    <div className="text-center">
      <div className="text-5xl mb-6">🎉</div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-3">
        You&apos;re all set!
      </h1>
      <p className="text-rf-muted mb-10">
        Your Instagram is connected. Let&apos;s launch your first campaign.
      </p>

      <Link
        href={`/dashboard/${slug}/automation/new`}
        className="block w-full bg-gradient-to-r from-rf-blue to-rf-purple
                   text-white font-extrabold py-4 rounded-xl text-sm
                   shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:opacity-90 transition-opacity"
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
