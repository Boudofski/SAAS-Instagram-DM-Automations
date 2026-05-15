import Billing from "@/components/global/billing";
import { getAllAutomation } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

type Props = { params: { slug: string } };

async function Page({ params }: Props) {
  const [userResult, automationsResult] = await Promise.all([
    onUserInfo(),
    getAllAutomation(),
  ]);

  const user = userResult.status === 200 ? userResult.data : null;
  const automations =
    automationsResult.status === 200 && Array.isArray(automationsResult.data)
      ? (automationsResult.data as any[])
      : [];
  const instagram = user?.integrations?.[0];
  const totalComments = automations.reduce(
    (sum: number, automation: any) => sum + (automation.listener?.commentCount ?? 0),
    0
  );
  const totalDms = automations.reduce(
    (sum: number, automation: any) => sum + (automation.listener?.dmCount ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
              Account settings
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              AP3k workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage the signed-in AP3k user, connected Instagram profile, usage, and plan.
            </p>
          </div>
          <SignOutButton redirectUrl="/">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Connected profile
          </p>
          <div className="mt-5 flex items-center gap-4">
            {instagram?.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instagram.profilePictureUrl}
                alt={instagram.instagramUsername ?? "Instagram profile"}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ap3k-gradient text-sm font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-black">
                {instagram?.instagramUsername
                  ? `@${instagram.instagramUsername}`
                  : "No Instagram connected"}
              </p>
              <p className="text-sm text-slate-500">
                {instagram?.instagramId
                  ? `Account ID ${instagram.instagramId}`
                  : "Connect Instagram to activate comment automations."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["Campaigns", automations.length],
              ["Comments", totalComments],
              ["DMs sent", totalDms],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/${params.slug}/integrations`}
              className="ap3k-gradient-button px-4 py-2.5 text-sm"
            >
              {instagram ? "Reconnect Instagram" : "Connect Instagram"}
            </Link>
            {instagram && (
              <span className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600">
                Remove account: contact support
              </span>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            User and plan
          </p>
          <h2 className="mt-2 text-xl font-black">
            Current plan: {user?.subscription?.plan === "PRO" ? "Creator" : "Free"}
          </h2>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Signed-in AP3k user
            </p>
            <p className="mt-1 break-words text-sm font-bold text-slate-800">
              {user?.email ?? user?.firstname ?? "Signed in"}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Active campaigns", automations.filter((a: any) => a.active).length],
              ["Webhook events", "See campaign logs"],
              ["Billing history", "Stripe portal"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Billing />
    </div>
  );
}

export default Page;
