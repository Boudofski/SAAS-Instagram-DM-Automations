import PricingCard from "@/components/global/pricing-card";
import Link from "next/link";

const PLANS = [
  {
    tier: "Free",
    price: "$0",
    description: "Perfect for getting started",
    ctaLabel: "Get started free",
    ctaHref: "/sign-up",
    featured: false,
    features: [
      { text: "1 active campaign", included: true },
      { text: "Up to 50 DMs/month", included: true },
      { text: "Keyword triggers", included: true },
      { text: "Basic analytics", included: true },
      { text: "Smart AI replies", included: false },
      { text: "Unlimited DMs", included: false },
    ],
  },
  {
    tier: "Creator",
    price: "$29",
    description: "For serious creators and coaches",
    ctaLabel: "Start Creator plan",
    ctaHref: "/payment?plan=creator",
    featured: true,
    features: [
      { text: "Unlimited campaigns", included: true },
      { text: "Unlimited DMs", included: true },
      { text: "Smart AI replies", included: true },
      { text: "Full analytics + leads export", included: true },
      { text: "{{variable}} personalisation", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    tier: "Agency",
    price: "$79",
    description: "For teams managing multiple accounts",
    ctaLabel: "Start Agency plan",
    ctaHref: "/payment?plan=agency",
    featured: false,
    features: [
      { text: "Everything in Creator", included: true },
      { text: "Up to 10 Instagram accounts", included: true },
      { text: "Team access", included: true },
      { text: "Dedicated onboarding", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA support", included: true },
    ],
  },
] as const;

const FEATURES = [
  { icon: "🏷️", title: "Keyword triggers", desc: "When someone comments 'link', 'info', or any word you choose — your DM fires instantly." },
  { icon: "✉️", title: "Personalised DMs", desc: "Use {{first_name}}, {{keyword}}, and {{link}} to make every DM feel human and targeted." },
  { icon: "🤖", title: "Smart AI replies", desc: "Let AI handle follow-up conversations — answers questions, nurtures leads, closes sales. 24/7." },
  { icon: "📊", title: "Real analytics", desc: "Track DMs sent, leads captured, and reply rate per campaign. Know exactly what's working." },
  { icon: "💬", title: "Public comment replies", desc: "Reply publicly before sending the DM — boosts engagement and warms up the lead." },
  { icon: "🛡️", title: "Safe by design", desc: "Built-in duplicate prevention. Nobody gets the same DM twice. No spam, no bans." },
] as const;

const EXAMPLES = [
  { comment: "GUIDE", action: "Free PDF guide sent via DM",    color: "text-rf-blue" },
  { comment: "PRICE", action: "Pricing page link sent via DM", color: "text-rf-purple" },
  { comment: "BOOK",  action: "Booking page sent via DM",      color: "text-rf-green" },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-rf-bg text-rf-text font-sans">

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-16 py-4
                      border-b border-rf-border bg-rf-bg/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 font-bold text-base">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rf-blue to-rf-purple
                          flex items-center justify-center text-white text-[8px] font-black">
            AP3K
          </div>
          AP3k
        </div>
        <ul className="hidden md:flex items-center gap-8 text-sm text-rf-muted">
          <li><a href="#features" className="hover:text-rf-text transition-colors">Features</a></li>
          <li><a href="#pricing" className="hover:text-rf-text transition-colors">Pricing</a></li>
          <li><Link href="/dashboard" className="hover:text-rf-text transition-colors">Login</Link></li>
        </ul>
        <Link
          href="/sign-up"
          className="bg-rf-blue hover:bg-rf-blue/90 text-white text-sm font-bold
                     px-5 py-2 rounded-lg transition-colors"
        >
          Start free →
        </Link>
      </nav>

      {/* HERO */}
      <section className="relative px-16 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[400px] rounded-full
                          bg-rf-blue/6 blur-[100px]" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] rounded-full
                          bg-rf-purple/5 blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2
                        gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-rf-blue/10 border border-rf-blue/25
                            rounded-full px-3 py-1.5 text-xs font-semibold text-rf-blue mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-rf-blue animate-pulse" />
              Instagram DM Automation
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.06] tracking-[-0.04em] mb-5">
              Turn Instagram Comments<br />
              <span className="bg-gradient-to-r from-rf-blue to-rf-purple bg-clip-text text-transparent">
                Into Leads Automatically
              </span>
            </h1>

            <p className="text-lg text-rf-muted leading-relaxed mb-8 max-w-md">
              AP3k turns Instagram comments into automated DMs, leads, and sales.
            </p>

            <div className="flex items-center gap-3 mb-10">
              <Link
                href="/sign-up"
                className="bg-rf-blue hover:bg-rf-blue/90 text-white font-bold px-7 py-3.5
                           rounded-xl text-sm transition-colors shadow-[0_4px_20px_rgba(59,130,246,0.35)]"
              >
                Launch your first campaign →
              </Link>
              <a
                href="#features"
                className="border border-rf-border hover:border-rf-subtle text-rf-muted
                           hover:text-rf-text font-bold px-7 py-3.5 rounded-xl text-sm transition-colors"
              >
                See how it works
              </a>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-rf-muted">
              <div className="flex -space-x-2">
                {["A","M","J","S"].map((l) => (
                  <div key={l} className="w-6 h-6 rounded-full border-2 border-rf-bg
                                          bg-gradient-to-br from-rf-blue to-rf-purple
                                          flex items-center justify-center text-white text-[9px] font-bold">
                    {l}
                  </div>
                ))}
              </div>
              Trusted by <strong className="text-rf-text ml-1">2,400+ creators</strong>
            </div>
          </div>

          {/* Right — Comment → DM → Lead flow */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rf-muted mb-1">
              How it works
            </p>

            <div className="bg-rf-surface border border-rf-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rf-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-600" />
                <div>
                  <p className="text-xs font-semibold">@yourhandle</p>
                  <p className="text-[10px] text-rf-muted">Reel · 2h ago</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-rf-green bg-rf-green/10
                                 border border-rf-green/25 px-2 py-0.5 rounded-full">
                  🔗 AP3k active
                </span>
              </div>
              <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-900
                              flex items-center justify-center text-rf-muted text-sm">
                🎬 Your Reel
              </div>
              <div className="px-4 py-2 flex gap-4 text-[11px] text-rf-muted border-t border-rf-border">
                <span>❤️ 2.4k</span><span>💬 318 comments</span>
              </div>
            </div>

            <div className="bg-rf-surface border border-rf-border rounded-xl px-4 py-3 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rf-purple to-rf-blue" />
                <span className="text-xs font-semibold">@sarah.creates</span>
              </div>
              <p className="text-sm">
                This is amazing!{" "}
                <span className="bg-rf-blue/15 border border-rf-blue/30 text-rf-blue
                                 font-semibold px-1.5 py-0.5 rounded text-xs">
                  send link
                </span>{" "}
                please 🙏
              </p>
              <span className="absolute top-2.5 right-3 text-[10px] font-bold text-rf-green
                               bg-rf-green/10 border border-rf-green/25 px-2 py-0.5 rounded-full">
                ⚡ Keyword matched
              </span>
            </div>

            <div className="bg-rf-blue/8 border border-rf-blue/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rf-blue to-rf-purple
                                flex items-center justify-center text-white text-xs">
                  ✉️
                </div>
                <span className="text-xs font-bold text-rf-blue">DM sent instantly</span>
              </div>
              <p className="text-sm text-rf-text leading-relaxed">
                Hey <span className="text-rf-purple font-semibold">@sarah.creates</span>! Here&apos;s
                exactly what you asked for 👇<br />
                <span className="text-rf-blue">→ yoursite.com/resource</span>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-rf-green/6 border border-rf-green/20
                            rounded-xl px-4 py-3">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-xs font-bold text-rf-green">Lead captured — sarah.creates</p>
                <p className="text-[11px] text-rf-muted">Added to your leads · &lt;1s response</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLES STRIP */}
      <section className="px-16 py-10 border-y border-rf-border bg-rf-surface/40">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAMPLES.map((ex) => (
            <div key={ex.comment}
                 className="bg-rf-surface border border-rf-border rounded-xl p-5
                            flex items-center gap-4">
              <span className={`text-sm font-bold font-mono px-3 py-1.5 rounded-lg
                               bg-rf-surface2 border border-rf-border ${ex.color}`}>
                &ldquo;{ex.comment}&rdquo;
              </span>
              <span className="text-rf-muted text-xs">→</span>
              <span className="text-rf-text text-xs font-medium leading-snug">{ex.action}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="px-16 py-8 border-b border-rf-border">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-10 items-center justify-center">
          {[
            { num: "1.2M",  label: "DMs sent" },
            { num: "340K",  label: "Leads captured" },
            { num: "98.4%", label: "Delivery rate" },
            { num: "2,400+",label: "Active creators" },
            { num: "<1s",   label: "Response time" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold tracking-tight text-rf-text">{s.num}</div>
              <div className="text-xs text-rf-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-16 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-3">
              Everything you need
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-3">
              Set up in 60 seconds.<br />Run on autopilot.
            </h2>
            <p className="text-rf-muted max-w-md mx-auto">
              Pick your post, add keywords, write your DM. Done.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title}
                   className="bg-rf-surface border border-rf-border rounded-2xl p-6
                              hover:border-rf-blue/30 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-rf-text mb-2">{f.title}</h3>
                <p className="text-sm text-rf-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-16 py-20 bg-rf-blue/3">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-3">
              Simple pricing
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-3">
              Start free. Scale when you&apos;re ready.
            </h2>
            <p className="text-rf-muted">No hidden fees. Cancel any time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <PricingCard key={p.tier} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-16 py-8 border-t border-rf-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-rf-muted">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rf-blue to-rf-purple
                          flex items-center justify-center text-white text-[7px] font-black">
            AP3K
          </div>
          AP3k
        </div>
        <div className="flex gap-6 text-xs text-rf-muted">
          {["Privacy","Terms","Docs","Status"].map((l) => (
            <a key={l} href="#" className="hover:text-rf-text transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs text-rf-subtle">© 2026 AP3k</p>
      </footer>

    </div>
  );
}
