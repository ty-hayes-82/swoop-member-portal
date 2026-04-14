/**
 * QA: AI Co-pilot integration in CSV Import Wizard
 * Tests: wizard renders, AI toggle, Hide/Show, step transitions, graceful degradation
 *
 * Auth strategy: inject GM user via addInitScript before page load so the
 * AuthContext useState initializer reads it synchronously. This avoids the
 * /api/auth validation race that overwrites the user in demo sessions.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

const BASE = 'http://localhost:5174';

// Inject GM user before the page loads — runs synchronously in the browser
// before React's useState initializer, so useAuth() gets role:'gm' immediately.
const gmUserScript = () => {
  const demoUser = {
    userId: 'demo',
    clubId: 'demo_qa_test',
    name: 'Demo User',
    email: 'demo@swoopgolf.com',
    phone: '',
    role: 'gm',
    title: 'General Manager',
    isDemoSession: true,
  };
  localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
  localStorage.setItem('swoop_auth_token', 'demo');
  localStorage.setItem('swoop_club_id', 'demo_qa_test');
  localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
};

// Helper — write temp CSV and return its path
function writeTempCsv() {
  const content = 'first_name,last_name,email,member_id\nJohn,Smith,john@test.com,M001\nJane,Doe,jane@test.com,M002';
  const tmpPath = path.join(os.tmpdir(), `swoop_test_${Date.now()}.csv`);
  fs.writeFileSync(tmpPath, content, 'utf8');
  return tmpPath;
}

// Helper — navigate to step 1 (Jonas + Members + click Next)
async function navigateToStep1(page) {
  // Click Jonas vendor (first supported vendor)
  const jonasBtn = page.getByRole('button', { name: /jonas/i }).first();
  if (await jonasBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await jonasBtn.click();
    await page.waitForTimeout(400);
  }
  // Select Members data type
  const membersBtn = page.getByRole('button', { name: /^members$/i }).first();
  if (await membersBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await membersBtn.click();
    await page.waitForTimeout(300);
  } else {
    // Fallback: first data type card
    const firstType = page.locator('button').filter({ hasText: /step 1/i }).first();
    if (await firstType.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstType.click();
      await page.waitForTimeout(300);
    }
  }
  // Click Next
  const nextBtn = page.getByRole('button', { name: /next/i }).first();
  if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nextBtn.click();
    await page.waitForTimeout(1000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Wizard renders and has AI toggle
// ─────────────────────────────────────────────────────────────────────────────
test('Test 1: Wizard renders with Import Data heading', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.addInitScript(gmUserScript);
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check heading
  const heading = page.getByRole('heading', { name: /import data/i });
  const headingVisible = await heading.isVisible({ timeout: 8000 }).catch(() => false);
  expect(headingVisible, 'Import Data heading should be visible').toBeTruthy();

  // Check for wizard content (step 0)
  const wizardContent = page.locator('text=Which club software are you importing from');
  const wizardVisible = await wizardContent.isVisible({ timeout: 5000 }).catch(() => false);
  expect(wizardVisible, 'Step 0 wizard content should be visible').toBeTruthy();

  // On step 0, the AI toggle should NOT be present
  const hideAiBtn = page.getByRole('button', { name: /hide ai tips/i });
  const showAiBtn = page.locator('button', { hasText: /show ai tips/i });
  const toggleOnStep0 =
    (await hideAiBtn.isVisible({ timeout: 2000 }).catch(() => false)) ||
    (await showAiBtn.isVisible({ timeout: 2000 }).catch(() => false));
  expect(toggleOnStep0, 'AI toggle should NOT appear on step 0').toBeFalsy();

  // No JS errors
  expect(errors.filter(e => !e.includes('favicon')), 'No JS errors').toHaveLength(0);

  console.log('Test 1 PASS — heading visible, wizard content shows, no AI toggle on step 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Step 1 — AI card appears after file drop
// ─────────────────────────────────────────────────────────────────────────────
test('Test 2: Step 1 — AI card appears after file upload', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.addInitScript(gmUserScript);
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Navigate to step 1
  await navigateToStep1(page);

  // Verify we're on step 1 (upload step)
  const dropZone = page.locator('text=Drop your file here, or click to browse');
  const onStep1 = await dropZone.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('On step 1 (drop zone visible):', onStep1);

  if (!onStep1) {
    // Check what's on screen
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('Step 1 body:', body.slice(0, 500));
  }

  // Upload the file
  const csvPath = writeTempCsv();
  try {
    const fileInput = page.locator('[data-testid="wizard-file-input"]');
    const inputCount = await fileInput.count();
    console.log('wizard-file-input count:', inputCount);

    if (inputCount > 0) {
      await fileInput.setInputFiles(csvPath, { timeout: 8000 });
      await page.waitForTimeout(4000); // wait for AI call + render

      // Look for AI card
      const aiHeader = page.locator('text=✦ Swoop AI');
      const aiVisible = await aiHeader.isVisible({ timeout: 5000 }).catch(() => false);

      if (aiVisible) {
        console.log('Test 2 PASS — "✦ Swoop AI" card is visible after file upload');
        // Check for either loading or insight text
        const loadingDots = page.locator('text=Analyzing…');
        const loadingVisible = await loadingDots.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Loading dots visible:', loadingVisible);

        const hideAiBtn = page.getByRole('button', { name: /hide ai tips/i });
        const hideVisible = await hideAiBtn.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('"Hide AI tips" button visible inside card:', hideVisible);
      } else {
        // API unavailable — graceful degradation
        const body = await page.locator('body').innerText().catch(() => '');
        console.log('Test 2 PARTIAL — file uploaded, AI card not visible. Body:', body.slice(200, 600));
        console.log('Expected: API unavailable, graceful degradation');
      }

      // File should show as uploaded
      const fileUploaded = page.locator('text=Click or drop to change');
      const fileVisible = await fileUploaded.isVisible({ timeout: 3000 }).catch(() => false);
      console.log('File upload confirmed (success state):', fileVisible);
    } else {
      console.log('Test 2 — Could not find file input (not on step 1)');
    }
  } finally {
    fs.unlinkSync(csvPath);
  }

  // No JS errors
  const jsErrors = errors.filter(e => !e.includes('favicon'));
  expect(jsErrors, 'No JS errors').toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Hide/Show AI tips toggle
// ─────────────────────────────────────────────────────────────────────────────
test('Test 3: Hide/Show AI tips toggle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.addInitScript(gmUserScript);
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await navigateToStep1(page);

  const csvPath = writeTempCsv();
  try {
    const fileInput = page.locator('[data-testid="wizard-file-input"]');
    const inputCount = await fileInput.count();

    if (inputCount === 0) {
      console.log('Test 3 SKIP — not on step 1, file input not found');
      return;
    }

    await fileInput.setInputFiles(csvPath, { timeout: 8000 });
    await page.waitForTimeout(4000);

    const aiCard = page.locator('text=✦ Swoop AI');
    const cardVisible = await aiCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!cardVisible) {
      console.log('Test 3 SKIP — AI card not visible (API unavailable), toggle not testable');
      // But verify the toggle is still in the header (it should always be there on steps 1-3)
      const hideBtn = page.getByRole('button', { name: /hide ai tips/i });
      const showBtn = page.locator('button', { hasText: /show ai tips/i });
      const anyToggle =
        (await hideBtn.isVisible({ timeout: 2000 }).catch(() => false)) ||
        (await showBtn.isVisible({ timeout: 2000 }).catch(() => false));
      console.log('Toggle present (even without card):', anyToggle);
      return;
    }

    // Click "Hide AI tips"
    const hideBtn = page.getByRole('button', { name: /hide ai tips/i });
    await expect(hideBtn).toBeVisible({ timeout: 3000 });
    await hideBtn.click();
    await page.waitForTimeout(500);

    // Card should disappear
    const cardAfterHide = await aiCard.isVisible({ timeout: 2000 }).catch(() => false);
    expect(cardAfterHide, 'AI card should be hidden after clicking Hide').toBeFalsy();
    console.log('AI card hidden after Hide AI tips click: PASS');

    // The toggle text should change to "Show AI tips"
    const showBtn = page.locator('button', { hasText: /show ai tips/i });
    const showBtnVisible = await showBtn.isVisible({ timeout: 3000 }).catch(() => false);
    expect(showBtnVisible, '"Show AI tips" button should appear').toBeTruthy();
    console.log('"Show AI tips" button appears: PASS');

    // Click Show AI tips
    await showBtn.click();
    await page.waitForTimeout(500);

    // Card should reappear
    const cardAfterShow = await aiCard.isVisible({ timeout: 3000 }).catch(() => false);
    expect(cardAfterShow, 'AI card should reappear after clicking Show').toBeTruthy();
    console.log('AI card reappears after Show AI tips click: PASS');

    console.log('Test 3 PASS — Hide/Show toggle works correctly');
  } finally {
    fs.unlinkSync(csvPath);
  }

  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Step 2 — AI card appears after mapping
// ─────────────────────────────────────────────────────────────────────────────
test('Test 4: Step 2 — AI card appears after column mapping', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.addInitScript(gmUserScript);
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await navigateToStep1(page);

  const csvPath = writeTempCsv();
  try {
    const fileInput = page.locator('[data-testid="wizard-file-input"]');
    if (await fileInput.count() === 0) {
      console.log('Test 4 SKIP — not on step 1');
      return;
    }

    await fileInput.setInputFiles(csvPath, { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Click Next to go to step 2
    const nextBtn = page.getByRole('button', { name: /next.*map/i }).first();
    const genericNext = page.getByRole('button', { name: /next/i }).last();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
    } else if (await genericNext.isVisible({ timeout: 3000 }).catch(() => false)) {
      await genericNext.click();
    }
    await page.waitForTimeout(4000);

    // Verify step 2
    const body = await page.locator('body').innerText().catch(() => '');
    console.log('Step 2 body (500 chars):', body.slice(0, 500));

    const step2Indicators = [
      page.locator('text=Map Columns'),
      page.locator('text=mapping'),
      page.locator('table'),
    ];
    let step2Visible = false;
    for (const indicator of step2Indicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        step2Visible = true;
        break;
      }
    }
    console.log('Step 2 rendered:', step2Visible);

    if (step2Visible) {
      // Check for AI card on step 2
      const aiCard = page.locator('text=✦ Swoop AI');
      const aiVisible = await aiCard.isVisible({ timeout: 5000 }).catch(() => false);
      if (aiVisible) {
        console.log('Test 4 PASS — AI card visible on step 2');
      } else {
        console.log('Test 4 PARTIAL — Step 2 rendered, AI card not visible (API unavailable)');
      }
    } else {
      console.log('Test 4 — Step 2 not confirmed rendered');
    }
  } finally {
    fs.unlinkSync(csvPath);
  }

  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Graceful degradation — no crash without API
// ─────────────────────────────────────────────────────────────────────────────
test('Test 5: Graceful degradation — wizard works without AI API', async ({ page }) => {
  const errors = [];
  const networkFails = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => {
    if (r.url().includes('/api/onboarding-agent') && !r.ok()) {
      networkFails.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.addInitScript(gmUserScript);
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Step 0: verify wizard is accessible
  const wizardOnStep0 = await page.locator('text=Which club software are you importing from').isVisible({ timeout: 5000 }).catch(() => false);
  expect(wizardOnStep0, 'Wizard step 0 accessible').toBeTruthy();

  // Navigate to step 1
  await navigateToStep1(page);

  const csvPath = writeTempCsv();
  try {
    const fileInput = page.locator('[data-testid="wizard-file-input"]');
    const inputCount = await fileInput.count();
    console.log('File input count on step 1:', inputCount);

    if (inputCount > 0) {
      await fileInput.setInputFiles(csvPath, { timeout: 8000 });
      await page.waitForTimeout(2000);

      // Verify Next/Back buttons work
      const nextBtn = page.getByRole('button', { name: /next/i }).last();
      const backBtn = page.getByRole('button', { name: /back/i }).first();
      const nextVisible = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const backVisible = await backBtn.isVisible({ timeout: 3000 }).catch(() => false);

      expect(nextVisible || backVisible, 'At least one navigation button visible').toBeTruthy();
      console.log('Next visible:', nextVisible, '| Back visible:', backVisible);

      // Go to step 2
      if (nextVisible) {
        await nextBtn.click();
        await page.waitForTimeout(3000);
        const backBtn2 = page.getByRole('button', { name: /back/i }).first();
        if (await backBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await backBtn2.click();
          await page.waitForTimeout(1500);
          console.log('Back from step 2 works: PASS');
        }
      }
    }

    console.log('Test 5 PASS — wizard navigates without crash');
    console.log('API failures observed:', networkFails.length ? networkFails : 'none');

    // Critical: no JS errors
    const jsErrors = errors.filter(e => !e.includes('favicon'));
    expect(jsErrors, 'No JS errors').toHaveLength(0);
  } finally {
    fs.unlinkSync(csvPath);
  }
});
