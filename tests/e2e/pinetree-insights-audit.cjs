#!/usr/bin/env node
/**
 * Pinetree Country Club — E2E Insights Audit
 *
 * Creates a Pinetree CC club in Kennesaw, GA, imports each CSV in
 * realistic order, and documents every insight found across all pages
 * after each import.
 *
 * Usage: node tests/e2e/pinetree-insights-audit.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = process.env.APP_URL || 'https://swoop-member-portal.vercel.app';
const CSV_DIR = path.join(__dirname, '../../docs/jonas-exports');

// Import order — what a real club would upload first-to-last
const IMPORTS = [
  { type: 'Members',              file: 'JCM_Members_F9.csv',         importType: 'members',             vendorBtn: 'Jonas Club Software', typeBtn: 'JCM_Members' },
  { type: 'Tee Times',            file: 'TTM_Tee_Sheet_SV.csv',       importType: 'tee_times',           vendorBtn: 'Jonas Club Software', typeBtn: 'TTM_Tee_Sheet' },
  { type: 'F&B Transactions',     file: 'POS_Sales_Detail_SV.csv',    importType: 'transactions',        vendorBtn: 'Jonas Club Software', typeBtn: 'POS_Sales_Detail' },
  { type: 'Complaints',           file: 'JCM_Communications_RG.csv',  importType: 'complaints',          vendorBtn: 'Jonas Club Software', typeBtn: 'JCM_Communications' },
  { type: 'Events',               file: 'JAM_Event_List_SV.csv',      importType: 'events',              vendorBtn: 'Jonas Club Software', typeBtn: 'JAM_Event_List' },
  { type: 'Event Registrations',  file: 'JAM_Registrations_SV.csv',   importType: 'event_registrations', vendorBtn: 'Jonas Club Software', typeBtn: 'JAM_Registrations' },
  { type: 'Email Campaigns',      file: 'CHO_Campaigns_SV.csv',       importType: 'email_campaigns',     vendorBtn: 'Jonas Club Software', typeBtn: 'CHO_Campaigns' },
  { type: 'Email Events',         file: 'CHO_Email_Events_SV.csv',    importType: 'email_events',        vendorBtn: 'Jonas Club Software', typeBtn: 'CHO_Email_Events' },
  { type: 'Staff',                file: 'ADP_Staff_Roster.csv',       importType: 'staff',               vendorBtn: 'ADP / Payroll',       typeBtn: 'ADP_Staff' },
  { type: 'Shifts',               file: '7shifts_Staff_Shifts.csv',   importType: 'shifts',              vendorBtn: '7shifts',             typeBtn: '7shifts_Staff_Shifts' },
];

const PAGES = [
  { name: 'Today',       hash: '#/today',        patterns: [] },
  { name: 'Service',     hash: '#/service',       patterns: [] },
  { name: 'Members',     hash: '#/members',       patterns: [] },
  { name: 'Board Report',hash: '#/board-report',  patterns: [] },
  { name: 'Automations', hash: '#/automations',   patterns: [] },
  { name: 'Admin',       hash: '#/admin',         patterns: [] },
];

// ─── Helpers ────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] ${msg}`);
}

function heading(msg) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${msg}`);
  console.log('═'.repeat(70));
}

function subheading(msg) {
  console.log(`\n  ── ${msg} ${'─'.repeat(Math.max(0, 60 - msg.length))}`);
}

function parseCSV(text) {
  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let current = '', inQuotes = false;
  const lines = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === '\n' && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  function splitRow(line) {
    const fields = [];
    let field = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i+1] === '"') { field += '"'; i++; } else { q = !q; } }
      else if (c === ',' && !q) { fields.push(field.trim()); field = ''; }
      else { field += c; }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = splitRow(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const vals = splitRow(lines[i]);
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j] || ''; });
    rows.push(row);
  }
  return rows;
}

// Column alias lookup — maps Jonas CSV headers to Swoop DB field names
const ALIAS_MAP = {
  // Members
  'given name': 'first_name', 'first name': 'first_name', 'firstname': 'first_name',
  'surname': 'last_name', 'last name': 'last_name', 'lastname': 'last_name',
  'member #': 'external_id', 'member number': 'external_id', 'member id': 'external_id',
  'email': 'email', 'phone #': 'phone', 'phone': 'phone',
  'membership type': 'membership_type', 'mem type': 'membership_type',
  'annual fee': 'annual_dues', 'annual dues': 'annual_dues',
  'date joined': 'join_date', 'status': 'status',
  'household id': 'household_id', 'birthday': 'birthday', 'sex': 'sex',
  'handicap #': 'handicap', 'current balance': 'current_balance',
  'date resigned': 'date_resigned', 'mailings': '_skip',
  // Tee Times
  'reservation id': 'reservation_id', 'confirmation #': 'reservation_id', 'reservation confirmation #': 'reservation_id',
  'course': 'course', 'golf course': 'course',
  'date': 'date', 'tee sheet date': 'date', 'play date': 'date',
  'tee time': 'tee_time', 'time': 'tee_time',
  'players': 'players', 'number of players': 'players',
  'guest flag': 'guest_flag', 'transportation': 'transportation',
  'caddie': 'caddie', 'holes': 'holes',
  'check-in time': 'check_in_time', 'round start': 'round_start',
  'round end': 'round_end', 'duration (min)': 'duration_min', 'duration': 'duration_min',
  // Transactions
  'open time': 'transaction_date', 'close time': 'close_time', 'transaction date': 'transaction_date',
  'net amount': 'total_amount', 'total due': 'total_amount', 'total amount': 'total_amount', 'chit total': 'total_amount',
  'sales area': 'outlet_name', 'outlet': 'outlet_name',
  'category': 'category', 'item count': 'item_count',
  'tax': 'tax', 'gratuity': 'gratuity', 'comp': 'comp', 'discount': 'discount',
  'void': 'void', 'settlement method': 'settlement_method',
  // Complaints
  'type': 'category', 'department': 'category', 'subject': 'description',
  'description': 'description', 'comment': 'description',
  'priority': 'priority', 'severity': 'priority', 'happometer score': 'priority',
  'reported at': 'reported_at', 'created date': 'reported_at',
  'resolution date': 'resolved_at', 'resolved at': 'resolved_at',
  // Events
  'event number': 'event_id', 'event id': 'event_id', 'event #': 'event_id',
  'event name': 'event_name', 'name': 'event_name',
  'event type': 'event_type', 'start date': 'start_date', 'event date': 'start_date',
  'capacity': 'capacity', 'registration fee': 'registration_fee', 'member price': 'registration_fee',
  // Event Registrations
  'registration id': 'registration_id', 'reg id': 'registration_id',
  'client code': 'member_id',
  'event registrant status': 'status',
  'guest count': 'guest_count', 'guests': 'guest_count',
  'fee paid': 'fee_paid', 'amount paid': 'fee_paid',
  'registration date': 'registration_date', 'event booking number': 'event_id',
  // Email Campaigns
  'campaign id': 'campaign_id', 'campaign': 'campaign_id',
  'email subject': 'subject',
  'campaign type': 'campaign_type', 'send date': 'send_date',
  'audience count': 'audience_count', 'recipient count': 'audience_count', 'recipients': 'audience_count',
  // Email Events
  'event id': '_skip',
  'action': 'event_type', 'timestamp': 'timestamp', 'occurred at': 'timestamp',
  'link clicked': 'link_clicked', 'device': 'device', 'device type': 'device',
  // Note: 'campaign' and 'member #' mappings depend on import type — handled by IMPORT_OVERRIDES
  // Staff
  'employee id': 'employee_id', 'staff code': 'employee_id',
  'dept': 'department', 'preferred department': 'department',
  'job title': 'job_title', 'role': 'job_title', 'preferred job': 'job_title', 'function': 'job_title',
  'hire date': 'hire_date', 'hourly rate': 'hourly_rate', 'pay rate': 'hourly_rate',
  'ft/pt': 'ft_pt', 'ft_pt': 'ft_pt', 'employment type': 'ft_pt',
  // Shifts
  'shift id': 'shift_id', 'shift date': 'shift_date',
  'shift start': 'shift_start', 'shift end': 'shift_end',
  'act hrs': 'actual_hours', 'actual hours': 'actual_hours', 'hours worked': 'actual_hours',
  'location': 'location', 'outlet id': 'location',
  'employee_id': 'employee_id',
  'notes': 'notes',
};

// Per-import-type overrides (when a header maps differently by context)
const IMPORT_OVERRIDES = {
  email_events: { 'member #': 'member_id', 'member id': 'member_id', 'event id': '_skip', 'campaign': 'campaign_id' },
  email_campaigns: { 'subject': 'subject' }, // Don't let complaints' subject→description override
  event_registrations: { 'member #': 'member_id', 'event number': 'event_id' },
  complaints: { 'type': 'category', 'subject': 'description', 'date': 'reported_at', 'member #': 'member_id' },
  tee_times: { 'member #': 'member_id' },
  transactions: { 'member #': 'member_id' },
};

function mapRow(row, importType) {
  const overrides = IMPORT_OVERRIDES[importType] || {};
  const mapped = {};
  for (const [csvHeader, value] of Object.entries(row)) {
    const key = csvHeader.trim().toLowerCase();
    const swoopField = overrides[key] || ALIAS_MAP[key] || key;
    if (swoopField !== '_skip' && value !== undefined && value !== '') {
      mapped[swoopField] = value;
    }
  }
  return mapped;
}

async function importViaAPI(clubId, token, importType, csvPath) {
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rawRows = parseCSV(csvText);
  const rows = rawRows.map(r => mapRow(r, importType));

  const resp = await fetch(`${APP_URL}/api/import-csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ clubId, importType, rows }),
  });

  const httpStatus = resp.status;
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text.substring(0, 200) }; }
  return { httpStatus, ...data };
}

async function scanPageInsights(page, pageName, hash) {
  await page.goto(`${APP_URL}/${hash}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  // Check for ErrorBoundary
  const body = await page.locator('body').textContent();
  if (body.includes('Something went wrong')) {
    return { page: pageName, status: 'CRASHED', insights: [] };
  }

  const insights = [];

  // Extract all visible text blocks that contain data insights
  const cards = await page.locator('[class*="rounded"]').all();
  for (const card of cards.slice(0, 50)) { // limit to prevent timeout
    try {
      const text = await card.textContent({ timeout: 1000 });
      if (text && text.length > 10 && text.length < 2000) {
        // Look for numeric data, percentages, dollar amounts, status indicators
        if (/\d+[%$°]|\d+\.\d|\b(healthy|watch|at.risk|critical|connected|gap|full|resolved|open|pending)\b/i.test(text)) {
          const clean = text.replace(/\s+/g, ' ').trim().substring(0, 200);
          if (!insights.some(i => i === clean)) {
            insights.push(clean);
          }
        }
      }
    } catch { /* element disappeared */ }
  }

  // Also get key metric values
  const metrics = [];
  const metricEls = await page.locator('[class*="font-bold"]').all();
  for (const el of metricEls.slice(0, 30)) {
    try {
      const text = await el.textContent({ timeout: 500 });
      if (text && /^\$?[\d,.]+[%°]?$/.test(text.trim())) {
        metrics.push(text.trim());
      }
    } catch {}
  }

  return {
    page: pageName,
    status: 'OK',
    insights,
    metrics,
    contentLength: body.length,
  };
}

// ─── Main ───────────────────────────────────────────────────

(async () => {
  heading('PINETREE COUNTRY CLUB — E2E INSIGHTS AUDIT');
  log(`App: ${APP_URL}`);
  log(`CSV directory: ${CSV_DIR}`);

  // ─── Step 1: Create club ──────────────────────────────────
  heading('STEP 1: CREATE PINETREE COUNTRY CLUB');
  const ts = Date.now();
  const createResp = await fetch(`${APP_URL}/api/onboard-club`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clubName: 'Pinetree Country Club',
      city: 'Kennesaw',
      state: 'GA',
      zip: '30144',
      memberCount: 400,
      courseCount: 1,
      outletCount: 3,
      adminEmail: `pinetree-audit-${ts}@test.com`,
      adminName: 'Pinetree GM',
      adminPassword: 'PinetreeAudit2026!',
    }),
  });
  const club = await createResp.json();
  if (!club.clubId) {
    console.error('Failed to create club:', club);
    process.exit(1);
  }
  log(`Club created: ${club.clubId}`);
  log(`Club name: Pinetree Country Club, Kennesaw, GA 30144`);

  // ─── Step 2: Verify weather ───────────────────────────────
  subheading('Weather API check');
  try {
    const wxResp = await fetch(`${APP_URL}/api/weather?clubId=${club.clubId}&type=current`);
    const wx = await wxResp.json();
    if (wx.temp) {
      log(`Weather: ${Math.round(wx.temp)}°F, ${wx.conditionsText}, wind ${wx.wind}/${wx.gusts} mph (source: ${wx.source})`);
    } else {
      log(`Weather: unavailable — ${wx.error || 'no data'}`);
    }
  } catch (e) {
    log(`Weather: error — ${e.message}`);
  }

  // ─── Step 3: Launch browser, authenticate ─────────────────
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', err => { /* suppress */ });

  await page.goto(APP_URL);
  await page.evaluate(({ clubId, token, user }) => {
    localStorage.setItem('swoop_auth_token', token);
    localStorage.setItem('swoop_club_id', clubId);
    localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
  }, { clubId: club.clubId, token: club.token, user: club.user });

  // ─── Step 4: Baseline scan (no data) ─────────────────────
  heading('BASELINE — No Data Imported');
  for (const pg of PAGES) {
    const result = await scanPageInsights(page, pg.name, pg.hash);
    console.log(`  ${pg.name}: ${result.status} (${result.insights.length} insights, ${result.contentLength} chars)`);
    if (result.insights.length > 0) {
      result.insights.slice(0, 3).forEach(i => console.log(`    → ${i.substring(0, 120)}`));
    }
  }

  // ─── Step 5: Import each CSV and scan insights ────────────
  const allResults = [];

  for (let idx = 0; idx < IMPORTS.length; idx++) {
    const imp = IMPORTS[idx];
    const csvPath = path.join(CSV_DIR, imp.file);

    if (!fs.existsSync(csvPath)) {
      log(`SKIP: ${imp.file} not found`);
      continue;
    }

    const rowCount = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(l => l.trim()).length - 1;

    heading(`IMPORT ${idx + 1}/${IMPORTS.length}: ${imp.type} (${imp.file}, ${rowCount} rows)`);

    // Import via API
    const rows_sent = parseCSV(fs.readFileSync(csvPath, 'utf-8')).length;
    log(`  Parsed ${rows_sent} rows, first row keys: ${Object.keys(parseCSV(fs.readFileSync(csvPath, 'utf-8'))[0] || {}).slice(0, 5).join(', ')}`);
    const result = await importViaAPI(club.clubId, club.token, imp.importType, csvPath);
    log(`Import: HTTP ${result.httpStatus}, success=${result.success ?? '?'}, errors=${result.errors ?? '?'}, rows sent=${rows_sent}`);
    if (result.error) log(`  Error: ${result.error}`);
    if (result.errorDetails?.length > 0) {
      log(`  First errors: ${result.errorDetails.slice(0, 3).map(e => `row ${e.row}: ${e.field} — ${e.message}`).join('; ')}`);
    }
    if (result.httpStatus >= 400) {
      log(`FAILED (HTTP ${result.httpStatus}): ${result.error || JSON.stringify(result).substring(0, 300)}`);
      allResults.push({ import: imp.type, status: 'FAILED', error: result.error, rows: rowCount });
      continue;
    }

    // Reload page to pick up new data
    await page.reload();
    await page.waitForTimeout(2000);

    // Scan all pages for insights
    subheading(`Insights after importing ${imp.type}`);
    const importInsights = {};

    for (const pg of PAGES) {
      const scan = await scanPageInsights(page, pg.name, pg.hash);
      importInsights[pg.name] = scan;

      if (scan.status === 'CRASHED') {
        console.log(`  ${pg.name}: ❌ CRASHED (ErrorBoundary)`);
      } else if (scan.insights.length === 0) {
        console.log(`  ${pg.name}: (no data-driven insights detected)`);
      } else {
        console.log(`  ${pg.name}: ${scan.insights.length} insights found`);
        scan.insights.slice(0, 5).forEach(i => console.log(`    → ${i.substring(0, 150)}`));
      }
    }

    allResults.push({
      import: imp.type,
      file: imp.file,
      rows: rowCount,
      success: result.success || 0,
      failed: result.failed || 0,
      insights: importInsights,
    });
  }

  // ─── Step 6: Final summary ────────────────────────────────
  heading('FINAL SUMMARY');

  console.log('\n  Import Results:');
  console.log('  ' + '─'.repeat(68));
  console.log('  ' + 'Import Type'.padEnd(25) + 'Rows'.padEnd(8) + 'Success'.padEnd(10) + 'Failed'.padEnd(10) + 'Status');
  console.log('  ' + '─'.repeat(68));
  for (const r of allResults) {
    const status = r.error ? '❌ FAILED' : r.success > 0 ? '✅ OK' : '⚠️ 0 rows';
    console.log('  ' + (r.import || '').padEnd(25) + String(r.rows || '-').padEnd(8) + String(r.success || '-').padEnd(10) + String(r.failed || '-').padEnd(10) + status);
  }

  console.log('\n  Insights by Page (after all imports):');
  console.log('  ' + '─'.repeat(68));
  const lastResult = allResults[allResults.length - 1];
  if (lastResult?.insights) {
    for (const [pageName, scan] of Object.entries(lastResult.insights)) {
      console.log(`  ${pageName}: ${scan.status === 'CRASHED' ? '❌ CRASHED' : `${scan.insights?.length || 0} insights`}`);
    }
  }

  // ─── Step 7: Weather verification ─────────────────────────
  subheading('Weather on Today page');
  await page.goto(`${APP_URL}/#/today`);
  await page.waitForTimeout(3000);
  const todayBody = await page.locator('body').textContent();
  const hasWeather = /°F|forecast|wind|rain|weather|temperature/i.test(todayBody);
  const hasRounds = /rounds?\s*booked|tee.*sheet/i.test(todayBody);
  console.log(`  Weather data visible: ${hasWeather ? 'YES' : 'NO'}`);
  console.log(`  Rounds/tee data visible: ${hasRounds ? 'YES' : 'NO'}`);

  // Check 10-day forecast
  const has10Day = /10.day|week.*forecast/i.test(todayBody);
  console.log(`  10-day forecast visible: ${has10Day ? 'YES' : 'NO'}`);

  await browser.close();

  heading('AUDIT COMPLETE');
  log(`Club ID: ${club.clubId}`);
  log(`Total imports attempted: ${IMPORTS.length}`);
  log(`Successful imports: ${allResults.filter(r => r.success > 0).length}`);

  process.exit(0);
})().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
