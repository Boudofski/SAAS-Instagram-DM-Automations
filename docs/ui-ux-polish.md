# AP3K interface refinement

## Audit and direction

Baseline: production tree e6422b7668ff109d2a18b1136a7f85abbc046bf0.
UI UX Pro Max was run for “SaaS creator productivity dashboard”, with variance 3,
motion 2, density 7, and supplemented with Instagram automation SaaS, focus not
obscured, reduced motion, and Next.js/Radix form/navigation searches.

Adopt: neutral layered surfaces, existing Plus Jakarta Sans/Tajawal, clear focus,
44px touch targets, modest motion, stable layout, accessible Radix overlays.
Reject: suggested teal/orange palette, GSAP installation, information architecture
changes, generic glassmorphism, and replaying scroll reveals. AP3K keeps its violet
identity, approved copy, media, links, localization, pricing, and business behavior.

Findings: inconsistent blue/pink focus colors; very heavy shared shadows; static
cards lifting like links; primary dark-theme blue with white text; 500ms drawers;
36px controls; physical left/right spacing in overlays; custom mobile preview
dialogs lacking Radix focus management; variable 380–820ms product entrances;
continuous decorative hero motion; sticky controls without consistent safe-area
padding. Existing responsive tables, locale routing and optimized videos are kept.

## Boundaries

Only presentation, semantics and interaction accessibility are in scope. No
changes to auth, Stripe, webhooks, data models, API contracts, automation execution,
account isolation, approved text or translated strings. Existing working layouts
are retained. No dependencies added.

Production public pages were inspected directly. Authenticated production review
is blocked by the Cloudflare challenge on accounts.ap3k.com; code review and
isolated presentation verification must not be described as live workflow tests.

## Motion

Shared 140/220/360/440ms durations, ease-out entrances and ease-in-out state
transitions. CSS handles control feedback and Radix overlays; existing Framer
Motion handles content changes and marketing reveals. Reduced motion removes
decorative movement. Content must never depend on an observer to become readable.
Sidebar width and matching content margin are the deliberate layout-animation
exception; no animation of message-history scrolling or data values.
