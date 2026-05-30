import { cn } from "@/lib/utils";

export function V2Table({
  headers,
  rows,
  empty = "No records found.",
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.02]">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-slate-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className={cn("border-b border-white/[0.04] last:border-0", i % 2 === 0 ? "" : "bg-white/[0.015]")}
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-slate-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function V2Pagination({
  page,
  total,
  limit = 50,
  base,
}: {
  page: number;
  total: number;
  limit?: number;
  base: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const prev = page > 0 ? page - 1 : null;
  const next = page < totalPages - 1 ? page + 1 : null;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
      <span>
        {Math.min(page * limit + 1, total)}–{Math.min((page + 1) * limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        {prev !== null && (
          <a
            href={`${base}?page=${prev}`}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300 hover:bg-white/[0.08]"
          >
            ← Prev
          </a>
        )}
        {next !== null && (
          <a
            href={`${base}?page=${next}`}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300 hover:bg-white/[0.08]"
          >
            Next →
          </a>
        )}
      </div>
    </div>
  );
}
