// MathMaker : Mind Challenge — landing page (V2): intro gate, WebGL particle field,
// Web Audio, scroll scenes, category wheel and the playable browser round.
// Generated from design-prototypes/website/index.html in the app repo
// by design-prototypes/website/tools/port-to-site.mjs — edit the prototype.
// @ts-check
// ============================================================
// 1. Config — mirrors src/config/sigmaEconomy.ts, categoryLevels.ts
//    and gameConfig.ts of the app (values as of card #65)
// ============================================================
const STORAGE_KEY = 'mathmaker-site:v1';
/** Shared with assets/site.js: the language the visitor last picked. */
const LANG_KEY = 'mathmakerLang';
/** The page decides the language: / is English, /tr/ is Turkish (never auto-redirected). */
const PAGE_LANG = document.documentElement.lang === 'tr' ? 'tr' : 'en';
/** assets/home.js → site root */
const SITE_ROOT = new URL('../', import.meta.url);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const QUESTION_TIME = 20;
const STRIKE_AFTER = 10;
const MAX_LIVES = 5;
const LEVEL_CAP = 500;
/** Browser demo uses per round: hint once, 50-50 twice, the rest three times. */
const PU_START = { hint: 1, fifty: 2, change: 3, time: 3 };

/** @typedef {{ id: string, base: number, eps: number, sigma: number, epsUnlock: number, color: string, x: number, y: number, icon: string }} Cat */
/** @type {Cat[]} */
const CATS = [
  { id: 'C1', base: 10, eps: 1, sigma: 0, epsUnlock: 0, color: '#2bd589', x: 50, y: 6, icon: 'pisagor' },
  { id: 'C2', base: 20, eps: 1.5, sigma: 500000, epsUnlock: 5000, color: '#9be04a', x: 84.4, y: 22.6, icon: 'harezmi' },
  { id: 'C3', base: 40, eps: 2, sigma: 1500000, epsUnlock: 7500, color: '#ffc107', x: 92.9, y: 59.8, icon: 'oklid' },
  { id: 'C4', base: 80, eps: 2.5, sigma: 3500000, epsUnlock: 10000, color: '#ff9a1f', x: 69.1, y: 89.6, icon: 'newton' },
  { id: 'C5', base: 160, eps: 3, sigma: 7500000, epsUnlock: 12500, color: '#ff6d00', x: 30.9, y: 89.6, icon: 'fibonacci' },
  { id: 'C6', base: 320, eps: 3.5, sigma: 15500000, epsUnlock: 15000, color: '#ff3d2e', x: 7.1, y: 59.8, icon: 'euler' },
  { id: 'C7', base: 640, eps: 4, sigma: 31500000, epsUnlock: 17500, color: '#ff1f6b', x: 15.6, y: 22.6, icon: 'gauss' },
];
/** @typedef {'bronze' | 'silver' | 'gold'} Tier */
/** @type {Record<Tier, { mult: number, eps: number }>} */
const TIERS = { bronze: { mult: 1, eps: 10 }, silver: { mult: 1.35, eps: 20 }, gold: { mult: 1.75, eps: 30 } };
const TIME_BRACKETS = [{ min: 16, mult: 2 }, { min: 12, mult: 1.8 }, { min: 8, mult: 1.4 }, { min: 4, mult: 1.2 }, { min: 0, mult: 1 }];

/** @type {Record<string, { vb?: string, fill?: string[], stroke?: string[], sw?: number, text?: string }>} */
const ICONS = {
  pisagor: { vb: '0 0 24 24', fill: ['M6 9.22V11H8V8H11V6H8V3H6V6H3V8H6V9.22ZM18.78 18H21V16H13V18H18.78ZM4.04 20.04L4.74 20.74L12.74 12.74L20.74 4.74L20.04 4.04L19.33 3.33L11.33 11.33L3.33 19.33L4.04 20.04Z'] },
  harezmi: { text: '×÷' },
  oklid: { vb: '0 0 24 24', sw: 1.3, stroke: ['M14.6 16.9L12 18.3L12 21.3L14.6 19.8V16.9ZM14.6 16.9L8.5 13.9L8.5 9.6L12.1 11.4L18.3 8.3V17.8L12.3 15V12.1M12.3 12.1L14.9 10.8L15.8 11.3V13.9L12.3 12.1Z', 'M12 21.3L3.2 16.8V4.2L6 2.8L12.1 5.8L18.1 2.8L20.8 4.1V16.5L18.3 17.8', 'M3.2 4.2L12.1 8.5M12.1 8.5L20.8 4.1M12.1 8.5L12.1 11.4M12 18.3L5.8 15.2L5.8 8.2L8.5 9.6'] },
  newton: { vb: '0 0 18 20', sw: 2, stroke: ['M1 9.3C1 12.4 1.4 14.6 3.2 17.3C4.6 19.1 6.4 19.5 8.3 18.3C8.7 18 9.3 18 9.7 18.3C11.6 19.5 13.4 19.1 14.8 17.3C16.6 14.6 17 12.4 17 9.3C17 6.7 15 4 12.6 4C11.3 4 10.1 4.7 9.3 5.4C9.1 5.6 8.9 5.6 8.7 5.4C7.9 4.7 6.7 4 5.4 4C3 4 1 6.7 1 9.3Z', 'M4 10C4 8.5 4.5 7.7 5.5 7M9 5C9 3.8 9.9 1 12 1'] },
  fibonacci: { vb: '0 0 16.5 24', sw: 1.5, stroke: ['M2.5 0.8C8.4 1.3 15.8 5.8 15.8 14.4C15.8 20.5 11.5 22.8 7.5 23.2', 'M5.6 14.4C7.4 15.1 8.2 17.6 6.7 18.8C5.8 19.6 4.5 19.5 3.8 18.8', 'M15.8 14.4H0.8M7.5 14.4V23.3M2.3 0.8H14.8C15.3 0.8 15.8 1.2 15.8 1.8V22.3C15.8 22.8 15.3 23.3 14.8 23.3H3.6C2 23.3 0.8 22 0.8 20.4V2.3C0.8 1.4 1.4 0.8 2.3 0.8Z'] },
  euler: { text: 'xⁿ' },
  gauss: { vb: '0 0 24 24', sw: 1.4, stroke: ['M12 2L21 7V17L12 22L3 17V7Z', 'M12 2L8 12L12 22L16 12Z', 'M3 7L8 12L3 17M21 7L16 12L21 17M8 12H16'] },
};
const COMPASS_PATH = 'M46 2h8v13h-8z M50 15a17 17 0 1 1 0 34a17 17 0 1 1 0-34z M50 25.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z M38 44L50 50L22 108L10 116L10 102z M61 57L69 51L90 102L90 116L78 108z';

// ============================================================
// 2. Text — every string of both languages lives here; the markup of
//    index.html (EN) and tr/index.html (TR) carries the same text for
//    crawlers and no-JS visitors
// ============================================================
/** @type {Record<string, string>} */
const EN = {
  'gate.sound': 'Enter with sound', 'gate.silent': 'Continue silently', 'gate.hint': 'Headphones recommended · This is a math experience',
  'nav.aria': 'Sections', 'nav.speed': 'Speed', 'nav.categories': 'Categories', 'nav.play': 'Play', 'nav.journey': 'Journey', 'nav.screens': 'Screens', 'nav.sound': 'Sound', 'nav.cta': 'Play now',
  'hero.tag1': 'Push', 'hero.tag2': 'your mind to the limit', 'hero.tag3': 'against the clock.',
  'hero.lead': "From Pythagoras' Apprentice to the Gauss Apocalypse: seven great minds. Every level is one question, every question 20 seconds. Be fast, keep the streak, multiply your Sigma.",
  'hero.play': 'Try it in your browser', 'hero.soon': 'Coming soon: iOS & Android', 'hero.hint': 'Click the particles', 'hero.scroll': 'Scroll',
  'stat.cats': 'Categories', 'stat.levels': 'Levels', 'stat.seconds': 'Seconds', 'stat.langs': 'Languages',
  'pitch.title': 'How the game works', 'pitch.l1': 'Four choices.', 'pitch.l2': 'One answer.', 'pitch.l3': 'Twenty seconds.',
  'pitch.sub': 'Every level is a single question. A right answer takes you to the next level; a wrong one costs a life. You have five lives, and one comes back every 30 minutes.',
  'timer.eyebrow': '01 · Speed', 'timer.t1': 'Every second', 'timer.t2': 'is Sigma.', 'timer.lead': 'The sooner you answer, the bigger the time multiplier. Scroll down — you run the clock.', 'timer.unit': 'seconds',
  'timer.b1': '16–20 s left', 'timer.b2': '12–16 s left', 'timer.b3': '8–12 s left', 'timer.b4': '4–8 s left', 'timer.b5': '0–4 s left',
  'cats.eyebrow': '02 · Seven great minds', 'cats.t1': 'One wheel.', 'cats.t2': 'Seven legends.',
  'cats.lead': 'Each category is harder — and more rewarding — than the last. As your lifetime Sigma grows, the next corner of the wheel lights up. Tap or hover a node: every mathematician has their own note.',
  'cats.start': 'START', 'cats.sample': 'Sample question · generated live', 'cats.base': 'Base Σ', 'cats.eps': 'ε / question', 'cats.unlock': 'Unlock',
  'cats.climb': 'Unlock thresholds · lifetime Sigma (or unlock early with Epsilon)',
  'tier.bronze': 'Bronze', 'tier.silver': 'Silver', 'tier.gold': 'Gold',
  'play.eyebrow': '03 · Try it now', 'play.t1': 'The clock', 'play.t2': 'is ticking.',
  'play.lead': "One round in your browser with the game's real rules: 20 seconds, 4 choices, 5 lives, power-ups and ×2 strike after 10 in a row. Keyboard: 1–4.",
  'play.category': 'Category', 'play.level': 'Level', 'play.lives': 'Lives', 'play.streak': 'Strike streak', 'play.pick': 'Pick a mind.', 'play.start': 'Start',
  'play.keys': 'All seven categories are open in the demo. Shortcuts: 1–4 to answer, Enter to start.', 'play.sumLevels': 'Levels', 'play.sumStreak': 'Best streak', 'play.again': 'Play again',
  'pu.hint': 'Hint', 'pu.fifty': '50-50', 'pu.change': 'Swap Question', 'pu.time': '+5 Seconds', 'pu.eyebrow': '05 · Power-ups', 'pu.t1': 'Stuck?', 'pu.t2': 'Strategy, not cheating.',
  'pu.lead': 'You start with 3 of each power-up. When they run out, buy more with Epsilon or watch a short ad.',
  'pu.hintP': 'Whispers the way to the answer.', 'pu.fiftyP': 'Two wrong choices vanish.', 'pu.changeP': 'A brand-new question from the same level.', 'pu.timeP': 'Adds five seconds to the clock.',
  'journey.eyebrow': '04 · The journey', 'journey.t1': '500 levels.', 'journey.t2': 'Three medals.',
  'journey.lead': 'Bronze, Silver and Gold tiers in every category. Finish a tier and the badge is yours; across seven categories you graduate from Primary School to Professor.',
  'journey.r1': 'Levels 1 – 100', 'journey.r2': 'Levels 101 – 300 · Σ ×1.35', 'journey.r3': 'Levels 301 – 500 · Σ ×1.75', 'journey.ladder': 'Graduation ladder', 'journey.chestOpen': 'Open the chest',
  'journey.chestT': 'A chest every 10 levels', 'journey.chestP': 'Chests open as you advance on the achievements map: Sigma, Epsilon and a power-up every 50 levels. Click the chest.',
  'journey.giftT': 'Daily gift', 'journey.giftP': 'Every 24 hours, pick one of nine boxes: Epsilon, a power-up or a life. Tap the boxes.',
  'journey.livesT': '5 lives, one back every 30 minutes', 'journey.livesP': "A wrong answer or a timeout costs a life. Don't want to wait? Refill with a rewarded ad or Epsilon.",
  'screens.eyebrow': '06 · The app', 'screens.t1': 'A brain workout', 'screens.t2': 'in your pocket.',
  'screens.home': 'Home screen: the category wheel', 'screens.game': 'Game screen', 'screens.fifty': '50-50 power-up', 'screens.ach': 'Achievements map', 'screens.store': 'Store',
  'screens.homeL': 'Category wheel', 'screens.gameL': '20 seconds', 'screens.fiftyL': '50-50', 'screens.achL': 'Achievements', 'screens.storeL': 'Store', 'screens.hint': 'Drag to spin',
  'trust.eyebrow': '07 · Details', 'trust.t1': 'Small details,', 'trust.t2': 'big difference.',
  'trust.a': 'No account', 'trust.aP': 'Your progress stays on your device. No sign-up, password or email.',
  'trust.b': '16 languages', 'trust.bP': "From Turkish to Japanese — even the mathematicians' names speak your language.",
  'trust.c': 'Global leaderboards', 'trust.cP': '1 global + 7 category leaderboards on Game Center and Google Play Games.',
  'trust.d': 'Feedback you can feel', 'trust.dP': 'A distinct haptic pattern for right answers, wrong answers and badges.',
  'trust.e': 'Pick up where you left off', 'trust.eP': 'Close the app and come back: the same question and the same streak are waiting.',
  'trust.f': 'Free to play', 'trust.fP': 'Remove ads or unlock categories early if you like — never required.',
  'cta.t1': 'Is your mind', 'cta.t2': 'ready?', 'cta.lead': 'MathMaker is coming soon to the App Store and Google Play. Tap a badge to hear on launch day.',
  'cta.soon': 'Coming soon', 'cta.ios': 'App Store — coming soon', 'cta.android': 'Google Play — coming soon',
  'footer.aria': 'Legal', 'footer.support': 'Support', 'footer.privacy': 'Privacy', 'footer.terms': 'Terms', 'footer.note': 'Exo typeface · SIL OFL',
};

/** @type {Record<'tr' | 'en', Record<string, string>>} */
const DYN = {
  tr: {
    open: 'Açık', orEps: 'ya da {n} ε', sec: '{n} sn', hint: 'Cevabın son rakamı: {d}', timeUp: 'Süre doldu!', lifeLost: '−1 ♥', strike: 'STRIKE ×2!',
    overTitle: 'Canların bitti!', best: 'Rekorun: {n} Σ', newBest: 'Yeni rekor: {n} Σ!', streak: '{n} / 10', streakHot: 'STRIKE ×2 · {n} seri',
    tierText: '{tier} {n}/{of}', title: 'MathMaker : Mind Challenge — Zamana karşı zihninin sınırlarını zorla', thousand: 'bin', million: 'milyon',
    gHint: 'İpucu', gFifty: '50-50', gChange: 'Değiştir', gTime: '+5 sn', gLife: '+1 Can',
  },
  en: {
    open: 'Open', orEps: 'or {n} ε', sec: '{n} s', hint: 'The answer ends in {d}', timeUp: "Time's up!", lifeLost: '−1 ♥', strike: 'STRIKE ×2!',
    overTitle: 'Out of lives!', best: 'Your best: {n} Σ', newBest: 'New record: {n} Σ!', streak: '{n} / 10', streakHot: 'STRIKE ×2 · {n} streak',
    tierText: '{tier} {n}/{of}', title: 'MathMaker : Mind Challenge — Push your mind to the limit against the clock', thousand: 'K', million: 'M',
    gHint: 'Hint', gFifty: '50-50', gChange: 'Swap', gTime: '+5 s', gLife: '+1 Life',
  },
};

/** @type {Record<'tr' | 'en', { name: string, topic: string, badges: string[] }[]>} */
const CAT_TEXT = {
  tr: [
    { name: "Pisagor'un Çırağı", topic: 'Toplama ve çıkarma', badges: ['İlkokul 1', 'İlkokul 3', 'İlkokul 5'] },
    { name: "Harezmi'nin Katları", topic: 'Çarpma ve tam bölme', badges: ['Ortaokul 1', 'Ortaokul 2', 'Ortaokul 3'] },
    { name: "Öklid'in Labirenti", topic: 'İşlem önceliği — parantez yok, tuzak çok', badges: ['Lise 1', 'Lise 2', 'Lise 3'] },
    { name: "Newton'un Hücresi", topic: 'İç içe parantezler, katman katman', badges: ['Üniversite 1', 'Üniversite 2', 'Üniversite 3'] },
    { name: "Fibonacci'nin Şifresi", topic: 'Örüntüyü bul, diziyi tamamla', badges: ['Yüksek Lisans 1', 'Yüksek Lisans 2', 'Yüksek Lisans 3'] },
    { name: "Euler'in Gücü", topic: 'Üsler, kökler ve faktöriyeller', badges: ['Doktora 1', 'Doktora 2', 'Doktora 3'] },
    { name: 'Gauss Kıyameti', topic: 'Hibrit kaos, içine gömülü örüntüler', badges: ['Profesör 1', 'Profesör 2', 'Profesör 3'] },
  ],
  en: [
    { name: "Pythagoras' Apprentice", topic: 'Addition and subtraction', badges: ['Primary School 1', 'Primary School 3', 'Primary School 5'] },
    { name: "Al-Khwarizmi's Multiples", topic: 'Multiplication and exact division', badges: ['Middle School 1', 'Middle School 2', 'Middle School 3'] },
    { name: "Euclid's Labyrinth", topic: 'Order of operations — no brackets, plenty of traps', badges: ['High School 1', 'High School 2', 'High School 3'] },
    { name: "Newton's Cell", topic: 'Nested brackets, layer by layer', badges: ['University 1', 'University 2', 'University 3'] },
    { name: "Fibonacci's Cipher", topic: 'Find the pattern, complete the sequence', badges: ["Master's 1", "Master's 2", "Master's 3"] },
    { name: "Euler's Power", topic: 'Powers, roots and factorials', badges: ['Doctorate 1', 'Doctorate 2', 'Doctorate 3'] },
    { name: 'Gauss Apocalypse', topic: 'Hybrid chaos with hidden patterns', badges: ['Professor 1', 'Professor 2', 'Professor 3'] },
  ],
};
const SCHOOLS = {
  tr: ['İlkokul', 'Ortaokul', 'Lise', 'Üniversite', 'Yüksek Lisans', 'Doktora', 'Profesör'],
  en: ['Primary School', 'Middle School', 'High School', 'University', "Master's", 'Doctorate', 'Professor'],
};
const LEGAL_LINKS = { support: 'support.html', privacy: 'privacy-policy.html', terms: 'terms-of-service.html' };

// ============================================================
// 3. State and persistence
// ============================================================
/** @typedef {{ lang: 'tr' | 'en', sound: boolean, best: number }} Prefs */
/** @returns {Prefs} */
function loadPrefs() {
  const fallback = /** @type {Prefs} */ ({ lang: PAGE_LANG, sound: false, best: 0 });
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw && (raw.lang === 'tr' || raw.lang === 'en')) {
      return { lang: PAGE_LANG, sound: raw.sound === true, best: Number.isFinite(raw.best) ? raw.best : 0 };
    }
  } catch { /* storage blocked or corrupt: use defaults */ }
  return fallback;
}
const prefs = loadPrefs();
function savePrefs() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

/** Turkish strings (kept in sync with the markup of tr/index.html). */
/** @type {Record<string, string>} */
const TR_TEXT = {
  "gate.sound": "Sesle gir",
  "gate.silent": "Sessiz devam et",
  "gate.hint": "Kulaklık önerilir · Bu bir matematik deneyimi",
  "nav.speed": "Hız",
  "nav.categories": "Kategoriler",
  "nav.play": "Oyna",
  "nav.journey": "Yolculuk",
  "nav.screens": "Ekranlar",
  "nav.cta": "Hemen oyna",
  "hero.tag1": "Zamana karşı",
  "hero.tag2": "zihninin sınırlarını",
  "hero.tag3": "zorla.",
  "hero.lead": "Pisagor'un Çırağı'ndan Gauss Kıyameti'ne yedi büyük zihin. Her seviye tek soru, her soru 20 saniye. Hızlı ol, seriyi koru, Sigma'yı katla.",
  "hero.play": "Tarayıcıda dene",
  "hero.soon": "Çok yakında: iOS & Android",
  "stat.cats": "Kategori",
  "stat.levels": "Seviye",
  "stat.seconds": "Saniye",
  "stat.langs": "Dil",
  "hero.hint": "Parçacıklara tıkla",
  "hero.scroll": "Kaydır",
  "pitch.title": "Oyun nasıl işler",
  "pitch.l1": "Dört şık.",
  "pitch.l2": "Tek doğru.",
  "pitch.l3": "Yirmi saniye.",
  "pitch.sub": "Her seviye tek bir soru. Doğru cevap seni bir sonraki seviyeye taşır; yanlış cevap bir canına mal olur. Beş canın var, her 30 dakikada biri geri gelir.",
  "timer.eyebrow": "01 · Hız",
  "timer.t1": "Her saniye",
  "timer.t2": "Sigma'dır.",
  "timer.lead": "Ne kadar erken cevaplarsan zaman çarpanı o kadar büyür. Aşağı kaydır, saati sen işlet.",
  "timer.unit": "saniye",
  "timer.b1": "16–20 sn kala",
  "timer.b2": "12–16 sn kala",
  "timer.b3": "8–12 sn kala",
  "timer.b4": "4–8 sn kala",
  "timer.b5": "0–4 sn kala",
  "cats.eyebrow": "02 · Yedi büyük zihin",
  "cats.t1": "Bir çark.",
  "cats.t2": "Yedi efsane.",
  "cats.lead": "Her kategori bir öncekinden zor ve daha ödüllü. Toplam Sigma'n büyüdükçe çarkın bir sonraki köşesi aydınlanır. Bir düğüme dokun ya da üzerinde gezin: her matematikçinin kendi notası var.",
  "cats.start": "BAŞLA",
  "cats.sample": "Örnek soru · canlı üretildi",
  "cats.base": "Taban Σ",
  "cats.eps": "ε / soru",
  "cats.unlock": "Açılış",
  "cats.climb": "Açılış eşikleri · toplam Sigma (ya da Epsilon ile erken aç)",
  "play.eyebrow": "03 · Şimdi dene",
  "play.t1": "Saat",
  "play.t2": "işliyor.",
  "play.lead": "Oyunun gerçek kurallarıyla tarayıcıda bir tur: 20 saniye, 4 şık, 5 can, jokerler ve 10 doğrudan sonra ×2 strike. Klavye: 1–4.",
  "play.category": "Kategori",
  "play.level": "Seviye",
  "play.lives": "Canlar",
  "play.streak": "Strike serisi",
  "play.pick": "Bir zihin seç.",
  "play.start": "Başla",
  "play.keys": "Demo'da yedi kategorinin hepsi açık. Kısayollar: 1–4 cevap, Enter başlat.",
  "play.sumLevels": "Seviye",
  "play.sumStreak": "En iyi seri",
  "play.again": "Tekrar oyna",
  "journey.eyebrow": "04 · Yolculuk",
  "journey.t1": "500 seviye.",
  "journey.t2": "Üç madalya.",
  "journey.lead": "Her kategoride Bronz, Gümüş ve Altın aşamalar. Aşamayı bitirdiğinde rozet senin; yedi kategori boyunca İlkokul'dan Profesör'e mezun olursun.",
  "tier.bronze": "Bronz",
  "journey.r1": "Seviye 1 – 100",
  "tier.silver": "Gümüş",
  "journey.r2": "Seviye 101 – 300 · Σ ×1,35",
  "tier.gold": "Altın",
  "journey.r3": "Seviye 301 – 500 · Σ ×1,75",
  "journey.chestT": "Her 10 seviyede bir sandık",
  "journey.chestP": "Kazanımlar haritasında ilerledikçe sandıklar açılır: Sigma, Epsilon ve her 50 seviyede bir joker. Sandığa tıkla.",
  "journey.giftT": "Günlük hediye",
  "journey.giftP": "Her 24 saatte bir 3×3 kutudan birini seç: Epsilon, joker ya da can. Kutulara dokun.",
  "journey.livesT": "5 can, 30 dakikada bir yenilenir",
  "journey.livesP": "Yanlış cevap ya da süre dolumu bir can götürür. Beklemek istemezsen ödüllü reklam ya da Epsilon ile doldur.",
  "pu.eyebrow": "05 · Jokerler",
  "pu.t1": "Takıldın mı?",
  "pu.t2": "Hile değil, strateji.",
  "pu.lead": "Her joker türünden 3'er hakla başlarsın. Bitince Epsilon ile al ya da kısa bir reklam izle.",
  "pu.hint": "İpucu",
  "pu.hintP": "Cevaba giden yolu fısıldar.",
  "pu.fifty": "50-50",
  "pu.fiftyP": "İki yanlış şık buharlaşır.",
  "pu.change": "Soruyu Değiştir",
  "pu.changeP": "Aynı seviyeden yepyeni bir soru.",
  "pu.time": "+5 Saniye",
  "pu.timeP": "Saate beş saniye ekler.",
  "screens.eyebrow": "06 · Uygulama",
  "screens.t1": "Cebindeki",
  "screens.t2": "beyin jimnastiği.",
  "screens.homeL": "Kategori çarkı",
  "screens.gameL": "20 saniye",
  "screens.fiftyL": "50-50 jokeri",
  "screens.achL": "Kazanımlar",
  "screens.storeL": "Mağaza",
  "screens.hint": "Sürükle ve döndür",
  "trust.eyebrow": "07 · Detaylar",
  "trust.t1": "Küçük ayrıntılar,",
  "trust.t2": "büyük fark.",
  "trust.a": "Hesap yok",
  "trust.aP": "İlerlemen yalnızca cihazında saklanır. Kayıt, şifre, e-posta istemeyiz.",
  "trust.b": "16 dil",
  "trust.bP": "Türkçe'den Japonca'ya; matematikçilerin adları bile senin dilinde.",
  "trust.c": "Küresel sıralama",
  "trust.cP": "Game Center ve Google Play Games'te 1 genel + 7 kategori tablosu.",
  "trust.d": "Hissedilen geri bildirim",
  "trust.dP": "Doğruda, yanlışta ve rozette ayrı titreşim deseni.",
  "trust.e": "Kaldığın yerden",
  "trust.eP": "Uygulamayı kapat, geri dön: aynı soru, aynı seri seni bekler.",
  "trust.f": "Ücretsiz oyna",
  "trust.fP": "İstersen reklamları kaldır, kategorileri erken aç; zorunlu değil.",
  "cta.t1": "Zihnin",
  "cta.t2": "hazır mı?",
  "cta.lead": "MathMaker çok yakında App Store ve Google Play'de. Çıktığı gün haber almak için bir rozete dokun.",
  "cta.soon": "Çok yakında",
  "footer.support": "Destek",
  "footer.privacy": "Gizlilik",
  "footer.terms": "Koşullar",
  "footer.note": "Exo yazı tipi · SIL OFL"
};
/** @type {Record<string, string>} */
const TR_ARIA = {
  "nav.aria": "Bölümler",
  "nav.sound": "Ses",
  "pu.hint": "İpucu",
  "pu.fifty": "50-50",
  "pu.change": "Soruyu Değiştir",
  "pu.time": "+5 Saniye",
  "play.category": "Kategori",
  "journey.ladder": "Mezuniyet merdiveni",
  "journey.chestOpen": "Sandığı aç",
  "cta.ios": "App Store — çok yakında",
  "cta.android": "Google Play — çok yakında",
  "footer.aria": "Yasal"
};
/** @type {Record<string, string>} */
const TR_ALT = {
  "screens.home": "Ana sayfa: kategori çarkı",
  "screens.game": "Oyun ekranı",
  "screens.fifty": "50-50 jokeri",
  "screens.ach": "Kazanımlar haritası",
  "screens.store": "Mağaza"
};

// ============================================================
// 4. DOM + math helpers
// ============================================================
/** @param {string} sel @param {ParentNode} [root] @returns {HTMLElement} */
const $ = (sel, root = document) => /** @type {HTMLElement} */ (root.querySelector(sel));
/** @param {string} sel @param {ParentNode} [root] @returns {HTMLElement[]} */
const $$ = (sel, root = document) => /** @type {HTMLElement[]} */ ([...root.querySelectorAll(sel)]);
/** @param {HTMLElement} el @param {string} name @param {string | number} value */
const setVar = (el, name, value) => el.style.setProperty(name, String(value));
/** @param {number} v @param {number} a @param {number} b */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** @param {number} a @param {number} b */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
/** @template T @param {T[]} arr @returns {T[]} */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
/** @param {string} key @param {Record<string, string | number>} [vars] */
function d(key, vars) {
  let s = DYN[prefs.lang][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
/** @param {string} key */
const t = (key) => (prefs.lang === 'en' ? EN[key] : TR_TEXT[key]) ?? TR_TEXT[key] ?? key;
/** @param {number} n @param {number} [digits] */
const fmt = (n, digits = 0) => new Intl.NumberFormat(prefs.lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
/** @param {number} n */
function fmtShort(n) {
  if (n >= 1e6) return `${fmt(n / 1e6, n % 1e6 === 0 ? 0 : 1)}${prefs.lang === 'tr' ? ' ' : ''}${d('million')}`;
  if (n >= 1e3) return `${fmt(n / 1e3)}${prefs.lang === 'tr' ? ' ' : ''}${d('thousand')}`;
  return fmt(n);
}
/** @param {number} m @param {number} [digits] */
const fmtMult = (m, digits = 1) => `×${fmt(m, digits)}`;
/** @param {number} remaining */
const timeMult = (remaining) => (TIME_BRACKETS.find((b) => remaining >= b.min) ?? TIME_BRACKETS[4]).mult;
/** @param {number} level @returns {Tier} */
const tierOf = (level) => (level <= 100 ? 'bronze' : level <= 300 ? 'silver' : 'gold');
/** @param {number} cat @param {number} level @param {number} remaining @param {number} streakBefore */
const sigmaFor = (cat, level, remaining, streakBefore) =>
  Math.round(CATS[cat].base * TIERS[tierOf(level)].mult * timeMult(remaining) * (streakBefore >= STRIKE_AFTER ? 2 : 1) * 100);
/** @param {number} cat @param {Tier} tier */
const epsFor = (cat, tier) => Math.round(TIERS[tier].eps * CATS[cat].eps);
/** @param {number} ms @param {() => void} fn */
const after = (ms, fn) => window.setTimeout(fn, ms);

// ============================================================
// 5. Sound — everything is synthesized with Web Audio (no files)
// ============================================================
const sound = (() => {
  /** @type {AudioContext | null} */ let ctx = null;
  /** @type {GainNode} */ let master;
  /** @type {GainNode} */ let wet;
  /** @type {BiquadFilterNode | null} */ let padFilter = null;
  /** @type {{ stop: () => void } | null} */ let ambient = null;
  let enabled = false;
  let energy = 0;
  let lastHover = 0;
  const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
  const WHEEL = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!AC) return null;
    ctx = /** @type {AudioContext} */ (new AC());
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp);
    comp.connect(ctx.destination);
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.6);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    conv.buffer = buf;
    wet = ctx.createGain();
    wet.gain.value = 0.4;
    wet.connect(conv);
    conv.connect(master);
    return ctx;
  }

  /**
   * @param {number} freq
   * @param {{ type?: OscillatorType, dur?: number, gain?: number, attack?: number, when?: number, send?: number, glide?: number }} [o]
   */
  function tone(freq, o = {}) {
    if (!enabled || !ctx) return;
    const { type = 'sine', dur = 0.2, gain = 0.1, attack = 0.006, when = 0, send = 0.2, glide = 0 } = o;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    if (send) {
      const s = ctx.createGain();
      s.gain.value = send;
      g.connect(s);
      s.connect(wet);
    }
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** @param {number} dur @param {number} f0 @param {number} f1 @param {number} gain @param {number} [when] */
  function noise(dur, f0, f1, gain, when = 0) {
    if (!enabled || !ctx) return;
    const t0 = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(f0, t0);
    bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    const s = ctx.createGain();
    s.gain.value = 0.3;
    g.connect(s);
    s.connect(wet);
    src.start(t0);
  }

  function startAmbient() {
    if (ambient || !ctx) return;
    const c = ctx;
    padFilter = c.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 380;
    padFilter.Q.value = 5;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.05, c.currentTime, 2.5);
    padFilter.connect(g);
    g.connect(master);
    const s = c.createGain();
    s.gain.value = 0.6;
    g.connect(s);
    s.connect(wet);
    const oscs = [55, 82.41, 110, 164.81, 220].map((f, i) => {
      const osc = c.createOscillator();
      osc.type = i % 2 ? 'sawtooth' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (i - 2) * 7;
      osc.connect(/** @type {BiquadFilterNode} */ (padFilter));
      osc.start();
      return osc;
    });
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.06;
    const lg = c.createGain();
    lg.gain.value = 160;
    lfo.connect(lg);
    lg.connect(padFilter.frequency);
    lfo.start();
    const arp = window.setInterval(() => {
      if (Math.random() < 0.3 + energy * 0.5) {
        const n = PENTA[Math.floor(Math.random() * PENTA.length)] * (Math.random() < 0.35 ? 2 : 1);
        tone(n, { type: 'triangle', dur: 1.8, gain: 0.018 + energy * 0.02, send: 0.8 });
      }
      energy *= 0.82;
    }, 400);
    ambient = {
      stop() {
        g.gain.setTargetAtTime(0.0001, c.currentTime, 0.3);
        window.clearInterval(arp);
        after(1600, () => { oscs.forEach((o) => o.stop()); lfo.stop(); });
      },
    };
  }

  return {
    get on() { return enabled; },
    /** @param {boolean} on */
    setEnabled(on) {
      enabled = on;
      if (on) {
        const c = ensure();
        if (!c) { enabled = false; return; }
        void c.resume();
        master.gain.cancelScheduledValues(c.currentTime);
        master.gain.setTargetAtTime(0.9, c.currentTime, 0.25);
        startAmbient();
      } else if (ctx) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
        ambient?.stop();
        ambient = null;
      }
    },
    /** @param {number} v 0..1 scroll energy */
    energize(v) {
      energy = Math.min(1, energy + v);
      if (ctx && padFilter) padFilter.frequency.setTargetAtTime(380 + energy * 1900, ctx.currentTime, 0.25);
    },
    hover() {
      const now = performance.now();
      if (now - lastHover < 70) return;
      lastHover = now;
      tone(1500 + Math.random() * 400, { dur: 0.06, gain: 0.014, send: 0.15 });
    },
    click() { tone(660, { type: 'triangle', dur: 0.1, gain: 0.05 }); tone(990, { type: 'sine', dur: 0.12, gain: 0.03, when: 0.03 }); },
    whoosh() { noise(0.9, 220, 2600, 0.035); },
    shimmer() { for (let i = 0; i < 5; i++) tone(PENTA[rnd(3, 8)] * 2, { dur: 1.4, gain: 0.012, send: 0.95, when: i * 0.06 }); },
    /** @param {boolean} urgent */
    tick(urgent) { tone(urgent ? 2600 : 1900, { type: 'square', dur: urgent ? 0.05 : 0.03, gain: urgent ? 0.035 : 0.016, send: 0 }); },
    /** @param {number} streak */
    correct(streak) {
      const base = 523.25 * Math.pow(2, Math.min(streak, 12) / 12);
      [1, 1.25, 1.5, 2].forEach((r, i) => tone(base * r, { type: 'triangle', dur: 0.5, gain: 0.07, when: i * 0.06, send: 0.4 }));
    },
    wrong() {
      tone(196, { type: 'sawtooth', dur: 0.5, gain: 0.06, glide: 92 });
      tone(207, { type: 'square', dur: 0.4, gain: 0.025, glide: 98 });
    },
    strike() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(f, { type: 'triangle', dur: 1.4, gain: 0.045, send: 0.7 }));
      noise(1.1, 400, 6000, 0.05);
    },
    /** @param {number} i @param {number} [level] */
    note(i, level = 1) {
      tone(WHEEL[i], { type: 'triangle', dur: 1.3, gain: 0.08 * level, send: 0.6 });
      tone(WHEEL[i] * 2, { dur: 0.7, gain: 0.025 * level, send: 0.6 });
    },
    burst() { noise(0.7, 3500, 180, 0.09); tone(96, { dur: 0.7, gain: 0.2, glide: 38 }); },
    coin() { tone(1318.5, { type: 'square', dur: 0.08, gain: 0.025, send: 0.2 }); tone(1760, { type: 'square', dur: 0.16, gain: 0.025, when: 0.07, send: 0.3 }); },
    enter() {
      tone(110, { type: 'sawtooth', dur: 2.4, gain: 0.04, glide: 220, send: 0.5 });
      [440, 554.37, 659.25, 880].forEach((f, i) => tone(f, { type: 'triangle', dur: 2, gain: 0.03, when: 0.5 + i * 0.09, send: 0.9 }));
      noise(1.4, 200, 5000, 0.05);
    },
  };
})();

// ============================================================
// 6. Particle field — raw WebGL, one draw call. Every section
//    names a shape (data-shape); particles morph between them.
//    Positions are CSS px; target mode: 0 = drifting dust,
//    1 = pinned to the page (scrolls), 2 = pinned to the screen.
// ============================================================
/**
 * @typedef {{ share: number, mode?: number, tint?: string | null, draw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }} ShapeDef
 */
/** Largest font size that fits `text` into w×h (fill = share of h, wide = share of w). */
function fitWord(text, w, h, ctx, fill, wide) {
  const family = /[A-Za-z0-9?]/.test(text) ? "'Exo', 'Segoe UI', sans-serif" : "'Segoe UI', 'Cambria Math', serif";
  ctx.font = `800 100px ${family}`;
  const m = ctx.measureText(text).width || 1;
  return { family, size: Math.min(h * fill, (100 * w * wide) / m) };
}
/** @param {string} text @param {number} w @param {number} h @param {CanvasRenderingContext2D} ctx @param {'center' | 'right'} [align] @param {number} [fill] */
function drawWord(text, w, h, ctx, align = 'center', fill = 0.92, wide = 0.96) {
  const { family, size } = fitWord(text, w, h, ctx, fill, wide);
  ctx.font = `800 ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, align === 'center' ? w / 2 : w * 0.99, h / 2 + size * 0.04);
}

const TITLE_FIT = /** @type {const} */ ([0.92, 0.84]);
/** @type {Record<string, ShapeDef>} */
const SHAPES = {
  cloud: { share: 0 },
  title: { share: 0.74, draw: (c, w, h) => drawWord('MATHMAKER', w, h, c, 'center', ...TITLE_FIT) },
  question: { share: 0.55, draw: (c, w, h) => drawWord('?', w, h, c, 'center', 0.95) },
  ring: {
    share: 0.5,
    tint: '#2bd589',
    draw: (c, w) => {
      const r = w * 0.43;
      c.lineWidth = w * 0.03;
      c.strokeStyle = '#fff';
      c.beginPath();
      c.arc(w / 2, w / 2, r, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const rr = i % 5 === 0 ? w * 0.012 : w * 0.006;
        c.beginPath();
        c.arc(w / 2 + Math.cos(a) * w * 0.485, w / 2 + Math.sin(a) * w * 0.485, rr, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  heptagon: {
    share: 0.42,
    tint: '#2bd589',
    draw: (c, w, h) => {
      const pts = CATS.map((cat) => [(cat.x / 100) * w, (cat.y / 100) * h]);
      c.strokeStyle = '#fff';
      c.lineWidth = w * 0.01;
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.stroke();
      c.lineWidth = w * 0.0018;
      c.beginPath();
      for (let i = 0; i < 7; i++) {
        const [x, y] = pts[(i * 3) % 7];
        if (i) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.closePath();
      c.stroke();
    },
  },
  n500: { share: 0.48, draw: (c, w, h) => drawWord('500', w, h, c, 'right', 1.15, 0.3) },
  n16: { share: 0.4, draw: (c, w, h) => drawWord('16', w, h, c, 'right', 0.95) },
  compass: {
    share: 0.62,
    draw: (c, w, h) => {
      const s = Math.min(w / 100, h / 120) * 0.95;
      c.translate((w - 100 * s) / 2, (h - 120 * s) / 2);
      c.scale(s, s);
      c.fill(new Path2D(COMPASS_PATH));
    },
  },
};
/** Where each shape is drawn when its anchor is not the section itself. */
const SHAPE_ANCHORS = { title: '.hero__stage', n500: '.journey .section-head', n16: '.trust .section-head' };

/** @param {HTMLCanvasElement} canvas */
function createFx(canvas) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const VS = `
    attribute vec4 aFrom; attribute vec4 aTo; attribute vec4 aRand;
    uniform float uT, uTime, uScroll, uPx, uDpr, uMotion, uTintAmt;
    uniform vec2 uRes, uMouse; uniform vec3 uBurst, uTint;
    varying float vAlpha; varying vec3 vColor;
    vec2 toScreen(vec4 p) {
      if (p.w < 0.5) {
        float f = 0.12 + 0.45 * (p.z * 0.5 + 0.5);
        float h = uRes.y + 200.0;
        return vec2(p.x, mod(p.y - uScroll * f, h) - 100.0);
      }
      if (p.w < 1.5) return vec2(p.x, p.y - uScroll);
      return p.xy;
    }
    void main() {
      float k = clamp((uT - aRand.x * 0.35) / 0.65, 0.0, 1.0);
      float e = k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) / 2.0;
      vec2 pos = mix(aFrom.xy, toScreen(aTo), e);
      float arc = sin(k * 3.14159) * uMotion;
      float ang = aRand.y * 6.2831;
      pos += vec2(cos(ang), sin(ang)) * arc * (80.0 + 220.0 * aRand.z) * uPx;
      float shapeTo = step(0.5, aTo.w);
      float shapeMix = mix(aFrom.w, shapeTo, e);
      float wob = mix(16.0, 1.4, shapeMix) * uPx * uMotion;
      pos += vec2(sin(uTime * (0.25 + aRand.z * 0.6) + aRand.y * 40.0), cos(uTime * (0.2 + aRand.x * 0.5) + aRand.z * 30.0)) * wob;
      float z = mix(aFrom.z, aTo.z, e);
      pos -= (uMouse / uRes - 0.5) * z * 36.0 * uPx * uMotion;
      vec2 dm = pos - uMouse;
      float L = length(dm);
      float R = 150.0 * uPx;
      if (L < R) pos += normalize(dm + 0.0001) * (R - L) * 0.75;
      vec2 bd = pos - uBurst.xy;
      pos += normalize(bd + 0.001) * uBurst.z * (0.35 + aRand.w) * 520.0 * uPx * exp(-length(bd) / (700.0 * uPx));
      vec2 clip = pos / uRes * 2.0 - 1.0;
      gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
      float size = mix(1.2 + aRand.w * 2.4, 2.4 + aRand.w * 3.2, shapeMix) * (1.0 + z * 0.4);
      gl_PointSize = max(1.0, size * uPx * uDpr * 1.5);
      float tw = 0.7 + 0.3 * sin(uTime * (1.5 + aRand.x * 2.0) + aRand.y * 60.0);
      vAlpha = mix(0.2 + 0.3 * aRand.z, 0.85 + 0.15 * aRand.x, shapeMix) * tw;
      vec3 hot = mix(vec3(1.0, 0.43, 0.0), vec3(1.0, 0.8, 0.45), aRand.z);
      hot = mix(hot, vec3(1.0), step(0.92, aRand.x));
      hot = mix(hot, uTint, uTintAmt * (0.55 + 0.45 * aRand.y));
      vec3 dust = mix(vec3(0.42, 0.56, 0.8), vec3(1.0, 0.55, 0.2), step(0.85, aRand.w));
      vColor = mix(dust, hot, shapeMix);
    }`;
  const FS = `
    precision mediump float;
    varying float vAlpha; varying vec3 vColor;
    void main() {
      float dd = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, dd);
      gl_FragColor = vec4(vColor, pow(a, 1.6) * vAlpha);
    }`;
  /** @param {number} type @param {string} src */
  const compile = (type, src) => {
    const s = /** @type {WebGLShader} */ (gl.createShader(type));
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const prog = /** @type {WebGLProgram} */ (gl.createProgram());
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  gl.useProgram(prog);

  const N = Math.round(clamp((innerWidth * innerHeight) / (1920 * 1080), 0.6, 2.4) * 24000);
  const from = new Float32Array(N * 4);
  const to = new Float32Array(N * 4);
  const rand = new Float32Array(N * 4);
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
  const order = Array.from({ length: N }, (_, i) => i);

  /** @param {string} name @param {Float32Array} data @param {number} usage */
  const attrib = (name, data, usage) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 0, 0);
    return buf;
  };
  const fromBuf = attrib('aFrom', from, gl.DYNAMIC_DRAW);
  const toBuf = attrib('aTo', to, gl.DYNAMIC_DRAW);
  attrib('aRand', rand, gl.STATIC_DRAW);
  /** @type {Record<string, WebGLUniformLocation | null>} */
  const u = {};
  for (const n of ['uT', 'uTime', 'uScroll', 'uPx', 'uDpr', 'uMotion', 'uTintAmt', 'uRes', 'uMouse', 'uBurst', 'uTint']) u[n] = gl.getUniformLocation(prog, n);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  const off = document.createElement('canvas');
  const octx = /** @type {CanvasRenderingContext2D} */ (off.getContext('2d', { willReadFrequently: true }));
  let W = innerWidth;
  let H = innerHeight;
  let dpr = 1;
  let current = 'cloud';
  let morphStart = -1e9;
  let morphDur = 1800;
  let burst = 0;
  let burstX = 0;
  let burstY = 0;
  const tint = [1, 0.43, 0];
  const tintTarget = [1, 0.43, 0];
  let tintAmt = 0;
  let tintAmtTarget = 0;

  function resize() {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, W > 2500 ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /** Current on-screen position of particle i, mirroring the shader without noise. */
  function currentPos(i, T) {
    const k = clamp((T - rand[i * 4] * 0.35) / 0.65);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const tx = to[i * 4];
    let ty = to[i * 4 + 1];
    const tz = to[i * 4 + 2];
    const tw = to[i * 4 + 3];
    if (tw < 0.5) {
      const f = 0.12 + 0.45 * (tz * 0.5 + 0.5);
      const h = H + 200;
      ty = ((((ty - scrollY * f) % h) + h) % h) - 100;
    } else if (tw < 1.5) ty -= scrollY;
    return [
      from[i * 4] + (tx - from[i * 4]) * e,
      from[i * 4 + 1] + (ty - from[i * 4 + 1]) * e,
      from[i * 4 + 2] + (tz - from[i * 4 + 2]) * e,
      from[i * 4 + 3] + ((tw > 0.5 ? 1 : 0) - from[i * 4 + 3]) * e,
    ];
  }

  /** @param {string} name */
  function samplePoints(name) {
    const def = SHAPES[name];
    if (!def || !def.draw) return { pts: /** @type {number[]} */ ([]), mode: 0 };
    const section = /** @type {HTMLElement | null} */ (document.querySelector(`[data-shape="${name}"]`));
    const anchorSel = SHAPE_ANCHORS[/** @type {keyof typeof SHAPE_ANCHORS} */ (name)];
    const anchor = /** @type {HTMLElement | null} */ (document.querySelector(anchorSel || `[data-shape-anchor="${name}"]`));
    if (!section || !anchor) return { pts: [], mode: 0 };
    const r = anchor.getBoundingClientRect();
    const sticky = section.hasAttribute('data-sticky');
    let ox = r.left;
    let oy = r.top + scrollY;
    if (sticky) {
      const inner = /** @type {HTMLElement} */ (section.querySelector('[data-sticky-inner]'));
      oy = r.top - inner.getBoundingClientRect().top;
    }
    const scale = Math.min(1, 640 / Math.max(r.width, 1));
    const cw = Math.max(1, Math.round(r.width * scale));
    const ch = Math.max(1, Math.round(r.height * scale));
    off.width = cw;
    off.height = ch;
    octx.clearRect(0, 0, cw, ch);
    octx.save();
    octx.scale(scale, scale);
    octx.fillStyle = '#fff';
    def.draw(octx, r.width, r.height);
    octx.restore();
    const data = octx.getImageData(0, 0, cw, ch).data;
    /** @type {number[]} */
    const pts = [];
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (data[(y * cw + x) * 4 + 3] > 120) pts.push(ox + (x + Math.random()) / scale, oy + (y + Math.random()) / scale);
      }
    }
    return { pts, mode: sticky ? 2 : 1 };
  }

  /** @param {string} name @param {number} [dur] */
  function setShape(name, dur = 1800) {
    const now = performance.now();
    const T = clamp((now - morphStart) / morphDur);
    for (let i = 0; i < N; i++) {
      const p = currentPos(i, T);
      from[i * 4] = p[0];
      from[i * 4 + 1] = p[1];
      from[i * 4 + 2] = p[2];
      from[i * 4 + 3] = p[3];
    }
    const def = SHAPES[name] ?? SHAPES.cloud;
    const { pts, mode } = samplePoints(name);
    const count = pts.length ? Math.round(N * def.share) : 0;
    const nPts = pts.length / 2;
    // Random subset of the sampled pixels so the shape stays even.
    const picks = Array.from({ length: nPts }, (_, i) => i);
    shuffle(picks);
    shuffle(order);
    for (let j = 0; j < N; j++) {
      const i = order[j];
      if (j < count) {
        const p = picks[j % nPts];
        const jit = j >= nPts ? 1.6 : 0;
        to[i * 4] = pts[p * 2] + (Math.random() - 0.5) * jit;
        to[i * 4 + 1] = pts[p * 2 + 1] + (Math.random() - 0.5) * jit;
        to[i * 4 + 2] = (Math.random() - 0.5) * 0.7;
        to[i * 4 + 3] = mode;
      } else {
        to[i * 4] = Math.random() * W;
        to[i * 4 + 1] = Math.random() * (H + 200) - 100;
        to[i * 4 + 2] = Math.random() * 2 - 1;
        to[i * 4 + 3] = 0;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, fromBuf);
    gl.bufferData(gl.ARRAY_BUFFER, from, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, toBuf);
    gl.bufferData(gl.ARRAY_BUFFER, to, gl.DYNAMIC_DRAW);
    current = name;
    morphStart = now;
    morphDur = REDUCED ? 1 : dur;
    setTint(def.tint ?? null);
  }

  /** @param {string | null} hex */
  function setTint(hex) {
    if (!hex) { tintAmtTarget = 0; return; }
    const n = parseInt(hex.slice(1), 16);
    tintTarget[0] = ((n >> 16) & 255) / 255;
    tintTarget[1] = ((n >> 8) & 255) / 255;
    tintTarget[2] = (n & 255) / 255;
    tintAmtTarget = 0.85;
  }

  /** @param {number} now @param {number} dt @param {number} mx @param {number} my */
  function render(now, dt, mx, my) {
    burst *= Math.exp(-dt * 2.6);
    const lerp = 1 - Math.exp(-dt * 4);
    for (let k = 0; k < 3; k++) tint[k] += (tintTarget[k] - tint[k]) * lerp;
    tintAmt += (tintAmtTarget - tintAmt) * lerp;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.uT, clamp((now - morphStart) / morphDur));
    gl.uniform1f(u.uTime, now / 1000);
    gl.uniform1f(u.uScroll, scrollY);
    gl.uniform1f(u.uPx, W / 1920);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uMotion, REDUCED ? 0 : 1);
    gl.uniform1f(u.uTintAmt, tintAmt);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uMouse, mx, my);
    gl.uniform3f(u.uBurst, burstX, burstY, burst);
    gl.uniform3f(u.uTint, tint[0], tint[1], tint[2]);
    gl.drawArrays(gl.POINTS, 0, N);
  }

  resize();
  return {
    resize() { resize(); setShape(current, 700); },
    get shape() { return current; },
    setShape,
    setTint,
    /** @param {number} x @param {number} y */
    burst(x, y) { burstX = x; burstY = y; burst = 1; },
    render,
  };
}

/** UI sparks (answers, chest, gifts) on a separate 2D overlay. */
const sparks = (() => {
  const canvas = /** @type {HTMLCanvasElement} */ ($('.spark-canvas'));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  /** @type {{ x: number, y: number, vx: number, vy: number, life: number, max: number, size: number, color: string, g: number }[]} */
  const list = [];
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  return {
    resize,
    /** @param {number} x @param {number} y @param {{ count?: number, colors?: string[], speed?: number, gravity?: number }} [o] */
    emit(x, y, o = {}) {
      if (REDUCED) return;
      const { count = 60, colors = ['#ff6d00', '#ffc35a', '#ffffff'], speed = 1, gravity = 1 } = o;
      const s = innerWidth / 1920;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (2 + Math.random() * 9) * speed * s;
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4 * s * speed, life: 0, max: 50 + Math.random() * 50, size: (2 + Math.random() * 4) * s, color: colors[i % colors.length], g: 0.28 * s * gravity });
      }
    },
    step() {
      if (!list.length) return;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life++;
        p.vy += p.g;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        const a = 1 - p.life / p.max;
        if (a <= 0) { list.splice(i, 1); continue; }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!list.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
    },
  };
})();

// ============================================================
// 7. Questions — compact take on the app's generators (C1–C7),
//    with "trap" distractors like the real distractor model
// ============================================================
const SUP = /** @type {Record<string, string>} */ ({ 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' });
/** @param {number} n */
const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040];
/** @typedef {{ text: string, answer: number, traps: number[] }} Question */

/** @param {number} cat @param {number} level @returns {Question} */
function genQuestion(cat, level) {
  const df = level <= 100 ? 0 : level <= 300 ? 1 : 2;
  switch (cat) {
    case 0: {
      const max = [45, 150, 450][df];
      const kind = rnd(0, 2);
      if (kind === 0) {
        const a = rnd(5, max), b = rnd(2, max), c = rnd(1, a + b);
        return { text: `${a} + ${b} − ${c}`, answer: a + b - c, traps: [a + b + c, a + b - c + 10, a + b - c - 10] };
      }
      if (kind === 1) {
        const a = rnd(3, max), b = rnd(2, max);
        return { text: `${a} + ${b}`, answer: a + b, traps: [a + b + 10, a + b - 10, Math.abs(a - b)] };
      }
      const a = rnd(10, max), b = rnd(2, a);
      return { text: `${a} − ${b}`, answer: a - b, traps: [a + b, a - b + 10, a - b - 10] };
    }
    case 1: {
      const m = [10, 15, 25][df];
      if (Math.random() < 0.55) {
        const a = rnd(2, m), b = rnd(2, m);
        return { text: `${a} × ${b}`, answer: a * b, traps: [a * (b + 1), (a + 1) * b, a * b + 10, a + b] };
      }
      const b = rnd(2, [9, 12, 15][df]), q = rnd(2, [12, 20, 30][df]);
      return { text: `${b * q} ÷ ${b}`, answer: q, traps: [q + 1, q - 1, q * 2, b] };
    }
    case 2: {
      const a = rnd(2, [20, 40, 80][df]), b = rnd(2, [9, 12, 15][df]), c = rnd(2, [9, 12, 15][df]);
      const kind = rnd(0, 2);
      if (kind === 0) return { text: `${a} + ${b} × ${c}`, answer: a + b * c, traps: [(a + b) * c, a + b + c, a * b + c] };
      if (kind === 1) {
        const x = a * b, cc = rnd(1, Math.min(x - 1, 60));
        return { text: `${a} × ${b} − ${cc}`, answer: x - cc, traps: [a * (b - cc), x + cc, x - cc + 10] };
      }
      const big = b * c + rnd(1, 50);
      return { text: `${big} − ${b} × ${c}`, answer: big - b * c, traps: [(big - b) * c, big - b - c, big - b * c + 10] };
    }
    case 3: {
      const a = rnd(2, [12, 25, 40][df]), b = rnd(2, [12, 25, 40][df]), c = rnd(2, [6, 9, 12][df]);
      const kind = rnd(0, 2);
      if (kind === 0) return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, traps: [a + b * c, (a + b) * c + c, (a + b) * (c + 1)] };
      if (kind === 1) {
        const hi = Math.max(a, b) + 1, lo = Math.min(a, b), e = rnd(1, 30);
        return { text: `(${hi} − ${lo}) × ${c} + ${e}`, answer: (hi - lo) * c + e, traps: [hi - lo * c + e, (hi - lo) * (c + e), (hi - lo) * c - e] };
      }
      const e = rnd(1, 9), inner = b + e, sub = rnd(1, c * inner - 1);
      return { text: `${c} × (${b} + ${e}) − ${sub}`, answer: c * inner - sub, traps: [c * b + e - sub, c * inner + sub, c * (inner - 1) - sub] };
    }
    case 4: {
      const kind = rnd(0, 4);
      /** @type {number[]} */
      let s = [];
      if (kind === 0) { const st = rnd(1, 20), step = rnd(2, [9, 15, 25][df]); s = [0, 1, 2, 3, 4].map((i) => st + i * step); }
      else if (kind === 1) { const st = rnd(1, 5), r = rnd(2, 3); s = [0, 1, 2, 3, 4].map((i) => st * r ** i); }
      else if (kind === 2) { s = [rnd(1, 5), rnd(1, 6)]; while (s.length < 5) s.push(s[s.length - 1] + s[s.length - 2]); }
      else if (kind === 3) { const st = rnd(1, 6); s = [0, 1, 2, 3, 4].map((i) => (st + i) ** 2); }
      else { const p = rnd(2, 6), q = rnd(3, 9); s = [rnd(1, 10)]; for (let i = 1; i < 5; i++) s.push(s[i - 1] + (i % 2 ? p : q)); }
      const ans = s[4], diff = s[3] - s[2] || 2;
      return { text: `${s.slice(0, 4).join(', ')}, ?`, answer: ans, traps: [s[3] + diff, ans + 1, ans - diff, ans + diff] };
    }
    case 5: {
      const kind = rnd(0, 4);
      if (kind === 0) { const a = rnd(2, [12, 15, 20][df]); return { text: `${a}²`, answer: a * a, traps: [a * 2, a * a + a, (a + 1) * (a + 1)] }; }
      if (kind === 1) { const a = rnd(2, [5, 7, 9][df]); return { text: `${a}³`, answer: a ** 3, traps: [a * 3, a * a, (a + 1) ** 3] }; }
      if (kind === 2) { const a = rnd(3, [12, 16, 25][df]); return { text: `√${a * a}`, answer: a, traps: [a + 1, a - 1, a * 2] }; }
      if (kind === 3) { const a = rnd(3, [5, 6, 7][df]); const f = FACT[a]; return { text: `${a}!`, answer: f, traps: [f / a, f + a, f * 2] }; }
      const n = rnd(3, [8, 10, 12][df]);
      return { text: `2${sup(n)}`, answer: 2 ** n, traps: [2 * n, 2 ** (n - 1), 2 ** n + 2] };
    }
    default: {
      const kind = rnd(0, 2);
      if (kind === 0) { const a = rnd(2, 12), b = rnd(2, 9); return { text: `√${a * a} + ${b}²`, answer: a + b * b, traps: [a * a + b * b, a + b * 2, (a + b) * b] }; }
      if (kind === 1) {
        const a = rnd(4, 5), b = rnd(2, 9), c = rnd(2, 9), f = FACT[a];
        return { text: `${a}! − ${b} × ${c}`, answer: f - b * c, traps: [(f - b) * c, f - b - c, f + b * c] };
      }
      const a = rnd(2, 15), b = rnd(2, 15), c = rnd(2, 6), e = rnd(2, Math.min(9, (a + b) * c - 1));
      return { text: `(${a} + ${b}) × ${c} − √${e * e}`, answer: (a + b) * c - e, traps: [(a + b) * c - e * e, a + b * c - e, (a + b) * c + e] };
    }
  }
}

/** @param {Question} q */
function buildOptions(q) {
  const set = new Set();
  for (const v of q.traps) if (Number.isInteger(v) && v >= 0 && v !== q.answer) set.add(v);
  for (const o of shuffle([1, -1, 2, -2, 10, -10, 3, 5, -5, 11])) {
    if (set.size >= 3) break;
    const v = q.answer + o;
    if (v >= 0) set.add(v);
  }
  return shuffle([q.answer, ...shuffle([...set]).slice(0, 3)]);
}

// ============================================================
// 8. Rendering — i18n + section controllers
// ============================================================
const fxCanvas = /** @type {HTMLCanvasElement} */ ($('.fx-canvas'));
/** @type {ReturnType<typeof createFx>} */
let fx = null;
try { fx = createFx(fxCanvas); } catch (err) { console.warn('WebGL unavailable', err); }
if (fx) document.documentElement.classList.add('has-fx');

/**
 * Switch in place (the intro, the sound and the demo keep running) and move the
 * address to the other language's page, so a reload or a shared link matches.
 * @param {'tr' | 'en'} lang
 */
function switchLang(lang) {
  if (lang === prefs.lang) return;
  prefs.lang = lang;
  savePrefs();
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* storage disabled */ }
  applyLanguage();
  try {
    const url = new URL(`${lang === 'tr' ? 'tr/' : ''}${location.protocol === 'file:' ? 'index.html' : ''}`, SITE_ROOT);
    url.hash = location.hash;
    history.replaceState(history.state, '', url);
  } catch { /* file:// or sandboxed: keep the address */ }
}

function applyLanguage() {
  const en = prefs.lang === 'en';
  document.documentElement.lang = prefs.lang;
  document.title = d('title');
  $$('[data-i18n]').forEach((el) => { const k = /** @type {string} */ (el.dataset.i18n); el.textContent = en ? EN[k] ?? TR_TEXT[k] : TR_TEXT[k]; });
  $$('[data-i18n-aria]').forEach((el) => { const k = /** @type {string} */ (el.dataset.i18nAria); el.setAttribute('aria-label', en ? EN[k] ?? TR_ARIA[k] : TR_ARIA[k]); });
  $$('[data-i18n-alt]').forEach((el) => { const k = /** @type {string} */ (el.dataset.i18nAlt); el.setAttribute('alt', en ? EN[k] ?? TR_ALT[k] : TR_ALT[k]); });
  $$('[data-screen]').forEach((img) => { /** @type {HTMLImageElement} */ (img).src = new URL(`screens/${prefs.lang}/${img.dataset.screen}.png`, import.meta.url).href; });
  $$('[data-link]').forEach((a) => { a.setAttribute('href', new URL(`${en ? '' : 'tr/'}${LEGAL_LINKS[/** @type {keyof typeof LEGAL_LINKS} */ (a.dataset.link)]}`, SITE_ROOT).href); });
  $$('[data-action="lang"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === prefs.lang)));
  $$('.bracket').forEach((li, i) => { $('.bracket__mult', li).textContent = fmtMult(TIME_BRACKETS[i].mult); });
  $$('[data-count]').forEach((el) => { if (el.dataset.done) el.textContent = fmt(Number(el.dataset.count)); });
  renderWheelLabels();
  renderCatPanel(false);
  renderClimb();
  renderLadder();
  renderGifts();
  renderPickers();
  renderGame();
  updateTimer(true);
}

/** Decode effect: random math glyphs settle into the real text. @param {HTMLElement} el */
function scramble(el) {
  if (REDUCED) return;
  const glyphs = '0123456789+−×÷=√π∑∞';
  const start = performance.now();
  const frame = () => {
    const final = el.dataset.i18n ? t(el.dataset.i18n) : el.textContent || '';
    const p = clamp((performance.now() - start) / 900);
    const shown = Math.floor(final.length * p);
    el.textContent = final.slice(0, shown) + [...final.slice(shown)].map((ch) => (ch === ' ' ? ' ' : glyphs[rnd(0, glyphs.length - 1)])).join('');
    if (p < 1) requestAnimationFrame(frame); else el.textContent = final;
  };
  requestAnimationFrame(frame);
}

/** @param {HTMLElement} el */
function countUp(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const dur = REDUCED ? 1 : 1800;
  const frame = () => {
    const p = clamp((performance.now() - start) / dur);
    el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 4))));
    if (p < 1) requestAnimationFrame(frame); else el.dataset.done = '1';
  };
  requestAnimationFrame(frame);
}

// --- Gate ---
const gate = $('.gate');
function runGate() {
  const word = $('.gate__word');
  [...'MATHMAKER'].forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.setAttribute('aria-hidden', 'true');
    setVar(span, '--i', i);
    word.append(span);
  });
  const fill = $('.gate__meter-fill');
  const count = $('.gate__count');
  const start = performance.now();
  let fontsReady = false;
  document.fonts.ready.then(() => { fontsReady = true; });
  const frame = () => {
    const p = clamp((performance.now() - start) / (REDUCED ? 200 : 1700));
    const shown = fontsReady ? p : Math.min(p, 0.9);
    setVar(fill, '--load', shown);
    count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
    if (shown < 1) { requestAnimationFrame(frame); return; }
    gate.classList.add('gate--ready');
    /** @type {HTMLElement} */ ($('[data-action="enter"]', gate)).focus({ preventScroll: true });
  };
  requestAnimationFrame(frame);
}
/** @param {boolean} withSound */
function enterSite(withSound) {
  if (gate.hidden || gate.classList.contains('gate--leaving')) return;
  prefs.sound = withSound;
  savePrefs();
  setSound(withSound);
  if (withSound) sound.enter();
  gate.classList.add('gate--leaving');
  document.body.classList.remove('is-locked');
  after(1200, () => { gate.hidden = true; });
  if (fx) {
    fitHeroTitle();
    fx.setShape('title', 2600);
    after(500, () => sound.shimmer());
    after(1700, () => heroTitle.classList.add('hero__title--lit'));
  }
  $$('[data-count]').forEach((el) => after(700, () => countUp(el)));
}

const heroTitle = $('.hero__title');
const titleCtx = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
/** Size the solid hero word like the particle word drawn over the same stage. */
function fitHeroTitle() {
  const r = $('.hero__stage').getBoundingClientRect();
  setVar(heroTitle, '--title-size', `${fitWord('MATHMAKER', r.width, r.height, titleCtx, ...TITLE_FIT).size.toFixed(1)}px`);
}

/** @param {boolean} on */
function setSound(on) {
  sound.setEnabled(on);
  const btn = $('[data-action="toggle-sound"]');
  btn.setAttribute('aria-pressed', String(sound.on));
}

// --- Scroll engine: progress, sticky scenes, active shape, nav ---
const pitch = $('.pitch');
const pitchLines = $$('.pitch__line');
const pitchSub = $('.pitch__sub');
const timerSec = $('.timer');
const timerDial = $('.timer__dial');
const timerNum = $('.timer__num');
const timerArc = /** @type {HTMLElement} */ (/** @type {unknown} */ ($('.timer__arc')));
const timerMult = $('.timer__mult');
const brackets = $$('.bracket');
const shapeSections = $$('[data-shape]');
const navLinks = $$('[data-nav]');
let lastTimerShown = -1;
let lastScrollY = scrollY;

/** @param {HTMLElement} el */
function stickyProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}

/** @param {boolean} [force] */
function updateTimer(force = false) {
  const p = stickyProgress(timerSec);
  const sec = QUESTION_TIME * (1 - clamp((p - 0.08) / 0.84));
  const shown = Math.ceil(sec - 1e-6);
  const zone = sec > 8 ? 'ok' : sec > 4 ? 'warn' : 'danger';
  timerDial.dataset.zone = zone;
  setVar(timerArc, '--off', (289 * (1 - sec / QUESTION_TIME)).toFixed(2));
  const mult = timeMult(sec);
  brackets.forEach((b, i) => b.classList.toggle('bracket--active', TIME_BRACKETS[i].mult === mult));
  if (shown !== lastTimerShown || force) {
    if (!force && lastTimerShown !== -1 && fx?.shape === 'ring') sound.tick(shown <= 5);
    lastTimerShown = shown;
    timerNum.textContent = String(shown);
    timerMult.textContent = fmtMult(mult);
    if (fx?.shape === 'ring') fx.setTint(zone === 'ok' ? '#2bd589' : zone === 'warn' ? '#ffc107' : '#ff3b2f');
  }
}

function updateScroll() {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  setVar($('.progress__fill'), '--progress', clamp(y / Math.max(1, max)).toFixed(4));
  sound.energize(Math.min(0.25, Math.abs(y - lastScrollY) / 1500));
  lastScrollY = y;

  const pp = stickyProgress(pitch);
  pitchLines.forEach((line, i) => setVar(line, '--lp', clamp((pp - 0.04 - i * 0.2) / 0.18).toFixed(3)));
  setVar(pitchSub, '--lp', clamp((pp - 0.66) / 0.18).toFixed(3));
  updateTimer();

  const mid = innerHeight * 0.5;
  const active = shapeSections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
  if (fx && active && !document.body.classList.contains('is-locked')) {
    const name = /** @type {string} */ (active.dataset.shape);
    if (name !== fx.shape) {
      fx.setShape(name);
      sound.whoosh();
      if (name === 'heptagon') fx.setTint(CATS[wheelState.active].color);
      if (name === 'ring') lastTimerShown = -1;
    }
  }
  const navId = shapeSections.concat($$('section[id]')).find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid && s.id; })?.id;
  navLinks.forEach((a) => a.classList.toggle('nav__link--active', a.dataset.nav === navId));
}

// --- Category wheel ---
const wheel = $('.wheel');
const wheelSvg = $('.wheel__edges');
const panel = $('.cat-panel');
const wheelState = { active: 0, userUntil: 0 };
/** @type {HTMLButtonElement[]} */
const wheelNodes = [];
/** @type {SVGLineElement[]} */
const wheelEdges = [];

/** @param {string} name */
function iconNode(name) {
  const def = ICONS[name];
  if (def.text) { const s = document.createElement('span'); s.textContent = def.text; return s; }
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', def.vb || '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const dd of def.fill || []) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', dd); p.setAttribute('fill', 'currentColor'); svg.append(p); }
  for (const dd of def.stroke || []) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', dd);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', String(def.sw || 1.5));
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    svg.append(p);
  }
  return svg;
}

function buildWheel() {
  const NS = 'http://www.w3.org/2000/svg';
  CATS.forEach((cat, i) => {
    const next = CATS[(i + 1) % 7];
    const line = /** @type {SVGLineElement} */ (document.createElementNS(NS, 'line'));
    line.setAttribute('x1', String(cat.x));
    line.setAttribute('y1', String(cat.y));
    line.setAttribute('x2', String(next.x));
    line.setAttribute('y2', String(next.y));
    line.classList.add('wheel__edge');
    wheelSvg.append(line);
    wheelEdges.push(line);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wheel__node';
    btn.dataset.action = 'cat';
    btn.dataset.index = String(i);
    setVar(btn, '--x', cat.x);
    setVar(btn, '--y', cat.y);
    setVar(btn, '--cat', cat.color);
    const icon = document.createElement('span');
    icon.className = 'wheel__icon';
    icon.append(iconNode(cat.icon));
    const name = document.createElement('span');
    name.className = 'wheel__name';
    btn.append(icon, name);
    wheel.append(btn);
    wheelNodes.push(btn);
  });
  const bars = $('.climb__bars');
  CATS.forEach((cat, i) => {
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'climb__bar';
    bar.dataset.action = 'cat';
    bar.dataset.index = String(i);
    setVar(bar, '--cat', cat.color);
    setVar(bar, '--i', i);
    setVar(bar, '--h', Math.max(1.5, (cat.sigma / CATS[6].sigma) * 82).toFixed(2));
    const fill = document.createElement('span');
    fill.className = 'climb__fill';
    const label = document.createElement('span');
    label.className = 'climb__label tnum';
    const id = document.createElement('span');
    id.className = 'climb__id';
    id.textContent = cat.id;
    bar.append(label, fill, id);
    bars.append(bar);
  });
}

function renderWheelLabels() {
  wheelNodes.forEach((btn, i) => {
    const name = CAT_TEXT[prefs.lang][i].name;
    $('.wheel__name', btn).textContent = name;
    btn.setAttribute('aria-label', `${CATS[i].id} · ${name}`);
    btn.setAttribute('aria-pressed', String(i === wheelState.active));
  });
}

function renderClimb() {
  $$('.climb__bar').forEach((bar, i) => {
    const cat = CATS[i];
    const label = $('.climb__label', bar);
    label.textContent = '';
    const main = document.createElement('span');
    main.textContent = cat.sigma ? `${fmtShort(cat.sigma)} Σ` : d('open');
    label.append(main);
    if (cat.epsUnlock) {
      const small = document.createElement('small');
      small.textContent = d('orEps', { n: fmt(cat.epsUnlock) });
      label.append(small);
    }
    bar.classList.toggle('climb__bar--active', i === wheelState.active);
    bar.setAttribute('aria-label', `${cat.id} · ${CAT_TEXT[prefs.lang][i].name} · ${main.textContent}`);
  });
}

function newSample() {
  const q = $('[data-cat="q"]', panel);
  q.textContent = genQuestion(wheelState.active, rnd(1, 400)).text;
  q.classList.remove('cat-panel__q--flip');
  void q.offsetWidth;
  q.classList.add('cat-panel__q--flip');
}

/** @param {boolean} [withSample] */
function renderCatPanel(withSample = true) {
  const i = wheelState.active;
  const cat = CATS[i];
  const txt = CAT_TEXT[prefs.lang][i];
  setVar(panel, '--cat', cat.color);
  $('[data-cat="id"]', panel).textContent = cat.id;
  $('[data-cat="name"]', panel).textContent = txt.name;
  $('[data-cat="topic"]', panel).textContent = txt.topic;
  $('[data-cat="base"]', panel).textContent = fmt(cat.base);
  $('[data-cat="eps"]', panel).textContent = [10, 20, 30].map((b) => fmt(b * cat.eps)).join(' · ');
  $('[data-cat="unlock"]', panel).textContent = cat.sigma ? `${fmtShort(cat.sigma)} Σ` : d('open');
  ['b1', 'b2', 'b3'].forEach((k, j) => { $(`[data-cat="${k}"]`, panel).textContent = txt.badges[j]; });
  wheelNodes.forEach((n, j) => {
    n.classList.toggle('wheel__node--open', j <= i);
    n.classList.toggle('wheel__node--active', j === i);
    n.setAttribute('aria-pressed', String(j === i));
  });
  wheelEdges.forEach((e, j) => e.classList.toggle('wheel__edge--lit', j < i));
  if (withSample) newSample();
}

/** @param {number} i @param {boolean} fromUser */
function selectCat(i, fromUser) {
  wheelState.active = i;
  if (fromUser) wheelState.userUntil = performance.now() + 12000;
  renderCatPanel();
  renderClimb();
  if (fx?.shape === 'heptagon') fx.setTint(CATS[i].color);
  if (fromUser) sound.note(i);
  else if (fx?.shape === 'heptagon') sound.note(i, 0.45);
}

// --- Journey: ladder + daily gifts ---
function renderLadder() {
  const ladder = $('.ladder');
  if (!ladder.childElementCount) {
    CATS.forEach((cat, i) => {
      const step = document.createElement('div');
      step.className = 'ladder__step';
      setVar(step, '--i', i);
      setVar(step, '--cat', cat.color);
      const school = document.createElement('span');
      school.className = 'ladder__school';
      const name = document.createElement('span');
      name.className = 'ladder__cat';
      step.append(school, name);
      ladder.append(step);
    });
  }
  $$('.ladder__step').forEach((step, i) => {
    $('.ladder__school', step).textContent = SCHOOLS[prefs.lang][i];
    $('.ladder__cat', step).textContent = `${CATS[i].id} · ${CAT_TEXT[prefs.lang][i].name}`;
  });
}

const GIFTS = ['100 ε', '200 ε', '300 ε', '500 ε', 'gHint', 'gFifty', 'gChange', 'gTime', 'gLife'];
let giftOrder = shuffle([...GIFTS]);
function renderGifts() {
  const wrap = $('[data-gifts]');
  if (!wrap.childElementCount) {
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gift';
      b.dataset.action = 'gift';
      const front = document.createElement('span');
      front.className = 'gift__face gift__face--front';
      front.textContent = '?';
      const back = document.createElement('span');
      back.className = 'gift__face gift__face--back';
      b.append(front, back);
      wrap.append(b);
    }
  }
  $$('.gift', wrap).forEach((b, i) => {
    const g = giftOrder[i];
    const label = g.startsWith('g') ? d(g) : g;
    $('.gift__face--back', b).textContent = label;
    b.setAttribute('aria-label', b.classList.contains('gift--open') ? label : `${i + 1} / 9`);
  });
}
/** @param {HTMLElement} box */
function openGift(box) {
  if (box.classList.contains('gift--open')) return;
  box.classList.add('gift--open');
  const r = box.getBoundingClientRect();
  sparks.emit(r.left + r.width / 2, r.top + r.height / 2, { count: 26, colors: ['#ffc35a', '#ff6d00', '#fff'], speed: 0.6 });
  sound.coin();
  renderGifts();
  const all = $$('.gift');
  if (all.every((b) => b.classList.contains('gift--open'))) {
    after(1800, () => { all.forEach((b) => b.classList.remove('gift--open')); after(500, () => { giftOrder = shuffle([...GIFTS]); renderGifts(); }); });
  }
}

// --- Game category picker ---
function renderPickers() {
  const playChips = $('[data-chips="play"]');
  if (!playChips.childElementCount) {
    CATS.forEach((cat, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.action = 'play-cat';
      b.dataset.index = String(i);
      setVar(b, '--cat', cat.color);
      playChips.append(b);
    });
  }
  $$('.chip', playChips).forEach((c, i) => {
    c.textContent = `${CATS[i].id} · ${CAT_TEXT[prefs.lang][i].name}`;
    c.setAttribute('aria-pressed', String(i === game.cat));
  });
}

// ============================================================
// 9. The playable round
// ============================================================
const arena = $('[data-arena]');
/** @param {string} k */
const g = (k) => $(`[data-g="${k}"]`, arena);
const answerBtns = /** @type {HTMLButtonElement[]} */ ($$('.answer', arena));
const puBtns = /** @type {HTMLButtonElement[]} */ ($$('.pu-btn', arena));
const ringArc = /** @type {HTMLElement} */ (/** @type {unknown} */ ($('.ring__arc', arena)));
/** @typedef {'hint' | 'fifty' | 'change' | 'time'} PowerUp */
const game = {
  state: /** @type {'idle' | 'playing' | 'over'} */ ('idle'),
  cat: 0, level: 1, lives: MAX_LIVES, sigma: 0, eps: 0, streak: 0, bestStreak: 0, levels: 0,
  time: QUESTION_TIME, lastSec: QUESTION_TIME, locked: true, visible: false,
  /** @type {Question | null} */ q: null,
  /** @type {number[]} */ options: [],
  pu: /** @type {Record<PowerUp, number>} */ ({ ...PU_START }),
};

function buildArena() {
  const hearts = g('hearts');
  for (let i = 0; i < MAX_LIVES; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', '#i-heart');
    svg.append(use);
    h.append(svg);
    hearts.append(h);
  }
  const streak = g('streak');
  for (let i = 0; i < STRIKE_AFTER; i++) { const s = document.createElement('span'); s.className = 'streak__seg'; streak.append(s); }
}

function renderGame() {
  const tier = tierOf(game.level);
  const [lo, span] = tier === 'bronze' ? [0, 100] : tier === 'silver' ? [100, 200] : [300, 200];
  setVar(arena, '--cat', CATS[game.cat].color);
  g('catName').textContent = `${CATS[game.cat].id} · ${CAT_TEXT[prefs.lang][game.cat].name}`;
  g('level').textContent = fmt(game.level);
  setVar(g('tierFill'), '--t', ((game.level - lo) / span).toFixed(3));
  g('tierText').textContent = d('tierText', { tier: t(`tier.${tier}`), n: game.level - lo, of: span });
  $$('.heart', g('hearts')).forEach((h, i) => h.classList.toggle('heart--lost', i >= game.lives));
  g('sigma').textContent = fmt(game.sigma);
  g('eps').textContent = fmt(game.eps);
  const hot = game.streak >= STRIKE_AFTER;
  g('streak').classList.toggle('streak--hot', hot);
  $$('.streak__seg', g('streak')).forEach((s, i) => s.classList.toggle('streak__seg--on', i < game.streak));
  const st = g('streakText');
  st.textContent = hot ? d('streakHot', { n: game.streak }) : d('streak', { n: game.streak });
  st.classList.toggle('streak__label--hot', hot);
  puBtns.forEach((b) => {
    const k = /** @type {PowerUp} */ (b.dataset.pu);
    $('.pu-btn__count', b).textContent = String(game.pu[k]);
    b.disabled = game.state !== 'playing' || game.locked || game.pu[k] <= 0;
  });
  if (game.state === 'over') {
    g('overTitle').textContent = d('overTitle');
    g('sumLevels').textContent = fmt(game.levels);
    g('sumSigma').textContent = fmt(game.sigma);
    g('sumEps').textContent = fmt(game.eps);
    g('sumStreak').textContent = fmt(game.bestStreak);
    g('bestText').textContent = game.sigma >= prefs.best && game.sigma > 0 ? d('newBest', { n: fmt(prefs.best) }) : d('best', { n: fmt(prefs.best) });
  }
  renderRing();
}

function renderRing() {
  const ring = g('ring');
  const tm = Math.max(0, game.time);
  ring.dataset.zone = tm > 8 ? 'ok' : tm > 4 ? 'warn' : 'danger';
  setVar(ringArc, '--off', (264 * (1 - Math.min(1, tm / QUESTION_TIME))).toFixed(2));
  g('time').textContent = String(Math.ceil(tm - 1e-6));
}

/** @param {boolean} [keepTime] */
function loadQuestion(keepTime = false) {
  game.q = genQuestion(game.cat, game.level);
  game.options = buildOptions(game.q);
  if (!keepTime) { game.time = QUESTION_TIME; game.lastSec = QUESTION_TIME; }
  answerBtns.forEach((b, i) => {
    b.disabled = false;
    b.classList.remove('answer--correct', 'answer--wrong', 'answer--gone');
    $('[data-g="opt"]', b).textContent = fmt(game.options[i]);
  });
  const q = g('question');
  q.textContent = `${game.q.text}${game.cat === 4 ? '' : ' = ?'}`;
  q.classList.remove('arena__question--in');
  void q.offsetWidth;
  q.classList.add('arena__question--in');
  g('hint').textContent = '';
  game.locked = false;
  renderGame();
}

function startGame() {
  Object.assign(game, { state: 'playing', level: 1, lives: MAX_LIVES, sigma: 0, eps: 0, streak: 0, bestStreak: 0, levels: 0 });
  game.pu = { ...PU_START };
  g('start').hidden = true;
  g('over').hidden = true;
  sound.click();
  loadQuestion();
  answerBtns[0].focus({ preventScroll: true });
}

/** @param {string} text @param {boolean} [bad] */
function floatReward(text, bad = false) {
  const tpl = /** @type {HTMLTemplateElement} */ ($('#tpl-float'));
  const el = /** @type {HTMLElement} */ (/** @type {DocumentFragment} */ (tpl.content.cloneNode(true)).firstElementChild);
  el.textContent = text;
  el.classList.toggle('float-reward--bad', bad);
  arena.append(el);
  after(1300, () => el.remove());
}

/** @param {string} cls */
function flash(cls) {
  arena.classList.remove('arena--flash-ok', 'arena--flash-bad', 'arena--shake');
  void arena.offsetWidth;
  arena.classList.add(cls);
  if (cls === 'arena--flash-bad') arena.classList.add('arena--shake');
  after(600, () => arena.classList.remove(cls, 'arena--shake'));
}

function nextLevel() {
  if (game.state !== 'playing') return;
  game.level = Math.min(LEVEL_CAP, game.level + 1);
  loadQuestion();
}

/** @param {number} i */
function answer(i) {
  if (game.state !== 'playing' || game.locked || !game.q || answerBtns[i].disabled) return;
  game.locked = true;
  answerBtns.forEach((b) => { b.disabled = true; });
  game.levels++;
  const btn = answerBtns[i];
  if (game.options[i] === game.q.answer) {
    const s = sigmaFor(game.cat, game.level, game.time, game.streak);
    const e = epsFor(game.cat, tierOf(game.level));
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.sigma += s;
    game.eps += e;
    btn.classList.add('answer--correct');
    flash('arena--flash-ok');
    const r = btn.getBoundingClientRect();
    const hot = game.streak > STRIKE_AFTER;
    sparks.emit(r.left + r.width / 2, r.top + r.height / 2, { count: hot ? 110 : 70, colors: hot ? ['#ffc35a', '#ff3b2f', '#ff6d00', '#fff'] : ['#2bd589', '#ffc35a', '#ffffff'] });
    floatReward(`+${fmt(s)} Σ · +${fmt(e)} ε`);
    sound.correct(game.streak);
    if (game.streak === STRIKE_AFTER) after(450, () => { floatReward(d('strike')); sound.strike(); });
    renderGame();
    after(1050, nextLevel);
  } else {
    btn.classList.add('answer--wrong');
    fail(false);
  }
}

/** @param {boolean} timedOut */
function fail(timedOut) {
  game.streak = 0;
  game.lives = Math.max(0, game.lives - 1);
  flash('arena--flash-bad');
  sound.wrong();
  floatReward(timedOut ? d('timeUp') : d('lifeLost'), true);
  renderGame();
  after(1300, () => { if (game.lives > 0) nextLevel(); else endGame(); });
}

function endGame() {
  game.state = 'over';
  if (game.sigma > prefs.best) { prefs.best = game.sigma; savePrefs(); }
  renderGame();
  g('over').hidden = false;
  sound.strike();
}

/** @param {PowerUp} kind */
function usePowerUp(kind) {
  if (game.state !== 'playing' || game.locked || !game.q || game.pu[kind] <= 0) return;
  game.pu[kind]--;
  sound.coin();
  if (kind === 'hint') g('hint').textContent = d('hint', { d: game.q.answer % 10 });
  if (kind === 'fifty') {
    const wrong = shuffle(answerBtns.filter((b, i) => game.options[i] !== game.q?.answer && !b.disabled));
    wrong.slice(0, 2).forEach((b) => { b.disabled = true; b.classList.add('answer--gone'); });
  }
  if (kind === 'change') loadQuestion(true);
  if (kind === 'time') { game.time += 5; game.lastSec = Math.ceil(game.time); }
  renderGame();
}

/** @param {number} dt */
function tickGame(dt) {
  if (game.state !== 'playing' || game.locked || !game.visible) return;
  game.time -= dt;
  const sec = Math.ceil(game.time);
  if (sec !== game.lastSec) {
    game.lastSec = sec;
    if (sec <= 5 && sec > 0) sound.tick(sec <= 3);
  }
  if (game.time <= 0) {
    game.time = 0;
    game.locked = true;
    game.levels++;
    answerBtns.forEach((b) => { b.disabled = true; });
    fail(true);
  }
  renderRing();
}

// ============================================================
// 10. Carousel, cursor, tilt, magnetic
// ============================================================
const carousel = { el: $('[data-carousel]'), ring: $('.carousel__ring'), angle: 0, vel: -9, drag: false, lastX: 0, visible: false };
/** @param {number} dt */
function tickCarousel(dt) {
  if (!carousel.visible || REDUCED) return;
  if (!carousel.drag) {
    carousel.vel += (-9 - carousel.vel) * Math.min(1, dt * 1.5);
    carousel.angle += carousel.vel * dt;
  }
  setVar(carousel.ring, '--angle', `${carousel.angle.toFixed(2)}deg`);
}

const cursor = $('.cursor');
const pointer = { x: -9999, y: -9999 };
let cursorDrawTimer = 0;
const finePointer = matchMedia('(pointer: fine)').matches && !REDUCED;
if (finePointer) document.documentElement.classList.add('has-cursor');
function tickCursor() {
  if (!finePointer) return;
  setVar(cursor, '--dx', `${pointer.x}px`);
  setVar(cursor, '--dy', `${pointer.y}px`);
}
/** Click = the compass swings a full turn around its needle and draws a circle. */
function drawCircle() {
  cursor.classList.remove('cursor--draw');
  void cursor.offsetWidth;
  cursor.classList.add('cursor--draw');
  window.clearTimeout(cursorDrawTimer);
  cursorDrawTimer = window.setTimeout(() => cursor.classList.remove('cursor--draw'), 850);
}

// ============================================================
// 11. Events — one delegated listener per type
// ============================================================
document.addEventListener('click', (e) => {
  const target = /** @type {HTMLElement} */ (e.target);
  const el = /** @type {HTMLElement | null} */ (target.closest('[data-action]'));
  if (!el) {
    if (fx?.shape === 'title' && target.closest('.hero') && !target.closest('a')) { fx.burst(e.clientX, e.clientY); sound.burst(); }
    return;
  }
  const action = el.dataset.action;
  const idx = Number(el.dataset.index);
  switch (action) {
    case 'enter': enterSite(el.dataset.sound === 'on'); break;
    case 'lang': switchLang(el.dataset.lang === 'en' ? 'en' : 'tr'); sound.click(); break;
    case 'toggle-sound': prefs.sound = !sound.on; savePrefs(); setSound(prefs.sound); if (prefs.sound) sound.shimmer(); break;
    case 'cat': selectCat(idx, true); break;
    case 'play-cat': game.cat = idx; renderPickers(); renderGame(); sound.note(idx, 0.6); break;
    case 'start': case 'restart': startGame(); break;
    case 'answer': answer(Number(el.dataset.index)); break;
    case 'pu': usePowerUp(/** @type {PowerUp} */ (el.dataset.pu)); break;
    case 'gift': openGift(el); break;
    case 'chest': {
      const r = el.getBoundingClientRect();
      sparks.emit(r.left + r.width / 2, r.top + r.height * 0.3, { count: 120, colors: ['#ffc35a', '#ffd98a', '#ff6d00', '#fff'], speed: 1.2 });
      for (let k = 0; k < 6; k++) after(k * 70, () => sound.coin());
      break;
    }
    default: break;
  }
});

document.addEventListener('keydown', (e) => {
  if (!gate.hidden && !gate.classList.contains('gate--leaving')) {
    if (e.key === 'Escape') enterSite(false);
    return;
  }
  if (!game.visible) return;
  if (game.state === 'playing' && /^[1-4]$/.test(e.key)) { e.preventDefault(); answer(Number(e.key) - 1); }
  else if (game.state !== 'playing' && e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); startGame(); }
});

document.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  const target = /** @type {HTMLElement} */ (e.target);
  const tilt = /** @type {HTMLElement | null} */ (target.closest('[data-tilt]'));
  if (tilt && !REDUCED) {
    const r = tilt.getBoundingClientRect();
    setVar(tilt, '--rx', `${(-((e.clientY - r.top) / r.height - 0.5) * 12).toFixed(2)}deg`);
    setVar(tilt, '--ry', `${(((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(2)}deg`);
  }
  const mag = /** @type {HTMLElement | null} */ (target.closest('[data-magnetic]'));
  if (mag && !REDUCED) {
    const r = mag.getBoundingClientRect();
    setVar(mag, '--mx', `${((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1)}px`);
    setVar(mag, '--my', `${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px`);
  }
  if (carousel.drag) {
    const dx = e.clientX - carousel.lastX;
    carousel.lastX = e.clientX;
    carousel.angle += dx * 0.25;
    carousel.vel = dx * 12;
  }
});

document.addEventListener('pointerover', (e) => {
  const target = /** @type {HTMLElement} */ (e.target);
  const hit = target.closest('a, button, input, [data-hover]');
  cursor.classList.toggle('cursor--hover', !!hit);
  if (hit && !(e.relatedTarget instanceof Node && hit.contains(e.relatedTarget))) {
    sound.hover();
    const node = /** @type {HTMLElement | null} */ (target.closest('.wheel__node'));
    if (node) sound.note(Number(node.dataset.index), 0.5);
  }
});

document.addEventListener('pointerout', (e) => {
  const target = /** @type {HTMLElement} */ (e.target);
  const leaving = (/** @type {string} */ sel) => {
    const el = /** @type {HTMLElement | null} */ (target.closest(sel));
    if (el && !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return el;
    return null;
  };
  const tilt = leaving('[data-tilt]');
  if (tilt) { setVar(tilt, '--rx', '0deg'); setVar(tilt, '--ry', '0deg'); }
  const mag = leaving('[data-magnetic]');
  if (mag) { setVar(mag, '--mx', '0px'); setVar(mag, '--my', '0px'); }
});

document.addEventListener('pointerdown', (e) => {
  if (finePointer) drawCircle();
  if (/** @type {HTMLElement} */ (e.target).closest('[data-carousel]')) { carousel.drag = true; carousel.lastX = e.clientX; }
});
document.addEventListener('pointerup', () => { carousel.drag = false; });
document.addEventListener('pointerleave', () => { pointer.x = -9999; pointer.y = -9999; });

let scrollQueued = false;
addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => { scrollQueued = false; updateScroll(); });
}, { passive: true });

let resizeTimer = 0;
addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => { fitHeroTitle(); fx?.resize(); sparks.resize(); updateScroll(); }, 200);
});

// ============================================================
// 12. Init
// ============================================================
buildWheel();
buildArena();
renderLadder();
renderGifts();
renderPickers();
applyLanguage();
runGate();

const io = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    const el = /** @type {HTMLElement} */ (en.target);
    el.classList.add('is-in');
    if (el.classList.contains('eyebrow')) scramble(el);
    io.unobserve(el);
  }
}, { threshold: 0.2 });
$$('[data-reveal], [data-reveal-class], .eyebrow').forEach((el) => io.observe(el));

const vis = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (en.target === arena) game.visible = en.isIntersecting;
    if (en.target === carousel.el) carousel.visible = en.isIntersecting;
  }
}, { threshold: 0.25 });
vis.observe(arena);
vis.observe(carousel.el);

window.setInterval(() => {
  if (performance.now() < wheelState.userUntil || document.hidden) return;
  selectCat((wheelState.active + 1) % 7, false);
}, 3800);
window.setInterval(() => { if (!document.hidden) newSample(); }, 2600);

let livesSec = 30 * 60;
const livesClock = $('[data-lives-clock]');
window.setInterval(() => {
  livesSec = livesSec <= 0 ? 30 * 60 : livesSec - 7;
  livesClock.textContent = `${String(Math.floor(livesSec / 60)).padStart(2, '0')}:${String(livesSec % 60).padStart(2, '0')}`;
}, 60);
window.setInterval(() => {
  if (document.hidden) return;
  const closed = $$('.gift').filter((b) => !b.classList.contains('gift--open'));
  const box = closed[rnd(0, closed.length - 1)];
  const r = box?.getBoundingClientRect();
  if (box && r && r.top < innerHeight && r.bottom > 0) openGift(box);
}, 1700);

// Particles start as drifting dust behind the gate.
fx?.setShape('cloud', 10);
document.fonts.ready.then(() => { fitHeroTitle(); if (fx && fx.shape !== 'cloud') fx.resize(); });

let last = performance.now();
/** @param {number} now */
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  fx?.render(now, dt, pointer.x, pointer.y);
  sparks.step();
  tickGame(dt);
  tickCarousel(dt);
  tickCursor();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
updateScroll();
  