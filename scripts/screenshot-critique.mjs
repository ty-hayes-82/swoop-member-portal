/**
 * Capture full-page + sliced screenshots of all 5 landing pages from Vercel.
 * Usage: node scripts/screenshot-critique.mjs [round-name]
 * e.g.:  node scripts/screenshot-critique.mjs r16
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.SITE_URL || 'https://swoop-member-intelligence-website.vercel.app';
const ROUND = process.argv[2] || 'r16';
const OUT = path.resolve(`.screenshots/${ROUND}`);
await mkdir(OUT, { recursive: true });

const PAGES = [
  { name: 'home',     hash: '#/landing'  },
  { name: 'platform', hash: '#/platform' },
  { name: 'pricing',  hash: '#/pricing'  },
  { name: 'about',    hash: '#/about'    },
  { name: 'contact',  hash: '#/contact'  },
];

const browser = await chromium.launch({ headless: true });

for (const pg of PAGES) {
  const url = `${BASE}/${pg.hash}`;
  console.log(`\n→ ${pg.name}  ${url}`);

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('  PAGEERROR:', e.message));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Full-page shot
  const fullPath = path.join(OUT, `${pg.name}-full.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`  full → ${fullPath}`);

  // Hero (above fold)
  const heroPath = path.join(OUT, `${pg.name}-hero.png`);
  await page.screenshot({ path: heroPath, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log(`  hero → ${heroPath}`);

  // Slices (900px strips)
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const sliceH = 900;
  let y = 0, i = 0;
  while (y < totalHeight && i < 20) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(400);
    const slicePath = path.join(OUT, `${pg.name}-slice-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: slicePath });
    console.log(`  slice-${i} y=${y}`);
    y += sliceH;
    i++;
  }

  await ctx.close();
}

// Mobile — home page only
const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mPage = await mCtx.newPage();
await mPage.goto(`${BASE}/#/landing`, { waitUntil: 'networkidle', timeout: 60000 });
await mPage.waitForTimeout(2000);
await mPage.screenshot({ path: path.join(OUT, 'home-mobile-full.png'), fullPage: true });
console.log('\n  mobile-full saved');
await mCtx.close();

await browser.close();
console.log(`\n✓ All screenshots saved to .screenshots/${ROUND}/`);
