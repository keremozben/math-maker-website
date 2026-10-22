// End-to-end check of the consent banner and every analytics event, in Chromium.
// Google is never contacted: gtag.js is answered by a stub that only sets the _ga cookies,
// so the assertions read what the site pushes into window.dataLayer.
//
//   npx playwright install chromium   (once)
//   node tools/check-analytics.mjs [--shots <dir>]   → exit code 1 on any failure
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GA_ID = /GA_MEASUREMENT_ID = '([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'assets/analytics-config.js'), 'utf8'))[1];
const shotsArg = process.argv.indexOf('--shots');
const SHOTS = shotsArg > 0 ? path.resolve(process.argv[shotsArg + 1]) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

// ---- static server (GitHub Pages-like: 404.html for misses) ----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, p.endsWith('/') ? `${p}index.html` : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---- tiny assertion log ----
let failed = 0;
const ok = (cond, label) => { console.log(`${cond ? '  ✓' : '  ✗'} ${label}`); if (!cond) failed++; };
const section = (t) => console.log(`\n${t}`);

const browser = await chromium.launch();

/** A fresh visitor; `consent` presets the stored choice. */
async function visitor({ consent = null, viewport = { width: 1440, height: 900 }, mobile = false } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
  const google = [];
  await ctx.route(/^https?:\/\/[^/]*(google|doubleclick)[^/]*\//, (route) => {
    google.push(route.request().url());
    if (route.request().url().includes('googletagmanager.com/gtag/js')) {
      return route.fulfill({ contentType: 'text/javascript', body: 'document.cookie="_ga=GA1.1.1.1; path=/"; document.cookie="_ga_STUB=GS1.1; path=/";' });
    }
    return route.abort();
  });
  if (consent) await ctx.addInitScript((c) => localStorage.setItem('mathmakerConsent', JSON.stringify({ analytics: c })), consent);
  // Keep mailto: links from leaving the page; the delegated listeners still see the click.
  await ctx.addInitScript(() => addEventListener('click', (e) => { if (e.target instanceof Element && e.target.closest('a[href^="mailto:"], a.lang__btn')) e.preventDefault(); }, true));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(`${m.text()} ${m.location()?.url ?? ''}`); });
  return { ctx, page, google, errors };
}
/** Everything the site pushed to dataLayer, as plain arrays. */
const layer = (page) => page.evaluate(() => (window.dataLayer || []).map((a) => JSON.parse(JSON.stringify([...a]))));
const events = async (page, name) => (await layer(page)).filter((a) => a[0] === 'event' && (!name || a[1] === name));
const cookies = async (ctx) => (await ctx.cookies()).map((c) => c.name).filter((n) => n.startsWith('_ga'));
const overlap = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
async function enterSilently(page) {
  await page.waitForSelector('.gate--ready');
  await page.click('[data-action="enter"][data-sound="off"]');
  await page.waitForTimeout(1300);
}

// ------------------------------------------------------------------
section('1. Before consent: nothing loads, nothing is sent');
for (const [label, opts] of [['desktop 1440', {}], ['mobile 390', { viewport: { width: 390, height: 844 }, mobile: true }]]) {
  for (const lang of ['en', 'tr']) {
    const { ctx, page, google, errors } = await visitor(opts);
    await page.goto(`${BASE}/${lang === 'tr' ? 'tr/' : ''}`);
    await page.waitForSelector('.consent');
    await page.waitForSelector('.gate--ready');
    const banner = await page.locator('.consent').boundingBox();
    const gateBox = await page.locator('.gate__inner').boundingBox();
    const btns = await page.locator('.consent__btn').evaluateAll((els) => els.map((b) => ({ text: b.textContent, cls: b.className, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })));
    const text = await page.locator('.consent__text').textContent();
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `banner-gate-${label.split(' ')[0]}-${lang}.png`) });
    ok(lang === 'tr' ? text.startsWith('Ziyaretçilerin') : text.startsWith('May we use'), `${label} ${lang}: banner in ${lang} — "${btns.map((b) => b.text).join(' / ')}"`);
    ok(btns.length === 2 && btns[0].cls === btns[1].cls && btns[0].h === btns[1].h, `${label} ${lang}: Accept / Reject same style and height (${btns.map((b) => `${b.w}×${b.h}`).join(', ')})`);
    ok(!overlap(banner, gateBox), `${label} ${lang}: banner does not cover the intro gate (gate ends at ${Math.round(gateBox.y + gateBox.height)}, banner starts at ${Math.round(banner.y)})`);
    await enterSilently(page);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
    await page.waitForTimeout(1500);
    ok(google.length === 0, `${label} ${lang}: no request to Google (${google.length})`);
    ok((await cookies(ctx)).length === 0, `${label} ${lang}: no _ga cookie`);
    ok(await page.evaluate(() => window.dataLayer === undefined && !document.querySelector('script[src*="googletagmanager"]')), `${label} ${lang}: gtag.js not on the page, dataLayer empty`);
    ok(errors.length === 0, `${label} ${lang}: no console errors ${errors.join(' | ')}`);
    await ctx.close();
  }
}

// ------------------------------------------------------------------
section('2. Accept → gtag.js with the configured ID, then every landing event');
{
  const { ctx, page, google, errors } = await visitor();
  await page.goto(`${BASE}/`);
  await page.waitForSelector('.gate--ready');
  await page.click('.consent [data-consent="granted"]');
  await page.waitForTimeout(500);
  const gtagReq = google.find((u) => u.includes('googletagmanager.com/gtag/js'));
  ok(gtagReq?.endsWith(`id=${encodeURIComponent(GA_ID)}`), `gtag.js requested with the ID from analytics-config.js (${gtagReq})`);
  const dl = await layer(page);
  const consentDefault = dl.find((a) => a[0] === 'consent' && a[1] === 'default')?.[2];
  const consentUpdate = dl.find((a) => a[0] === 'consent' && a[1] === 'update')?.[2];
  ok(consentDefault && Object.values(consentDefault).every((v) => v === 'denied') && Object.keys(consentDefault).length === 4, `consent default: ${JSON.stringify(consentDefault)}`);
  ok(JSON.stringify(consentUpdate) === '{"analytics_storage":"granted"}', `consent update: ${JSON.stringify(consentUpdate)} (ad_* stay denied)`);
  ok(dl.some((a) => a[0] === 'config' && a[1] === GA_ID), 'gtag config with the measurement ID');
  ok(!(await page.locator('.consent').count()), 'banner closed after the choice');
  const props = dl.find((a) => a[0] === 'set' && a[1] === 'user_properties')?.[2];
  ok(props && ['site_lang', 'sound_on', 'reduced_motion', 'demo_played'].every((k) => k in props), `user properties: ${JSON.stringify(props)}`);

  await page.click('[data-action="enter"][data-sound="off"]');
  await page.waitForTimeout(1300);
  const gateEv = (await events(page, 'gate_enter'))[0]?.[2];
  ok(gateEv?.sound === 'off' && Number.isFinite(gateEv?.ms_to_enter), `gate_enter ${JSON.stringify(gateEv)}`);

  await page.click('.nav [data-action="toggle-sound"]');
  await page.waitForTimeout(200);
  ok((await events(page, 'sound_toggle'))[0]?.[2]?.on === 'yes', `sound_toggle ${JSON.stringify((await events(page, 'sound_toggle'))[0]?.[2])}`);
  await page.click('.nav [data-action="toggle-sound"]');

  // Scroll the whole page slowly: section_view once per section.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 300) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(500);
  const sections = (await events(page, 'section_view')).map((e) => e[2].section);
  ok(sections.length >= 9 && new Set(sections).size === sections.length, `section_view once each: ${sections.join(', ')}`);

  await page.locator('#categories').scrollIntoViewIfNeeded();
  await page.click('.wheel__node[data-index="3"]');
  ok((await events(page, 'category_view'))[0]?.[2]?.category === 'newton', `category_view ${JSON.stringify((await events(page, 'category_view'))[0]?.[2])}`);

  await page.locator('#play').scrollIntoViewIfNeeded();
  await page.click('[data-action="start"]');
  await page.waitForTimeout(300);
  ok((await events(page, 'demo_start'))[0]?.[2]?.category === 'pisagor', `demo_start ${JSON.stringify((await events(page, 'demo_start'))[0]?.[2])}`);
  for (const kind of ['hint', 'fifty', 'time', 'change']) { await page.click(`.pu-btn[data-pu="${kind}"]`); await page.waitForTimeout(150); }
  const pus = (await events(page, 'demo_powerup')).map((e) => e[2].kind);
  ok(pus.join() === 'hint,fifty,time,change', `demo_powerup kinds: ${pus.join(', ')}`);
  // Lose all 5 lives: always pick an answer that is not the result of the expression.
  for (let life = 0; life < 5; life++) {
    await page.waitForFunction(() => [...document.querySelectorAll('.answer')].some((b) => !b.disabled));
    await page.evaluate(() => {
      const q = document.querySelector('[data-g="question"]').textContent.replace(' = ?', '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
      const right = Function(`return (${q})`)();
      const btn = [...document.querySelectorAll('.answer')].find((b) => !b.disabled && Number(b.querySelector('[data-g="opt"]').textContent.replace(/[.,]/g, '')) !== right);
      btn.click();
    });
    await page.waitForTimeout(1500);
  }
  await page.waitForSelector('[data-g="over"]:not([hidden])');
  const end = (await events(page, 'demo_end'))[0]?.[2];
  ok(end && end.levels === 5 && end.sigma === 0 && end.best_streak === 0 && end.new_best === 'no', `demo_end ${JSON.stringify(end)}`);
  ok((await layer(page)).some((a) => a[0] === 'set' && a[1] === 'user_properties' && a[2].demo_played === 'yes'), 'user property demo_played = yes after the round');

  // The chest bobs forever: scroll by hand and click without waiting for it to be still.
  await page.locator('.chest').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.click('.chest', { force: true });
  await page.click('.gift:not(.gift--open)', { force: true });
  ok((await events(page, 'chest_open')).length === 1 && (await events(page, 'gift_open')).length === 1, 'chest_open + gift_open (user clicks only, not the auto-opening boxes)');

  await page.locator('#download').scrollIntoViewIfNeeded();
  await page.click('.store[data-track-platform="ios"]');
  await page.click('.store[data-track-platform="android"]');
  const stores = (await events(page, 'store_click')).map((e) => e[2]);
  ok(stores.length === 2 && stores[0].platform === 'ios' && stores[1].platform === 'android' && stores.every((s) => s.location === 'cta' && ['live', 'coming_soon'].includes(s.status)), `store_click ${JSON.stringify(stores)}`);

  // Language switch: one lang_switch, no page_view, no new config.
  const configsBefore = (await layer(page)).filter((a) => a[0] === 'config').length;
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('.nav [data-action="lang"][data-lang="tr"]');
  await page.waitForTimeout(300);
  const after = await layer(page);
  ok(JSON.stringify((await events(page, 'lang_switch'))[0]?.[2]) === '{"from":"en","to":"tr"}', `lang_switch ${JSON.stringify((await events(page, 'lang_switch'))[0]?.[2])}`);
  ok(!after.some((a) => a[0] === 'event' && a[1] === 'page_view') && after.filter((a) => a[0] === 'config').length === configsBefore, 'no page_view and no new config after the language switch');
  ok(new URL(page.url()).pathname === '/tr/' && (await page.title()).includes('Süreli Matematik Oyunu'), `address moved to ${new URL(page.url()).pathname}, title "${await page.title()}"`);
  ok(after.some((a) => a[0] === 'set' && a[1] === 'user_properties' && a[2].site_lang === 'tr'), 'user property site_lang = tr after the switch');

  // Core Web Vitals report when the page is hidden.
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);
  const vitals = (await events(page, 'web_vitals')).map((e) => e[2]);
  ok(vitals.length >= 3 && vitals.every((v) => v.name && Number.isFinite(v.value) && v.rating), `web_vitals ${vitals.map((v) => `${v.name}=${v.value} ${v.rating}`).join(', ')}`);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); });

  // Withdraw: footer "Çerez tercihleri" → banner with the current choice → Reddet.
  ok((await cookies(ctx)).length === 2, `with consent the stub set ${(await cookies(ctx)).join(', ')}`);
  await page.locator('.footer__consent').scrollIntoViewIfNeeded();
  await page.click('.footer__consent');
  const now = await page.locator('.consent__now').textContent();
  ok(now.includes('kabul edildi'), `banner reopened in Turkish with "${now}"`);
  await page.waitForTimeout(600); // fade-in
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'banner-reopened-tr.png') });
  await page.click('.consent [data-consent="denied"]');
  await page.waitForTimeout(200);
  const countBefore = (await layer(page)).length;
  ok((await cookies(ctx)).length === 0, '_ga cookies deleted after withdrawal');
  ok(await page.evaluate((id) => window[`ga-disable-${id}`] === true, GA_ID), 'GA switched off for the page (ga-disable-<ID>)');
  await page.click('.nav [data-action="toggle-sound"]');
  await page.waitForTimeout(200);
  const lastDl = await layer(page);
  ok(lastDl.length === countBefore + 0 && lastDl.at(-1)?.[1] === 'update' && lastDl.at(-1)?.[2]?.analytics_storage === 'denied', 'no event after withdrawal (last dataLayer entry is consent update → denied)');
  ok(errors.length === 0, `no console errors ${errors.join(' | ')}`);
  await ctx.close();
}

// ------------------------------------------------------------------
section('3. Inner pages: legal_view, support_contact, lang_switch');
{
  const { ctx, page, errors } = await visitor({ consent: 'granted' });
  await page.goto(`${BASE}/support.html`);
  await page.waitForTimeout(800);
  ok(JSON.stringify((await events(page, 'legal_view'))[0]?.[2]) === '{"page":"support"}', `legal_view ${JSON.stringify((await events(page, 'legal_view'))[0]?.[2])}`);
  await page.click('a[href="mailto:support@math-maker.com"]');
  ok(JSON.stringify((await events(page, 'support_contact'))[0]?.[2]) === '{"mailto":"support","page":"support"}', `support_contact ${JSON.stringify((await events(page, 'support_contact'))[0]?.[2])}`);
  await page.click('.lang__btn[data-lang="tr"]');
  ok(JSON.stringify((await events(page, 'lang_switch'))[0]?.[2]) === '{"from":"en","to":"tr"}', `lang_switch ${JSON.stringify((await events(page, 'lang_switch'))[0]?.[2])}`);
  ok(!(await page.locator('.consent').count()), 'returning visitor with consent: no banner');
  await page.goto(`${BASE}/tr/privacy-policy.html`);
  await page.waitForTimeout(800);
  ok(JSON.stringify((await events(page, 'legal_view'))[0]?.[2]) === '{"page":"privacy"}', `TR privacy legal_view ${JSON.stringify((await events(page, 'legal_view'))[0]?.[2])}`);
  ok(await page.locator('#website').count() === 1, 'privacy policy has the #website section');
  ok(errors.length === 0, `no console errors ${errors.join(' | ')}`);
  await ctx.close();
}
{
  const { ctx, page, google, errors } = await visitor({ viewport: { width: 390, height: 844 }, mobile: true });
  await page.goto(`${BASE}/tr/terms-of-service.html`);
  await page.waitForSelector('.consent');
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'banner-inner-mobile-tr.png') });
  ok((await page.locator('.consent__text').textContent()).startsWith('Ziyaretçilerin'), 'TR inner page, new visitor: Turkish banner');
  await page.click('.consent [data-consent="denied"]');
  await page.reload();
  await page.waitForTimeout(800);
  ok(!(await page.locator('.consent').count()) && google.length === 0 && (await cookies(ctx)).length === 0, 'after Reject: no banner on reload, no Google request, no cookie');
  await page.goto(`${BASE}/missing-page`);
  ok(await page.locator('.footer__consent').count() === 1, '404 page has "Cookie preferences"');
  ok(errors.length === 0, `no console errors ${errors.join(' | ')}`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
