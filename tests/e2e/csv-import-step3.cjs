/**
 * Targeted script: just capture Step 3 (Import confirmation / preview)
 * after navigating the wizard to column mapping and clicking "Import 3 Rows"
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SCREENSHOTS_DIR = 'C:/GIT/Development/swoop-member-portal/.screenshots/csv-import';
const BASE_URL = 'https://swoop-member-portal-dev.vercel.app';

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const CSV_CONTENT = `MemberID,FirstName,LastName,Email,MembershipType,JoinDate
1001,Alice,Johnson,alice.johnson@example.com,Full,2023-01-15
1002,Bob,Smith,bob.smith@example.com,Social,2023-03-22
1003,Carol,Davis,carol.davis@example.com,Junior,2022-11-08
`;
const CSV_PATH = path.join(os.tmpdir(), 'test-members.csv');
fs.writeFileSync(CSV_PATH, CSV_CONTENT);

async function shot(page, name, label) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[screenshot] ${name}.png — ${label}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  // Inject demo session before navigation
  const demoUser = { userId: 'demo', clubId: `demo_qa_${Date.now()}`, name: 'Demo User',
    email: 'demo@swoopgolf.com', phone: '', role: 'gm', title: 'General Manager', isDemoSession: true };
  await context.addInitScript(({ user }) => {
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', user.clubId);
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
  }, { user: demoUser });

  await page.goto(`${BASE_URL}/#/csv-import`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Step 0 → click Next: Upload File
  const nextUpload = await page.$('button:has-text("Next: Upload File")');
  if (nextUpload) { await nextUpload.click(); await page.waitForTimeout(1500); }

  // Step 1 → upload file (second file input = wizard dropzone)
  const fileInputs = await page.$$('input[type="file"]');
  const fi = fileInputs.length >= 2 ? fileInputs[1] : fileInputs[0];
  if (fi) {
    await fi.setInputFiles(CSV_PATH);
    await page.waitForTimeout(3000);
  }

  // Step 1 → click Next: Map Columns (wait for it to be enabled)
  await page.waitForFunction(() => {
    return [...document.querySelectorAll('button')].some(b => /map columns/i.test(b.innerText) && !b.disabled);
  }, { timeout: 15000 }).catch(() => {});
  const mapBtn = await page.$('button:has-text("Map Columns")');
  if (mapBtn) { await mapBtn.click(); await page.waitForTimeout(2000); }

  // Step 2 — column mapping — capture it
  await shot(page, '04-column-mapping', 'Step 2 — Column Mapping with auto-detected fields');

  // Step 2 → click "Import 3 Rows" button (or any Import button)
  const importBtn = await page.$('button:has-text("Import")');
  if (importBtn) {
    const txt = await importBtn.evaluate(e => e.innerText);
    console.log('Clicking:', txt.trim());
    await importBtn.click();
    await page.waitForTimeout(3000);
    await shot(page, '05-preview-import', 'Step 3 — After clicking Import (result/confirmation screen)');
  } else {
    console.log('No Import button found');
    // Screenshot what we have
    await shot(page, '05-no-import-btn', 'No Import button found at Step 2');
  }

  // Log final page state
  const txt = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  console.log('Final page text:\n', txt);

  console.log('\nConsole errors:', errors.length ? errors : 'none');
  await browser.close();
  console.log('Done.');
})();
