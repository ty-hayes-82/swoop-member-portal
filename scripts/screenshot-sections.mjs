import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const URL = 'http://localhost:5173/#/landing';
const OUT = path.resolve('.screenshots/sections');
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main');
await page.waitForTimeout(1500);

const sections = await page.evaluate(() =>
  Array.from(document.querySelectorAll('main > section, main > div > section, main section')).map((s, i) => ({
    i,
    id: s.id || null,
    cls: s.className,
    h: Math.round(s.getBoundingClientRect().height),
  }))
);
console.log('sections:', sections.length);

const handles = await page.locator('main section').all();
for (let i = 0; i < handles.length; i++) {
  const meta = sections[i] || {};
  const label = meta.id || `s${i}`;
  const name = `${String(i).padStart(2, '0')}-${label}.png`;
  try {
    await handles[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await handles[i].screenshot({ path: path.join(OUT, name) });
    console.log(`  ${name}  h=${meta.h}`);
  } catch (e) {
    console.log(`  ${name}  ERR ${e.message}`);
  }
}

await browser.close();
console.log(`\nSaved to ${OUT}`);
