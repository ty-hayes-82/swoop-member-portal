/**
 * Diagnostic 4: check console output and user object on csv-import page
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

test('Diagnostic: console logs on csv-import page after demo entry', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', e => errors.push(e.message));

  // 1. Enter demo
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const exploreBtn = page.getByRole('button', { name: /explore without an account/i });
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    await page.waitForTimeout(1000);
  }
  const pinetreeBtn = page.getByRole('button', { name: /explore demo.*pinetree/i });
  if (await pinetreeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pinetreeBtn.click();
    await page.waitForTimeout(4000);
  }

  // 2. Check localStorage before navigate
  const lsBefore = await page.evaluate(() => ({
    user: localStorage.getItem('swoop_auth_user'),
    token: localStorage.getItem('swoop_auth_token'),
    clubId: localStorage.getItem('swoop_club_id'),
  }));
  const parsedUser = lsBefore.user ? JSON.parse(lsBefore.user) : null;
  console.log('Before nav - user.role:', parsedUser?.role);
  console.log('Before nav - IMPORT_ALLOWED_ROLES has gm:', ['gm', 'admin', 'swoop_admin'].includes(parsedUser?.role));

  // 3. Navigate to csv-import
  await page.goto(BASE + '/#/integrations/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // 4. Check localStorage after navigate
  const lsAfter = await page.evaluate(() => ({
    user: localStorage.getItem('swoop_auth_user'),
    token: localStorage.getItem('swoop_auth_token'),
  }));
  const parsedUserAfter = lsAfter.user ? JSON.parse(lsAfter.user) : null;
  console.log('\nAfter nav - user.role:', parsedUserAfter?.role);
  console.log('After nav - token:', lsAfter.token);

  // 5. Try to read React user state from window (if exposed)
  const windowUser = await page.evaluate(() => window.__swoop_debug_user || null).catch(() => null);
  console.log('Window debug user:', windowUser);

  // 6. Check body
  const body = await page.locator('body').innerText().catch(() => '');
  console.log('\nBody snippet:', body.slice(0, 500));

  // 7. Check for wizard elements
  const heading = page.getByRole('heading', { name: /import data/i });
  const headingVisible = await heading.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('\nImport Data heading visible:', headingVisible);

  // 8. Check for restriction message
  const restrictionText = await page.locator('text=CSV import is restricted').isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Restriction message visible:', restrictionText);

  // 9. Try via navigate approach (via link/button)
  console.log('\n--- NAVIGATING VIA ADMIN HUB ---');
  await page.goto(BASE + '/#/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const adminBody = await page.locator('body').innerText().catch(() => '');
  console.log('Admin page body snippet:', adminBody.slice(0, 500));

  // Look for Open Upload Tool button
  const uploadBtn = page.getByRole('button', { name: /open upload tool/i });
  const uploadVisible = await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Open Upload Tool button visible:', uploadVisible);

  if (uploadVisible) {
    await uploadBtn.click();
    await page.waitForTimeout(2000);
    const csvBody = await page.locator('body').innerText().catch(() => '');
    console.log('\nAfter clicking Upload Tool - body snippet:', csvBody.slice(0, 500));
    const heading2 = page.getByRole('heading', { name: /import data/i });
    const h2Visible = await heading2.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Import Data heading visible after Upload click:', h2Visible);
  }

  console.log('\nConsole messages (first 20):');
  consoleMessages.slice(0, 20).forEach(m => console.log(' ', m));
  console.log('JS errors:', errors.length ? errors : 'none');
});
