import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const URL = process.env.LANDING_URL || 'http://localhost:5173/#/landing';
const OUT = path.resolve('.screenshots');

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'mobile-390', width: 390, height: 844 },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('PAGEERROR:', e.message));
    console.log(`→ ${vp.name}  ${URL}`);
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for React to mount something recognisable
    await page.waitForSelector('main', { timeout: 20000 });
    await page.waitForTimeout(1200);
    const h = await page.evaluate(() => ({
      doc: document.documentElement.scrollHeight,
      body: document.body.scrollHeight,
      main: document.querySelector('main')?.scrollHeight || 0,
    }));
    console.log(`   heights: doc=${h.doc}  body=${h.body}  main=${h.main}`);

    // Above-the-fold shot — clip to viewport explicitly
    await page.screenshot({
      path: path.join(OUT, `${vp.name}-hero.png`),
      clip: { x: 0, y: 0, width: vp.width, height: vp.height },
    });

    // Full page shot
    await page.screenshot({
      path: path.join(OUT, `${vp.name}-full.png`),
      fullPage: true,
    });

    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log(`\nSaved to ${OUT}`);
