# math-maker.com

Static website for **MathMaker : Mind Challenge**, the timed math quiz game — hosted on GitHub Pages
with the custom domain `math-maker.com` (see `CNAME`). Same setup as grid-collection.com.

No framework and no build step: plain HTML, two stylesheets and a few scripts. **This repo is the
single source of the site** — edit the pages and assets here directly, commit, push.

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

- `assets/site.css` — shared design: tokens, base, nav, buttons, cards, footer, consent banner and
  the inner page layouts (support cards, legal documents with a table of contents, 404).
- `assets/site.js` — inner pages: language memory, reading progress bar, table of contents,
  compass cursor, math dust background; loads `measure.js`.
- `assets/home.css`, `assets/home.js` — landing page only (WebGL particles, Web Audio, scroll
  scenes, category wheel, the browser round). Both languages' strings live in `home.js`.
- `assets/measure.js` — consent banner + Google Analytics 4 + `track()` (see below);
  `assets/analytics-config.js` — the GA4 measurement ID; `assets/vendor/web-vitals.js` —
  web-vitals 6.2.3, copied from npm (Apache 2.0, licence next to it).
- `assets/fonts/` — self-hosted Exo (SIL OFL, `assets/fonts/OFL-Exo.txt`), latin + latin-ext.
- `assets/img/`, `assets/screens/{en,tr}/` — medals, power-ups, store badges, app screenshots, all
  WebP at the size they are shown (screens 360×780, medals 384, power-ups 320).
- `app-ads.txt` — AdMob publisher record (must stay at the domain root, served as text).
- `CNAME`, `robots.txt`, `sitemap.xml`, `404.html` (root-absolute paths: served for any URL).
- `favicon.png` (512), `icon-192.png`, `apple-touch-icon.png` (from the app icon),
  `site.webmanifest`, `og-image.png` / `og-image-tr.png` (share previews), `llms.txt` (short
  product summary for AI search).
- `brand-assets/` — `og-image.html` source of the share previews + `capture.mjs`.
- `store.config.json` + `tools/apply-store-config.mjs` — store links (see below);
  `tools/faq-schema.mjs` — FAQ structured data of the support pages.

## SEO

- Every page: title, description, canonical, `hreflang` (en / tr / x-default), Open Graph and
  Twitter card (`og:image` per language with `:type`, `:width`, `:height`, `:alt`;
  `og:locale:alternate`), `site.webmanifest`. 404 is `noindex`.
- Landing pages: `VideoGame` JSON-LD (`#ld-game`: description in the page's language, `offers`
  free, `publisher`, `screenshot`; `installUrl` / `sameAs` once a store is live). Add an
  `aggregateRating` only when a real store rating exists — never a made-up one. The H1 carries
  the genre ("timed math quiz game") in a visually hidden span.
- Support pages: `FAQPage` JSON-LD (`#ld-faq`) generated from the page's own FAQ. After editing an
  FAQ item run `node tools/faq-schema.mjs`.
- Images: `width` / `height` on every `<img>`; everything below the hero is
  `loading="lazy" decoding="async"`.
- `sitemap.xml`: update `lastmod` of the pages you change.

### Share previews (Open Graph images)

`brand-assets/og-image.html` is the template (`?lang=tr` switches it to Turkish). Re-render both
files after changing it — they must stay 1200×630 and under 300 KB:

```bash
npx playwright install chromium   # once
node brand-assets/capture.mjs     # → og-image.png, og-image-tr.png
```

After publishing, refresh the previews in the Facebook Sharing Debugger / LinkedIn Post
Inspector (WhatsApp caches hard: test with `?v=2`).

## Analytics (Google Analytics 4 + consent)

### Changing the measurement ID

The ID lives **only** in `assets/analytics-config.js` (`GA_MEASUREMENT_ID`). To switch to the real
web stream, replace its value with the `G-…` ID from GA4 › Admin › Data streams, then commit and
push. Nothing else references the ID — there is no gtag snippet in the HTML.

### Consent (Consent Mode v2, basic)

- First visit: a small bilingual banner (Accept / Reject, equal weight). Until the visitor
  accepts, **gtag.js is not loaded**, no request goes to Google and no `_ga` cookie is set.
- Accept → `consent default` (all denied) + `consent update {analytics_storage: granted}` and
  gtag.js is loaded with the ID. `ad_storage`, `ad_user_data`, `ad_personalization` stay denied
  (no ads on the site); Google signals and ad personalisation are off.
- The choice is stored in localStorage (`mathmakerConsent`). "Cookie preferences" in every footer
  reopens the banner; Reject / withdraw switches GA off for the page (`ga-disable-<ID>`) and
  deletes the `_ga`, `_ga_*` cookies.
- On the landing page the banner sits above the intro gate, which moves up to make room
  (`--consent-h`), so `gate_enter` can be measured after consent.
- Events that happen before the choice are dropped, never queued.

### Sending events

Everything goes through one helper, `track(name, params)` in `assets/measure.js` — a silent
no-op without consent. `home.js` and `site.js` load `measure.js` with a dynamic `import()`, so a
blocked script never breaks the page.

- Static clicks are declarative; one delegated listener turns `data-track-*` into snake_case
  parameters:

  ```html
  <a href="…" data-track="store_click" data-track-platform="ios" data-track-location="cta"
     data-track-status="coming_soon">
  ```

- Game events are sent from code: `track('demo_end', { levels, sigma, best_streak, new_best })`.
- `section_view`: give a section `data-section="name"`; it is sent once per session when half of
  the section (or half of the screen, for tall sections) is in view.
- Language switch on the landing page sends only `lang_switch` — the address change
  (`history.replaceState`) is not a page view as long as GA4 › Enhanced measurement › "Page
  changes based on browser history events" is **off**.

| Event | Parameters | Where |
| --- | --- | --- |
| `page_view` | (automatic, gtag config) | every page, after consent |
| `store_click` | `platform` ios/android, `location` cta, `status` live/coming_soon | store badges (`data-track`) |
| `lang_switch` | `from`, `to` | landing (code), inner pages (`data-track`) |
| `sound_toggle` | `on` yes/no | landing nav sound button |
| `section_view` | `section` hero, pitch, speed, categories, play, journey, powerups, screens, details, download | landing |
| `legal_view` | `page` support/privacy/terms | inner pages, on load |
| `support_contact` | `mailto` support/info/contact, `page` | mailto links (`data-track`) |
| `web_vitals` | `name` LCP/INP/CLS/FCP/TTFB, `value` (ms; CLS × 1000), `rating` | every page |
| `gate_enter` | `sound` on/off, `ms_to_enter` | landing intro gate |
| `category_view` | `category` pisagor … gauss | category wheel / threshold bars (user clicks) |
| `demo_start` | `category` | browser round start / restart |
| `demo_end` | `levels`, `sigma`, `best_streak`, `new_best` yes/no | browser round over |
| `demo_powerup` | `kind` hint/fifty/change/time | browser round |
| `chest_open`, `gift_open` | — | journey cards (user clicks) |

User properties (`gtag('set', 'user_properties', …)`): `site_lang` (en/tr), `sound_on`,
`reduced_motion`, `demo_played` (yes/no, for the session).

Check after changing the banner, `measure.js` or any tracked element (Chromium via Playwright;
Google is never contacted — gtag.js is stubbed and the script reads `window.dataLayer`):

```bash
node tools/check-analytics.mjs              # exit code 1 on any failure
node tools/check-analytics.mjs --shots out  # + banner screenshots
```

GA4 setup (once): Enhanced measurement › browser history page changes **off**, outbound clicks
on; mark `store_click` as a key event; register the custom dimensions (user properties above and
the event parameters); data retention 14 months (the privacy policy says so).

### UTM for links you share

Tag links posted elsewhere so GA4 shows the channel:
`https://math-maker.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch`
(`utm_source` = the platform, `utm_medium` = social / email / …, `utm_campaign` = the occasion).

## Store links

`store.config.json` drives every store link; `null` = "Coming soon" (the badges are `mailto:`
links, as today):

```json
{
  "ios": null,
  "android": null,
  "iosCampaignToken": null
}
```

At launch, fill in what is live and run the script (idempotent; setting a value back to `null`
restores the "Coming soon" state):

```json
{
  "ios": "https://apps.apple.com/app/id6817337911",
  "android": "https://play.google.com/store/apps/details?id=com.mathmaker.games",
  "iosCampaignToken": "<provider token from App Store Connect › App Analytics › Campaigns>"
}
```

```bash
node tools/apply-store-config.mjs
```

It writes, between the `<!-- store:… -->` markers of the 8 pages:

- App Store badges → campaign links
  `https://apps.apple.com/app/apple-store/id6817337911?pt=<token>&ct=web_<location>&mt=8`
  (`ct` = the button: `web_cta`; without a token, the plain App Store URL).
- Google Play badges →
  `https://play.google.com/store/apps/details?id=com.mathmaker.games&referrer=utm_source%3Dmath-maker.com%26utm_medium%3Dweb%26utm_campaign%3Dweb_<location>`.
- `<meta name="apple-itunes-app" content="app-id=6817337911">` on every page (Safari reads only
  static markup), the live CTA texts and the hero button ("Get the app"), `data-track-status="live"`.
- JSON-LD `installUrl` + `sameAs` (the plain store URLs).

Then update the store status line in `llms.txt`, commit and push.

## Hosting note

GitHub Pages sends `Cache-Control: max-age=600` for every file and headers cannot be changed. If
the site ever moves behind Cloudflare, long caching for `assets/` and security headers can be set
there.
