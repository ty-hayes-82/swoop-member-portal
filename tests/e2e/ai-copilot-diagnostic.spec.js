/**
 * Diagnostic: discover what's actually on the page
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

test('Diagnostic: page state after demo mode + navigate to csv-import', async ({ page }) => {
  // 1. Land on root
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Snapshot what's on screen
  const bodyText1 = await page.locator('body').innerText().catch(() => '(error)');
  console.log('=== BODY TEXT AFTER INITIAL LOAD (first 1000 chars) ===');
  console.log(bodyText1.slice(0, 1000));

  // Try explore button
  const exploreBtn = page.getByRole('button', { name: /explore without an account/i });
  const exploreVisible = await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('\n=== Explore button visible:', exploreVisible);

  if (exploreVisible) {
    await exploreBtn.click();
    await page.waitForTimeout(1000);
    const bodyText2 = await page.locator('body').innerText().catch(() => '(error)');
    console.log('\n=== BODY TEXT AFTER EXPLORE CLICK (first 1000 chars) ===');
    console.log(bodyText2.slice(0, 1000));

    // Look for Full Demo
    const fullDemoBtn = page.getByRole('button', { name: /full demo/i });
    const demoVisible = await fullDemoBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('\n=== Full Demo button visible:', demoVisible);
    if (demoVisible) {
      await fullDemoBtn.click();
      await page.waitForTimeout(4000);
    }
  }

  // Current URL
  const url = page.url();
  console.log('\n=== Current URL:', url);

  // Navigate to csv-import
  await page.goto(BASE + '/#/integrations/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  console.log('\n=== URL after navigation:', finalUrl);

  const bodyText3 = await page.locator('body').innerText().catch(() => '(error)');
  console.log('\n=== BODY TEXT ON CSV IMPORT PAGE (first 2000 chars) ===');
  console.log(bodyText3.slice(0, 2000));

  // Look for headings
  const headings = await page.locator('h1, h2, h3, h4').allInnerTexts().catch(() => []);
  console.log('\n=== ALL HEADINGS:', headings);

  // Check for any buttons
  const buttons = await page.locator('button').allInnerTexts().catch(() => []);
  console.log('\n=== ALL BUTTONS (first 20):', buttons.slice(0, 20));

  // Check for the file input
  const fileInput = page.locator('[data-testid="wizard-file-input"]');
  const fileInputCount = await fileInput.count();
  console.log('\n=== wizard-file-input count:', fileInputCount);

  // Check for any input elements
  const inputs = await page.locator('input').evaluateAll(els =>
    els.map(el => ({ type: el.type, name: el.name, id: el.id, testId: el.dataset?.testid }))
  ).catch(() => []);
  console.log('\n=== ALL INPUTS:', inputs);
});

test('Diagnostic: step 1 navigation', async ({ page }) => {
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const exploreBtn = page.getByRole('button', { name: /explore without an account/i });
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    await page.waitForTimeout(1000);
    const fullDemoBtn = page.getByRole('button', { name: /full demo/i });
    if (await fullDemoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fullDemoBtn.click();
      await page.waitForTimeout(4000);
    }
  }

  await page.goto(BASE + '/#/integrations/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('=== URL:', page.url());
  const allText = await page.locator('body').innerText().catch(() => '');
  console.log('=== Page text (2000 chars):', allText.slice(0, 2000));

  // Try clicking Jonas
  const jonasBtn = page.getByRole('button', { name: /jonas/i }).first();
  const jonasVisible = await jonasBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('\n=== Jonas button visible:', jonasVisible);

  if (jonasVisible) {
    await jonasBtn.click();
    await page.waitForTimeout(500);

    const afterJonas = await page.locator('body').innerText().catch(() => '');
    console.log('\n=== After Jonas click (1000 chars):', afterJonas.slice(0, 1000));

    // Select Members
    const membersBtn = page.getByRole('button', { name: /^members$/i }).first();
    const membersVisible = await membersBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('\n=== Members button visible:', membersVisible);

    if (membersVisible) {
      await membersBtn.click();
      await page.waitForTimeout(300);
    }

    // Find and click Next
    const buttons = await page.locator('button').allInnerTexts().catch(() => []);
    console.log('\n=== Buttons after Jonas+Members select:', buttons);

    const nextBtn = page.getByRole('button', { name: /next/i }).first();
    const nextVisible = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('\n=== Next button visible:', nextVisible);

    if (nextVisible) {
      await nextBtn.click();
      await page.waitForTimeout(2000);

      const step1Text = await page.locator('body').innerText().catch(() => '');
      console.log('\n=== Step 1 page text (2000 chars):', step1Text.slice(0, 2000));

      const fileInputCount = await page.locator('[data-testid="wizard-file-input"]').count();
      const allInputs = await page.locator('input[type="file"]').count();
      console.log('\n=== wizard-file-input count:', fileInputCount);
      console.log('=== file inputs total:', allInputs);
    }
  }
});
