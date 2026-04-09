// Test: Refreshing on each page in guided demo mode should not crash
import { test, expect } from '@playwright/test';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function enterGuidedDemo(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Explore without an account/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Guided Demo/i }).click();
  await page.waitForTimeout(2000);
}

const pages = ['today', 'members', 'tee-sheet', 'service', 'automations', 'board-report'];

for (const route of pages) {
  test(`Refresh on #/${route} does not crash (zero data)`, async ({ page }) => {
    await enterGuidedDemo(page);

    // Capture JS errors
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    // Navigate to the page via hash
    await page.goto(`${APP_URL}#/${route}`);
    await page.waitForTimeout(2000);

    // Hard refresh (simulates F5)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({ path: `test-results/refresh-${route}.png`, fullPage: true });

    // Page should not be blank/white
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);

    // Should not show React error boundary or "Something went wrong"
    expect(bodyText).not.toContain('Something went wrong');
    expect(bodyText).not.toContain('Unhandled Runtime Error');

    // No uncaught JS exceptions
    if (jsErrors.length > 0) {
      console.log(`JS errors on ${route}:`, jsErrors);
    }
    expect(jsErrors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
  });
}

// Test refresh AFTER importing members (the state the user described)
test('Refresh on #/tee-sheet after members import', async ({ page }) => {
  await enterGuidedDemo(page);

  // Import members gate
  await page.evaluate(() => {
    sessionStorage.setItem('swoop_demo_files', JSON.stringify(['JCM_Members_F9']));
    sessionStorage.setItem('swoop_demo_gates', JSON.stringify(['members']));
    window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed'));
  });
  await page.waitForTimeout(500);

  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto(`${APP_URL}#/tee-sheet`);
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/refresh-tee-sheet-after-members.png', fullPage: true });
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText.length).toBeGreaterThan(50);
  expect(bodyText).not.toContain('Something went wrong');
  expect(jsErrors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
});

test('Refresh on #/automations after members import', async ({ page }) => {
  await enterGuidedDemo(page);

  await page.evaluate(() => {
    sessionStorage.setItem('swoop_demo_files', JSON.stringify(['JCM_Members_F9']));
    sessionStorage.setItem('swoop_demo_gates', JSON.stringify(['members']));
    window.dispatchEvent(new CustomEvent('swoop:demo-sources-changed'));
  });
  await page.waitForTimeout(500);

  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await page.goto(`${APP_URL}#/automations`);
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/refresh-automations-after-members.png', fullPage: true });
  const bodyText = await page.evaluate(() => document.body.innerText);
  expect(bodyText.length).toBeGreaterThan(50);
  expect(bodyText).not.toContain('Something went wrong');
  expect(jsErrors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
});
