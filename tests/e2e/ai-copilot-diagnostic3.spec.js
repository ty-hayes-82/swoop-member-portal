/**
 * Diagnostic 3: check localStorage after demo login
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

test('Diagnostic: inspect localStorage user role after demo login', async ({ page }) => {
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click "Explore without an account"
  const exploreBtn = page.getByRole('button', { name: /explore without an account/i });
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    await page.waitForTimeout(1000);
  }

  // Click "Explore Demo (Pinetree CC)"
  const pinetreeBtn = page.getByRole('button', { name: /explore demo.*pinetree/i });
  if (await pinetreeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pinetreeBtn.click();
    await page.waitForTimeout(4000);
  }

  // Read localStorage
  const ls = await page.evaluate(() => {
    return {
      token: localStorage.getItem('swoop_auth_token'),
      user: localStorage.getItem('swoop_auth_user'),
      clubId: localStorage.getItem('swoop_club_id'),
      clubName: localStorage.getItem('swoop_club_name'),
    };
  });
  console.log('localStorage token:', ls.token);
  console.log('localStorage user:', ls.user);
  console.log('localStorage clubId:', ls.clubId);
  console.log('localStorage clubName:', ls.clubName);

  // Parse user
  let userObj = null;
  try {
    userObj = JSON.parse(ls.user);
    console.log('Parsed user role:', userObj?.role);
  } catch (e) {
    console.log('Could not parse user:', e.message);
  }

  // Now navigate to CSV import
  await page.goto(BASE + '/#/integrations/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check localStorage again (might have been cleared)
  const ls2 = await page.evaluate(() => {
    return {
      token: localStorage.getItem('swoop_auth_token'),
      user: localStorage.getItem('swoop_auth_user'),
    };
  });
  console.log('\nAfter navigation - localStorage token:', ls2.token);
  console.log('After navigation - localStorage user:', ls2.user);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('\nBody on csv-import page (1000 chars):', bodyText.slice(0, 1000));

  // Check via #/csv-import route too
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const bodyText2 = await page.locator('body').innerText().catch(() => '');
  console.log('\nBody on #/csv-import page (1000 chars):', bodyText2.slice(0, 1000));
});

test('Diagnostic: inject GM user directly and navigate', async ({ page }) => {
  await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Inject GM user directly
  await page.evaluate(() => {
    const demoUser = {
      userId: 'demo',
      clubId: 'demo_test123',
      name: 'Demo User',
      email: 'demo@swoopgolf.com',
      phone: '',
      role: 'gm',
      title: 'General Manager',
      isDemoSession: true,
    };
    localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', 'demo_test123');
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
  });

  await page.goto(BASE + '/#/integrations/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  console.log('Body on csv-import with injected GM user (2000 chars):', bodyText.slice(0, 2000));

  const headings = await page.locator('h1, h2, h3').allInnerTexts().catch(() => []);
  console.log('Headings:', headings);

  const buttons = await page.locator('button').allInnerTexts().catch(() => []);
  console.log('Buttons (first 20):', buttons.slice(0, 20));

  const fileInputCount = await page.locator('[data-testid="wizard-file-input"]').count();
  console.log('wizard-file-input count:', fileInputCount);
});
