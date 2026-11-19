# AP3K logo v2

Vector rebuild of the logo you picked: a two-tone A, a chat bubble with three dots, and a violet → pink → orange reply arrow with three sparks. The wordmark AP3K has an open A with an orange triangle and an orange 3.

Every SVG is outlined paths only: no live text, no embedded images. The PNGs are rendered from those SVGs. Open `preview.html` to see every file, and `in-context.html` to see the logo in a site header (light and dark), a browser tab at real size, Instagram circles, Stripe Checkout and a phone home screen.

## Which file do I use?
| Where | File |
|---|---|
| Website header, dark background | `svg/ap3k-horizontal-for-dark-bg.svg` |
| Website header, light background | `svg/ap3k-horizontal-for-light-bg.svg` |
| Icon only (transparent) | `svg/ap3k-icon.svg`, `png/ap3k-icon-512.png` / `-1024.png` |
| Text only (transparent) | `svg/ap3k-wordmark-white.svg` (dark backgrounds), `svg/ap3k-wordmark-ink.svg` (light backgrounds) |
| Full logo, stacked | `svg/ap3k-stacked-for-dark-bg.svg`, `-for-light-bg.svg`, `-on-dark-background.svg` (with the dark panel) |
| One colour (print, stamps, embossing) | `svg/ap3k-icon-black.svg` / `-white.svg`, `ap3k-horizontal-black.svg` / `-white.svg`, `ap3k-wordmark-black.svg` / `-white-mono.svg` |
| Small icon (48–128 px) | `svg/ap3k-icon-small.svg`: no sparks, bigger dots, thicker arrow tail and wider gaps |
| Tiny icon (16–32 px) | `favicon/favicon.svg`, `favicon-16.png`, `favicon-32.png`: the A and the arrow only, because three dots can't be drawn in 16 pixels |
| Favicon / browser / PWA | everything in `favicon/` and paste `favicon/head-snippet.html` into `<head>` |
| Instagram, TikTok, X, LinkedIn, Facebook profile picture | `social/profile-picture-1080.png` (icon on dark), `social/profile-picture-light-1080.png` (icon on white) or `social/profile-picture-full-logo-1080.png` (icon + AP3K). Both are square and stay inside the circle crop. `-400.png` for platforms with small uploads. |
| Stripe icon | `stripe/stripe-icon-512.png` |
| Stripe logo | `stripe/stripe-logo-text-ink-1024.png` (text only), `stripe/stripe-logo-full-ink-1024.png` (icon + text), `stripe/stripe-logo-text-white-1024.png` (only if your Checkout background is dark) |

## Stripe (Dashboard → Settings → Business → Branding)
Stripe's documentation says the icon and the logo have the same rules: square, at least 128 × 128 px, PNG (recommended) or JPG, 512 KB maximum. The Stripe files here are square PNGs at 512 or 1024 px, and the build checks each one is under 512 KB. There is also `stripe/stripe-logo-wide-ink-1200w.png` (horizontal lockup) in case your Dashboard accepts a non-square logo. Stripe's docs list square, so use the square files first.
Suggested Stripe colours (the site's own): brand `#6D28D9`, accent `#FF6B35`.

## Colours (taken from ap3k.com's own CSS)
| Role | HEX | Where it comes from on ap3k.com |
|---|---|---|
| Dark background | `#050816` | dark-mode page background |
| Light background | `#EEF1F6` | light-mode page background |
| Ink (text on light) | `#0F172A` | light-mode text colour |
| White (text on dark) | `#F8FAFC` | dark-mode text colour |
| A, left leg | `#A78BFA` → `#8B5CF6` | dark-mode brand purple / gradient violet |
| A, right leg | `#7C3AED` → `#6D28D9` | primary violet |
| Chat bubble | `#8B5CF6` → `#6D28D9` | brand gradient |
| Reply arrow | `#8B5CF6` → `#EC4899` → `#FF6B35` | the site's brand gradient |
| Sparks, triangle, the 3 | `#FF9F43` → `#FF6B35` | the gradient's orange end |

No Pantone or CMYK matches are claimed. Ask your printer for a proof before printing.

## Rules
- Always write **AP3K** in capitals.
- Keep space around the logo at least equal to the height of the wordmark's letters.
- Don't stretch, rotate, recolour or add effects (glow, shadow, 3D). The dark versions have a soft violet glow behind the icon. It is a vector gradient on the background, not part of the logo.
- Under 128 px use the small icon; under 48 px the favicon files (already set up).
- On light backgrounds the left leg of the A is light, so the logo has less contrast there. Prefer the dark version when you can.

## Notes
- Your reference had glow and soft 3D shading. Here those are flat gradients, so the logo prints, scales and works as a favicon. It is a close rebuild, not a pixel copy.
- Trademark: not cleared. A chat bubble plus an arrow is a common idea for messaging and growth products, so run a professional trademark search before you register it or launch with it.
- Nothing was uploaded to Stripe, social accounts or ap3k.com. These files are only on this computer.
- Source: `../build/v2.py` (Python 3 + shapely). Run `build/.venv/bin/python build/v2.py --png` to rebuild everything.
