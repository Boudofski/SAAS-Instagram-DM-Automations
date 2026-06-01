export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-slate-950 dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
      <div className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-rf-surface/78 dark:shadow-ap3k-card sm:p-8">
        {children}
      </div>
    </div>
  );
}
