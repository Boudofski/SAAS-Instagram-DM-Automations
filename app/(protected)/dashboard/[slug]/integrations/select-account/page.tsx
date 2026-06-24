import {
  getPendingInstagramAccountSelections,
  selectPendingInstagramAccount,
} from "@/actions/integration";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import { dashboardPath } from "@/lib/dashboard";
import { redirect } from "next/navigation";

type Props = {
  params: { slug: string };
};

async function Page({ params }: Props) {
  const result = await getPendingInstagramAccountSelections();
  const accounts = result.data ?? [];

  if (!accounts.length) {
    redirect(`${dashboardPath(params.slug)}/integrations?integration_error=page_resolution_failed`);
  }

  return (
    <div className="flex justify-center p-4 text-slate-950 dark:text-slate-50 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
            Facebook Page connection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Select a Facebook Page
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            These are the eligible Facebook Pages managed by your Meta account. Select one Page to continue into its Page-scoped Instagram automation features.
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {accounts.map((account) => (
            <form
              key={account.pageId}
              action={selectPendingInstagramAccount}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <input type="hidden" name="pageId" value={account.pageId} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <InstagramAvatar
                    src={account.profilePictureUrl}
                    username={account.instagramUsername}
                    label={account.pageName}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="text-lg font-black">
                      {account.pageName ?? "Facebook Page"}
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">
                      Page ID: {account.pageId}
                    </p>
                    <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      Linked Instagram account: @{account.instagramUsername ?? "unknown"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>Official Meta connection</span>
                      <span>·</span>
                      <span>Managed Facebook Page</span>
                      <span>·</span>
                      <span>Permissions granted through official Meta access</span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-ap3k-gradient px-5 py-3 text-sm font-black text-white shadow-sm"
                >
                  Use this Page and continue
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Page;
