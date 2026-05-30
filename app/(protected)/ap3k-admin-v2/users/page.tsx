import { getAdminV2Users, getAdminV2UserCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge, statusTone } from "@/components/admin-v2/v2-badge";
import LocalTime from "@/components/global/local-time";

type Props = { searchParams?: { page?: string } };

export default async function AdminV2UsersPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [users, total] = await Promise.all([
    getAdminV2Users(page),
    getAdminV2UserCount(),
  ]);

  const rows = users.map((u) => [
    <div key="user" className="min-w-0">
      <p className="truncate font-bold text-slate-200">{u.email}</p>
      {(u.firstname || u.lastname) && (
        <p className="text-[11px] text-slate-500">
          {[u.firstname, u.lastname].filter(Boolean).join(" ")}
        </p>
      )}
    </div>,
    <V2Badge key="plan" tone={u.plan === "PRO" ? "pink" : "slate"}>
      {u.plan === "PRO" ? "Creator" : "Free"}
    </V2Badge>,
    u.instagramUsername ? (
      <span key="ig" className="text-slate-300">@{u.instagramUsername}</span>
    ) : (
      <span key="ig" className="text-slate-600">Not connected</span>
    ),
    <span key="campaigns" className="tabular-nums text-slate-300">
      {u.automationCount}
    </span>,
    <V2Badge key="status" tone={statusTone(u.status)}>{u.status}</V2Badge>,
    <span key="created" className="text-[11px] text-slate-500">
      <LocalTime value={u.createdAt} mode="date" />
    </span>,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Users</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          All Users{" "}
          <span className="text-base font-bold text-slate-500">({total})</span>
        </h1>
      </div>
      <V2Table
        headers={["User", "Plan", "Instagram", "Campaigns", "Status", "Joined"]}
        rows={rows}
        empty="No users found."
      />
      <V2Pagination page={page} total={total} base="/ap3k-admin-v2/users" />
    </div>
  );
}
