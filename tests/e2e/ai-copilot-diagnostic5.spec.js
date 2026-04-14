/**
 * Diagnostic 5: navigate within SPA using hash change (no full reload)
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

test('Diagnostic: navigate via hash (no full reload) after demo login', async ({ page }) => {
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('auth') || msg.text().includes('role') || msg.text().includes('user')) {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

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

  // 2. Navigate via hash change (SPA navigation — no full page reload)
  await page.evaluate(() => { window.location.hash = '#/csv-import'; });
  await page.waitForTimeout(3000);

  const body = await page.locator('body').innerText().catch(() => '');
  console.log('Body after hash nav (1000 chars):', body.slice(0, 1000));

  const restrictionVisible = await page.locator('text=CSV import is restricted').isVisible({ timeout: 2000 }).catch(() => false);
  const wizardVisible = await page.locator('text=Jonas').isVisible({ timeout: 2000 }).catch(() => false);
  const fileDropZone = await page.locator('text=Drop your file here').isVisible({ timeout: 2000 }).catch(() => false);
  console.log('\nRestriction visible:', restrictionVisible);
  console.log('Jonas vendor visible:', wizardVisible);
  console.log('File dropzone visible:', fileDropZone);

  // 3. Try navigating via Admin → Open Upload Tool
  await page.evaluate(() => { window.location.hash = '#/admin'; });
  await page.waitForTimeout(2000);
  const uploadBtn = page.getByRole('button', { name: /open upload tool/i });
  if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('\nClicking Open Upload Tool from admin...');
    await uploadBtn.click();
    await page.waitForTimeout(3000);
    const body2 = await page.locator('body').innerText().catch(() => '');
    console.log('Body after Upload Tool click (1000 chars):', body2.slice(0, 1000));
    const wizardVisible2 = await page.locator('text=Jonas').isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Jonas vendor visible after Upload Tool click:', wizardVisible2);
  }

  // 4. Try navigation via integrations/csv-import hash
  await page.evaluate(() => { window.location.hash = '#/integrations/csv-import'; });
  await page.waitForTimeout(3000);
  const body3 = await page.locator('body').innerText().catch(() => '');
  console.log('\nBody after #/integrations/csv-import hash nav (1000 chars):', body3.slice(0, 1000));

  console.log('\nConsole messages:', consoleMessages);
});

test('Diagnostic: check API auth response for demo token', async ({ page }) => {
  // Enter demo first
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

  // Manually call the auth endpoint with token 'demo'
  const authResult = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/auth', {
        headers: { Authorization: 'Bearer demo' },
      });
      const text = await res.text();
      return { status: res.status, body: text };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Auth API response for demo token:', authResult);
});
