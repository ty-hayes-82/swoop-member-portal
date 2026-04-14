import { chromium } from 'playwright';
import path from 'node:path';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/#/landing', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main');
await page.waitForTimeout(1500);

// Capability card + stat
const cards = await page.locator('#platform article').all();
if (cards[0]) {
  await cards[0].scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await cards[0].screenshot({ path: path.resolve('.screenshots/sections/zoom-capability.png') });
}

// Demo form
const demoForm = page.locator('#demo-form form').first();
await demoForm.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await demoForm.screenshot({ path: path.resolve('.screenshots/sections/zoom-demo-form.png') });

// Integrations subtitle region
const integrations = page.locator('section.landing-band-dark').first();
await integrations.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await integrations.screenshot({ path: path.resolve('.screenshots/sections/zoom-integrations-header.png'), clip: { x: 0, y: 0, width: 1440, height: 320 } });

await browser.close();
console.log('done');
