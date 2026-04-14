import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/#/landing', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main');
await page.waitForTimeout(1500);

// Scroll to ROI section and find sliders
await page.evaluate(() => {
  const heading = Array.from(document.querySelectorAll('h2')).find((h) => h.textContent.includes('member turnover costing'));
  heading?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(400);

const sliders = await page.$$('input[type="range"]');
console.log(`found ${sliders.length} range inputs`);

async function readNumbers() {
  return page.evaluate(() => {
    const bigs = Array.from(document.querySelectorAll('p, span'))
      .map((el) => el.textContent?.trim())
      .filter((t) => /^\$?[\d,]+$/.test(t || ''));
    return bigs.slice(0, 12);
  });
}

const before = await readNumbers();
console.log('numbers BEFORE:', before);

for (const slider of sliders) {
  const min = +(await slider.getAttribute('min'));
  const max = +(await slider.getAttribute('max'));
  const mid = Math.round((min + max) * 0.75);
  await slider.focus();
  await slider.evaluate((el, val) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, mid);
  await page.waitForTimeout(200);
}

const after = await readNumbers();
console.log('numbers AFTER :', after);

const changed = JSON.stringify(before) !== JSON.stringify(after);
console.log(`\nsliders updated outputs: ${changed ? '✓ YES' : '✗ NO'}`);

await browser.close();
process.exit(changed ? 0 : 1);
