import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Play, MessageCircle, Workflow, Users } from "lucide-react";
import WebsiteNav from "@/components/global/website-nav";
import WebsiteFooter from "@/components/global/website-footer";
import AP3KLogo from "@/components/global/ap3k-logo";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import { PLAN_CARDS } from "@/lib/billing-plans";
import { POST_AUTOMATION_VIDEO } from "@/lib/tutorial-video";
import s from "./manychat-comparison.module.css";

const rows = [
  ["Best fit", "Instagram campaigns, replies and lead capture", "Conversations across multiple messaging channels"],
  ["Instagram comment → DM", "Post and Reel triggers; keyword or any comment", "Comment-triggered automations and DM links"],
  ["Usage model", "Successful automated actions: each sent public reply or DM", "Monthly active contacts: people interacted with"],
  ["Free plan", "500 actions/month · 1 account · 5 active automations", "25 active contacts/month · up to 4 live triggers"],
  ["Contact collection", "Email and phone capture + Contacts CSV on Pro and Business", "Contact collection and tags on Essential and above"],
  ["AI replies", "Pro and Business, within monthly AI allowances", "AI-powered conversations on Pro and above"],
  ["Custom workflows", "Visual Flow Builder publishing on paid plans", "Custom automation builder; availability varies by plan"],
  ["Channels & team", "Instagram account workspaces; up to 6 accounts on Business", "Multiple channels, users and inbox seats by plan"],
];
const faqs = [
  ["Is AP3K a free ManyChat alternative for Instagram?", "You can start with AP3K Free: one Instagram account, five active automations and 500 successful automated actions per month. No credit card is required. Contact collection, follow gates, follow-ups, AI replies and custom Flow publishing require an eligible paid plan."],
  ["Does AP3K replace every ManyChat feature?", "No. AP3K focuses on Instagram. If you need WhatsApp, Messenger or other messaging channels in the same workspace, evaluate ManyChat against those requirements. Compare the actual customer journey you need, rather than a checklist alone."],
  ["Are 500 actions the same as 500 contacts?", "No. One successful public reply counts as one action, and one successful DM counts as another. A person receiving both uses two actions. Extra automated messages add actions; failed or skipped sends do not count. ManyChat measures active contacts differently."],
  ["Can I import my existing ManyChat flows?", "There is no automatic ManyChat flow import in AP3K. Rebuild one campaign as a draft, review every message and link, turn off overlapping rules in the previous tool, then publish and test the replacement from another Instagram account."],
  ["Can I collect an email and phone number in AP3K?", "Pro and Business can request email and phone details in supported automations. Captured fields are saved to the contact. Use Contacts to filter records and Download CSV to export them. Test invalid answers and the final DM as well as the first prompt."],
  ["Will either platform guarantee Instagram delivery?", "No. Instagram permissions, account eligibility, messaging rules and usage limits still apply. Test a complete conversation from another account and inspect activity. A preview is not proof that Instagram delivered a message."],
];
export default function ManychatComparison() {
  const schema = [
    { "@context": "https://schema.org", "@type": "Article", headline: "ManyChat vs AP3K: an Instagram-first comparison", description: "Compare Instagram automation, pricing models, lead capture and migration. Watch a real AP3K setup before choosing.", datePublished: "2026-09-27", dateModified: "2026-10-06", author: { "@type": "Organization", name: "AP3K", url: "https://ap3k.com/about" }, mainEntityOfPage: "https://ap3k.com/manychat-alternative", image: "https://ap3k.com/images/docs/dashboard.webp" },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
    { "@context": "https://schema.org", "@type": "VideoObject", name: POST_AUTOMATION_VIDEO.title, description: POST_AUTOMATION_VIDEO.description, thumbnailUrl: POST_AUTOMATION_VIDEO.thumbnail, uploadDate: POST_AUTOMATION_VIDEO.uploaded, duration: POST_AUTOMATION_VIDEO.duration, embedUrl: POST_AUTOMATION_VIDEO.embed },
  ];
  return <div className={s.page}>
    <WebsiteNav />
    <main className={s.main} lang="en" translate="no">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[{ name: "Compare", path: "/compare" }, { name: "ManyChat vs AP3K", path: "/manychat-alternative" }]} />
      <header className={s.hero}>
        <div>
          <span className={s.eyebrow}>MANYCHAT ALTERNATIVE FOR INSTAGRAM</span>
          <h1>ManyChat vs AP3K.<br /><span>Find your fit.</span></h1>
          <p className={s.lead}>ManyChat vs AP3K: choose the tool that fits the way you turn Instagram comments into DMs, leads and useful conversations.</p>
          <div className={s.actions}><Link className={s.primary} href="/sign-up">Start with AP3K Free <ArrowRight size={18} /></Link><a className={s.secondary} href="#tutorial"><Play size={17} /> Watch the walkthrough</a></div>
          <p className={s.micro}><Check size={15} /> No credit card · 500 automated actions each month</p>
        </div>
        <div className={s.choiceCard}>
          <div className={s.brandRow}><AP3KLogo markClassName="h-10 w-10" /><span className={s.versus}>vs</span><Image src="/images/brands/manychat.svg" alt="ManyChat" width={151} height={28} className={s.manychatLogo} /></div>
          <div className={s.choice}><span className={s.choiceIcon}><MessageCircle size={22} /></span><div><strong>Focused on Instagram?</strong><p>Explore AP3K for comments, Story replies, DMs and lead capture.</p></div></div>
          <div className={s.choice}><span className={s.choiceIcon}><Users size={22} /></span><div><strong>Need several channels?</strong><p>Consider ManyChat for a broader messaging and team workflow.</p></div></div>
          <div className={s.cardFoot}>Compare one real campaign. Choose with evidence.</div>
        </div>
      </header>
      <nav className={s.jumpNav} aria-label="Comparison sections"><a href="#features">Feature comparison</a><a href="#pricing">Plans & usage</a><a href="#tutorial">See AP3K in action</a><a href="#migration">Switching checklist</a><a href="#faq">FAQs</a></nav>
      <section className={s.section} id="features">
        <div className={s.sectionHeading}><span className={s.eyebrow}>THE PRACTICAL DIFFERENCES</span><h2>Compare the workflow, not just the price.</h2><p>Both products automate conversations. The important differences are your channels, required steps and how usage is counted.</p></div>
        <div className={s.tableWrap} tabIndex={0} role="region" aria-label="AP3K and ManyChat feature comparison, scroll horizontally on smaller screens"><table><caption>AP3K vs ManyChat · checked October 6, 2026</caption><thead><tr><th scope="col">What matters</th><th scope="col">AP3K</th><th scope="col">ManyChat</th></tr></thead><tbody>{rows.map(([label, ap3k, manychat]) => <tr key={label}><th scope="row">{label}</th><td>{ap3k}</td><td>{manychat}</td></tr>)}</tbody></table></div>
        <p className={s.micro}>Provider plans can vary by account, billing country and date. <a href="https://manychat.com/pricing" target="_blank" rel="noopener noreferrer">Check ManyChat’s current plans ↗</a></p>
      </section>
      <section className={s.section} id="tutorial">
        <div className={s.sectionHeading}><span className={s.eyebrow}>WATCH THE ACTUAL PRODUCT</span><h2>From a comment to a DM, step by step.</h2><p>See the post picker, triggers, public reply and DM link in the AP3K walkthrough.</p></div>
        <div className={s.video}><iframe src="https://www.youtube-nocookie.com/embed/SSOYGbfwLUQ?rel=0" title="AP3K tutorial: set up Instagram comment-to-DM automation" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
        <div className={s.tutorialFoot}><p>Prefer written steps? Open the setup guide and follow along.</p><Link href="/docs/post-automation/create-instagram-comment-to-dm-automation" className={s.secondary}>Read the setup guide <ArrowRight size={17} /></Link></div>
        <div className={s.workflow}>{[[MessageCircle,"01","Choose the interaction","A post comment, Story reply or incoming DM."],[Workflow,"02","Build the response","Write the message and add the promised destination."],[Check,"03","Test the full journey","Publish deliberately, then test from another account."]].map(([Icon,n,title,body]) => { const I=Icon as typeof Check; return <div key={String(n)}><span className={s.stepNumber}>{String(n)}</span><I size={23} /><h3>{String(title)}</h3><p>{String(body)}</p></div>; })}</div>
      </section>
      <section className={s.section} id="pricing">
        <div className={s.sectionHeading}><span className={s.eyebrow}>BUDGET FOR YOUR REAL CAMPAIGN</span><h2>Clear plans. Different units of usage.</h2><p>AP3K counts successful automated actions. ManyChat counts active contacts. Those numbers are not interchangeable.</p></div>
        <div className={s.plans}>{PLAN_CARDS.map(plan => <div key={plan.id} className={plan.featured ? s.featuredPlan : s.plan}><span className={s.eyebrow}>{plan.name}</span><p className={s.price}>${plan.monthlyPrice}<span>/month</span></p><p>{plan.annualPrice ? `$${plan.annualPrice} billed yearly ($${plan.annualPrice / 12}/month equivalent)` : "Start without a credit card"}</p><ul><li>{plan.replyLimit.toLocaleString("en-US")} automated actions / month</li><li>{plan.id === "FREE" ? "1 account · 5 active automations" : plan.id === "PRO" ? "3 accounts · unlimited active automations" : "6 accounts · unlimited active automations"}</li><li>{plan.id === "FREE" ? "Public replies and DMs" : plan.id === "PRO" ? "500 AI replies / month" : "2,000 AI replies / month"}</li></ul><Link href={plan.id === "FREE" ? "/sign-up" : "/pricing"} className={s.secondary}>{plan.id === "FREE" ? "Start free" : "Explore plan"}<ArrowRight size={17} /></Link></div>)}</div>
        <div className={s.usage}><div><span className={s.eyebrow}>AN ILLUSTRATION, NOT A FORECAST</span><h3>200 people. One public reply + one DM each.</h3><p>That is 400 successful AP3K actions. Another DM to each person adds 200 actions. Monthly allowances reset monthly, including on annual billing.</p></div><div className={s.equation}><strong>200 × 2</strong><span>400 actions</span></div></div>
        <Link href="/blog/manychat-vs-ap3k-pricing-for-instagram" className={s.inlineLink}>Work through a campaign cost comparison <ArrowRight size={17} /></Link>
      </section>
      <section className={s.productSection}><div><span className={s.eyebrow}>YOUR INSTAGRAM WORKSPACE</span><h2>Keep the conversation connected.</h2><p>Manage automations, inspect activity and work with captured contacts in AP3K. Account activity and feature availability depend on your workspace and plan.</p><Link href="/help/workspace-tour" className={s.secondary}>Explore the workspace <ArrowRight size={17} /></Link></div><Link href="/help/workspace-tour"><Image src="/images/docs/dashboard.webp" alt="Current AP3K dashboard with Post, Story and Chat shortcuts and Instagram performance" width={1363} height={936} sizes="(max-width: 760px) 92vw, 700px" /></Link></section>
      <section className={s.section} id="migration"><div className={s.sectionHeading}><span className={s.eyebrow}>A CONTROLLED SWITCH</span><h2>Move one campaign before moving everything.</h2></div><ol className={s.migration}>{[["Map the existing journey","Record the post, keyword, public reply, opening DM, optional gates, final message and destination."],["Rebuild it as a draft","Check plan eligibility and each step. AP3K does not automatically import another platform’s flows."],["Avoid overlapping live rules","Turn off the old campaign before activating its replacement on the same interaction."],["Test and inspect delivery","Use another Instagram account. Check messages, links, collected fields and skipped or failed actions."]].map(([title,body],i)=><li key={title}><span>{i+1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol><Link className={s.secondary} href="/docs/migrating-from-manychat/rebuild-your-automations">Open the migration guide <ArrowRight size={17} /></Link></section>
      <section className={s.section} id="faq"><div className={s.sectionHeading}><span className={s.eyebrow}>BEFORE YOU CHOOSE</span><h2>Your questions, answered.</h2></div><div className={s.faqs}>{faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
      <section className={s.finalCta}><AP3KLogo markClassName="h-10 w-10" /><h2>Start with one useful conversation.</h2><p>Choose a post, deliver what you promised, and test the experience from comment to click.</p><div className={s.actions}><Link className={s.primary} href="/sign-up">Create your free AP3K account <ArrowRight size={18} /></Link><Link className={s.secondary} href="/pricing">Compare AP3K plans</Link></div></section>
      <aside className={s.methodology}><h2>Sources & methodology</h2><p>Published by AP3K. ManyChat descriptions were checked against its <a href="https://manychat.com/pricing" target="_blank" rel="noopener noreferrer">official pricing and feature page</a> on October 6, 2026. AP3K details reflect the <Link href="/pricing">current product plans</Link>. This is not hands-on testing of every competitor plan. ManyChat’s logo identifies the compared product; no affiliation or endorsement is implied.</p><Link href="/compare">Explore all comparisons →</Link></aside>
    </main><WebsiteFooter />
  </div>;
}
