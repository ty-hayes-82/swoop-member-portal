/**
 * pinetree-setup.mjs
 *
 * One-shot setup script for Pinetree Country Club (Kennesaw, GA).
 * Creates a real (non-demo) club, imports all 21 CSV files in dependency order,
 * computes health scores, and runs the agent sweep so the inbox is pre-populated.
 *
 * Usage:
 *   APP_URL=https://swoop-member-portal-dev.vercel.app node scripts/pinetree-setup.mjs
 *   APP_URL=https://... node scripts/pinetree-setup.mjs --reuse   (skip club creation)
 *
 * Credentials are saved to critiques/pinetree-creds.json for use by the
 * pinetree-concierge Playwright test suite (E2E_CLUB_* env vars not required).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCSV, login, importCSV, sleep } from './lib/infra.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'demo-data');
const CREDS_PATH = path.join(ROOT, '..', 'critiques', 'pinetree-creds.json');

const APP_URL = process.env.APP_URL || 'https://swoop-member-portal-dev.vercel.app';
const REUSE = process.argv.includes('--reuse');

// ─── Import sequence (dependency order) ──────────────────────────────────────

const IMPORTS = [
  // Phase 1: Core member data
  { importType: 'membership_types', file: 'JCM_Membership_Types_F9.csv',   label: 'Membership Types' },
  { importType: 'members',          file: 'JCM_Members_F9.csv',             label: 'Members (394)' },
  { importType: 'households',       file: 'JCM_Dependents_F9.csv',          label: 'Households/Dependents' },
  // Phase 2: Golf operations
  { importType: 'courses',          file: 'TTM_Course_Setup_F9.csv',        label: 'Courses' },
  { importType: 'tee_times',        file: 'TTM_Tee_Sheet_SV.csv',           label: 'Tee Times (4,467)' },
  { importType: 'booking_players',  file: 'TTM_Tee_Sheet_Players_SV.csv',   label: 'Booking Players (5,697)' },
  // Phase 3: F&B / POS
  { importType: 'sales_areas',      file: 'POS_Sales_Areas_F9.csv',         label: 'POS Sales Areas' },
  { importType: 'transactions',     file: 'POS_Sales_Detail_SV.csv',        label: 'POS Transactions (1,941)' },
  { importType: 'line_items',       file: 'POS_Line_Items_SV.csv',          label: 'POS Line Items (7,496)' },
  { importType: 'payments',         file: 'POS_Payments_SV.csv',            label: 'POS Payments (1,941)' },
  { importType: 'daily_close',      file: 'POS_Daily_Close_SV.csv',         label: 'Daily Close Outs' },
  // Phase 4: Staffing
  { importType: 'staff',            file: 'ADP_Staff_Roster.csv',           label: 'Staff Roster' },
  { importType: 'shifts',           file: '7shifts_Staff_Shifts.csv',       label: 'Staff Shifts (641)' },
  // Phase 5: Email / Marketing
  { importType: 'email_campaigns',  file: 'CHO_Campaigns_SV.csv',           label: 'Email Campaigns' },
  { importType: 'email_events',     file: 'CHO_Email_Events_SV.csv',        label: 'Email Events (10,118)' },
  // Phase 6: Events
  { importType: 'events',           file: 'JAM_Event_List_SV.csv',          label: 'Club Events' },
  { importType: 'event_registrations', file: 'JAM_Registrations_SV.csv',   label: 'Event Registrations (1,649)' },
  // Phase 7: Billing & Service
  { importType: 'invoices',         file: 'JCM_Aged_Receivables_SV.csv',    label: 'Aged Receivables (1,675)' },
  { importType: 'complaints',       file: 'JCM_Communications_RG.csv',      label: 'Member Communications' },
  { importType: 'service_requests', file: 'JCM_Service_Requests_RG.csv',    label: 'Service Requests' },
];

// ─── Club creation ────────────────────────────────────────────────────────────

async function createPinetree() {
  const ts = Date.now();
  const email = `pinetree-${ts}@e2e.test`;
  const password = 'Pinetree1!';

  console.log('\n  Creating Pinetree Country Club...');
  const res = await fetch(`${APP_URL}/api/onboard-club`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clubName: 'Pinetree Country Club',
      city: 'Kennesaw',
      state: 'GA',
      zip: '30144',
      memberCount: 394,
      courseCount: 3,
      outletCount: 7,
      adminEmail: email,
      adminName: 'Tyler Hayes',
      adminPassword: password,
    }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  if (res.status !== 201 || !json?.clubId) {
    throw new Error(`onboard-club failed (status=${res.status}): ${text.slice(0, 400)}`);
  }
  console.log(`  Club created: ${json.clubId}`);
  return { clubId: json.clubId, email, password };
}

// ─── Post-import: health scores + agent sweep ─────────────────────────────────

async function postImportSetup(clubId, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 1. Compute health scores
  console.log('\n  Computing health scores...');
  const hsRes = await fetch(`${APP_URL}/api/compute-health-scores?clubId=${clubId}`, {
    method: 'POST', headers,
  });
  const hsJson = await hsRes.json().catch(() => ({}));
  if (hsRes.ok) {
    console.log(`  Health scores computed: ${hsJson.computed ?? '?'} / ${hsJson.totalMembers ?? '?'} members`);
  } else {
    console.warn(`  Health scores returned ${hsRes.status} — continuing anyway`);
  }

  await sleep(2000);

  // 2. Agent autonomous sweep (generates inbox actions)
  console.log('\n  Running agent sweep...');
  const agRes = await fetch(`${APP_URL}/api/agent-autonomous?clubId=${clubId}`, {
    method: 'POST', headers,
  });
  const agJson = await agRes.json().catch(() => ({}));
  if (agRes.ok) {
    const count = agJson.results?.length ?? agJson.agents?.length ?? 0;
    console.log(`  Agent sweep complete: ${count} agents ran`);
  } else {
    console.warn(`  Agent sweep returned ${agRes.status} — continuing anyway`);
  }

  await sleep(2000);

  // 3. Health monitor cron (creates risk-based playbooks for at-risk members)
  console.log('\n  Triggering health monitor...');
  const hmRes = await fetch(`${APP_URL}/api/cron/health-monitor`, {
    method: 'POST', headers,
  });
  if (hmRes.ok) {
    console.log('  Health monitor triggered');
  } else {
    console.warn(`  Health monitor returned ${hmRes.status} — continuing anyway`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Pinetree Country Club Setup');
  console.log(`  APP_URL: ${APP_URL}`);
  console.log(`  REUSE: ${REUSE}`);
  console.log('='.repeat(60));

  let creds;

  if (REUSE && fs.existsSync(CREDS_PATH)) {
    creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    console.log(`\n  Reusing existing club: ${creds.clubId}`);
    // Get a fresh token
    const auth = await login(APP_URL, creds.email, creds.password);
    creds.token = auth.token;
  } else {
    if (REUSE) {
      console.warn(`  --reuse specified but ${CREDS_PATH} not found — creating new club`);
    }
    const club = await createPinetree();
    const auth = await login(APP_URL, club.email, club.password);
    creds = { ...club, token: auth.token, createdAt: new Date().toISOString() };
  }

  const { clubId, token } = creds;
  const authToken = token;

  // Import all CSV files in order
  console.log(`\n${'─'.repeat(60)}`);
  console.log('  Importing CSV files...');
  console.log('─'.repeat(60));

  const results = [];
  for (const { importType, file, label } of IMPORTS) {
    const csvPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(csvPath)) {
      console.warn(`  SKIP — file not found: ${csvPath}`);
      results.push({ importType, file, status: 'skipped' });
      continue;
    }
    process.stdout.write(`  [${importType.padEnd(22)}] ${label}... `);
    try {
      const result = await importCSV(APP_URL, authToken, importType, csvPath, '?');
      console.log(`${result.accepted}/${result.total} rows`);
      results.push({ importType, file, ...result, status: 'ok' });
    } catch (err) {
      console.log(`FAILED: ${err.message?.slice(0, 80)}`);
      results.push({ importType, file, status: 'error', error: err.message });
    }
    // Brief pause to avoid hammering the rate limiter
    await sleep(300);
  }

  // Post-import: health scores, agent sweep, health monitor
  await postImportSetup(clubId, authToken);

  // Save credentials
  const toSave = { clubId, email: creds.email, password: creds.password, token: authToken, createdAt: creds.createdAt ?? new Date().toISOString() };
  fs.mkdirSync(path.dirname(CREDS_PATH), { recursive: true });
  fs.writeFileSync(CREDS_PATH, JSON.stringify(toSave, null, 2));

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Setup Summary');
  console.log('='.repeat(60));
  const ok = results.filter(r => r.status === 'ok').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors = results.filter(r => r.status === 'error');
  console.log(`  Imports:   ${ok} ok, ${skipped} skipped, ${errors.length} errors`);
  if (errors.length) {
    errors.forEach(e => console.warn(`    ERROR: ${e.importType} — ${e.error?.slice(0, 100)}`));
  }
  console.log(`  Club ID:   ${clubId}`);
  console.log(`  Email:     ${creds.email}`);
  console.log(`  Creds:     ${CREDS_PATH}`);
  console.log('\n  Run the test suite:');
  console.log(`    npm run test:pinetree\n`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message || err);
  process.exit(1);
});
