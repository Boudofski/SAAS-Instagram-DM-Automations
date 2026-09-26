# AP3K homepage hero adaptation

## Scope and workflow
- Reference: https://linktodm.com/ — top hero only, as requested September 26, 2026.
- Destination: AP3K `/` and existing localized homepage routes.
- Adapt the reconnaissance / component specification / visual QA workflow from
  JCodesMore/ai-website-cloner-template (MIT). Keep the existing Next 14 application.
- Replace only the first homepage section; preserve navigation, remaining sections,
  metadata, route structure, sign-up flow, and application logic.
- Components: `components/website/home-hero.tsx`, scoped CSS module.
- Copy: `lib/i18n/home-hero.ts` for en/fr/es/de/pt.
- Assets: `public/media/hero/`, local WebP versions of the two reference post photos.

## Observed reference
- Centered headline, with muted first line and dark second line.
- Desktop computed headline size 60px, container width 717px at browser's current desktop viewport.
- Rotating keyword pill above heading (e.g. fashion / freebie), time driven.
- Center CTA followed by social proof and partner badge.
- Two flanking image stacks, positioned left/right -50px, top 158px.
- Each stack 388.53 x 399.43px; hidden below xl (1280px).
- Photo card 230px wide, comment card 248.9 x 118.02px,
  DM card 206.85px square; outer corner radii 16–21px.
- Alternating 15-degree card rotations, soft shadows, pale frame backgrounds.
- Side card transform transition 200ms ease-out.
- Source screenshots supplied by user and live hero inspected in browser.

## AP3K adaptation
- Preserve AP3K Plus Jakarta Sans, purple / pink / orange accents.
- Light: off-white background, white cards, slate copy; dark: near-black background,
  dark cards, white/lavender text. Colored CTA and keyword in both modes.
- Center headline: “Turn Instagram comments / into conversations.”
- Body explains comments, DMs, story replies and delivering the promised link.
- CTA GET STARTED links to existing localized sign-up route; secondary anchor to setup steps.
- Free plan footnote preserves 500 monthly actions and no credit card copy.
- Do not transfer LinktoDM's 22,000-customer claim or implied endorsements.
  Use “Built for creators, coaches & brands” and Official Instagram API.
- Photo cards illustrative, not user testimonials. Demo message cards must be labelled as an example.
- Reference post images:
  - creator-style: right-card-1.DGnMJxbY.svg, embedded image0, local WebP.
  - creator-fashion: left-card-1.BkadjsFL.svg, embedded image1, local WebP.
- Desktop >=1280px: flanking angled card stacks, center copy bounded away from cards.
- Tablet/mobile: single compact conversation composition in normal flow; hide duplicate right stack.
- Mobile typography wraps naturally, no fixed text heights, no horizontal page overflow.

## Motion and interaction
- Cycle GUIDE / LINK / OFFER every six seconds, with matching comment / DM example.
- Each scene reveals the comment followed by DM, using opacity/translate only.
- Gentle card float; pause control; pause when offscreen, document hidden, or focused/hovered.
- Reduced-motion preference: stable first scene, no cycling or decorative movement.
- All primary copy remains readable before hydration. Demo links are clearly illustrative.
- Decorative photo/card stacks aria-hidden; concise accessible equivalent describes the flow.

## Verification
- TypeScript and existing relevant locale / SEO checks.
- Production build.
- Preview browser: desktop light/dark, mobile/tablet where browser supports resizing,
  CTA destinations, pause state and animation progression, no missing media.
- Keep verification limitations explicit; do not claim unobserved mobile screenshots.
