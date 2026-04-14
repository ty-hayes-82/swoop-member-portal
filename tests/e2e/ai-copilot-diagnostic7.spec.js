/**
 * Diagnostic 7: trace step 0 navigation
 */
import { test } from '@playwright/test';

const BASE = 'http://localhost:5174';

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

test('Trace step 0 navigation', async ({ page }) => {
  await page.addInitScript(gmUserScript);
  await page.goto(BASE + '/#/csv-import', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // What buttons are on the page?
  const allButtons = await page.locator('button').allInnerTexts();
  console.log('All buttons on step 0 (first 30):', allButtons.slice(0, 30));

  // Click Jonas
  const jonasBtn = page.getByRole('button', { name: /jonas/i }).first();
  const jonasVisible = await jonasBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Jonas button visible:', jonasVisible);

  if (jonasVisible) {
    await jonasBtn.click();
    await page.waitForTimeout(500);

    const allButtons2 = await page.locator('button').allInnerTexts();
    console.log('\nButtons after Jonas click (first 30):', allButtons2.slice(0, 30));

    // Click Members
    // Look for buttons containing 'Members'
    const membersBtns = await page.locator('button').filter({ hasText: /members/i }).all();
    console.log('\nNumber of Members buttons:', membersBtns.length);
    for (const btn of membersBtns) {
      const text = await btn.innerText().catch(() => '');
      console.log('  Members button text:', text.slice(0, 80));
    }

    // Click the first Members button
    const membersBtn = page.locator('button').filter({ hasText: /^members/i }).first();
    const membersVisible = await membersBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('\nMembers button (starts with Members) visible:', membersVisible);

    if (membersVisible) {
      const membersText = await membersBtn.innerText().catch(() => '');
      console.log('Members button text:', membersText.slice(0, 100));
      await membersBtn.click();
      await page.waitForTimeout(500);

      const allButtons3 = await page.locator('button').allInnerTexts();
      console.log('\nButtons after Members click (first 30):', allButtons3.slice(0, 30));
    }

    // Find Next button
    const nextBtns = await page.locator('button').filter({ hasText: /next/i }).all();
    console.log('\nNumber of Next buttons:', nextBtns.length);
    for (const btn of nextBtns) {
      const text = await btn.innerText().catch(() => '');
      console.log('  Next button text:', text.slice(0, 50));
    }

    // Try clicking the Next button specifically within the guided wizard section
    // (not the nav buttons)
    const guidedWizardNext = page.locator('.space-y-2 + * button[type="button"]').first();
    const guidedWizardNextText = await guidedWizardNext.innerText().catch(() => 'n/a');
    console.log('\nGuidedWizardNext text:', guidedWizardNextText);

    // Try a different approach: find button after selecting Members that says "Next"
    // in the context of the wizard step
    const nextBtn = page.getByRole('button', { name: /^next/i });
    const nextCount = await nextBtn.count();
    console.log('\nCount of buttons starting with Next:', nextCount);
    for (let i = 0; i < nextCount; i++) {
      const text = await nextBtn.nth(i).innerText().catch(() => '');
      console.log(`  Next button ${i}:`, text);
    }

    // Click the LAST next button (step control, not nav)
    if (nextCount > 0) {
      const lastNext = nextBtn.last();
      await lastNext.click();
      await page.waitForTimeout(2000);

      const url = page.url();
      const body = await page.locator('body').innerText().catch(() => '');
      console.log('\nAfter clicking Next - URL:', url);
      console.log('After clicking Next - body (500 chars):', body.slice(0, 500));

      const fileInput = await page.locator('[data-testid="wizard-file-input"]').count();
      const dropZone = await page.locator('text=Drop your file here').isVisible({ timeout: 2000 }).catch(() => false);
      console.log('wizard-file-input count:', fileInput);
      console.log('Drop zone visible:', dropZone);
    }
  }
});
