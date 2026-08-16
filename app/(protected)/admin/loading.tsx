export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading admin dashboard">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-8 w-64 rounded-lg bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-80 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
    </div>
  );
}
