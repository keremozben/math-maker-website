// Writes the FAQPage JSON-LD of the support pages from their own FAQ markup, so the
// structured data always matches the questions and answers on the page word for word.
// Run after editing an FAQ item (idempotent):  node tools/faq-schema.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['support.html', 'tr/support.html'];
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

/** Visible text of an HTML fragment. @param {string} html */
const text = (html) =>
  html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITIES[e]).replace(/\s+/g, ' ').trim();

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let html = raw.replace(/\r\n/g, '\n');
  const items = [...html.matchAll(/<div class="faq__item[^>]*><p><strong>(.*?)<\/strong><br \/>(.*?)<\/p><\/div>/g)];
  if (!items.length) throw new Error(`${page}: no FAQ items found`);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([, q, a]) => ({
      '@type': 'Question',
      name: text(q),
      acceptedAnswer: { '@type': 'Answer', text: text(a) },
    })),
  };
  const body = JSON.stringify(ld, null, 2).split('\n').map((l) => `      ${l}`).join('\n');
  const block = `    <script type="application/ld+json" id="ld-faq">\n${body}\n    </script>\n`;
  const existing = /    <script type="application\/ld\+json" id="ld-faq">[\s\S]*?<\/script>\n/;
  html = existing.test(html) ? html.replace(existing, block) : html.replace(/(    <link rel="preload")/, `${block}\n$1`);
  fs.writeFileSync(file, html.replace(/\n/g, eol));
  console.log(`${page}: ${items.length} questions`);
}
