import { FadeIn, HoverLift, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { BLOG_POSTS } from "@/lib/blog";
import { getAuthenticatedLandingRedirect } from "@/lib/landing-redirect";
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  LockKeyhole,
  MessageCircle,
  MousePointerClick,
  Play,
  Reply,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const FAQS = [
  ["Do I need coding skills?", "No. Connect an Instagram Business or Creator account, choose a post, set the trigger, choose your actions, and activate the campaign."],
  ["Can AP3K reply to comments and send DMs?", "Yes. A campaign can Reply to comment, Send a DM, or do both when an eligible Instagram comment matches the trigger."],
  ["How are automated replies counted?", "Each successfully sent Comment reply counts as one automated reply, and each successfully sent DM counts as one automated reply. Failed or skipped actions do not count."],
  ["Do annual plans still reset usage monthly?", "Yes. Annual billing changes how you pay, not the monthly usage cycle. Your automated reply allowance resets each month."],
  ["Which Instagram accounts work?", "AP3K is designed for Instagram professional accounts supported by the current Instagram Business API flow, including Business and Creator accounts."],
  ["Can I change or cancel my plan later?", "Yes. Paid subscriptions can be managed through the Billing center and Stripe customer portal."],
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
    { "@type": "Offer", name: "Pro Annual", price: "79", priceCurrency: "USD" },
    { "@type": "Offer", name: "Business Monthly", price: "29", priceCurrency: "USD" },
    { "@type": "Offer", name: "Business Annual", price: "279", priceCurrency: "USD" },
  ],
};

function makePoster(title: string, subtitle: string, accent = "#ff4fc7") {
  const safeTitle = title.replace(/[&<>]/g, "");
  const safeSubtitle = subtitle.replace(/[&<>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#16111f"/><stop offset="1" stop-color="#08080d"/></linearGradient><radialGradient id="r"><stop stop-color="${accent}" stop-opacity=".36"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="720" height="1280" rx="72" fill="url(#g)"/><circle cx="560" cy="220" r="300" fill="url(#r)"/><rect x="54" y="74" width="612" height="78" rx="39" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".12"/><circle cx="102" cy="113" r="21" fill="${accent}"/><text x="142" y="124" fill="white" font-size="30" font-family="Arial,Helvetica,sans-serif" font-weight="700">AP3K automation</text><rect x="60" y="240" width="600" height="200" rx="40" fill="#ffffff" fill-opacity=".06" stroke="#ffffff" stroke-opacity=".10"/><text x="100" y="320" fill="#ffffff" font-size="42" font-family="Arial,Helvetica,sans-serif" font-weight="800">${safeTitle}</text><text x="100" y="374" fill="#cbd5e1" font-size="25" font-family="Arial,Helvetica,sans-serif">${safeSubtitle}</text><rect x="60" y="500" width="600" height="130" rx="34" fill="#ffffff" fill-opacity=".05"/><circle cx="112" cy="565" r="24" fill="#7c3aed"/><rect x="158" y="540" width="316" height="18" rx="9" fill="#ffffff" fill-opacity=".85"/><rect x="158" y="578" width="220" height="14" rx="7" fill="#ffffff" fill-opacity=".28"/><rect x="60" y="660" width="600" height="130" rx="34" fill="#ffffff" fill-opacity=".05"/><circle cx="112" cy="725" r="24" fill="${accent}"/><rect x="158" y="700" width="350" height="18" rx="9" fill="#ffffff" fill-opacity=".85"/><rect x="158" y="738" width="260" height="14" rx="7" fill="#ffffff" fill-opacity=".28"/><rect x="60" y="820" width="600" height="280" rx="40" fill="${accent}" fill-opacity=".12" stroke="${accent}" stroke-opacity=".24"/><path d="M330 920l110 65-110 65z" fill="white" fill-opacity=".92"/><text x="360" y="1170" text-anchor="middle" fill="#ffffff" fill-opacity=".5" font-size="22" font-family="Arial,Helvetica,sans-serif">Video plays automatically</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function ProductVideo({
  src,
  label,
  posterTitle,
  posterSubtitle,
  accent,
  className = "",
}: {
  src: string;
  label: string;
  posterTitle: string;
  posterSubtitle: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[330px] ${className}`}>
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-400/20 via-fuchsia-400/15 to-cyan-300/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2.55rem] border border-slate-950/10 bg-[#101014] p-2.5 shadow-[0_30px_90px_rgba(41,25,80,0.22)]">
        <div className="mb-2 flex items-center justify-between px-2 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
          <span>AP3K demo</span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live</span>
        </div>
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={makePoster(posterTitle, posterSubtitle, accent)}
          aria-label={label}
          className="aspect-[240/426] w-full rounded-[1.9rem] bg-[#0d0d12] object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7738e7]">{children}</p>;
}

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
    <div className="min-h-screen overflow-hidden bg-white text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema).replace(/</g, "\\u003c") }} />
      <WebsiteNav current="home" />

      <main>
        <section className="relative overflow-hidden bg-[#7338e6] px-4 pb-16 pt-12 text-white sm:px-8 sm:pb-20 sm:pt-16 lg:px-16 lg:pb-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(255,92,211,.34),transparent_28rem),radial-gradient(circle_at_90%_0%,rgba(32,20,91,.55),transparent_34rem)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] backdrop-blur">
                <Sparkles className="h-4 w-4" /> Instagram automation that feels simple
              </div>
              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
                Turn comments into conversations that convert.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/80 sm:text-xl">
                AP3K replies to Instagram comments, sends the right DM, and keeps every campaign lead organized—without making you live in your inbox.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#6128c8] shadow-[0_18px_45px_rgba(28,8,68,.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(28,8,68,.36)]">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#product" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                  <Play className="h-4 w-4 fill-current" /> Watch AP3K work
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/75">
                {["No code", "Business + Creator", "Comment reply + DM", "Official Instagram access"].map((item) => (
                  <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}</span>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.08} className="relative">
              <div className="relative mx-auto max-w-[620px] rounded-[2.4rem] border border-white/15 bg-[#15101e]/90 p-5 shadow-[0_45px_120px_rgba(31,11,71,.45)] backdrop-blur-xl sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.2em] text-fuchsia-200">Live workflow</p>
                    <p className="mt-1 text-sm font-bold text-white/70">Comment → reply → DM → lead</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-200">Always on</span>
                </div>
                <div className="grid items-center gap-6 sm:grid-cols-[.82fr_1.18fr]">
                  <ProductVideo src="/media/instagram-features_01.mp4" label="Instagram comment automation demo" posterTitle="Comment detected" posterSubtitle="AP3K starts the campaign" className="max-w-[250px]" />
                  <div className="space-y-3">
                    {[
                      [MessageCircle, "Comment received", "GUIDE"],
                      [Zap, "Trigger matched", "Keyword"],
                      [Reply, "Comment reply", "Sent"],
                      [Send, "DM", "Delivered"],
                      [Users, "Lead", "Captured"],
                    ].map(([Icon, title, state], index) => {
                      const FlowIcon = Icon as typeof MessageCircle;
                      return (
                        <div key={title as string} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-3.5">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fuchsia-400/12 text-fuchsia-200"><FlowIcon className="h-4 w-4" /></div>
                          <div className="min-w-0 flex-1"><p className="text-sm font-black">{title as string}</p><p className="text-xs text-white/45">Step {index + 1}</p></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{state as string}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-9 gap-y-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            <span>Instagram Business + Creator</span><span className="text-slate-300">•</span><span>Approved permissions</span><span className="text-slate-300">•</span><span>No scraping</span><span className="text-slate-300">•</span><span>No browser bot</span>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mx-auto max-w-4xl text-center">
              <SectionEyebrow>One simple system</SectionEyebrow>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Stop manually chasing every Instagram comment.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Set the trigger once. AP3K handles the repetitive first response and keeps the next action moving.</p>
            </FadeIn>
            <StaggerContainer className="mt-12 grid gap-4 md:grid-cols-4">
              {[
                [MousePointerClick, "1", "Choose the trigger", "Keyword or any eligible comment."],
                [Reply, "2", "Reply to comment", "Answer under the post instantly."],
                [Send, "3", "Send a DM", "Continue the conversation privately."],
                [BarChart3, "4", "Track the lead", "See activity in one dashboard."],
              ].map(([Icon, step, title, copy]) => {
                const StepIcon = Icon as typeof MessageCircle;
                return (
                  <StaggerItem key={title as string}>
                    <HoverLift>
                      <div className="h-full rounded-[1.8rem] border border-slate-200 bg-[#fbfaff] p-6 shadow-[0_14px_45px_rgba(32,24,64,.05)]">
                        <div className="flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7738e7]/10 text-[#7738e7]"><StepIcon className="h-5 w-5" /></div><span className="text-3xl font-black text-slate-200">{step as string}</span></div>
                        <h3 className="mt-6 text-lg font-black">{title as string}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{copy as string}</p>
                      </div>
                    </HoverLift>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        <section id="product" className="bg-[#f5f1ff] px-4 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl space-y-16 lg:space-y-20">
            <FadeIn className="max-w-3xl">
              <SectionEyebrow>See the product</SectionEyebrow>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Automation people can understand in seconds.</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">Every campaign answers three questions: what starts it, what AP3K does, and what happened next.</p>
            </FadeIn>

            <div className="grid items-center gap-10 rounded-[2.4rem] border border-violet-100 bg-white p-6 shadow-[0_24px_80px_rgba(67,44,120,.08)] sm:p-10 lg:grid-cols-[1fr_.8fr] lg:p-14">
              <FadeIn>
                <span className="inline-flex rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Comment automation</span>
                <h3 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Turn comments into conversations that keep moving.</h3>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">Choose a keyword or any eligible comment. AP3K reacts while the customer intent is still fresh.</p>
                <div className="mt-7 space-y-3">{["Keyword or any-comment triggers", "Automatic reply under the post", "Campaign activity recorded as it happens"].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700"><Check className="h-5 w-5 text-violet-600" />{item}</p>)}</div>
              </FadeIn>
              <FadeIn delay={0.08}><ProductVideo src="/media/instagram-features_02.mp4" label="Comment trigger demo" posterTitle="Trigger matched" posterSubtitle="Reply starts instantly" accent="#7c3aed" /></FadeIn>
            </div>

            <div className="grid items-center gap-10 rounded-[2.4rem] border border-fuchsia-100 bg-white p-6 shadow-[0_24px_80px_rgba(67,44,120,.08)] sm:p-10 lg:grid-cols-[.8fr_1fr] lg:p-14">
              <FadeIn className="lg:order-2">
                <span className="inline-flex rounded-full bg-fuchsia-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-fuchsia-700">DM follow-up</span>
                <h3 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Catch interested people before the moment disappears.</h3>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">Move the right commenter into a DM with the response, link, or next step you configured.</p>
                <div className="mt-7 space-y-3">{["Send a DM after an eligible comment", "Keep the campaign and lead context together", "Reduce repetitive inbox follow-up"].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700"><Check className="h-5 w-5 text-fuchsia-600" />{item}</p>)}</div>
              </FadeIn>
              <FadeIn delay={0.08} className="lg:order-1"><ProductVideo src="/media/instagram-features_03.mp4" label="Instagram DM follow-up demo" posterTitle="Send the DM" posterSubtitle="Continue in the inbox" accent="#ec4899" /></FadeIn>
            </div>

            <div className="grid items-center gap-10 rounded-[2.4rem] border border-cyan-100 bg-white p-6 shadow-[0_24px_80px_rgba(67,44,120,.08)] sm:p-10 lg:grid-cols-[1fr_.8fr] lg:p-14">
              <FadeIn>
                <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-800">Always-on engagement</span>
                <h3 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Reply while your audience is still paying attention.</h3>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">Use a Comment reply, a DM, or both. AP3K runs the exact actions you configure—nothing mysterious.</p>
                <div className="mt-7 space-y-3">{["Comment reply only", "DM only", "Comment reply + DM together"].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700"><Check className="h-5 w-5 text-cyan-700" />{item}</p>)}</div>
              </FadeIn>
              <FadeIn delay={0.08}><ProductVideo src="/media/instagram-features_04.mp4" label="Instagram engagement automation demo" posterTitle="Reply + DM" posterSubtitle="One campaign, two actions" accent="#06b6d4" /></FadeIn>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="mx-auto max-w-4xl text-center"><SectionEyebrow>Why automate?</SectionEyebrow><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Stop doing overtime. Start replying in real time.</h2></FadeIn>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <FadeIn><div className="h-full rounded-[2rem] border border-rose-200 bg-rose-50 p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[.2em] text-rose-600">Without automation</p><h3 className="mt-4 text-2xl font-black">You are doing the same work again and again.</h3><div className="mt-6 space-y-4 text-sm text-slate-700">{["Comments wait until you notice them", "Potential leads disappear in the feed", "The same DM gets typed repeatedly", "You lose the campaign context"].map((item) => <p key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />{item}</p>)}</div></div></FadeIn>
              <FadeIn delay={0.06}><div className="h-full rounded-[2rem] border border-emerald-200 bg-emerald-50 p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">With AP3K</p><h3 className="mt-4 text-2xl font-black">The repetitive response happens automatically.</h3><div className="mt-6 space-y-4 text-sm text-slate-700">{["Triggers react while interest is fresh", "Comment replies go out consistently", "DM follow-up keeps the conversation moving", "Campaign activity stays organized"].map((item) => <p key={item} className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />{item}</p>)}</div></div></FadeIn>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-[#0f0f13] px-4 py-20 text-white sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_.85fr] lg:gap-20">
            <FadeIn>
              <p className="text-xs font-black uppercase tracking-[.22em] text-fuchsia-300">Start in minutes</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">New to automation? Don&apos;t overthink it.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">Connect Instagram, choose the post, set the trigger, choose the actions, and activate. AP3K keeps the campaign model intentionally small.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {["Connect Instagram", "Choose the post", "Set keyword or any comment", "Choose reply, DM, or both"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] p-4 text-sm font-bold"><span className="grid h-7 w-7 place-items-center rounded-full bg-fuchsia-400/15 text-xs font-black text-fuchsia-200">{index + 1}</span>{item}</div>)}
              </div>
              <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-[#6128c8] transition hover:-translate-y-1">Create your first campaign <ArrowRight className="h-4 w-4" /></Link>
            </FadeIn>
            <FadeIn delay={0.08}><div className="rounded-[2.4rem] bg-gradient-to-br from-fuchsia-500 via-[#7738e7] to-indigo-600 p-7 sm:p-10"><ProductVideo src="/media/templates_05.mp4" label="AP3K campaign setup demo" posterTitle="Build the campaign" posterSubtitle="Trigger → Actions → Activate" accent="#ff4fc7" /></div></FadeIn>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-slate-200 bg-slate-950 px-6 py-10 text-white shadow-[0_30px_90px_rgba(15,23,42,.12)] sm:px-10 lg:px-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <FadeIn><p className="text-xs font-black uppercase tracking-[.22em] text-fuchsia-300">Supported access</p><h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">No Instagram password. No scraping. No browser bot pretending to be you.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">AP3K uses Instagram authorization and approved Instagram Business API permissions for the features it provides.</p></FadeIn>
              <div className="flex gap-3">{[ShieldCheck, LockKeyhole, Zap].map((Icon, index) => <div key={index} className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[.06]"><Icon className="h-5 w-5 text-fuchsia-300" /></div>)}</div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#f7f7fa] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1500px]">
            <FadeIn className="mb-12 text-center"><SectionEyebrow>Simple pricing</SectionEyebrow><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start free. Save more annually.</h2><p className="mx-auto mt-5 max-w-2xl text-slate-600">Pro is $9/month or $79/year. Business is $29/month or $279/year. Annual billing saves up to 27% while usage still resets monthly.</p></FadeIn>
            <FadeIn delay={0.04}><PricingExperience compact /></FadeIn>
            <div className="mt-8 text-center"><Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-black text-[#7738e7]">See the full plan comparison <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <FadeIn className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><SectionEyebrow>Instagram automation guides</SectionEyebrow><h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Learn the strategy behind the automation.</h2></div><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-[#7738e7]">Explore the blog <ArrowRight className="h-4 w-4" /></Link></FadeIn>
            <StaggerContainer className="mt-10 grid gap-5 md:grid-cols-3">{BLOG_POSTS.slice(0, 3).map((post) => <StaggerItem key={post.slug}><HoverLift><Link href={`/blog/${post.slug}`} className="block h-full rounded-[1.8rem] border border-slate-200 bg-[#fbfbfe] p-6"><p className="text-xs font-black uppercase tracking-[.18em] text-[#7738e7]">Guide</p><h3 className="mt-4 text-xl font-black leading-tight">{post.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{post.description}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#7738e7]">Read guide <ArrowRight className="h-4 w-4" /></span></Link></HoverLift></StaggerItem>)}</StaggerContainer>
          </div>
        </section>

        <section className="bg-[#111114] px-4 py-20 text-white sm:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <FadeIn className="text-center"><p className="text-xs font-black uppercase tracking-[.22em] text-fuchsia-300">FAQs</p><h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">The important questions, answered.</h2></FadeIn>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">{FAQS.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left font-black"><span>{question}</span><span className="text-2xl font-light text-fuchsia-300 transition group-open:rotate-45">+</span></summary><p className="max-w-3xl pb-2 pt-4 text-sm leading-7 text-white/60">{answer}</p></details>)}</div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#7738e7] px-4 py-20 text-center text-white sm:px-8 lg:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,.35),transparent_30rem)]" />
          <FadeIn className="relative mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[.22em] text-fuchsia-200">Your next comment can become a customer</p><h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-6xl">Start automating Instagram today.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/75">Create your first campaign, test it from another Instagram account, and let AP3K handle the repetitive follow-up.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#6128c8] shadow-xl transition hover:-translate-y-1">Start free <ArrowRight className="h-4 w-4" /></Link><Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">View pricing</Link></div></FadeIn>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
