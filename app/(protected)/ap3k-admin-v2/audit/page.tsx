import Link from "next/link";
import {
  getAdminV2AuditLogs,
  getAdminV2AuditLogCount,
  summarizeAuditValue,
  auditActionTone,
  auditStatusTone,
  type AdminV2AuditLogFilters,
  type AdminV2AuditLogRow,
} from "@/lib/admin-v2/audit-queries";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import LocalTime from "@/components/global/local-time";

type SearchParams = {
  page?: string;
  action?: string;
  targetId?: string;
  adminEmail?: string;
  dateFrom?: string;
  dateTo?: string;
};

type Props = { searchParams?: SearchParams };

const AUDIT_LIMIT = 50;

const ACTION_OPTIONS = [
  { value: "ADMIN_USER_SUSPENDED", label: "User suspended" },
  { value: "ADMIN_USER_REACTIVATED", label: "User reactivated" },
  { value: "ADMIN_PLAN_CHANGED", label: "Plan changed" },
  { value: "ADMIN_USER_USAGE_RESET", label: "Usage reset" },
  { value: "ADMIN_BILLING_OVERRIDES_UPDATED", label: "Billing overrides updated" },
  { value: "ADMIN_PAUSE_CAMPAIGN", label: "Campaign paused" },
  { value: "ADMIN_RESUME_CAMPAIGN", label: "Campaign resumed" },
  { value: "ADMIN_REFRESH_PROFILE_SNAPSHOT", label: "Profile snapshot refresh" },
  { value: "ADMIN_MARK_RECONNECT_REQUIRED", label: "Mark reconnect required" },
];

function sp(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function buildPageUrl(params: SearchParams, page: number): string {
  const entries = Object.entries({ ...params, page: String(page) })
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return `/ap3k-admin-v2/audit?${entries.join("&")}`;
}

export default async function AdminV2AuditPage({ searchParams }: Props) {
  const params = searchParams ?? {};
  const page = Math.max(0, parseInt(sp(params.page) ?? "0", 10) || 0);

  const filters: AdminV2AuditLogFilters = {
    action: sp(params.action) || undefined,
    targetId: sp(params.targetId) || undefined,
    adminEmail: sp(params.adminEmail) || undefined,
    dateFrom: sp(params.dateFrom) ? new Date(sp(params.dateFrom)!) : undefined,
    dateTo: sp(params.dateTo)
      ? new Date(`${sp(params.dateTo)}T23:59:59.999Z`)
      : undefined,
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const [logs, total] = await Promise.all([
    getAdminV2AuditLogs(filters, page),
    getAdminV2AuditLogCount(filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / AUDIT_LIMIT));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">
          Audit Logs
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          Admin Audit Log{" "}
          <span className="text-base font-bold text-slate-500">({total})</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Read-only record of all sensitive admin actions. No edits, replays, or
          rollbacks.
        </p>
      </div>

      {/* Filters */}
      <form
        method="GET"
        action="/ap3k-admin-v2/audit"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Action
          </label>
          <select
            name="action"
            defaultValue={sp(params.action) ?? ""}
            className="rounded-lg border border-white/10 bg-[#050816] px-3 py-1.5 text-xs text-slate-300 focus:border-pink-500 focus:outline-none"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Target user ID
          </label>
          <input
            name="targetId"
            type="text"
            defaultValue={sp(params.targetId) ?? ""}
            placeholder="User ID..."
            className="w-52 rounded-lg border border-white/10 bg-[#050816] px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Admin email
          </label>
          <input
            name="adminEmail"
            type="text"
            defaultValue={sp(params.adminEmail) ?? ""}
            placeholder="admin@..."
            className="w-44 rounded-lg border border-white/10 bg-[#050816] px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            From
          </label>
          <input
            name="dateFrom"
            type="date"
            defaultValue={sp(params.dateFrom) ?? ""}
            className="rounded-lg border border-white/10 bg-[#050816] px-3 py-1.5 text-xs text-slate-300 focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            To
          </label>
          <input
            name="dateTo"
            type="date"
            defaultValue={sp(params.dateTo) ?? ""}
            className="rounded-lg border border-white/10 bg-[#050816] px-3 py-1.5 text-xs text-slate-300 focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-pink-500 px-4 py-1.5 text-xs font-black text-white hover:bg-pink-400"
          >
            Filter
          </button>
          {activeFilterCount > 0 && (
            <Link
              href="/ap3k-admin-v2/audit"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              {[
                "Time",
                "Action",
                "Target",
                "Admin",
                "Reason",
                "Before",
                "After",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No audit log entries found.
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <AuditLogRows key={log.id} log={log} index={i} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>
            {Math.min(page * AUDIT_LIMIT + 1, total)}–
            {Math.min((page + 1) * AUDIT_LIMIT, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <Link
                href={buildPageUrl(params, page - 1)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300 hover:bg-white/[0.08]"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages - 1 && (
              <Link
                href={buildPageUrl(params, page + 1)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300 hover:bg-white/[0.08]"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogRows({
  log,
  index,
}: {
  log: AdminV2AuditLogRow;
  index: number;
}) {
  const stripe = index % 2 === 0 ? "" : "bg-white/[0.015]";
  const actionLabel = log.action.replace(/^ADMIN_/, "").replace(/_/g, " ");

  return (
    <>
      <tr className={`border-b border-white/[0.04] ${stripe}`}>
        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-400">
          <LocalTime value={log.createdAt} />
        </td>
        <td className="px-4 py-3">
          <V2Badge tone={auditActionTone(log.action)}>{actionLabel}</V2Badge>
        </td>
        <td className="px-4 py-3">
          <div className="min-w-0">
            {log.targetLabel && (
              <p className="truncate text-xs text-slate-300">{log.targetLabel}</p>
            )}
            {log.targetId && (
              <p className="font-mono text-[10px] text-slate-600">
                {log.targetId.slice(0, 8)}…
              </p>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
          {log.adminEmail ?? "—"}
        </td>
        <td className="max-w-[180px] px-4 py-3">
          <p className="truncate text-xs text-slate-400" title={log.reason ?? ""}>
            {log.reason ?? "—"}
          </p>
        </td>
        <td className="max-w-[140px] px-4 py-3">
          <p className="truncate text-[11px] text-slate-500">
            {summarizeAuditValue(log.before)}
          </p>
        </td>
        <td className="max-w-[140px] px-4 py-3">
          <p className="truncate text-[11px] text-slate-500">
            {summarizeAuditValue(log.after)}
          </p>
        </td>
        <td className="px-4 py-3">
          <V2Badge tone={auditStatusTone(log.status)}>{log.status}</V2Badge>
        </td>
      </tr>
      {/* Expandable detail row — pure HTML <details>, no client JS */}
      <tr className={stripe}>
        <td colSpan={8} className="border-b border-white/[0.04] px-4 pb-2 pt-0">
          <details>
            <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-300">
              ▶ View details
            </summary>
            <div className="mt-2 grid grid-cols-1 gap-3 rounded-xl bg-white/[0.05] p-3 sm:grid-cols-2">
              {log.reason && (
                <DetailBlock label="Reason" value={log.reason} />
              )}
              {log.before && (
                <DetailBlock
                  label="Before"
                  value={JSON.stringify(log.before, null, 2)}
                  mono
                />
              )}
              {log.after && (
                <DetailBlock
                  label="After"
                  value={JSON.stringify(log.after, null, 2)}
                  mono
                />
              )}
              {log.metadata && (
                <DetailBlock
                  label="Metadata"
                  value={JSON.stringify(log.metadata, null, 2)}
                  mono
                />
              )}
              {log.error && (
                <DetailBlock label="Error" value={log.error} tone="red" />
              )}
              <DetailBlock label="Target type" value={log.targetType} />
              {log.targetId && (
                <DetailBlock label="Target ID" value={log.targetId} mono />
              )}
              <DetailBlock
                label="Timestamp"
                value={<LocalTime value={log.createdAt} />}
              />
            </div>
          </details>
        </td>
      </tr>
    </>
  );
}

function DetailBlock({
  label,
  value,
  mono = false,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tone?: "red";
}) {
  return (
    <div>
      <p
        className={`text-[10px] font-black uppercase tracking-wider ${
          tone === "red" ? "text-red-500" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <div
        className={`mt-0.5 text-[11px] ${
          mono
            ? "overflow-x-auto rounded bg-black/30 p-1.5 font-mono whitespace-pre"
            : "whitespace-pre-wrap"
        } ${tone === "red" ? "text-red-300" : mono ? "text-slate-200" : "text-slate-300"}`}
      >
        {value}
      </div>
    </div>
  );
}
