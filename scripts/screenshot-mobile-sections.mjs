import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const URL = 'http://localhost:5173/#/landing';
const OUT = path.resolve('.screenshots/mobile');
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR:', e.message));
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main');
await page.waitForTimeout(1500);

const handles = await page.locator('main section').all();
for (let i = 0; i < handles.length; i++) {
  const id = await handles[i].evaluate((el) => el.id || '');
  const label = id || `s${i}`;
  const name = `${String(i).padStart(2, '0')}-${label}.png`;
  try {
    await handles[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await handles[i].screenshot({ path: path.join(OUT, name) });
    console.log(`  ${name}`);
  } catch (e) {
    console.log(`  ${name}  ERR ${e.message}`);
  }
}

await browser.close();
console.log(`\nSaved to ${OUT}`);
