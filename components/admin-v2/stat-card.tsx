const TONES = {
  slate: "border-white/[0.07] from-white/[0.045] to-white/[0.018]",
  green: "border-emerald-500/15 from-emerald-500/[0.07] to-white/[0.018]",
  amber: "border-amber-500/15 from-amber-500/[0.07] to-white/[0.018]",
  red: "border-red-500/15 from-red-500/[0.07] to-white/[0.018]",
  pink: "border-pink-500/15 from-pink-500/[0.08] to-white/[0.018]",
  blue: "border-sky-500/15 from-sky-500/[0.07] to-white/[0.018]",
} as const;

export function StatCard({
  label,
  value,
  sub,
  tone = "slate",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-[0_16px_50px_rgba(0,0,0,0.12)] ${TONES[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-slate-500">{sub}</p>}
    </div>
  );
}
