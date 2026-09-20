import VisibleProductVideo from "@/components/website/visible-product-video";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import { SITE_METADATA } from "@/lib/i18n/metadata";
import { COMPANY_SCHEMA } from "@/lib/company";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import PricingExperience from "@/components/global/pricing-experience";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { BLOG_POSTS } from "@/lib/blog";
import {
  ArrowRight,
  BadgeCheck,
  Infinity,
  MessageCircle,
  Send,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getBlogVisualSrc } from "@/components/website/blog-visual";
import styles from "@/components/website/home.module.css";
import { localizeCopyTree } from "@/lib/i18n/localize-copy-tree";
import FeatureDemos from "@/components/website/feature-demos";
import { SetupTimeline, WorkflowStory } from "@/components/website/workflow-stories";
import { getServerLocale } from "@/lib/i18n/server";

const BENEFITS = [
  {
    kicker: "Comment automation",
    title: "Turn comments into conversations that keep moving.",
    body: "Choose a keyword or any eligible comment, then let AP3K react immediately while intent is still fresh.",
    bullets: ["Match keywords or any comment", "Keep every automation organized", "See activity as it happens"],
    src: "/media/instagram-features_02-phone.mp4",
    poster: "/media/instagram-features_02-poster.webp",
    label: "Comment triggers",
  },
  {
    kicker: "Lead capture",
    title: "Catch interested people before the moment disappears.",
    body: "Move the right commenters into a DM and keep the automation activity and lead context in one place.",
    bullets: ["Send the requested follow-up by DM", "Track automation leads", "Reduce manual inbox follow-up"],
    src: "/media/instagram-features_03-phone.mp4",
    poster: "/media/instagram-features_03-poster.webp",
    label: "Lead flow",
  },
  {
    kicker: "Always-on engagement",
    title: "Reply while your audience is still paying attention.",
    body: "AP3K can reply under the post, send a DM, or do both—using the exact actions you configured for the automation.",
    bullets: ["Reply to comments automatically", "Send DMs after eligible comments", "Use one action or both"],
    src: "/media/instagram-features_04-phone.mp4",
    poster: "/media/instagram-features_04-poster.webp",
    label: "Reply and DM",
  },
] as const;

const SOLUTION_PAGES = [
  ["Instagram DM automation", "/instagram-dm-automation", "Automate useful private follow-up after comments, stories, and messages."],
  ["Comment-to-DM automation", "/instagram-comment-to-dm", "Turn a clear Instagram keyword into the promised DM or link."],
  ["Instagram automation for creators", "/instagram-automation-for-creators", "Deliver guides, launch details, and product links without repetitive inbox work."],
  ["Instagram automation for coaches", "/instagram-automation-for-coaches", "Move high-intent comments toward a resource, application, or booking."],
  ["Instagram automation for ecommerce", "/instagram-automation-for-ecommerce", "Connect product interest to the right storefront destination."],
  ["A focused ManyChat alternative", "/manychat-alternative", "Use a simpler Instagram-first workflow when you do not need a broad multi-channel builder."],
] as const;

const FAQS = [
  ["What does AP3K automate?", "AP3K watches new comments, story interactions, and incoming DMs. When an interaction matches your automation, it can publish a comment reply, send a DM, or run both actions."],
  ["Which Instagram accounts can connect to AP3K?", "AP3K supports Instagram Business and Creator accounts through Instagram's official authorization flow. Personal Instagram accounts must be changed to a professional account before connecting."],
  ["What is the difference between Specific keyword and Any comment?", "Specific keyword runs only when a new comment contains a word you configured, such as GUIDE. Any comment runs for every eligible new comment in that automation's post scope."],
  ["Can AP3K reply publicly and send a DM at the same time?", "Yes. You can enable a public Comment reply, a private DM, or both. When both are enabled, the public reply confirms the action while the DM delivers the private follow-up."],
  ["Can the automated DM include a clickable link?", "Yes. Add your destination URL and edit the button label—for example, Get the Link—so the commenter can open the promised guide, product, booking page, or offer from the DM."],
  ["Will a new automation respond to old interactions?", "No. Automations react to eligible new events received after they are active. They do not go backward through comments or messages that already existed."],
  ["How do I test an automation before promoting it?", "Activate the automation, then trigger it from a different Instagram account. Check the public reply, AP3K Inbox, activity, DM content, and link button before sending traffic to it."],
  ["Will AP3K reply to its own automated comments?", "No. AP3K ignores replies from the connected Instagram account and duplicate comment events so an automation cannot create a reply loop."],
  ["What is included in the AP3K Free plan?", "Free includes 500 automated actions each month, one Instagram Business or Creator account, and up to five active automations. AI replies are available on paid plans."],
  ["How does the AP3K referral program work?", "Share your tracked link from the Refer & earn dashboard. When a new referred user connects Instagram and completes a qualifying paid Pro or Business invoice, eligible Founding 10 partners earn a $9 AP3K account credit."],
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AP3K",
  publisher: COMPANY_SCHEMA,
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

function ProductVideo({
  src,
  poster,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`${styles.phone} ${className}`}>
      <VisibleProductVideo
        src={src}
        deferUntilLoaded={priority}
        poster={poster}
        label={label}
        showPlaybackControl
        className={styles.phoneVideo}
      />
    </div>
  );
}

export default function LandingPage() {
  const locale = getServerLocale();
  const localizedSoftware = { ...softwareSchema, inLanguage: locale,
    url: `https://ap3k.com${localizePublicPath("/", locale)}`,
    description: SITE_METADATA[locale].description };
  const localizedFaq = { ...faqSchema, inLanguage: locale,
    mainEntity: FAQS.map(([question, answer]) => ({
      "@type": "Question", name: translateUi(question, locale),
      acceptedAnswer: { "@type": "Answer", text: translateUi(answer, locale) },
    })) };
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite",
    "@id": "https://ap3k.com/#website", url: "https://ap3k.com/", name: "AP3K",
    alternateName: "AP3K DM Automation", publisher: COMPANY_SCHEMA };


  return localizeCopyTree(
    <div className={styles.home}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedSoftware).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedFaq).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />
      <a className={styles.skipLink} href="#home-content">Skip to content</a>
      <WebsiteNav current="home" />

      <main id="home-content">
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" />Instagram Comment &amp; DM Automation</p>
            <h1 id="home-title" className={styles.heroTitle}>Turn comments<br /><span>into customers.</span></h1>
            <p className={styles.heroDescription}>Reply to comments, send the right link by DM, and keep every conversation moving. Automatically.</p>
            <div className={styles.actions}>
              <Link href="/sign-up" className={styles.primary}>GET STARTED <ArrowUpRight aria-hidden="true" /></Link>
              <a href="#features" className={styles.textLink}>See how it works <span className={styles.playIcon} aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroStage}>
              <div className={styles.stageMark} aria-hidden="true"><ArrowUpRight /></div>
              <div className={styles.commentNote}><MessageCircle aria-hidden="true" /><span>Comment received</span><Check aria-hidden="true" /></div>
              <ProductVideo src="/media/instagram-features_01-phone.mp4" poster="/media/instagram-features_01-poster.webp" label="AP3K Instagram automation demo" priority />
              <div className={styles.deliveryNote}><span className={styles.noteIcon}><Send aria-hidden="true" /></span><span>DM delivered<small>Automatically</small></span><Check aria-hidden="true" /></div>
            </div>
            <p className={styles.demoCaption}><span aria-hidden="true" />Illustrative automation example</p>
          </div>
        </section>

        <div className={styles.trustStrip}>
          <p><strong>500</strong><span>automated actions every month on Free</span></p>
          <p><BadgeCheck aria-hidden="true" /><span>Official Instagram API</span></p>
          <p><Infinity aria-hidden="true" /><span>Meta Business Partner</span></p>
          <p><Check aria-hidden="true" /><span>No credit card required</span></p>
        </div>

        <section className={`${styles.section} ${styles.workflow}`} aria-labelledby="workflow-title">
          <FadeIn className={styles.workflowIntro}>
            <p className={styles.eyebrow}>The AP3K workflow</p>
            <h2 id="workflow-title" className={styles.sectionTitle}>From Instagram comment to delivered link—automatically.</h2>
            <p>Choose the post, trigger, and actions once. When the right comment arrives, AP3K can publish your reply, send the DM and link, and record the result.</p>
          </FadeIn>
          <WorkflowStory />
        </section>

        <FeatureDemos demos={BENEFITS} />

        <section id="how-it-works" className={`${styles.section} ${styles.setup}`} aria-labelledby="setup-title">
          <div className={styles.setupVisual}>
            <div className={styles.setupFrame}>
              <span className={styles.setupDecoration} aria-hidden="true">↗</span>
              <ProductVideo src="/media/templates_05-phone.mp4" poster="/media/templates_05-poster.webp" label="AP3K automation setup demo" />
            </div>
          </div>
          <div>
            <FadeIn><p className={styles.eyebrow}>Start in minutes</p><h2 id="setup-title" className={styles.sectionTitle}>New to automation? Do not overthink it.</h2><p className={styles.setupLead}>The customer flow is intentionally simple: Post → Trigger → Actions → Review.</p></FadeIn>
            <SetupTimeline />
            <Link href="/blog/how-ap3k-works-step-by-step" className={styles.textLink}>Read the setup guide <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </section>

        <section className={`${styles.section} ${styles.solutions}`} aria-labelledby="solutions-title">
          <FadeIn className={styles.sectionHeading}><h2 id="solutions-title" className={styles.sectionTitle}>Your audience.<br />Your next move.</h2><p>See practical workflows, interactive examples, honest limitations, and setup tutorials for each use case.</p></FadeIn>
          <StaggerContainer className={styles.solutionList}>
            {SOLUTION_PAGES.map(([title, href, description], index) => (
              <StaggerItem key={href}>
                <Link href={href} className={styles.solutionRow}>
                  <span className={styles.solutionNumber} aria-hidden="true">0{index + 1}</span>
                  <h3>{title}</h3><p>{description}</p><ArrowUpRight aria-hidden="true" />
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section id="pricing" className={`${styles.section} ${styles.pricing}`} aria-labelledby="pricing-title">
          <FadeIn className={styles.centerHeading}><h2 id="pricing-title" className={styles.sectionTitle}>Start free. Grow at your pace.</h2><p>Start Free with 500 automated actions each month and up to 5 active automations, choose Pro at $9/month, or Business at $29/month.</p></FadeIn>
          <PricingExperience compact homepage />
          <div className={styles.centerLink}><Link href="/pricing" className={styles.textLink}>See the full plan comparison <ArrowRight aria-hidden="true" /></Link></div>
        </section>

        <section className={`${styles.section} ${styles.guides}`} aria-labelledby="guides-title">
          <FadeIn className={styles.sectionHeading}><h2 id="guides-title" className={styles.sectionTitle}>Good ideas.<br />Put into action.</h2><Link href="/blog" className={styles.textLink}>Explore the blog <ArrowUpRight aria-hidden="true" /></Link></FadeIn>
          <StaggerContainer className={styles.guideGrid}>
            {BLOG_POSTS.slice(0, 3).map((post, index) => (
              <StaggerItem key={post.slug} className={index === 0 ? styles.featuredGuide : styles.smallGuide}>
                <Link href={`/blog/${post.slug}`} className={styles.guideLink}>
                  {index === 0 && <div className={styles.guideImage}><Image src={getBlogVisualSrc(post.visual)} alt={post.visualAlt} fill sizes="(max-width: 767px) 100vw, 50vw" /></div>}
                  <div className={styles.guideCopy}><span className={styles.guideIndex}>0{index + 1} <span>Guide</span></span><h3>{post.title}</h3><p>{post.description}</p><span className={styles.textLink}>Read guide <ArrowUpRight aria-hidden="true" /></span></div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-title">
          <FadeIn className={styles.faqIntro}><h2 id="faq-title" className={styles.sectionTitle}>The important questions, answered.</h2><Link href="/help" className={styles.textLink}>Visit the help center <ArrowUpRight aria-hidden="true" /></Link></FadeIn>
          <div className={styles.questions}>
            {FAQS.map(([question, answer]) => (
              <details key={question}>
                <summary><span>{question}</span><span className={styles.faqPlus} aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div className={styles.closingArtwork} aria-hidden="true"><MessageCircle /><ArrowUpRight /><Send /></div>
          <FadeIn className={styles.closingCopy}>
            <p className={styles.eyebrow}>Your next comment can become a customer</p>
            <h2 id="closing-title">Less typing.<br />More possibility.</h2>
            <p>Create your first automation, test it from another Instagram account, and let AP3K handle the repetitive follow-up.</p>
            <Link href="/sign-up" className={styles.primary}>GET STARTED <ArrowUpRight aria-hidden="true" /></Link>
          </FadeIn>
        </section>
      </main>

      <WebsiteFooter />
    </div>, locale
  );
}
