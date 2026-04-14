const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SCREENSHOTS_DIR = 'C:/GIT/Development/swoop-member-portal/.screenshots/csv-import';
const BASE_URL = 'https://swoop-member-portal-dev.vercel.app';

// Ensure screenshots dir exists
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Create a minimal members CSV
const CSV_CONTENT = `MemberID,FirstName,LastName,Email,MembershipType,JoinDate
1001,Alice,Johnson,alice.johnson@example.com,Full,2023-01-15
1002,Bob,Smith,bob.smith@example.com,Social,2023-03-22
1003,Carol,Davis,carol.davis@example.com,Junior,2022-11-08
`;

const CSV_PATH = path.join(os.tmpdir(), 'test-members.csv');
fs.writeFileSync(CSV_PATH, CSV_CONTENT);
console.log('CSV written to:', CSV_PATH);

async function shot(page, name, label) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Screenshot saved: ${name}.png — ${label}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  console.log('\n=== Step 0: Navigate to CSV import ===');
  await page.goto(`${BASE_URL}/#/csv-import`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await shot(page, '00-initial', 'Initial state — Step 0 vendor+data type selector');

  // Log visible text to understand the UI
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log('Page text (first 2000 chars):\n', bodyText);

  // Look for vendor dropdown/select
  console.log('\n=== Step 1: Select vendor ===');

  // Try to find vendor selector
  const vendorSelectors = [
    'select[name*="vendor"]',
    '[data-testid*="vendor"]',
    'select:first-of-type',
    'button:has-text("Select vendor")',
    'button:has-text("Vendor")',
    '[placeholder*="vendor"]',
    '[placeholder*="Vendor"]',
  ];

  let vendorFound = false;
  for (const sel of vendorSelectors) {
    const el = await page.$(sel);
    if (el) {
      console.log(`Found vendor element with: ${sel}`);
      vendorFound = true;

      const tagName = await el.evaluate(e => e.tagName);
      if (tagName === 'SELECT') {
        // Try to select Jonas
        await el.selectOption({ label: 'Jonas' }).catch(async () => {
          // Try first option if Jonas not found
          const options = await el.evaluate(e => [...e.options].map(o => o.text));
          console.log('Available vendor options:', options);
          if (options.length > 1) await el.selectOption({ index: 1 });
        });
      } else {
        await el.click();
        await page.waitForTimeout(500);
        // Look for Jonas in dropdown
        const jonasOption = await page.$('text=Jonas');
        if (jonasOption) {
          await jonasOption.click();
        }
      }
      break;
    }
  }

  if (!vendorFound) {
    console.log('Vendor selector not found via common selectors, logging all selects and buttons...');
    const allSelects = await page.$$eval('select', els => els.map(e => ({ id: e.id, name: e.name, options: [...e.options].map(o => o.text) })));
    console.log('Selects:', JSON.stringify(allSelects, null, 2));
    const allButtons = await page.$$eval('button', els => els.map(e => e.innerText.slice(0, 50)));
    console.log('Buttons:', allButtons);
  }

  await page.waitForTimeout(1000);
  await shot(page, '01-vendor-selected', 'After vendor selection attempt');

  // Try to select data type
  console.log('\n=== Step 2: Select data type ===');
  const dataTypeSelectors = [
    'select[name*="type"]',
    'select[name*="data"]',
    '[data-testid*="data-type"]',
    '[data-testid*="dataType"]',
  ];

  for (const sel of dataTypeSelectors) {
    const el = await page.$(sel);
    if (el) {
      console.log(`Found data type element with: ${sel}`);
      const options = await el.evaluate(e => [...e.options].map(o => o.text));
      console.log('Data type options:', options);
      await el.selectOption({ label: 'Members' }).catch(async () => {
        if (options.length > 1) await el.selectOption({ index: 1 });
      });
      break;
    }
  }

  // Look for Next/Continue button
  const nextBtn = await page.$('button:has-text("Next")') ||
                  await page.$('button:has-text("Continue")') ||
                  await page.$('button:has-text("Upload")');
  if (nextBtn) {
    await nextBtn.click();
    await page.waitForTimeout(1500);
  }

  await shot(page, '02-after-step0', 'After Step 0 selections / entering Step 1');

  // Step 1: File upload
  console.log('\n=== Step 3: File upload ===');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('Found file input, uploading CSV...');
    await fileInput.setInputFiles(CSV_PATH);
    await page.waitForTimeout(2000);
    await shot(page, '03-file-uploaded', 'After file upload — Step 1');
  } else {
    console.log('No file input found at this step');
    await shot(page, '03-no-file-input', 'No file input found');
  }

  // Step 2: Column mapping
  console.log('\n=== Step 4: Column mapping ===');
  // Try to proceed to next step
  const nextBtn2 = await page.$('button:has-text("Next")') ||
                   await page.$('button:has-text("Continue")') ||
                   await page.$('button:has-text("Map")');
  if (nextBtn2) {
    await nextBtn2.click();
    await page.waitForTimeout(2000);
  }
  await shot(page, '04-column-mapping', 'Column mapping — Step 2');

  // Step 3: Preview & Import
  console.log('\n=== Step 5: Preview & Import ===');
  const nextBtn3 = await page.$('button:has-text("Next")') ||
                   await page.$('button:has-text("Preview")') ||
                   await page.$('button:has-text("Continue")');
  if (nextBtn3) {
    await nextBtn3.click();
    await page.waitForTimeout(2000);
  }
  await shot(page, '05-preview-import', 'Preview & Import — Step 3');

  // Final summary
  console.log('\n=== Console Errors Captured ===');
  if (errors.length === 0) {
    console.log('No console errors detected.');
  } else {
    errors.forEach(e => console.log('ERROR:', e));
  }

  await browser.close();
  console.log('\nDone. All screenshots saved to:', SCREENSHOTS_DIR);
})();
