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
    <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0b101d]/70 shadow-[0_18px_60px_rgba(0,0,0,0.14)]">
      <table className="w-full text-sm">
        <thead className="bg-[#0d1321]">
          <tr className="border-b border-white/[0.07]">
            {headers.map((header) => (
              <th
                key={header}
                className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-slate-600"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-sm text-slate-600">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-b border-white/[0.045] transition-colors last:border-0 hover:bg-white/[0.025]",
                  rowIndex % 2 === 0 ? "" : "bg-white/[0.012]"
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3.5 text-slate-300">
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
    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
      <span>
        {Math.min(page * limit + 1, total)}–{Math.min((page + 1) * limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        {prev !== null && (
          <a
            href={`${base}?page=${prev}`}
            className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300 transition hover:bg-white/[0.07]"
          >
            ← Prev
          </a>
        )}
        {next !== null && (
          <a
            href={`${base}?page=${next}`}
            className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-1.5 text-slate-300 transition hover:bg-white/[0.07]"
          >
            Next →
          </a>
        )}
      </div>
    </div>
  );
}
