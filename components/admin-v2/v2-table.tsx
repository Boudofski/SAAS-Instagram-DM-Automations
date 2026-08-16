import Link from "next/link";
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
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.075] bg-[#0b101b]/78 px-5 py-12 text-center text-sm text-slate-500 shadow-[0_14px_42px_rgba(0,0,0,0.14)]">
        {empty}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0b101b]/82 shadow-[0_14px_42px_rgba(0,0,0,0.14)] md:block">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="bg-[#0e1421]">
              <tr className="border-b border-white/[0.07]">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 first:pl-5 last:pr-5"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.045]">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="group transition-colors hover:bg-white/[0.025]"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="align-middle px-4 py-3 text-slate-300 first:pl-5 last:pr-5"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <article
            key={rowIndex}
            className="overflow-hidden rounded-2xl border border-white/[0.075] bg-[#0b101b]/88 shadow-[0_12px_36px_rgba(0,0,0,0.12)]"
          >
            <dl className="divide-y divide-white/[0.05]">
              {row.map((cell, cellIndex) => {
                const header = headers[cellIndex] ?? `Field ${cellIndex + 1}`;
                const isAction = /actions?/i.test(header);
                return (
                  <div
                    key={cellIndex}
                    className={cn(
                      "grid min-w-0 grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-4 py-3",
                      isAction && "grid-cols-1 bg-white/[0.018]"
                    )}
                  >
                    <dt className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                      {header}
                    </dt>
                    <dd className="min-w-0 break-words text-[13px] leading-5 text-slate-200">
                      {cell}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>
    </>
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
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
        <span className="font-bold tabular-nums text-slate-300">
          {Math.min(page * limit + 1, total)}–{Math.min((page + 1) * limit, total)} of {total}
        </span>
        <span>Page {page + 1} of {totalPages}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        {prev !== null ? (
          <Link
            href={`${base}?page=${prev}`}
            className="rounded-lg border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-center font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            ← Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-white/[0.04] px-3 py-2 text-center font-bold text-slate-700">← Previous</span>
        )}
        {next !== null ? (
          <Link
            href={`${base}?page=${next}`}
            className="rounded-lg border border-white/[0.09] bg-white/[0.035] px-3 py-2 text-center font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-lg border border-white/[0.04] px-3 py-2 text-center font-bold text-slate-700">Next →</span>
        )}
      </div>
    </div>
  );
}
