import { DOCS_ARTICLES } from "./docs";
import { AP3K_HELP_ARTICLES, ap3kSupportKnowledge } from "./ap3k-help";
import { PLAN_LIMITS } from "./plan-limits";
import { AP3K_PRICING } from "./billing-plans";
import { selectSupportResources } from "./support-resources";

/** Live documentation is retrieved at request time; no duplicated vector database. */
export function supportKnowledgeFor(message: string, previousQuestion = "") {
  const selected = selectSupportResources(message, previousQuestion);
  const sections = selected.map(resource => {
    const article = DOCS_ARTICLES.find(a => `/docs/${a.slug}` === resource.href);
    const help = AP3K_HELP_ARTICLES.find(a => `/help/${a.slug}` === resource.href);
    const body = article?.html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ") || help?.steps.join("\n") || "";
    return `${resource.title}\nDocumentation: ${resource.href}\nCurrent implementation notes: ${resource.facts || "Use the documentation below."}\n${body.slice(0,6500)}`;
  });
  return [
    "CURRENT PRODUCT LIMITS (authoritative if older documentation differs):",
    JSON.stringify({ plans: { FREE: PLAN_LIMITS.FREE, PRO: PLAN_LIMITS.PRO, BUSINESS: PLAN_LIMITS.BUSINESS }, pricesUSD: AP3K_PRICING }),
    "Paid-only: live AI replies, contact capture, CSV export, follow gates, follow-up messages, custom Flow publishing. Free permits AI drafts/samples. Policy scans and backtracking each have a separate three-use Free allowance; paid plans remove those attempt limits, not messaging quotas or Meta rules.",
    "Support is read-only. It may point to pages and give steps. It cannot publish, send messages, backtrack, change billing, delete data or inspect delivery records. Never claim an operation was performed.",
    ...(sections.length ? sections : [ap3kSupportKnowledge()]),
  ].join("\n\n");
}
