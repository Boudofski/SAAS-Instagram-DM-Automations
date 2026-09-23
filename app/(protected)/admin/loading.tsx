export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading admin workspace"
      className="space-y-6"
    >
      <p className="text-sm text-slate-400">Loading your workspace…</p>
      <div className="h-20 rounded-xl bg-white/5 motion-safe:animate-pulse" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-32 rounded-xl border border-white/10 bg-white/[0.025] motion-safe:animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-white/10 bg-white/[0.025]" />
    </div>
  );
}
