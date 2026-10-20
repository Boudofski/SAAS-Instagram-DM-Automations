import { createProvider, withAiProvider } from "@/lib/ai-routing";
import { aiCompletionBudget } from "@/lib/ai-completion-budget";
import { defaultEmailPlan, parseEmailPlan, type EmailPlan } from "./autopilot-policy";

/** One bounded model request per queue run, shared across audience segments.
 * No recipient identifiers, links, credentials or free-form customer input reach the model.
 */
export async function planMarketingEmails(): Promise<{ source: "ai" | "fallback"; plan: EmailPlan }> {
  if (process.env.AP3K_EMAIL_AUTOPILOT_ENABLED === "false") return { source: "fallback", plan: defaultEmailPlan() };
  try {
    const plan = await withAiProvider("email", async provider => {
      const response = await createProvider(provider).chat.completions.create({
        model: provider.model, temperature: 0.1, ...aiCompletionBudget(provider),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Select AP3K email templates and delays. You cannot write copy, change links, add messages, choose recipients or override consent. Return exactly four keys: creator_test, creator_launch, ecommerce_test, ecommerce_launch. Each value must be {"variant":"standard" or "checklist","delayHours":0 or 6 or 12}. No other fields.' },
          { role: "user", content: "These recipients confirmed a launch kit and exactly two follow-up lessons. Test lesson is eligible from day 2, launch invitation from day 5, always at least 24 hours after an accepted lesson. Standard is a short explanatory lesson; checklist is a concise actionable checklist. Creators share resources; ecommerce subscribers share product links. Choose a useful presentation for each audience and stage. Delay is additional hours after eligibility. No engagement or timezone evidence is available: prefer zero delay; do not pretend to know a best send time. Never add urgency or outcome claims." },
        ],
      });
      return parseEmailPlan(JSON.parse(response.choices[0]?.message?.content || "{}"));
    });
    return { source: "ai", plan };
  } catch {
    return { source: "fallback", plan: defaultEmailPlan() };
  }
}
