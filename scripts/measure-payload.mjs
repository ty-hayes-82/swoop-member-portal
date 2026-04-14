import { chromium } from 'playwright';

const URL = 'http://localhost:5173/#/landing';
const browser = await chromium.launch({ headless: true });

for (const [label, viewport] of [
  ['desktop-1440', { width: 1440, height: 900 }],
  ['mobile-390', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const assets = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (!url.startsWith('http')) return;
    if (!/\.(png|jpg|jpeg|webp|avif|gif|svg)|images\.unsplash\.com/.test(url)) return;
    try {
      const buf = await res.body();
      assets.push({
        url: url.replace(/\?.*/, '').slice(-70),
        full: url,
        bytes: buf.length,
        type: res.headers()['content-type'] || '',
      });
    } catch {}
  });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const total = assets.reduce((s, a) => s + a.bytes, 0);
  console.log(`\n=== ${label} (${viewport.width}x${viewport.height}, dpr=2) ===`);
  console.log(`image assets: ${assets.length}   total: ${(total / 1024).toFixed(1)} KB`);
  assets.sort((a, b) => b.bytes - a.bytes).forEach((a) => {
    console.log(`  ${(a.bytes / 1024).toFixed(1).padStart(7)} KB  ${a.type.padEnd(20)}  ${a.url}`);
  });
  await ctx.close();
}
await browser.close();
