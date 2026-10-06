# Product knowledge and media maintenance

## Sources of truth

- Product entitlements: `lib/plan-limits.ts`; prices: `lib/billing-plans.ts`.
- Task instructions: `lib/docs/content/*.json` and `lib/ap3k-help.ts`.
- Feature lookup: `lib/support-resources.ts` maps user vocabulary to a real guide, workspace destination and optional screenshot/video. Add a feature here after its implementation and guide are reviewed. Do not duplicate an entire guide in `facts`; reserve notes for critical distinctions.
- Server retrieval: `lib/support-knowledge.ts` retrieves the matching current guide and always includes configured limits. Short follow-up questions reuse the preceding question's topic.
- Presentation: `components/help/support-resources.tsx` attaches approved links and images separately from model-generated text. Never render model-supplied HTML or unrestricted image URLs.

Support is intentionally read-only. Workspace links let a signed-in user open the actual controls. Any future write tool needs server authentication, ownership validation, input validation, idempotency and a separate explicit confirmation for sends, publishing, backtracking, billing or deletion. A model statement must never be treated as proof an operation ran.

## Screenshot inventory

`lib/product-screenshots.ts` is the reviewed inventory, with descriptive alt text, capture date and exact dimensions. `public/images/docs/` holds compressed WebP files. October 6, 2026 captures cover Home, account connection, creation, keyword triggers, final DM/buttons, opener, public replies, follow gate, email, phone, follow-up, Story, Chat, Flow triggers, templates, AI Overview/Knowledge/Behavior/Playground, policy check, Backtracking, Contacts/CSV filters, billing and analytics.

These are actual @ap3kautomation demonstration-workspace screens. They are examples, not promised performance. Billing shows internal demonstration access. Contacts uses an empty search to hide people; analytics excludes individual activity and location details. Story shows the honest no-active-stories state. Drafts were not published and Backtracking was not executed.

For an update:

1. Inspect the live UI against current implementation. Capture a clean demonstration state without private messages, emails, phone numbers, tokens or customer names.
2. Compress to WebP (quality 82 is a useful starting point); retain readable text. Most full captures are 20–63 KB. Set true dimensions; do not preload below-fold screenshots.
3. Register the file in `PRODUCT_SCREENSHOTS`; attach to relevant `DOCS_SCREENSHOTS`, `TUTORIAL_SCREENSHOTS` and support resources. Check captions against the pictured controls.
4. Update guide modification dates only when the instructions or media actually change. Preserve first-publication dates and existing URLs.
5. Run documentation, tutorial-image, support-knowledge and archive tests; inspect the page and enlargement interaction at desktop and phone widths in both themes.

## Publishing and discovery

`getEditorialArchive` accepts the published collection and excludes explicit `noIndex` entries. Do not use content provenance (`importedArchive`, legacy or original) as a publication flag. Chronological sorting uses `publishedAt`, not import order. CMS drafts remain excluded upstream. Indexing eligibility, locale canonical handling and sitemap generation remain shared through the existing editorial/SEO pipeline.

Keep weak URLs when they can be improved. Check Search Console before consolidation; add a relevant redirect if a URL is retired. This update removed no published URLs.

## Audio

The support completion cue is opt-in via `ap3k-support-sound`. Audio is unlocked only by the user's send gesture, suppressed for hidden tabs/reduced motion, and never connected to Instagram webhooks. No audio files or preload costs are introduced.
