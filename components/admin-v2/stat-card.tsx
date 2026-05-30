export function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-xs font-bold text-slate-500">{sub}</p>}
    </div>
  );
}
