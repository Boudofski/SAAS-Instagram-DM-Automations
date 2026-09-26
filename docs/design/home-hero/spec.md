# AP3K reference hero fidelity

Scope: top homepage hero only. Reference https://linktodm.com/, inspected September 26, 2026. Follow the inspection/spec/build/visual verification workflow from the MIT-licensed JCodesMore/ai-website-cloner-template inside AP3K's existing application.

## Reference measurements
- Inter 700 headline: desktop 60px, first line 45px, second line 90px; mobile 32px, left aligned. Center content max-width 885px.
- Original keyword animation: comment-water-drop.webm, 1530×364, 7.05 seconds, rendered 90px high. Local copy; purple hue and dark-theme blend treatment.
- Six original SVG illustrations retain the original photo, portrait, comment and DM artwork. Embedded raster images compressed to WebP. Light/dark SVG variants recolor UI surfaces and message gradients while preserving photos.
- Wings 388.53×399.43px, left/right -50px, top 158px in viewport, hidden below 1280px. Photo/comment/DM dimensions, rotations, image transforms and crops follow reference.
- Scroll measured at 210px: right photo x176.4/y-126/opacity.496, comment x168/opacity.58, DM x124.95/y89.25/opacity.643. Left photo x169.05/y-120.75/opacity.517, comment x159.6/opacity.601, DM x132.3/y94.5/opacity.622. Implement proportional motion with 200ms ease-out; keep scene clipped to hero.
- Single CTA 46px high, 12px corners; social row follows with original portrait strip at 36px high.

## AP3K-specific behavior
- Keep AP3K purple/pink colors and existing navigation, localized signup routing, lower homepage and application logic.
- Original customer portraits are decorative; label is “Built for creators on Instagram”. No transfer of LinktoDM's customer count, testimonials or unverified Meta partner status. Existing factual Official Instagram API label remains.
- Remove visible pause/play control as explicitly requested. Video stops when offscreen/document hidden and respects reduced motion. No mobile card composition: match reference's hidden side cards.
- Main copy localized for English, French, Spanish, German, Portuguese; original illustrative artwork remains English.
- Temporary noindex responsive review page is preview-only and must be removed before production.

## Verification results
- TypeScript, local production build and 24 selected locale/SEO/redirect regression tests passed.
- Browser preview checked in desktop light/dark, 390px English, 320px German and 768px French. No horizontal overflow (380/310/758px client and scroll widths respectively).
- Original visible card images and portrait strip loaded successfully; video plays and advances, with zero hero buttons.
- At scroll 210px, six card opacities and translations match the measured reference exactly.
- Visual review caught and corrected video blending through an intermediate stacking context; use a shared isolated hero context so white/black video backgrounds blend into the respective theme.
- Long localized desktop headlines use 54px and natural line spacing; English retains the measured reference sizing.
- Removed responsive review harness before production.

## Partner badge update
- User confirmed AP3K has Meta Business Partner status on September 26, 2026.
- Replace the Official Instagram API label with the exact reference Meta Business Partner artwork (meta.B36JgVLz.svg), rendered at the reference 38px height. Keep Meta blue; use white wordmark text on dark backgrounds. Embedded logo raster is locally optimized.
- Keep the creator line factual; the user confirmed the requested 19,000+ customer count is not yet true, so it is not published.

## Navigation and Automatically showcase — 26 September 2026

- Public navigation follows the reference floating pill: 584px minimum desktop width, 24px top offset, AP3K 24px mark, text-only locale selector, Pricing/Login/Join for free using AP3K localized destinations. Mobile expands the pill into those same links. The flag-free locale selector stays beside the logo at every width. A circular theme toggle sits beside Join for free on desktop and in the expanded mobile menu; the footer theme selector remains available.
- The showcase follows the Meta badge, with eight selectable features, original paired conversation illustrations, scroll-driven tilted side cards, and a five-second active-text fill and image crossfade. Autoplay pauses while hovered, keyboard-focused, offscreen, or in a background tab; reduced-motion users select static examples. Mobile uses the reference horizontally scrolling cards.
- The original 16 WebP illustrations are stored locally under `public/media/showcase`; their source is LinktoDM's public homepage, inspected/downloaded at the owner's explicit request. Copy is localized into the five supported site languages; the reference illustrations retain their English example conversations.
- Shared media received through the DM webhook can enter an ANY_MESSAGE automation; this is a presentation change and introduces no new trigger or backend behavior.
- Preview verification: desktop, 768px tablet, 390px and 320px phones; dark and light modes; expanded mobile menu; flag-free locale menu; French localized destinations; feature selection, original image loading, and mobile horizontal swiping. TypeScript, production build and 15 existing locale/routing tests passed. Temporary preview harness removed before release.

- Navigation control follow-up: visually checked 390px and 320px mobile menus, desktop placement, flag-free dropdown, light/dark switching and French signup-label wrapping. TypeScript and targeted lint passed; the preview production build passed.

## Setup section — 26 September 2026

Replaces only the former “The AP3K workflow” section with the requested ChatAutoDM reference section. Keeps its exact English headline, subtitle, three card labels and descriptions, 1280px container, responsive font sizes, card rotations (-2/1/-1 degrees), floating labels, shadows, and upward entrance. AP3K purple/pink replaces the reference gradient and blue accent; dark mode uses AP3K surfaces. Cards stack below 768px. Reduced motion skips the entrance. All five site locales have dedicated copy. Geist variable font comes from Vercel's official geist 1.7.2 package, bundled locally with its SIL Open Font License.
- Setup preview verification: reference-matching desktop card widths and angles, Geist rendering, exact English copy, 390px/320px stacked cards, 768px three-column layout, both themes, and completed entrance animation. TypeScript, targeted lint and preview production build passed; temporary review page removed before release.
