import { chromium } from 'playwright';

const URL = process.env.LANDING_URL || 'http://localhost:5173/#/landing';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
const consoleLogs = [];
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}\n${e.stack}`));
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  }
});
page.on('requestfailed', (req) => consoleLogs.push(`REQ FAILED: ${req.url()} — ${req.failure()?.errorText}`));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);

const metrics = await page.evaluate(() => {
  const body = document.body;
  const main = document.querySelector('main');
  const sections = Array.from(document.querySelectorAll('section')).map((s, i) => ({
    idx: i,
    id: s.id || '(no id)',
    className: s.className,
    height: s.getBoundingClientRect().height,
    top: s.getBoundingClientRect().top + window.scrollY,
  }));
  return {
    bodyScrollHeight: body.scrollHeight,
    bodyClientHeight: body.clientHeight,
    mainScrollHeight: main?.scrollHeight || null,
    sectionCount: sections.length,
    sections,
  };
});

console.log('--- METRICS ---');
console.log(JSON.stringify(metrics, null, 2));
console.log('--- PAGE ERRORS ---');
console.log(errors.join('\n---\n') || '(none)');
console.log('--- CONSOLE ERRORS/WARNINGS ---');
console.log(consoleLogs.join('\n') || '(none)');

await browser.close();
