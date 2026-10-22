// Renders brand-assets/og-image.html → /og-image.png (EN) and /og-image-tr.png (TR), 1200×630.
// Usage (from the repo root):  npx playwright install chromium  (once)
//                              node brand-assets/capture.mjs
// Keep both files under 300 KB (WhatsApp skips larger previews).
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [lang, file] of [["en", "og-image.png"], ["tr", "og-image-tr.png"]]) {
  const url = pathToFileURL(path.join(here, "og-image.html"));
  url.search = `?lang=${lang}`;
  await page.goto(url.href);
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(here, "..", file);
  await page.screenshot({ path: out });
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${file} written (${kb} KB)${kb >= 300 ? " — over 300 KB!" : ""}`);
}
await browser.close();
