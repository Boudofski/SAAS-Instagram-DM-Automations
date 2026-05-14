export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-rf-bg flex items-center justify-center px-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
