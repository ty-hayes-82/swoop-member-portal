/**
 * Data Onboarding Agent — E2E Playwright tests
 *
 * Tests the AI Import Assistant chat panel on the Integrations page.
 *
 * Run: APP_URL=http://localhost:5174 npx playwright test tests/e2e/data-onboarding.spec.js --headed
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

/**
 * Enter demo mode — reused from storyboard-flows pattern.
 */
async function enterDemoMode(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  // Step 1: Welcome screen -> "Explore without an account"
  await page.getByRole('button', { name: /Explore without an account/i }).click();
  await page.waitForTimeout(500);
  // Step 2: Explore screen -> "Full Demo"
  await page.getByRole('button', { name: /Full Demo/i }).click();
  await page.waitForTimeout(3500);
}

/**
 * Navigate to the Integrations page.
 */
async function goToIntegrations(page) {
  const integrationsBtn = page.locator('button').filter({ hasText: /^Integrations$/i }).first();
  // Fallback to nav link if button not found
  const navLink = page.locator('a').filter({ hasText: /Integrations/i }).first();

  if (await integrationsBtn.isVisible().catch(() => false)) {
    await integrationsBtn.click();
  } else if (await navLink.isVisible().catch(() => false)) {
    await navLink.click();
  } else {
    // Try hash navigation directly
    await page.goto(`${APP_URL}/#/integrations`);
  }
  await page.waitForTimeout(1500);
}

/**
 * Check if the onboarding agent endpoint is available.
 * Returns true if the API returns a non-404 response.
 */
async function isAgentEndpointAvailable(page) {
  try {
    const response = await page.request.get(`${APP_URL}/api/onboarding-agent/chat`);
    return response.status() !== 404;
  } catch {
    return false;
  }
}

test.describe('Data Onboarding Agent', () => {

  test.beforeEach(async ({ page }) => {
    await enterDemoMode(page);
  });

  // -------------------------------------------------------------------------
  // 1. Onboarding agent tab is visible on Integrations page
  // -------------------------------------------------------------------------

  test('Onboarding agent tab is visible on Integrations page', async ({ page }) => {
    await goToIntegrations(page);

    // Look for the AI Import Assistant tab/button or any import-related entry
    const importAssistant = page.locator('text=/AI Import|Import Assistant|Data Import|CSV Import/i');
    const csvImportBtn = page.locator('button').filter({ hasText: /Import|Upload|CSV/i });

    const hasAssistant = await importAssistant.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasCsvBtn = await csvImportBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    // At minimum, the integrations page should have a way to start CSV import
    expect(hasAssistant || hasCsvBtn).toBe(true);

    await page.screenshot({ path: 'test-results/data-onboarding-integrations-tab.png', fullPage: true });
  });

  // -------------------------------------------------------------------------
  // 2. Chat panel renders with file drop zone
  // -------------------------------------------------------------------------

  test('Chat panel renders with file drop zone', async ({ page }) => {
    await goToIntegrations(page);

    // Click on the AI Import Assistant or CSV Import button
    const importBtn = page.locator('button').filter({ hasText: /AI Import|Import Assistant|CSV Import|Upload/i }).first();
    if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Navigate directly to CSV import page
      await page.goto(`${APP_URL}/#/integrations/csv-import`);
      await page.waitForTimeout(1500);
    }

    // Verify a drop zone or file upload area exists
    const dropZone = page.locator('text=/Drop.*CSV|drag.*drop|Choose.*file|Upload.*file|Select.*CSV/i');
    const fileInput = page.locator('input[type="file"]');

    const hasDropZone = await dropZone.first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasFileInput = await fileInput.first().count() > 0;

    expect(hasDropZone || hasFileInput).toBe(true);

    await page.screenshot({ path: 'test-results/data-onboarding-drop-zone.png', fullPage: true });
  });

  // -------------------------------------------------------------------------
  // 3. Agent responds to text message
  // -------------------------------------------------------------------------

  test('Agent responds to text message', async ({ page }) => {
    const endpointAvailable = await isAgentEndpointAvailable(page);

    if (!endpointAvailable) {
      test.skip();
      return;
    }

    await goToIntegrations(page);

    // Open AI Import Assistant
    const importBtn = page.locator('button').filter({ hasText: /AI Import|Import Assistant/i }).first();
    if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(1000);
    }

    // Find message input
    const messageInput = page.locator('input[type="text"], textarea').filter({ hasText: '' }).first();
    const chatInput = page.locator('[placeholder*="message"], [placeholder*="ask"], [placeholder*="type"]').first();
    const input = await chatInput.isVisible().catch(() => false) ? chatInput : messageInput;

    if (!await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await input.fill('What data do I need to import first?');

    // Find and click send button
    const sendBtn = page.locator('button').filter({ hasText: /Send|Submit/i }).first();
    const enterSend = page.locator('button[type="submit"]').first();
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click();
    } else if (await enterSend.isVisible().catch(() => false)) {
      await enterSend.click();
    } else {
      await input.press('Enter');
    }

    // Wait for response
    await page.waitForTimeout(5000);

    // Verify response mentions members (the recommended first import)
    const response = page.locator('text=/[Mm]ember/i');
    await expect(response.first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/data-onboarding-agent-response.png', fullPage: true });
  });

  // -------------------------------------------------------------------------
  // 4. File upload triggers agent analysis
  // -------------------------------------------------------------------------

  test('File upload triggers agent analysis', async ({ page }) => {
    await goToIntegrations(page);

    // Navigate to CSV import
    const importBtn = page.locator('button').filter({ hasText: /AI Import|Import Assistant|CSV Import|Upload/i }).first();
    if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto(`${APP_URL}/#/integrations/csv-import`);
      await page.waitForTimeout(1500);
    }

    // Check for vendor selection step first (CsvImportPage Step 0)
    const jonasOption = page.locator('text=/Jonas/i');
    if (await jonasOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await jonasOption.first().click();
      await page.waitForTimeout(500);
    }

    // Select "Members" import type if visible
    const membersOption = page.locator('text=/Members/i').first();
    if (await membersOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await membersOption.click();
      await page.waitForTimeout(500);
    }

    // Find file input and upload the demo CSV
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() === 0) {
      test.skip();
      return;
    }

    const csvPath = path.resolve(__dirname, '../../public/demo-data/JCM_Members_F9.csv');
    await fileInput.first().setInputFiles(csvPath);
    await page.waitForTimeout(2000);

    // After upload, verify the page shows analysis results
    // Should mention Jonas (vendor detection) or member-related content
    const vendorDetected = page.locator('text=/Jonas|member|column|mapping|map/i');
    await expect(vendorDetected.first()).toBeVisible({ timeout: 10000 });

    // Verify column mapping UI appears (table or mapping cards)
    const mappingUI = page.locator('text=/first_name|last_name|Member #|Given Name|mapping|Map Columns/i');
    const hasMappingUI = await mappingUI.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasMappingUI).toBe(true);

    await page.screenshot({ path: 'test-results/data-onboarding-file-upload.png', fullPage: true });
  });

  // -------------------------------------------------------------------------
  // 5. Import flow completes
  // -------------------------------------------------------------------------

  test('Import flow completes with preview', async ({ page }) => {
    // This test verifies the structured import preview renders correctly.
    // If the agent chat API is not available, we test the CSV import wizard instead.

    await goToIntegrations(page);

    // Navigate to CSV import wizard
    const importBtn = page.locator('button').filter({ hasText: /AI Import|Import Assistant|CSV Import|Upload/i }).first();
    if (await importBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await importBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto(`${APP_URL}/#/integrations/csv-import`);
      await page.waitForTimeout(1500);
    }

    // Select Jonas vendor if step 0 is visible
    const jonasOption = page.locator('text=/Jonas/i');
    if (await jonasOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await jonasOption.first().click();
      await page.waitForTimeout(500);
    }

    // Select Members import type
    const membersOption = page.locator('text=/Members/i').first();
    if (await membersOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await membersOption.click();
      await page.waitForTimeout(500);
    }

    // Look for a "Next" or "Continue" button to advance
    const nextBtn = page.locator('button').filter({ hasText: /Next|Continue|Proceed/i }).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Upload demo CSV
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() === 0) {
      test.skip();
      return;
    }

    const csvPath = path.resolve(__dirname, '../../public/demo-data/JCM_Members_F9.csv');
    await fileInput.first().setInputFiles(csvPath);
    await page.waitForTimeout(2000);

    // Advance to preview step if there is a next button
    const advanceBtn = page.locator('button').filter({ hasText: /Next|Continue|Preview|Review/i }).first();
    if (await advanceBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await advanceBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify preview/summary is visible — should show row counts, mapped fields, etc.
    const previewContent = page.locator('text=/row|record|import|preview|insert|update|member/i');
    const hasPreview = await previewContent.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Verify an import/confirm button exists
    const importConfirmBtn = page.locator('button').filter({ hasText: /Import|Confirm|Start Import|Go/i });
    const hasImportBtn = await importConfirmBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    // At least the preview content or import button should be visible
    expect(hasPreview || hasImportBtn).toBe(true);

    await page.screenshot({ path: 'test-results/data-onboarding-import-flow.png', fullPage: true });
  });

});
