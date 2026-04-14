/**
 * Capture full-page screenshots of all 5 landing pages at desktop and mobile.
 * Usage: node scripts/screenshot-fullpage.mjs [round-name]
 * e.g.:  SITE_URL=http://localhost:5173 node scripts/screenshot-fullpage.mjs r20
 *
 * Output: .screenshots/{round}/
 *   home-desktop.png, home-mobile.png
 *   platform-desktop.png, platform-mobile.png
 *   pricing-desktop.png, pricing-mobile.png
 *   about-desktop.png, about-mobile.png
 *   contact-desktop.png, contact-mobile.png
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE  = process.env.SITE_URL || 'https://swoop-member-intelligence-website.vercel.app';
const ROUND = process.argv[2] || 'r20';
const OUT   = path.resolve(`.screenshots/${ROUND}`);

await mkdir(OUT, { recursive: true });

const PAGES = [
  { name: 'home',     hash: '#/landing'  },
  { name: 'platform', hash: '#/platform' },
  { name: 'pricing',  hash: '#/pricing'  },
  { name: 'about',    hash: '#/about'    },
  { name: 'contact',  hash: '#/contact'  },
];

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900  },
  { label: 'mobile',  width: 390,  height: 844  },
];

const browser = await chromium.launch({ headless: true });

for (const pg of PAGES) {
  for (const vp of VIEWPORTS) {
    const url  = `${BASE}/${pg.hash}`;
    const file = path.join(OUT, `${pg.name}-${vp.label}.png`);

    console.log(`→ ${pg.name} (${vp.label})  ${url}`);

    const ctx = await browser.newContext({
      viewport:         { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Extra wait for fonts / animations
    await page.waitForTimeout(1200);

    // Scroll through the page to trigger lazy-loads (best-effort)
    try {
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let total = 0;
          const step = () => {
            window.scrollBy(0, 400);
            total += 400;
            if (total < document.body.scrollHeight) requestAnimationFrame(step);
            else { window.scrollTo(0, 0); resolve(); }
          };
          requestAnimationFrame(step);
        });
      });
      await page.waitForTimeout(600);
    } catch {
      // Navigation or context destroyed during scroll — proceed to screenshot
      await page.waitForTimeout(400);
    }

    await page.screenshot({ path: file, fullPage: true });
    console.log(`  saved → ${file}`);

    await ctx.close();
  }
}

await browser.close();
console.log(`\n✓ All screenshots saved to .screenshots/${ROUND}/`);
