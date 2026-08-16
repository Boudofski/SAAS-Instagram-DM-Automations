import { getAdminV2Users, getAdminV2UserCount } from "@/lib/admin-v2/queries";
import { V2Table, V2Pagination } from "@/components/admin-v2/v2-table";
import { V2Badge, statusTone } from "@/components/admin-v2/v2-badge";
import { AdminPageHeader } from "@/components/admin-v2/page-header";
import LocalTime from "@/components/global/local-time";
import Link from "next/link";

type Props = { searchParams?: { page?: string } };

export default async function AdminV2UsersPage({ searchParams }: Props) {
  const page = Math.max(0, parseInt(searchParams?.page ?? "0", 10) || 0);
  const [users, total] = await Promise.all([
    getAdminV2Users(page),
    getAdminV2UserCount(),
  ]);

  const rows = users.map((user) => [
    <div key="user" className="min-w-0">
      <p className="break-all font-bold text-slate-100 sm:break-normal sm:truncate">{user.email}</p>
      {(user.firstname || user.lastname) && (
        <p className="mt-0.5 truncate text-[11px] text-slate-500">
          {[user.firstname, user.lastname].filter(Boolean).join(" ")}
        </p>
      )}
    </div>,
    <V2Badge key="plan" tone={user.plan === "PRO" ? "pink" : "slate"}>
      {user.plan === "PRO" ? "Creator" : "Free"}
    </V2Badge>,
    user.instagramUsername ? (
      <span key="ig" className="text-slate-300">@{user.instagramUsername}</span>
    ) : (
      <span key="ig" className="text-slate-600">Not connected</span>
    ),
    <span key="campaigns" className="font-semibold tabular-nums text-slate-300">{user.automationCount}</span>,
    <span key="replies" className="font-semibold tabular-nums text-slate-300">{user.repliesToday}</span>,
    <span key="leads" className="font-semibold tabular-nums text-slate-300">{user.leadsToday}</span>,
    user.lastActivity ? (
      <span key="last" className="whitespace-nowrap text-[11px] text-slate-400"><LocalTime value={user.lastActivity} /></span>
    ) : (
      <span key="last" className="text-[11px] text-slate-600">No activity</span>
    ),
    <V2Badge key="status" tone={statusTone(user.status)}>{user.status}</V2Badge>,
    <Link
      key="detail"
      href={`/admin/users/${user.id}`}
      className="inline-flex items-center rounded-lg border border-pink-500/15 bg-pink-500/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-pink-300 transition hover:bg-pink-500/[0.1] hover:text-pink-200"
    >
      View details →
    </Link>,
  ]);

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <AdminPageHeader
        eyebrow="Users"
        title="All users"
        count={total}
        description="Account status, plan, Instagram connection, campaign volume, and recent usage in one place."
      />

      <V2Table
        headers={["User", "Plan", "Instagram", "Campaigns", "Replies today", "Leads today", "Last activity", "Status", "Actions"]}
        rows={rows}
        empty="No users found."
      />
      <V2Pagination page={page} total={total} base="/admin/users" />
    </div>
  );
}
