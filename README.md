# math-maker.com

Static website for **MathMaker**, the timed math quiz game — hosted on GitHub Pages
with the custom domain `math-maker.com` (see `CNAME`). Same setup as grid-collection.com.

No framework and no build step: plain HTML, one shared stylesheet and two small scripts.

## Languages

English lives at the root, Turkish under `/tr/`. Every page exists in both languages with
`hreflang` alternates, and the language switcher in the nav links the same page across
languages. `lang.js` remembers the visitor's choice (localStorage) and rewrites in-page nav
links — it never auto-redirects.

| Page | EN | TR |
| --- | --- | --- |
| Landing (with a playable 5-question demo) | `/index.html` | `/tr/index.html` |
| Support | `/support.html` | `/tr/support.html` |
| Privacy Policy | `/privacy-policy.html` | `/tr/privacy-policy.html` |
| Terms of Service | `/terms-of-service.html` | `/tr/terms-of-service.html` |

## Files

- `styles.css` — the only stylesheet (colours follow the app's design tokens).
- `lang.js` — language persistence.
- `demo.js` — the in-browser demo (C1 rules, real timer and Sigma formula); its strings
  come from `window.DEMO_T` on each landing page.
- `fonts/` — self-hosted Exo (SIL OFL, `fonts/OFL-Exo.txt`), latin + latin-ext.
- `app-ads.txt` — AdMob publisher record (must stay at the domain root, served as text).
- `CNAME`, `robots.txt`, `sitemap.xml`, `404.html`.
- `favicon.png`, `apple-touch-icon.png` (from the app icon), `og-image.png` (share preview).
- `brand-assets/` — `og-image.html` source; re-render with `node brand-assets/capture.mjs`
  (needs Playwright).

## Store links

The App Store / Google Play badges are "Coming soon" `mailto:` links for now. At launch,
replace their `href` with the store URLs (App Store id `6817337911`, Play package
`com.mathmaker.games`) in both `index.html` files and remove the `store-badge--soon` class.
