# math-maker.com

Static website for **MathMaker : Mind Challenge**, the timed math quiz game — hosted on GitHub Pages
with the custom domain `math-maker.com` (see `CNAME`). Same setup as grid-collection.com.

No framework and no build step: plain HTML, two stylesheets and two scripts.

## Where the design comes from

The pages are generated from the website prototype in the app repo
(`design-prototypes/website`, V2 design). Do not edit `assets/home.*`, the landing pages or the
inner pages here by hand — change the prototype, then publish it:

```bash
node <app repo>/design-prototypes/website/tools/port-to-site.mjs <this repo>
```

Preview locally with any static server from the repo root (the landing script is an ES module,
so `file://` does not work), e.g. `npx serve .` or `python -m http.server`.

## Languages

English lives at the root, Turkish under `/tr/`. Every page exists in both languages with
`hreflang` alternates, and the TR / EN switcher in the nav links the same page across
languages. The choice is remembered in localStorage (`mathmakerLang`) and in-page nav links are
rewritten to it — the site never auto-redirects. On the landing page the switch happens in
place (intro, sound and demo keep running) and the address moves between `/` and `/tr/`.

| Page | EN | TR |
| --- | --- | --- |
| Landing (intro, particle field, playable browser round) | `/index.html` | `/tr/index.html` |
| Support | `/support.html` | `/tr/support.html` |
| Privacy Policy | `/privacy-policy.html` | `/tr/privacy-policy.html` |
| Terms of Service | `/terms-of-service.html` | `/tr/terms-of-service.html` |

## Files

- `assets/site.css` — shared design: tokens, base, nav, buttons, cards, footer and the inner
  page layouts (support cards, legal documents with a table of contents, 404).
- `assets/site.js` — inner pages: language memory, reading progress bar, table of contents,
  compass cursor, math dust background.
- `assets/home.css`, `assets/home.js` — landing page only (WebGL particles, Web Audio, scroll
  scenes, category wheel, the browser round). Both languages' strings live in `home.js`.
- `assets/fonts/` — self-hosted Exo (SIL OFL, `assets/fonts/OFL-Exo.txt`), latin + latin-ext.
- `assets/img/`, `assets/screens/{en,tr}/` — medals, power-ups, store badges, app screenshots.
- `app-ads.txt` — AdMob publisher record (must stay at the domain root, served as text).
- `CNAME`, `robots.txt`, `sitemap.xml`, `404.html` (root-absolute paths: served for any URL).
- `favicon.png`, `apple-touch-icon.png` (from the app icon), `og-image.png` (share preview).
- `brand-assets/` — `og-image.html` source; re-render with `node brand-assets/capture.mjs`
  (needs Playwright).

## Store links

The App Store / Google Play badges are "Coming soon" `mailto:` links for now. At launch,
replace their `href` with the store URLs (App Store id `6817337911`, Play package
`com.mathmaker.games`) in the prototype (`.store` links and the hero's "coming soon" button)
and publish again.
