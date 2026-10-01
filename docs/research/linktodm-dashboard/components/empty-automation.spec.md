# Empty automation and library specification

Source: supplied `Screenshot 2026-10-01 at 05.08.37.png`, LinktoDM automations page.
Destination: existing AP3K `/dashboard/[slug]` recent-automations empty state and `/dashboard/[slug]/automation` empty state. These replacements are explicitly requested. Preserve all other routes and dashboard analytics.

## Evidence and limits

Browser observation is blocked by native credential protection. Values below are derived from the screenshot, not measured computed CSS. Live animation timing, responsive transitions and hover states could not be observed. Do not claim pixel-perfect live verification.

## Card

One centered compact card, approximately474×392 screenshot pixels, pale gray gradient, subtle2px border and32px radius.32px interior padding. Three chat rows above a bold20px heading,16px muted description, and bottom action row. Replace the reference brand marks with AP3K marks. Use existing licensed/local preview avatar for the sample person.

Copy: “How can we help you?”, “how does this work?”, “Pick a post and a keyword, that’s it”, “Create your first automation”, “Create a new DM automation for your Instagram account”, “New automation”, “Read docs”.

Chat rows: left AP3K avatar and white rounded bubble; right white bubble and person avatar; left AP3K reply and white bubble. Recreate a sequential bubble entrance with subtle vertical movement/fade and a looping sequence. This animation is an implementation assumption pending live-reference access. Respect reduced motion with all bubbles static and visible.

Primary action:16px white text over cyan-to-deep-blue gradient,16px radius; secondary white pill with book icon.

Links: new automation goes to the current authenticated dashboard slug's automation/new; Read docs goes to existing/help. No external competitor logo or product link.

## Library controls

Rounded gray segmented control containing All (check), Basic (lightning), Flow (branch icon), selected white pill. Filters are click-driven, mutually exclusive and keyboard accessible. Flow means a persisted non-null listener.flowDefinition or flowDraft; all others Basic. Search and current sorting/pagination must continue working. Empty category/search results must not claim the account has no automations. Genuine account-empty state gets the shared card once, not duplicate banners.

## Responsive and themes

Desktop card width474px maximum; mobile width100%, padding24px, wrap chatcopy and stack buttons where necessary. Center within available content area. Dark mode uses dark neutral card and bubbles, visible light copy, subduedborder, sameAP3Kaccent. Keep navigation reachable onmobile using a compact floatingdrawerbutton; removeglobalutilitytoolbarwithoutreplacingitwithanotherbar. Settings retains appearance/language.

## Validation

Check defaulttheme, existingstoredtheme preservation, per-accountzero state, categoryclassification, searchcombinedwithcategories, accurate emptyfiltermessage, mobilewidthcontainment and reducedmotion. Livevisualcomparisonblocked untilbrowserisusable.
