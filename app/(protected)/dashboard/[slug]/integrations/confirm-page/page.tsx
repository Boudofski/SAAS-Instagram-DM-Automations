import { onUserInfo } from "@/actions/user";
import { dashboardPath } from "@/lib/dashboard";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: { slug: string };
};

export default async function ConfirmFacebookPage({ params }: Props) {
  const user = await onUserInfo();
  const integration = getCanonicalInstagramIntegration(
    user.status === 200 ? user.data?.integrations : null
  );

  if (!integration?.pageId) {
    redirect(`${dashboardPath(params.slug)}/integrations?integration_error=page_resolution_failed`);
  }

  return (
    <div className="flex justify-center p-4 text-slate-950 dark:text-slate-50 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
            Facebook Page connection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Select a Facebook Page
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Meta returned one eligible Page managed by this user. Select it to continue into AP3k&apos;s Page-scoped Instagram automation features.
          </p>
        </div>

        <div className="mt-5 rounded-3xl border-2 border-pink-200 bg-white p-6 shadow-sm dark:border-pink-500/30 dark:bg-white/[0.04]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Managed Facebook Page
              </p>
              <p className="mt-2 text-xl font-black">
                {integration.pageName ?? "Facebook Page"}
              </p>
              <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">
                Page ID: {integration.pageId}
              </p>
              {integration.instagramUsername && (
                <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Linked Instagram account: @{integration.instagramUsername}
                </p>
              )}
            </div>

            <Link
              href={`${dashboardPath(params.slug)}/integrations`}
              className="ap3k-gradient-button inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-black text-white"
            >
              Use this Page and continue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
