import { onUserInfo, skipOnboarding } from "@/actions/user";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

export default async function OnboardingWelcomePage() {
  const user = await onUserInfo();

  if (user.status === 200 && user.data?.integrations?.length) {
    redirect("/onboarding/complete");
  }

  if (
    user.status === 200 &&
    user.data?.clerkId &&
    cookies().get(onboardingSkippedCookie(user.data.clerkId))?.value === "true"
  ) {
    redirect("/dashboard");
  }

  const firstName = user.data?.firstname ?? "there";
  const slug =
    `${user.data?.firstname ?? ""}${user.data?.lastname ?? ""}` ||
    user.data?.clerkId ||
    "";

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rf-blue to-rf-purple
                      flex items-center justify-center text-white text-2xl font-black mx-auto mb-6">
        AP3K
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight mb-3">
        Welcome to AP3k, {firstName} 👋
      </h1>
      <p className="text-rf-muted mb-10 leading-relaxed">
        It takes 60 seconds to set up your first campaign.<br />
        Let&apos;s connect your Instagram and launch it now.
      </p>

      {/* Flow visualisation */}
      <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
        {[
          { icon: "💬", label: "Comment" },
          { icon: "→", label: null },
          { icon: "✉️", label: "DM sent" },
          { icon: "→", label: null },
          { icon: "🎯", label: "Lead captured" },
        ].map((item, i) => item.label ? (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-rf-surface border border-rf-border
                            flex items-center justify-center text-xl">
              {item.icon}
            </div>
            <span className="text-[10px] text-rf-muted">{item.label}</span>
          </div>
        ) : (
          <span key={i} className="text-rf-subtle text-xl mb-4">{item.icon}</span>
        ))}
      </div>

      <Link
        href={`/dashboard/${slug}/integrations`}
        className="block w-full bg-rf-blue hover:bg-rf-blue/90 text-white font-bold
                   py-3.5 rounded-xl text-sm transition-colors
                   shadow-[0_4px_20px_rgba(59,130,246,0.35)]"
      >
        Let&apos;s connect your Instagram →
      </Link>

      <form action={skipOnboarding}>
        <button
          type="submit"
          className="block w-full mt-3 text-xs text-rf-muted hover:text-rf-text transition-colors"
        >
          I&apos;ll explore first
        </button>
      </form>
    </div>
  );
}
