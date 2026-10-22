// MathMaker : Mind Challenge — consent-gated Google Analytics 4, shared by every page
// (assets/home.js and assets/site.js load it on the side, so a blocked script never
// breaks the page).
//
// - Consent Mode v2, basic: until the visitor accepts the banner nothing is loaded, no
//   request goes to Google and no cookie is set. Accept → consent update
//   (analytics_storage granted; ad_* stay denied, the site shows no ads) and gtag.js with
//   the ID from analytics-config.js. Reject or withdraw ("Cookie preferences" in the
//   footer) → GA is switched off for the page and its cookies are deleted.
// - track(name, params) is the one door for every event: a silent no-op without consent.
//   Events from before the choice are dropped, never queued.
// - Static clicks are declarative: data-track="store_click" data-track-platform="ios" …
//   (one delegated listener turns data-track-* into snake_case event parameters).
// - section_view for [data-section] (half of the section or of the screen in view, once
//   per session) and Core Web Vitals (vendor/web-vitals.js) as web_vitals.
// @ts-check
import { GA_MEASUREMENT_ID } from './analytics-config.js';

const CONSENT_KEY = 'mathmakerConsent';
const SEEN_KEY = 'mathmakerSectionsSeen';
const DEMO_KEY = 'mathmakerDemoPlayed';
/** The landing page's own prefs (assets/home.js): sound on/off. */
const SITE_PREFS_KEY = 'mathmaker-site:v1';

/** @param {Storage} store @param {string} key */
function read(store, key) {
  try { return store.getItem(key); } catch { return null; }
}
/** @param {Storage} store @param {string} key @param {string} value */
function write(store, key, value) {
  try { store.setItem(key, value); } catch { /* storage disabled */ }
}

/** @returns {'granted' | 'denied' | null} */
function readConsent() {
  try {
    const v = JSON.parse(read(localStorage, CONSENT_KEY) || 'null')?.analytics;
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

let consent = readConsent();
/** gtag.js was injected into this page. */
let loaded = false;
/** Consent granted and gtag configured: events are sent. */
let ready = false;

/** @type {Record<string, string>} */
const userProps = {
  site_lang: document.documentElement.lang || 'en',
  sound_on: (() => { try { return JSON.parse(read(localStorage, SITE_PREFS_KEY) || '{}').sound === true; } catch { return false; } })() ? 'yes' : 'no',
  reduced_motion: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'yes' : 'no',
  demo_played: read(sessionStorage, DEMO_KEY) ? 'yes' : 'no',
};

// ------------------------------------------------------------
// gtag
// ------------------------------------------------------------
const w = /** @type {any} */ (window);

/** gtag.js reads the Arguments object, not an array. @type {(...args: unknown[]) => void} */
const gtag = function () {
  (w.dataLayer = w.dataLayer || []).push(arguments);
};

function startGa() {
  w[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  if (!loaded) {
    loaded = true;
    w.gtag = gtag;
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    gtag('set', 'ads_data_redaction', true);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('set', 'user_properties', { ...userProps });
    gtag('config', GA_MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.append(s);
  } else {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
  ready = true;
}

function stopGa() {
  ready = false;
  if (loaded) {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    // Google's opt-out switch: gtag.js already on the page sends nothing more.
    w[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  }
  clearGaCookies();
}

/** _ga, _ga_<stream>, _gid, _gat* — on the host and on the registrable domain. */
function clearGaCookies() {
  const host = location.hostname;
  const domains = ['', host, `.${host}`];
  const parts = host.split('.');
  if (parts.length > 2) domains.push(`.${parts.slice(-2).join('.')}`);
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (!/^_ga($|_)|^_gid$|^_gat/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
  }
}

/**
 * Sends a GA4 event — only with consent, otherwise a silent no-op.
 * @param {string} name
 * @param {Record<string, string | number>} [params]
 * @returns {boolean} whether the event was sent
 */
export function track(name, params = {}) {
  if (!ready) return false;
  gtag('event', name, params);
  return true;
}

/**
 * Updates GA4 user properties (site_lang, sound_on, reduced_motion, demo_played).
 * Remembered without consent too, so they go out with the first hit after it.
 * @param {Record<string, string>} props
 */
export function setUserProps(props) {
  Object.assign(userProps, props);
  if (ready) gtag('set', 'user_properties', { ...userProps });
}

/** The visitor started the browser demo: demo_played = yes for the rest of the session. */
export function markDemoPlayed() {
  write(sessionStorage, DEMO_KEY, '1');
  setUserProps({ demo_played: 'yes' });
}

// ------------------------------------------------------------
// Consent banner (bilingual, follows <html lang>)
// ------------------------------------------------------------
const TEXT = {
  en: {
    label: 'Cookie consent',
    text: 'May we use Google Analytics cookies to learn how visitors use this site? Nothing is loaded unless you accept.',
    policy: 'Privacy Policy',
    href: '/privacy-policy.html#website',
    accept: 'Accept',
    reject: 'Reject',
    granted: 'Current choice: accepted',
    denied: 'Current choice: rejected',
  },
  tr: {
    label: 'Çerez onayı',
    text: 'Ziyaretçilerin siteyi nasıl kullandığını görmek için Google Analytics çerezlerini kullanabilir miyiz? Kabul etmezsen hiçbir şey yüklenmez.',
    policy: 'Gizlilik Politikası',
    href: '/tr/privacy-policy.html#website',
    accept: 'Kabul et',
    reject: 'Reddet',
    granted: 'Şu anki seçimin: kabul edildi',
    denied: 'Şu anki seçimin: reddedildi',
  },
};

/** @type {HTMLElement | null} */
let banner = null;
/** @type {ResizeObserver | null} */
let bannerSize = null;

function renderBanner() {
  if (!banner) return;
  const tx = TEXT[document.documentElement.lang === 'tr' ? 'tr' : 'en'];
  banner.setAttribute('aria-label', tx.label);
  banner.lang = document.documentElement.lang === 'tr' ? 'tr' : 'en';
  const text = /** @type {HTMLElement} */ (banner.querySelector('.consent__text'));
  text.textContent = `${tx.text} `;
  const a = document.createElement('a');
  a.href = tx.href;
  a.textContent = tx.policy;
  text.append(a);
  const now = /** @type {HTMLElement} */ (banner.querySelector('.consent__now'));
  now.hidden = !consent;
  now.textContent = consent ? tx[consent] : '';
  /** @type {HTMLElement} */ (banner.querySelector('[data-consent="granted"]')).textContent = tx.accept;
  /** @type {HTMLElement} */ (banner.querySelector('[data-consent="denied"]')).textContent = tx.reject;
}

/** @param {boolean} focus */
function openBanner(focus) {
  if (!banner) {
    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.innerHTML =
      '<p class="consent__text"></p><p class="consent__now" hidden></p>' +
      '<div class="consent__actions">' +
      '<button type="button" class="btn btn--ghost btn--sm consent__btn" data-consent="granted"></button>' +
      '<button type="button" class="btn btn--ghost btn--sm consent__btn" data-consent="denied"></button>' +
      '</div>';
    document.body.append(banner);
    // The landing page's intro gate makes room for the banner (--consent-h).
    bannerSize = new ResizeObserver(() => {
      if (banner) document.documentElement.style.setProperty('--consent-h', `${banner.offsetHeight}px`);
    });
    bannerSize.observe(banner);
  }
  renderBanner();
  if (focus) /** @type {HTMLElement} */ (banner.querySelector('.consent__btn')).focus();
}

function closeBanner() {
  bannerSize?.disconnect();
  bannerSize = null;
  banner?.remove();
  banner = null;
  document.documentElement.style.removeProperty('--consent-h');
}

/** @param {'granted' | 'denied'} value */
function decide(value) {
  consent = value;
  write(localStorage, CONSENT_KEY, JSON.stringify({ analytics: value, at: new Date().toISOString() }));
  if (value === 'granted') startGa();
  else stopGa();
  closeBanner();
}

// ------------------------------------------------------------
// Listeners
// ------------------------------------------------------------
/** data-track-ms-to-enter → dataset.trackMsToEnter → ms_to_enter */
const paramName = (/** @type {string} */ key) =>
  key.slice(5).replace(/^./, (c) => c.toLowerCase()).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

document.addEventListener('click', (e) => {
  const target = e.target instanceof Element ? e.target : null;
  const choice = /** @type {HTMLElement | null} */ (target?.closest('[data-consent]') ?? null);
  if (choice && banner?.contains(choice)) {
    decide(choice.dataset.consent === 'granted' ? 'granted' : 'denied');
    return;
  }
  if (target?.closest('[data-consent-open]')) {
    e.preventDefault();
    openBanner(true);
    return;
  }
  const el = /** @type {HTMLElement | null} */ (target?.closest('[data-track]') ?? null);
  if (!el?.dataset.track) return;
  /** @type {Record<string, string>} */
  const params = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (k.startsWith('track') && k !== 'track' && v !== undefined) params[paramName(k)] = v;
  }
  track(el.dataset.track, params);
}, true);

// The landing page switches language in place: the banner and site_lang follow.
new MutationObserver(() => {
  setUserProps({ site_lang: document.documentElement.lang || 'en' });
  renderBanner();
}).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

function watchSections() {
  const sections = /** @type {HTMLElement[]} */ ([...document.querySelectorAll('[data-section]')]);
  if (!sections.length) return;
  /** @type {Set<string>} */
  let seen;
  try { seen = new Set(JSON.parse(read(sessionStorage, SEEN_KEY) || '[]')); } catch { seen = new Set(); }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const name = /** @type {HTMLElement} */ (en.target).dataset.section || '';
      if (!en.isIntersecting || seen.has(name)) continue;
      // Half of the section — or, for sections taller than the screen, half of the screen.
      const need = Math.min(en.boundingClientRect.height, en.rootBounds?.height ?? innerHeight) * 0.5;
      if (en.intersectionRect.height < need) continue;
      // Without consent nothing was sent: the section may still count later.
      if (!track('section_view', { section: name })) continue;
      seen.add(name);
      write(sessionStorage, SEEN_KEY, JSON.stringify([...seen]));
      io.unobserve(en.target);
    }
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
  sections.forEach((s) => io.observe(s));
}

function watchVitals() {
  import('./vendor/web-vitals.js').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    /** @param {{ name: string, value: number, rating: string }} m */
    const report = (m) => track('web_vitals', { name: m.name, value: Math.round(m.name === 'CLS' ? m.value * 1000 : m.value), rating: m.rating });
    onCLS(report);
    onINP(report);
    onLCP(report);
    onFCP(report);
    onTTFB(report);
  }).catch(() => { /* blocked or unsupported: no vitals */ });
}

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
if (consent === 'granted') startGa();
else if (consent === null) openBanner(false);
watchSections();
watchVitals();
