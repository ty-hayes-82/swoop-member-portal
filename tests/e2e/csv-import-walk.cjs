/**
 * QA walkthrough: CSV Import Wizard
 * Injects demo localStorage session to bypass login, then walks all 4 steps.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SCREENSHOTS_DIR = 'C:/GIT/Development/swoop-member-portal/.screenshots/csv-import';
const BASE_URL = 'https://swoop-member-portal-dev.vercel.app';

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Minimal members CSV
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
  console.log(`[screenshot] ${name}.png — ${label}`);
}

async function logState(page, label) {
  console.log(`\n--- ${label} ---`);
  const text = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  console.log(text);
  const selects = await page.$$eval('select', els =>
    els.map(e => ({ id: e.id, name: e.name, options: [...e.options].map(o => o.text) }))
  );
  if (selects.length) console.log('selects:', JSON.stringify(selects));
  const buttons = await page.$$eval('button', els => els.map(e => e.innerText.trim()).filter(Boolean));
  console.log('buttons:', buttons);
  const inputs = await page.$$eval('input', els =>
    els.map(e => ({ type: e.type, name: e.name, placeholder: e.placeholder, id: e.id }))
  );
  console.log('inputs:', inputs);
}

// (injectDemoSession replaced by context.addInitScript — runs before page JS)

async function clickNext(page, maxWaitMs = 10000) {
  // Wait for an enabled Next/Continue/Map/Import button
  try {
    await page.waitForFunction(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.some(b => /next|continue|map columns|preview|start import/i.test(b.innerText) && !b.disabled);
    }, { timeout: maxWaitMs });
  } catch {
    console.log('Timed out waiting for enabled Next button');
  }

  // Try enabled buttons first
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const txt = await btn.evaluate(e => e.innerText).catch(() => '');
    const disabled = await btn.evaluate(e => e.disabled).catch(() => true);
    if (/next|continue|map columns|preview|start import/i.test(txt) && !disabled) {
      console.log('Clicking enabled button:', txt.trim().slice(0, 60));
      await btn.click();
      return true;
    }
  }
  // Log all buttons with their disabled state for debugging
  const btnStates = await page.$$eval('button', els =>
    els.map(e => ({ text: e.innerText.trim().slice(0, 50), disabled: e.disabled }))
  );
  console.log('No enabled Next button found. All buttons:', JSON.stringify(btnStates));
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  // ── Inject demo session BEFORE any navigation so AuthContext useState() initializer reads it ──
  const demoClubId = `demo_qa_${Date.now()}`;
  const demoUser = {
    userId: 'demo',
    clubId: demoClubId,
    name: 'Demo User',
    email: 'demo@swoopgolf.com',
    phone: '',
    role: 'gm',
    title: 'General Manager',
    isDemoSession: true,
  };
  await context.addInitScript(({ user, clubId }) => {
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_auth_token', 'demo');
    localStorage.setItem('swoop_club_id', clubId);
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
  }, { user: demoUser, clubId: demoClubId });
  console.log('Demo session init script registered (will run before page JS)');

  console.log('\n=== Navigating to CSV import ===');
  await page.goto(`${BASE_URL}/#/csv-import`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  await logState(page, 'Step 0 — initial');
  await shot(page, '00-initial', 'Initial state of CSV import wizard — Step 0');

  // ── Step 0: Jonas + Members are pre-selected defaults ──
  // The wizard defaults to vendor='jonas', importType='members'.
  // We verify the Jonas card is selected and Members is selected, then take screenshot.
  console.log('\n=== Step 0: Verifying Jonas + Members are selected (default) ===');

  // The vendor and data type are pre-selected. We just confirm visually.
  await page.waitForTimeout(500);
  await shot(page, '01-vendor-selected', 'Vendor=Jonas, DataType=Members pre-selected (defaults) — Step 0');

  // ── Advance to Step 1: click "Next: Upload File" ──
  console.log('\n=== Advancing to Step 1 (file upload) ===');
  // Look for the specific "Next: Upload File" button text
  const nextUploadBtn = await page.$('button:has-text("Next: Upload File")');
  if (nextUploadBtn) {
    console.log('Clicking "Next: Upload File"');
    await nextUploadBtn.click();
  } else {
    await clickNext(page);
  }
  await page.waitForTimeout(2000);
  await logState(page, 'After clicking Next from Step 0');
  await shot(page, '02-step1-upload', 'Step 1 — file upload screen');

  // ── Step 1: File upload ──
  // There are 2 file inputs: [0] = Quick Upload dropzone, [1] = Guided Wizard dropzone
  // We want the wizard one (index 1). If only 1, use that.
  console.log('\n=== Step 1: File upload ===');
  const fileInputs = await page.$$('input[type="file"]');
  console.log(`Found ${fileInputs.length} file input(s)`);
  const fileInput = fileInputs.length >= 2 ? fileInputs[1] : fileInputs[0];

  if (fileInput) {
    console.log('Uploading CSV:', CSV_PATH);
    await fileInput.setInputFiles(CSV_PATH);
    // Wait for file to be processed (AI analysis may run)
    await page.waitForTimeout(4000);
    await shot(page, '03-file-uploaded', 'After CSV file selected — Step 1 (AI analysis may be loading)');
  } else {
    console.log('WARNING: No file input found at Step 1');
    await shot(page, '03-no-file-input', 'No file input visible at Step 1');
  }

  // ── Advance to Step 2: wait for "Next: Map Columns" to be enabled ──
  console.log('\n=== Advancing to Step 2 (column mapping) ===');
  try {
    await page.waitForFunction(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.some(b => /map columns/i.test(b.innerText) && !b.disabled);
    }, { timeout: 15000 });
    const mapBtn = await page.$('button:has-text("Map Columns")');
    if (mapBtn) {
      console.log('Clicking "Next: Map Columns"');
      await mapBtn.click();
    }
  } catch {
    console.log('Next: Map Columns not enabled — capturing screenshot of current state');
  }
  await page.waitForTimeout(2000);
  await logState(page, 'Step 2 — column mapping');
  await shot(page, '04-column-mapping', 'Step 2 — column mapping screen');

  // ── Advance to Step 3 ──
  console.log('\n=== Advancing to Step 3 (preview & import) ===');
  await clickNext(page, 8000);
  await page.waitForTimeout(2000);
  await logState(page, 'Step 3 — preview & import');
  await shot(page, '05-preview-import', 'Step 3 — preview & import screen');

  // ── Summary ──
  console.log('\n=== Console Errors ===');
  if (errors.length === 0) console.log('None.');
  else errors.forEach(e => console.log('  ERROR:', e));

  await browser.close();
  console.log('\nAll screenshots saved to:', SCREENSHOTS_DIR);
})();
