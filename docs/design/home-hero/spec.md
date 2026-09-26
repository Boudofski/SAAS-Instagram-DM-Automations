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
