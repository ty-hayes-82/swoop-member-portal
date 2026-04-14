/**
 * Diagnostic 2: proper demo mode entry
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

test('Diagnostic: enter demo via Explore Demo Pinetree CC', async ({ page }) => {
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click "Explore without an account"
  const exploreBtn = page.getByRole('button', { name: /explore without an account/i });
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    await page.waitForTimeout(1000);
  }

  // Now look for "Explore Demo (Pinetree CC)"
  const pinetreeBtn = page.getByRole('button', { name: /explore demo.*pinetree/i });
  const pinetreeVisible = await pinetreeBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Pinetree CC Demo button visible:', pinetreeVisible);

  if (pinetreeVisible) {
    await pinetreeBtn.click();
    await page.waitForTimeout(4000);
  }

  const url = page.url();
  console.log('URL after demo entry:', url);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('Body text (2000 chars):', bodyText.slice(0, 2000));

  // Now try navigating to csv-import
  await page.goto(BASE + '/#/integrations/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const url2 = page.url();
  console.log('\nURL after csv-import navigation:', url2);

  const bodyText2 = await page.locator('body').innerText().catch(() => '');
  console.log('Body text on csv-import page (2000 chars):', bodyText2.slice(0, 2000));

  const headings = await page.locator('h1, h2, h3').allInnerTexts().catch(() => []);
  console.log('\nHeadings:', headings);

  const buttons = await page.locator('button').allInnerTexts().catch(() => []);
  console.log('Buttons (first 20):', buttons.slice(0, 20));
});

test('Diagnostic: try sidebar navigation to Import', async ({ page }) => {
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Enter demo
  const exploreBtn = page.getByRole('button', { name: /explore without an account/i });
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    await page.waitForTimeout(1000);
  }
  const pinetreeBtn = page.getByRole('button', { name: /explore demo.*pinetree/i });
  if (await pinetreeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pinetreeBtn.click();
    await page.waitForTimeout(5000);
  }

  const url = page.url();
  console.log('URL after demo entry:', url);
  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('Body snapshot:', bodyText.slice(0, 500));

  // Try Admin in nav
  const adminLink = page.getByRole('link', { name: /admin/i }).first();
  const adminVisible = await adminLink.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('\nAdmin link visible:', adminVisible);

  // Try looking for "Import" in nav
  const importLink = page.getByRole('link', { name: /import/i }).first();
  const importVisible = await importLink.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Import link visible:', importVisible);

  // Try direct hash routing
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const url2 = page.url();
  const text2 = await page.locator('body').innerText().catch(() => '');
  console.log('\n#/csv-import URL:', url2);
  console.log('#/csv-import body:', text2.slice(0, 500));
});
