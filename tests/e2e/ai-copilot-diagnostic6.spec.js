/**
 * Diagnostic 6: inject user via page.addInitScript to run before React
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5174';

test('Diagnostic: use addInitScript to set localStorage before page loads', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Set localStorage BEFORE the page loads
  await page.addInitScript(() => {
    const demoUser = {
      userId: 'demo',
      clubId: 'demo_playwright',
      name: 'Demo User',
      email: 'demo@swoopgolf.com',
      phone: '',
      role: 'gm',
      title: 'General Manager',
      isDemoSession: true,
    };
    localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', 'demo_playwright');
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
  });

  // Navigate directly to csv-import
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const body = await page.locator('body').innerText().catch(() => '');
  console.log('Body (2000 chars):', body.slice(0, 2000));

  const restrictionVisible = await page.locator('text=CSV import is restricted').isVisible({ timeout: 2000 }).catch(() => false);
  const wizardVisible = await page.locator('text=Jonas').isVisible({ timeout: 2000 }).catch(() => false);
  const dropzone = await page.locator('text=Drop your file here').isVisible({ timeout: 2000 }).catch(() => false);

  console.log('Restriction visible:', restrictionVisible);
  console.log('Jonas vendor visible:', wizardVisible);
  console.log('File dropzone visible:', dropzone);
  console.log('JS errors:', errors);
});

test('Diagnostic: use addInitScript to set localStorage, navigate via hash change', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Set localStorage BEFORE the page loads
  await page.addInitScript(() => {
    const demoUser = {
      userId: 'demo',
      clubId: 'demo_playwright',
      name: 'Demo User',
      email: 'demo@swoopgolf.com',
      phone: '',
      role: 'gm',
      title: 'General Manager',
      isDemoSession: true,
    };
    localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', 'demo_playwright');
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
  });

  // Start on home page first (authed)
  await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const body1 = await page.locator('body').innerText().catch(() => '');
  console.log('Home page body snippet:', body1.slice(0, 300));

  // Now navigate via SPA hash
  await page.evaluate(() => { window.location.hash = '#/csv-import'; });
  await page.waitForTimeout(3000);

  const body2 = await page.locator('body').innerText().catch(() => '');
  console.log('\nCSV import page body (2000 chars):', body2.slice(0, 2000));

  const wizardVisible = await page.locator('text=Jonas').isVisible({ timeout: 2000 }).catch(() => false);
  const dropzone = await page.locator('text=Drop your file here').isVisible({ timeout: 2000 }).catch(() => false);
  const fileInput = await page.locator('[data-testid="wizard-file-input"]').count();

  console.log('Jonas vendor visible:', wizardVisible);
  console.log('File dropzone visible:', dropzone);
  console.log('wizard-file-input count:', fileInput);
  console.log('JS errors:', errors.filter(e => !e.includes('favicon')));
});
