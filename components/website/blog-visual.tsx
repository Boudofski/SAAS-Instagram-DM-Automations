type BlogVisualVariant =
  | "workflow"
  | "connect"
  | "keyword"
  | "any-comment"
  | "dm-link"
  | "analytics"
  | "troubleshoot";

type Props = {
  variant: BlogVisualVariant;
  alt: string;
  caption?: string;
  compact?: boolean;
};

const SCENES: Record<BlogVisualVariant, { label: string; left: string; middle: string; right: string }> = {
  workflow: { label: "AP3K campaign flow", left: "Comment", middle: "AP3K", right: "Reply + DM" },
  connect: { label: "Connect Instagram", left: "Instagram", middle: "Authorize", right: "Connected" },
  keyword: { label: "Keyword trigger", left: "Comment GUIDE", middle: "Keyword found", right: "Send DM" },
  "any-comment": { label: "Any comment trigger", left: "New comment", middle: "Any comment", right: "Run actions" },
  "dm-link": { label: "DM link delivery", left: "Request", middle: "DM message", right: "Get the Link" },
  analytics: { label: "Campaign analytics", left: "Comments", middle: "Matches", right: "Leads" },
  troubleshoot: { label: "Campaign health check", left: "Test", middle: "Diagnose", right: "Working" },
};

export type { BlogVisualVariant };

export default function BlogVisual({ variant, alt, caption, compact = false }: Props) {
  const scene = SCENES[variant];

  return (
    <figure className="group">
      <div
        role="img"
        aria-label={alt}
        className={`relative isolate overflow-hidden rounded-[28px] border border-violet-500/20 bg-[linear-gradient(135deg,#32107d_0%,#6423c9_48%,#a133c5_100%)] shadow-[0_24px_70px_rgba(88,28,180,0.22)] ${compact ? "min-h-48 p-5" : "min-h-[270px] p-6 sm:min-h-[330px] sm:p-10"}`}
      >
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-3xl motion-safe:animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-12 h-64 w-64 rounded-full bg-indigo-950/40 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-white/60 sm:text-xs">
          <span>{scene.label}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 motion-safe:animate-pulse" /> Live flow
          </span>
        </div>

        <div className={`relative z-10 grid items-center ${compact ? "mt-8 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]" : "mt-10 gap-4 sm:mt-14 sm:grid-cols-[1fr_auto_1fr_auto_1fr]"}`}>
          {[scene.left, scene.middle, scene.right].map((label, index) => (
            <div key={label} className="contents">
              <div className={`relative rounded-2xl border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md transition duration-500 motion-safe:group-hover:-translate-y-1 ${compact ? "p-3" : "p-4 sm:p-5"}`}>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/12 text-sm font-black text-fuchsia-100">{index + 1}</span>
                <p className={`font-black ${compact ? "mt-3 text-xs" : "mt-4 text-sm sm:text-base"}`}>{label}</p>
                {!compact && <p className="mt-1.5 text-xs leading-5 text-white/60">{stepDescription(variant, index)}</p>}
                {index === 1 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-pink-300 shadow-[0_0_18px_rgba(249,168,212,0.9)] motion-safe:animate-ping" />}
              </div>
              {index < 2 && (
                <div aria-hidden="true" className="hidden items-center sm:flex">
                  <span className="h-px w-5 bg-white/25 sm:w-8" />
                  <span className="-ml-1 h-2 w-2 rotate-45 border-r border-t border-white/45" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {caption && <figcaption className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">{caption}</figcaption>}
    </figure>
  );
}

function stepDescription(variant: BlogVisualVariant, index: number) {
  const descriptions: Record<BlogVisualVariant, string[]> = {
    workflow: ["A real person comments", "The trigger is checked", "Configured actions run"],
    connect: ["Choose a professional account", "Approve requested access", "Media and campaigns become available"],
    keyword: ["The caption asks for a word", "AP3K checks whether it appears", "The promised follow-up is delivered"],
    "any-comment": ["Every eligible comment enters", "No keyword is required", "The same response flow runs"],
    "dm-link": ["Interest starts publicly", "The useful message arrives privately", "One clear button opens the resource"],
    analytics: ["See incoming activity", "Confirm trigger performance", "Measure captured opportunities"],
    troubleshoot: ["Reproduce with another account", "Check connection and activity", "Fix one cause and test again"],
  };
  return descriptions[variant][index];
}
