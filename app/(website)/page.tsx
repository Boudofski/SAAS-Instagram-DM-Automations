import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { BLOG_POSTS } from "@/lib/blog";
import { getAuthenticatedLandingRedirect } from "@/lib/landing-redirect";
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRight, CheckCircle2, MessageCircle, Reply, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const FEATURES = [
  { icon: MessageCircle, title: "Connect Instagram", desc: "Authorize one Instagram Business or Creator account and manage its campaigns from one workspace." },
  { icon: Sparkles, title: "Comment triggers", desc: "Choose a post or Reel, then react to a keyword or to any eligible new comment." },
  { icon: Reply, title: "Comment replies + DMs", desc: "Reply under the post, send a DM to the commenter, or use both actions in one campaign." },
  { icon: TrendingUp, title: "Activity + leads", desc: "Track comments, trigger matches, sent actions, campaign runs, and captured leads." },
] as const;

const EXAMPLES = [
  { comment: "GUIDE", action: "Reply to the comment and send the guide by DM", color: "text-rf-pink" },
  { comment: "PRICE", action: "Match pricing interest and continue the conversation in a DM", color: "text-rf-purple" },
  { comment: "BOOK", action: "Capture booking intent and record the campaign lead", color: "text-rf-blue" },
] as const;

const PROOF = [
  ["Instagram", "Business & Creator accounts", "bg-rf-orange/10 text-rf-orange"],
  ["Triggers", "Keyword or any comment", "bg-rf-pink/10 text-rf-magenta"],
  ["Actions", "Comment reply + DM", "bg-rf-purple/10 text-rf-purple"],
  ["Tracking", "Activity + leads", "bg-rf-indigo/10 text-rf-indigo"],
] as const;

const STEPS = [
  ["01", "Connect Instagram", "Authorize one Instagram Business or Creator account."],
  ["02", "Create a campaign", "Choose a post, set a comment trigger, then choose the actions."],
  ["03", "Receive a comment", "AP3K checks the comment against your active campaign trigger."],
  ["04", "Reply + track", "AP3K runs the Comment reply, DM, or both and records the resulting activity."],
] as const;

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AP3K",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://ap3k.com",
  description: "Instagram comment and DM automation for Business and Creator accounts.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro Monthly", price: "9", priceCurrency: "USD" },
    { "@type": "Offer", name: "Business Monthly", price: "29", priceCurrency: "USD" },
  ],
};

export default async function LandingPage() {
  const authUser = await currentUser();
  const profile = authUser
    ? await client.user.findUnique({
        where: { clerkId: authUser.id },
        select: {
          clerkId: true,
          integrations: {
            where: { name: "INSTAGRAM" },
            select: { id: true, name: true, instagramId: true, status: true, reconnectRequired: true, token: true },
          },
          automations: { where: { archivedAt: null }, take: 1, select: { id: true } },
        },
      })
    : null;

  const redirectTo = getAuthenticatedLandingRedirect(authUser, profile);
  if (redirectTo) redirect(redirectTo);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-rf-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema).replace(/</g, "\\u003c") }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.16),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(236,72,153,0.14),transparent_30rem),radial-gradient(circle_at_50%_46%,rgba(139,92,246,0.10),transparent_36rem)]" />
      <WebsiteNav current="home" />

      <main className="relative z-10">
        <section className="px-4 pb-14 pt-14 sm:px-8 sm:pt-20 lg:px-16 lg:pb-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-rf-pink/25 bg-rf-pink/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-rf-pink">
                <span className="h-1.5 w-1.5 rounded-full bg-rf-pink shadow-[0_0_16px_rgba(244,114,182,0.8)]" /> Instagram comment automation
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Comments become leads.
                <span className="ap3k-gradient-text block animate-gradient-pan bg-[length:220%_220%]">Comment replies and DMs follow.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-rf-muted sm:text-lg">
                Connect Instagram, choose the comments that should trigger, then reply under the post, send a DM, or do both—while AP3K tracks campaign activity and leads.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="ap3k-gradient-button inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm">Launch your first campaign <ArrowRight className="h-4 w-4" /></Link>
                <a href="#how-it-works" className="ap3k-outline-button inline-flex items-center justify-center px-7 py-3.5 text-sm">See how it works</a>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {PROOF.map(([label, value, accent]) => (
                  <div key={value} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg dark:border-white/[0.12] dark:bg-[#111214]">
                    <div className={`mb-1.5 inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${accent}`}>{label}</div>
                    <div className="text-xs font-bold text-slate-600 dark:text-rf-muted">{value}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.12} className="relative">
              <div className="absolute -inset-10 rounded-[2.5rem] bg-ap3k-gradient opacity-15 blur-[60px]" />
              <div className="relative animate-float-slow overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-rf-surface/80 dark:shadow-ap3k-card">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111214]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-ap3k-gradient shadow-ap3k-glow" />
                    <div><p className="text-sm font-black">@yourhandle</p><p className="text-xs text-slate-500 dark:text-rf-muted">Campaign live</p></div>
                    <span className="ml-auto rounded-full border border-rf-green/25 bg-rf-green/10 px-2.5 py-1 text-[10px] font-black text-rf-green">Live</span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 dark:border-white/10 dark:from-[#182033] dark:via-[#111827] dark:to-[#0B1020]">
                    <div className="flex h-48 items-center justify-center bg-ap3k-radial sm:h-52">
                      <div className="rounded-2xl border border-white/60 bg-white/65 px-5 py-4 text-center backdrop-blur dark:border-white/[0.18] dark:bg-white/[0.10]"><p className="text-xs font-black uppercase tracking-[0.2em] text-rf-pink">Creator drop</p><p className="mt-1 text-2xl font-black">New guide is live</p></div>
                    </div>
                    <div className="flex gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-rf-muted"><span>2.4k likes</span><span>318 comments</span></div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.14] dark:bg-white/[0.07]"><p className="text-xs text-slate-500 dark:text-rf-muted">@sarah.creates commented</p><p className="mt-1 text-sm">This is exactly what I need. <span className="rounded-lg border border-rf-pink/25 bg-rf-pink/10 px-2 py-1 text-xs font-black text-rf-pink">GUIDE</span></p></div>
                    <div className="rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft p-4 sm:ml-8"><div className="mb-2 flex items-center gap-2 text-xs font-black text-rf-pink"><MessageCircle className="h-4 w-4" /> Comment reply sent</div><p className="text-sm leading-relaxed">Thanks for commenting — I sent the guide by DM.</p></div>
                    <div className="rounded-2xl border border-rf-blue/20 bg-rf-blue/10 p-4 sm:ml-12"><div className="mb-2 flex items-center gap-2 text-xs font-black text-rf-blue"><Reply className="h-4 w-4" /> DM sent</div><p className="text-sm leading-relaxed">Here is the guide you requested.</p></div>
                    <div className="flex items-center gap-3 rounded-2xl border border-rf-green/20 bg-rf-green/10 p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-rf-green/15 text-rf-green">✓</div><div><p className="text-sm font-black text-rf-green">Lead captured</p><p className="text-xs text-slate-500 dark:text-rf-muted">Campaign activity updated</p></div></div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white/50 px-4 py-8 backdrop-blur dark:border-white/10 dark:bg-rf-surface/40 sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            {EXAMPLES.map((ex) => <HoverLift key={ex.comment}><div className="ap3k-card rounded-2xl p-5"><span className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-sm font-black ${ex.color}`}>&ldquo;{ex.comment}&rdquo;</span><p className="mt-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-rf-text">{ex.action}</p></div></HoverLift>)}
          </div>
        </section>

        <section id="features" className="px-4 py-24 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center"><p className="ap3k-kicker">Everything you need</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Simple automation for creators who move fast.</h2><p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-rf-muted">One Instagram account, unlimited campaigns, clear triggers, automatic actions, and useful activity tracking.</p></FadeIn>
            <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => { const Icon = feature.icon; return <StaggerItem key={feature.title}><div className="ap3k-card ap3k-card-hover h-full rounded-3xl p-6"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft text-rf-pink"><Icon className="h-5 w-5" /></div><h3 className="font-black text-slate-950 dark:text-rf-text">{feature.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-rf-muted">{feature.desc}</p></div></StaggerItem>; })}
            </StaggerContainer>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-24 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-12 text-center"><p className="ap3k-kicker">How it works</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">From comment to action in four steps.</h2></FadeIn>
            <StaggerContainer className="grid gap-4 md:grid-cols-4">
              {STEPS.map(([num, title, desc]) => <StaggerItem key={num}><div className="ap3k-panel h-full p-5"><p className="font-mono text-xs font-black text-rf-pink">{num}</p><h3 className="mt-4 font-black text-slate-900 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-rf-muted">{desc}</p></div></StaggerItem>)}
            </StaggerContainer>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-10 text-center"><p className="ap3k-kicker">Built for a clean connection</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">No passwords. No scraping. No browser bots.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-rf-muted">AP3K connects through Instagram authorization and uses supported API flows for professional accounts.</p></FadeIn>
            <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Instagram authorization", "Business & Creator accounts", "Comment replies + DMs", "Data deletion controls"].map((label) => <StaggerItem key={label}><div className="ap3k-panel flex items-center gap-3 p-4"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-rf-green/10 dark:text-rf-green"><CheckCircle2 className="h-4 w-4" /></span><span className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span></div></StaggerItem>)}
            </StaggerContainer>
          </div>
        </section>

        <section id="pricing" className="px-4 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <FadeIn className="mb-12 text-center"><p className="ap3k-kicker">Simple pricing</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Start free. Save more annually.</h2><p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-rf-muted">Pro starts at $9/month. Business is $29/month. Annual billing saves up to 27% while your reply allowance still resets every month.</p></FadeIn>
            <FadeIn delay={0.05}><PricingExperience compact /></FadeIn>
            <div className="mt-7 text-center"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-300">See full plan comparison <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="ap3k-kicker">Learn Instagram automation</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Practical guides for better campaigns.</h2></div><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-300">Visit the blog <ArrowRight className="h-4 w-4" /></Link></FadeIn>
            <StaggerContainer className="grid gap-4 md:grid-cols-3">
              {BLOG_POSTS.slice(0, 3).map((post) => <StaggerItem key={post.slug}><Link href={`/blog/${post.slug}`} className="group block h-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-500/30 motion-safe:hover:shadow-xl dark:border-white/10 dark:bg-[#101112]"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">{post.category}</p><h3 className="mt-3 text-xl font-black leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-300">{post.title}</h3><p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{post.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-300">Read guide <ArrowRight className="h-4 w-4" /></span></Link></StaggerItem>)}
            </StaggerContainer>
          </div>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
