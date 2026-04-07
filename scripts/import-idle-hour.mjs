#!/usr/bin/env node
/**
 * Import: Idle Hour Country Club — Jonas CSV Exports
 *
 * Reads 21 CSV files from docs/jonas-exports/ and loads them
 * into the database via /api/import-csv in dependency order.
 *
 * All CSV header mapping is done client-side so the script works
 * against any deployed version of the API without needing a redeploy.
 *
 * Usage:
 *   node scripts/import-idle-hour.mjs [base-url]
 *
 * Default base URL: https://swoop-member-portal.vercel.app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.resolve(__dirname, '..', 'docs', 'jonas-exports');
const BASE_URL = process.argv[2] || 'https://swoop-member-portal.vercel.app';
const BATCH_SIZE = 200;

const CLUB_NAME = 'Idle Hour Country Club';
const ADMIN_EMAIL = 'admin@idlehourcc.com';
const ADMIN_NAME = 'Idle Hour Admin';
const ADMIN_PASSWORD = 'IdleHour2026!';

let token = null;
let clubId = null;

// ── Client-side header maps ─────────────────────────────────────
// Maps exact CSV column headers to the field names the API expects.
// This avoids depending on server-side alias resolution.

const HEADER_MAPS = {
  'JCM_Membership_Types_F9.csv': {
    'Type Code': 'type_code', 'Description': 'description',
    'Annual Fee': 'annual_fee', 'F&B Minimum': 'fnb_minimum', 'Golf Eligible': 'golf_eligible',
  },
  'JCM_Members_F9.csv': {
    'Member #': 'external_id', 'Member Number': '_skip',
    'Given Name': 'first_name', 'Surname': 'last_name',
    'Email': 'email', 'Phone #': 'phone', 'Birthday': 'birthday',
    'Sex': 'sex', 'Membership Type': 'membership_type', 'Status': 'status',
    'Date Joined': 'join_date', 'Date Resigned': 'date_resigned',
    'Household ID': 'household_id', 'Annual Fee': 'annual_dues',
    'Current Balance': 'current_balance', 'Handicap #': 'handicap', 'Mailings': '_skip',
  },
  'JCM_Dependents_F9.csv': {
    'Household ID': 'household_id', 'Primary Member #': 'primary_member_id',
    'Dependent Count': 'dependent_count', 'Home Address': 'home_address',
  },
  'TTM_Course_Setup_F9.csv': {
    'Course Code': 'course_code', 'Course Name': 'course_name',
    'Holes': 'holes', 'Par': 'par', 'Interval (min)': 'interval_min',
    'Start Time': 'start_time', 'End Time': 'end_time',
  },
  'TTM_Tee_Sheet_SV.csv': {
    'Reservation ID': 'reservation_id', 'Course': 'course', 'Date': 'date',
    'Tee Time': 'tee_time', 'Players': 'players', 'Guest Flag': 'guest_flag',
    'Transportation': 'transportation', 'Caddie': 'caddie', 'Holes': 'holes',
    'Status': 'status', 'Check-In Time': 'check_in_time',
    'Round Start': 'round_start', 'Round End': 'round_end', 'Duration (min)': 'duration_min',
  },
  'TTM_Tee_Sheet_Players_SV.csv': {
    'Player ID': 'player_id', 'Reservation ID': 'reservation_id',
    'Member #': 'member_id', 'Guest Name': 'guest_name',
    'Guest Flag': 'guest_flag', 'Position': 'position',
  },
  'POS_Sales_Areas_F9.csv': {
    'Sales Area ID': 'sales_area_id', 'Sales Area Description': 'description',
    'Type': 'type', 'Operating Hours': 'operating_hours',
    'Weekday Covers': 'weekday_covers', 'Weekend Covers': 'weekend_covers',
  },
  'POS_Sales_Detail_SV.csv': {
    'Chk#': 'check_id', 'Sales Area': 'outlet_name',
    'Member #': 'member_id', 'Open Time': 'transaction_date',
    'Close Time': 'close_time', 'First Fire': '_skip', 'Last Fulfilled': '_skip',
    'Net Amount': 'total_amount', 'Tax': 'tax', 'Gratuity': 'gratuity',
    'Comp': 'comp', 'Discount': 'discount', 'Void': 'void',
    'Total Due': '_skip', 'Settlement Method': 'settlement_method',
  },
  'POS_Line_Items_SV.csv': {
    'Line Item ID': 'line_item_id', 'Chk#': 'check_id',
    'Item Description': 'item_description', 'Sales Category': 'sales_category',
    'Regular Price': 'regular_price', 'Qty': 'qty', 'Line Total': 'line_total',
    'Comp': 'comp', 'Void': 'void', 'Fire Time': 'fire_time',
  },
  'POS_Payments_SV.csv': {
    'Payment ID': 'payment_id', 'Chk#': 'check_id',
    'Settlement Method': 'payment_method', 'Amount': 'amount',
    'Settlement Time': 'processed_at', 'Split': 'is_split',
  },
  'POS_Daily_Close_SV.csv': {
    'Close ID': 'closeout_id', 'Date': 'date',
    'Golf Revenue': 'golf_revenue', 'F&B Revenue': 'fb_revenue',
    'Total Revenue': 'total_revenue', 'Rounds Played': 'rounds_played',
    'Covers': 'covers', 'Weather': 'weather',
  },
  'JCM_Communications_RG.csv': {
    'Communication ID': 'feedback_id', 'Member #': 'member_id',
    'Date': 'reported_at', 'Type': 'category',
    'Happometer Score': 'priority', 'Subject': 'description',
    'Complete': 'status', 'Resolution Date': 'resolved_at',
  },
  'JCM_Service_Requests_RG.csv': {
    'Request ID': 'request_id', 'Member #': 'member_id',
    'Booking Ref': 'booking_ref', 'Type': 'type', 'Date': 'date',
    'Response Time (min)': 'response_time_min',
    'Resolution Date': 'resolution_date', 'Notes': 'notes',
  },
  'JAM_Event_List_SV.csv': {
    'Event Number': 'event_id', 'Event Name': 'event_name',
    'Event Type': 'event_type', 'Start Date': 'start_date',
    'Capacity': 'capacity', 'Pricing Category': 'registration_fee',
    'Description': 'description',
  },
  'JAM_Registrations_SV.csv': {
    'Registration ID': 'registration_id', 'Event Number': 'event_id',
    'Client Code': 'member_id', 'Status': 'status',
    'Guest Count': 'guest_count', 'Fee Paid': 'fee_paid',
    'Registration Date': 'registration_date', 'Check-In Time': 'check_in_time',
  },
  'CHO_Campaigns_SV.csv': {
    'Campaign ID': 'campaign_id', 'Subject': 'subject',
    'Campaign Type': 'campaign_type', 'Send Date': 'send_date',
    'Audience Count': 'audience_count',
  },
  'CHO_Email_Events_SV.csv': {
    'Event ID': '_skip', 'Campaign': 'campaign_id',
    'Member #': 'member_id', 'Event Type': 'event_type',
    'Timestamp': 'timestamp', 'Link Clicked': 'link_clicked', 'Device': 'device',
  },
  'ADP_Staff_Roster.csv': {
    'Employee ID': 'employee_id', 'First Name': 'first_name',
    'Last Name': 'last_name', 'Dept': 'department',
    'Job Title': 'job_title', 'Hire Date': 'hire_date',
    'Hourly Rate': 'hourly_rate', 'FT/PT': 'ft_pt',
  },
  '7shifts_Staff_Shifts.csv': {
    'Shift ID': 'shift_id', 'Employee ID': 'employee_id',
    'Date': 'date', 'Location': 'location',
    'Shift Start': 'shift_start', 'Shift End': 'shift_end',
    'Act Hrs': 'actual_hours', 'Notes': 'notes',
  },
  'JCM_Aged_Receivables_SV.csv': {
    'Invoice #': 'invoice_id', 'Member #': 'member_id',
    'Statement Date': 'statement_date', 'Due Date': 'due_date',
    'Net Amount': 'net_amount', 'Billing Code Type': 'billing_code_type',
    'Description': 'description', 'Aging Bucket': 'aging_bucket',
    'Last Payment': 'last_payment', 'Payment Amount': 'payment_amount',
    'Days Past Due': 'days_past_due', 'Late Fee': 'late_fee',
  },
};

// ── Helpers ─────────────────────────────────────────────────────

function log(icon, msg) { console.log(`${icon} ${msg}`); }

async function api(method, apiPath, body = null, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${apiPath}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

/**
 * Parse a CSV file into an array of row objects.
 * Applies client-side header mapping if available.
 */
function parseCSV(filePath, headerMap) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let current = '';
  let inQuotes = false;

  // Split into lines respecting quoted newlines
  const lines = [];
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
      if (ch === '\r' && content[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length === 0) return [];

  // Parse header and apply mapping
  const rawHeaders = splitCSVLine(lines[0]);
  const headers = rawHeaders.map(h => {
    const trimmed = h.trim();
    if (headerMap && headerMap[trimmed]) return headerMap[trimmed];
    return trimmed;
  });

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === '_skip') continue;
      row[headers[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Import rows via /api/import-csv in batches.
 */
async function importCSV(importType, rows, label) {
  log('📦', `${label}: ${rows.length} rows (${importType})`);
  let totalSuccess = 0;
  let totalErrors = 0;
  const errorDetails = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    const r = await api('POST', '/api/import-csv', {
      clubId,
      importType,
      rows: batch,
      uploadedBy: 'import-idle-hour-script',
    }, { Authorization: `Bearer ${token}` });

    if (r.ok) {
      totalSuccess += r.data.success || 0;
      totalErrors += r.data.errors || 0;
      if (r.data.errorDetails?.length) {
        errorDetails.push(...r.data.errorDetails.slice(0, 5));
      }
      if (totalBatches > 1) {
        process.stdout.write(`  Batch ${batchNum}/${totalBatches}: ${r.data.success}/${batch.length}\r`);
      }
    } else {
      log('  ❌', `Batch ${batchNum} failed: ${JSON.stringify(r.data).slice(0, 200)}`);
      totalErrors += batch.length;
    }
  }

  if (rows.length > BATCH_SIZE) console.log();
  const icon = totalErrors === 0 ? '✅' : totalErrors < rows.length ? '⚠️' : '❌';
  log(icon, `${label}: ${totalSuccess}/${rows.length} imported${totalErrors > 0 ? `, ${totalErrors} errors` : ''}`);

  if (errorDetails.length > 0) {
    log('  📋', `Sample errors: ${JSON.stringify(errorDetails.slice(0, 3))}`);
  }

  return { success: totalSuccess, errors: totalErrors };
}

/**
 * Load a CSV file, apply header mapping, and import.
 */
async function loadFile(filename, importType, label) {
  const filePath = path.join(CSV_DIR, filename);
  if (!fs.existsSync(filePath)) {
    log('❌', `File not found: ${filePath}`);
    return { success: 0, errors: 0 };
  }
  const headerMap = HEADER_MAPS[filename] || null;
  const rows = parseCSV(filePath, headerMap);
  return importCSV(importType, rows, label || filename);
}

// ── Main Flow ───────────────────────────────────────────────────

async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Idle Hour Country Club — Jonas CSV Import');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Base URL:  ${BASE_URL}`);
  console.log(`CSV Dir:   ${CSV_DIR}`);
  console.log(`Club:      ${CLUB_NAME}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  if (!fs.existsSync(CSV_DIR)) {
    log('❌', `CSV directory not found: ${CSV_DIR}`);
    process.exit(1);
  }

  const results = {};

  // Step 1: Create club
  log('📋', 'Step 1: Creating club...');
  const r1 = await api('POST', '/api/onboard-club', {
    clubName: CLUB_NAME,
    city: 'Lexington',
    state: 'KY',
    zip: '40502',
    memberCount: 390,
    courseCount: 2,
    outletCount: 5,
    adminEmail: ADMIN_EMAIL,
    adminName: ADMIN_NAME,
    adminPassword: ADMIN_PASSWORD,
  });
  if (!r1.ok) {
    // If club already exists, try logging in with existing credentials
    if (r1.status === 409) {
      log('⚠️', 'Admin email already exists — attempting login with existing account...');
    } else {
      log('❌', `Create club failed: ${JSON.stringify(r1.data)}`);
      process.exit(1);
    }
  } else {
    clubId = r1.data.clubId;
    log('✅', `Club created: ${clubId}`);
  }

  // Step 2: Login
  log('🔑', 'Step 2: Logging in...');
  const r2 = await api('POST', '/api/auth', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!r2.ok) {
    log('❌', `Login failed: ${JSON.stringify(r2.data)}`);
    process.exit(1);
  }
  token = r2.data.token;
  if (!clubId) clubId = r2.data.user.clubId;
  log('✅', `Logged in as ${r2.data.user.name} (club: ${clubId})\n`);

  // ── Phase 1: Club Setup + Members ─────────────────────────────

  console.log('─── Phase 1: Club Setup + Members ─────────────────');
  results.membership_types = await loadFile('JCM_Membership_Types_F9.csv', 'membership_types', 'Membership Types');
  results.members = await loadFile('JCM_Members_F9.csv', 'members', 'Members');
  results.households = await loadFile('JCM_Dependents_F9.csv', 'households', 'Households');

  // ── Phase 2: Golf Operations ──────────────────────────────────

  console.log('\n─── Phase 2: Golf Operations ──────────────────────');
  results.courses = await loadFile('TTM_Course_Setup_F9.csv', 'courses', 'Courses');
  results.tee_times = await loadFile('TTM_Tee_Sheet_SV.csv', 'tee_times', 'Tee Times');
  results.booking_players = await loadFile('TTM_Tee_Sheet_Players_SV.csv', 'booking_players', 'Booking Players');

  // ── Phase 3: F&B + POS ────────────────────────────────────────

  console.log('\n─── Phase 3: F&B + POS ────────────────────────────');
  results.sales_areas = await loadFile('POS_Sales_Areas_F9.csv', 'sales_areas', 'Sales Areas');
  // POS Sales Detail → use 'transactions' import type (pos_checks not deployed yet)
  results.transactions = await loadFile('POS_Sales_Detail_SV.csv', 'transactions', 'POS Sales Detail');
  results.line_items = await loadFile('POS_Line_Items_SV.csv', 'line_items', 'Line Items');
  // POS Payments — 'payments' import type not deployed yet, skip for now
  log('⏭️', 'POS Payments: skipped (payments import type requires deploy)');
  results.payments = { success: 0, errors: 0 };
  results.daily_close = await loadFile('POS_Daily_Close_SV.csv', 'daily_close', 'Daily Close');

  // ── Phase 4: Service + Feedback ───────────────────────────────

  console.log('\n─── Phase 4: Service + Feedback ───────────────────');
  results.complaints = await loadFile('JCM_Communications_RG.csv', 'complaints', 'Communications/Feedback');
  results.service_requests = await loadFile('JCM_Service_Requests_RG.csv', 'service_requests', 'Service Requests');

  // ── Phase 5: Events + Email ───────────────────────────────────

  console.log('\n─── Phase 5: Events + Email ───────────────────────');
  results.events = await loadFile('JAM_Event_List_SV.csv', 'events', 'Events');
  results.event_registrations = await loadFile('JAM_Registrations_SV.csv', 'event_registrations', 'Event Registrations');
  results.email_campaigns = await loadFile('CHO_Campaigns_SV.csv', 'email_campaigns', 'Email Campaigns');
  results.email_events = await loadFile('CHO_Email_Events_SV.csv', 'email_events', 'Email Events');

  // ── Phase 6: Staffing + Billing ───────────────────────────────

  console.log('\n─── Phase 6: Staffing + Billing ───────────────────');
  results.staff = await loadFile('ADP_Staff_Roster.csv', 'staff', 'Staff Roster');
  results.shifts = await loadFile('7shifts_Staff_Shifts.csv', 'shifts', 'Staff Shifts');
  results.invoices = await loadFile('JCM_Aged_Receivables_SV.csv', 'invoices', 'Invoices/AR');

  // ── Step: Compute Health Scores ───────────────────────────────

  console.log('\n─── Health Score Computation ───────────────────────');
  log('🧮', 'Computing health scores...');
  const rHealth = await api('POST', `/api/compute-health-scores?clubId=${clubId}`, { clubId }, { Authorization: `Bearer ${token}` });
  if (rHealth.ok) {
    log('✅', `Health scores: ${rHealth.data.computed || rHealth.data.count || 0} computed`);
  } else {
    log('⚠️', `Health scores: ${JSON.stringify(rHealth.data).slice(0, 200)}`);
  }

  // ── Summary ───────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Club ID:      ${clubId}`);
  console.log(`Club Name:    ${CLUB_NAME}`);
  console.log(`Admin Email:  ${ADMIN_EMAIL}`);
  console.log(`Admin Pass:   ${ADMIN_PASSWORD}`);
  console.log('');

  let grandSuccess = 0;
  let grandErrors = 0;
  for (const [key, val] of Object.entries(results)) {
    const icon = val.errors === 0 ? '✅' : '⚠️';
    console.log(`  ${icon} ${key.padEnd(22)} ${String(val.success).padStart(6)} ok  ${val.errors > 0 ? `${val.errors} err` : ''}`);
    grandSuccess += val.success;
    grandErrors += val.errors;
  }

  console.log(`\n  Total: ${grandSuccess} rows imported, ${grandErrors} errors`);
  console.log(`\n  Login URL: ${BASE_URL}/#/login`);
  console.log('═══════════════════════════════════════════════════════\n');
}

run().catch(err => { console.error('Import error:', err); process.exit(1); });
