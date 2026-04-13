import { test } from '@playwright/test';

test('wait for challenge then navigate', async ({ page }) => {
  page.on('console', m => console.log('  [page]', m.text()));
  await page.goto('https://swoop-member-portal.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('  initial title:', await page.title().catch(() => 'CLOSED'));
  // Wait up to 90s for the security checkpoint to resolve.
  for (let i = 0; i < 18; i++) {
    await page.waitForTimeout(5000);
    let t = 'CLOSED';
    try { t = await page.title(); } catch {}
    console.log(`  +${(i+1)*5}s title:`, t);
    if (!t.includes('Security Checkpoint') && t !== 'CLOSED') {
      console.log('  resolved url:', page.url());
      return;
    }
  }
  console.log('  TIMEOUT — challenge did not resolve in 90s');
});
