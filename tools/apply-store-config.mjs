// Applies store.config.json to the 8 pages (EN + TR: landing, support, privacy, terms).
// Idempotent; with null values the pages are exactly the "Coming soon" state again.
//
//   node tools/apply-store-config.mjs
//
// store.config.json
//   ios               App Store URL of the app (…/id6817337911) or null = coming soon
//   android           Google Play URL (…details?id=com.mathmaker.games) or null = coming soon
//   iosCampaignToken  App Store Connect provider token (App Analytics › Campaigns) for the
//                     pt= parameter; without it the App Store links carry no campaign
//
// What it writes, between the <!-- store:… --> markers and in the #ld-game JSON-LD:
//   - every page: <meta name="apple-itunes-app"> (Safari's smart banner; must be static HTML)
//   - landing pages: the hero button and the CTA store badges — App Store campaign links
//     (pt + ct=web_<location> + mt=8), Play links with a UTM referrer, data-track-status
//   - landing pages: JSON-LD installUrl + sameAs (the plain store URLs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'store.config.json'), 'utf8'));

const iosId = config.ios ? /id(\d+)/.exec(config.ios)?.[1] : null;
const playId = config.android ? /[?&]id=([\w.]+)/.exec(config.android)?.[1] : null;
if (config.ios && !iosId) throw new Error(`store.config.json: no App Store id (…/id123) in "${config.ios}"`);
if (config.android && !playId) throw new Error(`store.config.json: no package (?id=…) in "${config.android}"`);
const live = { ios: Boolean(iosId), android: Boolean(playId) };
const appStoreUrl = iosId && `https://apps.apple.com/app/id${iosId}`;
const playUrl = playId && `https://play.google.com/store/apps/details?id=${playId}`;

/** Store link of a button; `location` names the button (cta, hero, nav…). */
const storeHref = {
  /** @param {string} location */
  ios: (location) =>
    config.iosCampaignToken
      ? `https://apps.apple.com/app/apple-store/id${iosId}?pt=${encodeURIComponent(config.iosCampaignToken)}&amp;ct=web_${location}&amp;mt=8`
      : appStoreUrl,
  /** @param {string} location */
  android: (location) =>
    `${playUrl}&amp;referrer=${encodeURIComponent(`utm_source=math-maker.com&utm_medium=web&utm_campaign=web_${location}`)}`,
};

const TEXT = {
  en: {
    heroSoon: 'Coming soon: iOS &amp; Android', heroGet: 'Get the app',
    lead: 'MathMaker is coming soon to the App Store and Google Play. Tap a badge to hear on launch day.',
    leadLive: 'MathMaker is free on the App Store and Google Play. Tap a badge and take the challenge on your phone.',
    soon: 'Coming soon',
    ios: 'App Store — coming soon', android: 'Google Play — coming soon',
    iosLive: 'Download on the App Store', androidLive: 'Get it on Google Play',
  },
  tr: {
    heroSoon: 'Çok yakında: iOS &amp; Android', heroGet: 'Uygulamayı indir',
    lead: "MathMaker çok yakında App Store ve Google Play'de. Çıktığı gün haber almak için bir rozete dokun.",
    leadLive: "MathMaker App Store ve Google Play'de ücretsiz. Bir rozete dokun, meydan okumaya telefonunda devam et.",
    soon: 'Çok yakında',
    ios: 'App Store — çok yakında', android: 'Google Play — çok yakında',
    iosLive: "App Store'dan indir", androidLive: "Google Play'den indir",
  },
};
const BADGE = { ios: { img: 'app-store', subject: 'iOS' }, android: { img: 'google-play', subject: 'Android' } };

/** @param {'ios' | 'android'} platform @param {'en' | 'tr'} lang @param {string} prefix @param {string} location */
function badge(platform, lang, prefix, location) {
  const tx = TEXT[lang];
  const track = `data-track="store_click" data-track-platform="${platform}" data-track-location="${location}" data-track-status="${live[platform] ? 'live' : 'coming_soon'}"`;
  const img = `<img src="${prefix}assets/img/${BADGE[platform].img}.webp" alt="" width="240" height="80" loading="lazy" decoding="async" />`;
  if (live[platform]) {
    return `<a class="store" href="${storeHref[platform](location)}" target="_blank" rel="noopener" data-magnetic aria-label="${tx[`${platform}Live`]}" data-i18n-aria="cta.${platform}Live" ${track}>${img}</a>`;
  }
  return `<a class="store" href="mailto:contact@math-maker.com?subject=MathMaker%20${BADGE[platform].subject}" data-magnetic aria-label="${tx[platform]}" data-i18n-aria="cta.${platform}" ${track}>${img}<span class="store__ribbon" data-i18n="cta.soon">${tx.soon}</span></a>`;
}

/** @param {string} html @param {string} name @param {string} content (whole lines, or '') */
function fill(html, name, content) {
  const re = new RegExp(`(\\n( *)<!-- store:${name}[^\\n]*-->\\n)[\\s\\S]*?(\\2<!-- /store:${name} -->)`);
  if (!re.test(html)) throw new Error(`marker store:${name} missing`);
  return html.replace(re, (_, open, indent, close) => `${open}${content}${close}`);
}

const PAGES = ['index.html', 'support.html', 'privacy-policy.html', 'terms-of-service.html'].flatMap((f) => [f, `tr/${f}`]);
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let html = raw.replace(/\r\n/g, '\n');
  const lang = page.startsWith('tr/') ? 'tr' : 'en';
  const prefix = lang === 'tr' ? '../' : '';
  html = fill(html, 'meta', iosId ? `    <meta name="apple-itunes-app" content="app-id=${iosId}" />\n` : '');

  if (page.endsWith('index.html')) {
    const tx = TEXT[lang];
    const any = live.ios || live.android;
    html = fill(html, 'hero', any
      ? `            <a class="btn btn--ghost btn--xl" href="#download" data-magnetic data-i18n="hero.get">${tx.heroGet}</a>\n`
      : `            <a class="btn btn--ghost btn--xl" href="#download" data-magnetic data-i18n="hero.soon">${tx.heroSoon}</a>\n`);
    html = fill(html, 'cta', [
      any
        ? `          <p class="lead" data-reveal data-i18n="cta.leadLive">${tx.leadLive}</p>`
        : `          <p class="lead" data-reveal data-i18n="cta.lead">${tx.lead}</p>`,
      '          <div class="stores" data-reveal>',
      `            ${badge('ios', lang, prefix, 'cta')}`,
      `            ${badge('android', lang, prefix, 'cta')}`,
      '          </div>',
      '',
    ].join('\n'));

    // JSON-LD: installUrl + sameAs only for the stores that are live, always last.
    html = html.replace(/(    <script type="application\/ld\+json" id="ld-game">\n)([\s\S]*?)(\n    <\/script>)/, (_, open, json, close) => {
      const { installUrl, sameAs, ...ld } = JSON.parse(json);
      const urls = [appStoreUrl, playUrl].filter(Boolean);
      if (urls.length) Object.assign(ld, { installUrl: urls.length === 1 ? urls[0] : urls, sameAs: urls });
      return open + JSON.stringify(ld, null, 2).split('\n').map((l) => `      ${l}`).join('\n') + close;
    });
  }
  fs.writeFileSync(file, html.replace(/\n/g, eol));
}
console.log(`store links — iOS: ${live.ios ? 'live' : 'coming soon'}, Android: ${live.android ? 'live' : 'coming soon'}, App Store campaign token: ${config.iosCampaignToken ? 'yes' : 'no'}`);
