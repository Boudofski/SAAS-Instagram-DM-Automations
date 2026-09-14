import { UiText } from "@/components/i18n/localized-copy";
import { onUserInfo } from "@/actions/user";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OnboardingCompletePage() {
  const user = await onUserInfo();
  const slug = user.data?.clerkId ?? "";
  const instagram = getCanonicalInstagramIntegration(user.status === 200 ? user.data?.integrations : null);

  if (!instagram) {
    redirect("/onboarding/connect");
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-rf-green/20 bg-rf-green/10 text-5xl shadow-[0_0_30px_rgba(16,185,129,0.18)]">🎉</div>
      <h1 className="text-2xl font-black tracking-tight mb-3"><UiText>{" Instagram connected — one step left "}</UiText></h1>
      <p className="mb-10 text-slate-600 dark:text-rf-muted"><UiText>{" Your connection and webhooks are ready. Create and activate an automation before testing a comment or DM. "}</UiText></p>

      <Link
        href={`/dashboard/${slug}/automation/new`}
        className="ap3k-gradient-button block w-full py-4 text-sm"
      ><UiText>{" Create and activate my first campaign "}</UiText></Link>

      <Link
        href={`/dashboard/${slug}`}
        className="block mt-3 text-xs text-slate-500 hover:text-slate-950 transition-colors dark:text-rf-muted dark:hover:text-rf-text"
      ><UiText>{" Explore dashboard "}</UiText></Link>
    </div>
  );
}
