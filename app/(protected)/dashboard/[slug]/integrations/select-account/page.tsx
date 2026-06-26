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
            Official Meta connection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Select a Facebook Page
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            AP3k lists the Facebook Pages managed by the logged-in Meta user. Select the Page connected to the Instagram account you want to automate.
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
                    <p className="text-lg font-black text-slate-950 dark:text-white">
                      {account.pageName ?? "Unnamed Facebook Page"}
                    </p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                      Facebook Page ID: {account.pageId}
                    </p>
                    <div className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Instagram account: {account.instagramUsername ? `@${account.instagramUsername}` : "Not available"}
                      </span>
                      <span className="font-mono">
                        Instagram account ID: {account.instagramBusinessAccountId || "Not available"}
                      </span>
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
