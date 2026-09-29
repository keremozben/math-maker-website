// Renders brand-assets/og-image.html → /og-image.png (1200×630).
// Usage (from the repo root):  npx playwright install chromium  (once)
//                              node brand-assets/capture.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto("file://" + path.join(here, "og-image.html"));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(here, "..", "og-image.png") });
await browser.close();
console.log("og-image.png written");
