export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial" />
      <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/10 bg-rf-surface/78 p-6 shadow-ap3k-card backdrop-blur-2xl sm:p-8">
        {children}
      </div>
    </div>
  );
}
