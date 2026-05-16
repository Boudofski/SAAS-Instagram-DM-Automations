import {
  getPendingInstagramAccountSelections,
  selectPendingInstagramAccount,
} from "@/actions/integration";
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
    <div className="flex justify-center p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
            Select Instagram account
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Choose the account AP3k should connect
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            AP3k found multiple Facebook Pages with linked Instagram accounts. Select the Page and Instagram account that owns the media you want to automate.
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {accounts.map((account) => (
            <form
              key={account.pageId}
              action={selectPendingInstagramAccount}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <input type="hidden" name="pageId" value={account.pageId} />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  {account.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={account.profilePictureUrl}
                      alt={account.instagramUsername ?? "Instagram account"}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ap3k-gradient text-sm font-black text-white">
                      IG
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-black">
                      @{account.instagramUsername ?? "unknown"}
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      Page: {account.pageName ?? "Unnamed Page"}
                    </p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                      <span>Page ID: {account.pageId}</span>
                      <span>IG Business ID: {account.instagramBusinessAccountId}</span>
                      <span>Source: {account.igAccountSource ?? "unknown"}</span>
                      <span>
                        Tasks: {account.tasks.length ? account.tasks.join(", ") : "not returned"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-ap3k-gradient px-5 py-3 text-sm font-black text-white shadow-sm"
                >
                  Connect this account
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

