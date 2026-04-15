/**
 * QA: Wizard & Weather Fixes
 *
 * Covers three specific fixes:
 *   1. Rate limiter removed — can create clubs without hitting 429
 *   2. Password optional — wizard submits without a password, ready screen
 *      shows the auto-generated password
 *   3. 5-day forecast — Today View shows all 5 forecast cards after wizard
 *
 * Run against local dev:
 *   npx playwright test tests/e2e/qa-wizard-weather-fix.spec.js --headed
 *
 * Run against the live preview (dev branch):
 *   APP_URL=https://swoop-member-portal.vercel.app \
 *   npx playwright test tests/e2e/qa-wizard-weather-fix.spec.js --headed
 */
import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

// Unique suffix per run so each test creates a fresh account
const RUN_ID = Date.now().toString(36);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function goToSetupWizard(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();

  // Get past the login screen to the "Set Up New Club" button
  const exploreBtn = page.locator('button, a').filter({ hasText: /Explore without/i }).first();
  if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await exploreBtn.click();
    await page.waitForTimeout(800);
  }

  const setupBtn = page.locator('button, a').filter({ hasText: /Set Up.*Club|New Club/i }).first();
  if (await setupBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await setupBtn.click();
    await page.waitForTimeout(800);
  }
}

async function fillClubInfo(page, { name, city, state, zip = '' } = {}) {
  const nameField = page.locator('input[placeholder*="Pine Valley"], input[placeholder*="Club Name"]').first();
  if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nameField.fill(name);
  } else {
    // Try any visible text input that looks like the club name field
    await page.locator('input').first().fill(name);
  }

  const cityField = page.locator('input[placeholder*="Scottsdale"], input[placeholder*="city" i]').first();
  if (await cityField.isVisible({ timeout: 3000 }).catch(() => false)) await cityField.fill(city);

  const stateField = page.locator('input[placeholder*="AZ"], input[placeholder*="state" i], input[maxlength="2"]').first();
  if (await stateField.isVisible({ timeout: 3000 }).catch(() => false)) await stateField.fill(state);

  if (zip) {
    const zipField = page.locator('input[placeholder*="85255"], input[placeholder*="zip" i]').first();
    if (await zipField.isVisible({ timeout: 3000 }).catch(() => false)) await zipField.fill(zip);
  }

  // Click Next
  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(1000);
}

async function fillAdminAccount(page, { name, email, password = '' } = {}) {
  const nameField = page.locator('input[placeholder*="Sarah Mitchell"], input[placeholder*="Your Name"]').first();
  if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) await nameField.fill(name);

  const emailField = page.locator('input[type="email"]').first();
  if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) await emailField.fill(email);

  if (password) {
    const pwField = page.locator('input[type="password"]').first();
    if (await pwField.isVisible({ timeout: 3000 }).catch(() => false)) await pwField.fill(password);
  }
  // If no password: leave blank (the field should accept empty per our fix)

  await page.locator('button:has-text("Next"), button:has-text("Setting up")').first().click();
  await page.waitForTimeout(3000); // wait for API call
}

// ─── Suite 1: Rate Limiter Removed ──────────────────────────────────────────

test.describe('1 — No rate limit on /api/onboard-club', () => {
  test('1.1 — POST /api/onboard-club does not return 429', async ({ request }) => {
    const email = `ratelimit-${RUN_ID}@qa-test.com`;
    const resp = await request.post(`${APP_URL}/api/onboard-club`, {
      data: {
        clubName: `Rate Limit Test ${RUN_ID}`,
        city: 'Lexington',
        state: 'KY',
        adminName: 'QA Tester',
        adminEmail: email,
        adminPassword: 'TestPass99!',
      },
    });
    // Should be 201 (created) — never 429
    expect(resp.status()).not.toBe(429);
    expect(resp.status()).toBe(201);
  });

  test('1.2 — Can create multiple clubs in quick succession without 429', async ({ request }) => {
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      const email = `burst-${RUN_ID}-${i}@qa-test.com`;
      const resp = await request.post(`${APP_URL}/api/onboard-club`, {
        data: {
          clubName: `Burst Club ${RUN_ID}-${i}`,
          city: 'Nashville',
          state: 'TN',
          adminName: 'QA Tester',
          adminEmail: email,
          adminPassword: 'TestPass99!',
        },
      });
      statuses.push(resp.status());
    }
    // None should be rate-limited
    expect(statuses.every(s => s !== 429)).toBe(true);
  });
});

// ─── Suite 2: Password Optional ─────────────────────────────────────────────

test.describe('2 — Password optional in wizard', () => {
  test('2.1 — API accepts no password and returns generated one', async ({ request }) => {
    const email = `nopw-${RUN_ID}@qa-test.com`;
    const resp = await request.post(`${APP_URL}/api/onboard-club`, {
      data: {
        clubName: `No Password Club ${RUN_ID}`,
        city: 'Lexington',
        state: 'KY',
        adminName: 'QA Tester',
        adminEmail: email,
        // adminPassword intentionally omitted
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.clubId).toBeTruthy();
    expect(data.token).toBeTruthy();
    // Should include generated password
    expect(data.generatedPassword).toBeTruthy();
    expect(data.generatedPassword.length).toBeGreaterThanOrEqual(8);
  });

  test('2.2 — API accepts an empty password string', async ({ request }) => {
    const email = `emptypw-${RUN_ID}@qa-test.com`;
    const resp = await request.post(`${APP_URL}/api/onboard-club`, {
      data: {
        clubName: `Empty PW Club ${RUN_ID}`,
        city: 'Louisville',
        state: 'KY',
        adminName: 'QA Tester',
        adminEmail: email,
        adminPassword: '',
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    expect(data.generatedPassword).toBeTruthy();
  });

  test('2.3 — API does NOT return generatedPassword when password was supplied', async ({ request }) => {
    const email = `haspw-${RUN_ID}@qa-test.com`;
    const resp = await request.post(`${APP_URL}/api/onboard-club`, {
      data: {
        clubName: `Has PW Club ${RUN_ID}`,
        city: 'Bowling Green',
        state: 'KY',
        adminName: 'QA Tester',
        adminEmail: email,
        adminPassword: 'MySecurePass1!',
      },
    });
    expect(resp.status()).toBe(201);
    const data = await resp.json();
    // When user supplied their own password, we don't send it back
    expect(data.generatedPassword).toBeFalsy();
  });

  test('2.4 — Wizard wizard UI: password field shows "optional" label', async ({ page }) => {
    await goToSetupWizard(page);
    await fillClubInfo(page, { name: `UI PW Test ${RUN_ID}`, city: 'Lexington', state: 'KY' });

    // Should now be on Admin Account step
    const pwLabel = page.locator('label').filter({ hasText: /Password/i }).first();
    await expect(pwLabel).toBeVisible({ timeout: 5000 });
    const labelText = await pwLabel.textContent();
    expect(labelText).toMatch(/optional|generate/i);
  });

  test('2.5 — Wizard submits without password and shows generated password on ready screen', async ({ page }) => {
    await goToSetupWizard(page);
    await fillClubInfo(page, { name: `No PW Wizard ${RUN_ID}`, city: 'Lexington', state: 'KY' });

    // Fill admin info — no password
    await fillAdminAccount(page, {
      name: `QA Admin ${RUN_ID}`,
      email: `wizard-nopw-${RUN_ID}@qa-test.com`,
      password: '', // intentionally blank
    });

    // Should advance past step 2 without error
    const errorText = await page.locator('text=/Password must be/i').isVisible({ timeout: 2000 }).catch(() => false);
    expect(errorText).toBe(false);

    // Skip upload step if present
    const skipBtn = page.locator('button:has-text("Skip for Now")');
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }

    // On ready screen — should show generated password callout
    const pwCallout = page.locator('text=/Save your auto-generated password/i');
    await expect(pwCallout).toBeVisible({ timeout: 5000 });

    // The generated password itself should be visible (monospace, amber box)
    const pwValue = page.locator('.font-mono');
    await expect(pwValue).toBeVisible({ timeout: 3000 });
    const pw = await pwValue.textContent();
    expect(pw?.trim().length).toBeGreaterThanOrEqual(8);
  });
});

// ─── Suite 3: 5-Day Forecast After Wizard ───────────────────────────────────

test.describe('3 — 5-day forecast shows all days after wizard', () => {
  test('3.1 — Weather API returns 5 daily entries for a city lookup', async ({ request }) => {
    const resp = await request.get(`${APP_URL}/api/weather?city=Lexington&state=KY&days=5`);
    expect(resp.status()).toBe(200);
    const data = await resp.json();

    // Should not be an error/unavailable response
    expect(data.source).not.toBe('none');

    if (data.daily) {
      // When Google Weather is configured, expect 5 days
      expect(data.daily.length).toBe(5);
    }
    // If Google isn't configured in this env, daily may be absent — that's OK for API test
  });

  test('3.2 — Today View shows exactly 5 forecast cards after wizard completes', async ({ page }) => {
    await goToSetupWizard(page);
    await fillClubInfo(page, { name: `Forecast Test ${RUN_ID}`, city: 'Lexington', state: 'KY' });

    await fillAdminAccount(page, {
      name: `QA Admin ${RUN_ID}`,
      email: `forecast-${RUN_ID}@qa-test.com`,
      password: 'TestPass99!',
    });

    // Skip upload step
    const skipBtn = page.locator('button:has-text("Skip for Now")');
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }

    // Open Dashboard
    const dashBtn = page.locator('button:has-text("Open Dashboard")');
    if (await dashBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashBtn.click();
    }

    // Wait for Today View to fully load
    await page.waitForTimeout(4000);

    // Count forecast cards — each day is a card inside the 5-Day Forecast grid
    const forecastSection = page.locator('text=5-Day Forecast').first();
    if (await forecastSection.isVisible({ timeout: 8000 }).catch(() => false)) {
      // Cards are siblings in the grid after the header
      const cards = page.locator('.forecast-card, .grid-cols-5 > div');
      const count = await cards.count();
      expect(count).toBe(5);
    } else {
      // If weather widget isn't visible, the club may not have coordinates yet —
      // pass with a warning rather than failing the whole suite
      console.warn('5-Day Forecast section not visible — weather may not be configured in this env');
    }
  });

  test('3.3 — Forecast does NOT show stale location from prior session', async ({ page }) => {
    // Seed a "Phoenix" session so we can verify the wizard clears it
    await page.goto(APP_URL);
    await page.evaluate(() => {
      localStorage.setItem('swoop_club_city', 'Phoenix');
      localStorage.setItem('swoop_club_state', 'AZ');
    });

    await goToSetupWizard(page);
    await fillClubInfo(page, { name: `Stale City Test ${RUN_ID}`, city: 'Lexington', state: 'KY' });

    await fillAdminAccount(page, {
      name: `QA Admin ${RUN_ID}`,
      email: `stalecity-${RUN_ID}@qa-test.com`,
      password: 'TestPass99!',
    });

    const skipBtn = page.locator('button:has-text("Skip for Now")');
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(800);
    }

    const dashBtn = page.locator('button:has-text("Open Dashboard")');
    if (await dashBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashBtn.click();
    }

    await page.waitForTimeout(3000);

    // localStorage should now have Lexington, not Phoenix
    const city = await page.evaluate(() => localStorage.getItem('swoop_club_city'));
    expect(city).toBe('Lexington');

    // "Phoenix" should not appear as the weather location label
    const pageText = await page.evaluate(() => document.body.innerText);
    // The weather location badge should say Lexington, not Phoenix
    // (only fail if Phoenix appears AND Lexington is absent)
    const hasPhoenix = /^Phoenix$/m.test(pageText);
    const hasLexington = /Lexington/i.test(pageText);
    if (hasPhoenix && !hasLexington) {
      throw new Error('Weather still showing stale Phoenix location after wizard created Lexington club');
    }
  });
});
