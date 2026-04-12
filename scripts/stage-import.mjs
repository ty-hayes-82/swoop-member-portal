#!/usr/bin/env node
/**
 * Single-stage CSV import driver.
 *
 * Imports ONE Jonas CSV into the test club via /api/import-csv,
 * reports row counts before/after, and exits non-zero on failure.
 *
 * Usage:
 *   node scripts/stage-import.mjs <importType> <csvPath> [clubId]
 *
 * Examples:
 *   node scripts/stage-import.mjs booking_players tests/fixtures/small/TTM_Tee_Sheet_Players_SV.csv
 *   node scripts/stage-import.mjs courses docs/jonas-exports/TTM_Course_Setup_F9.csv
 *
 * Env required: POSTGRES_URL, CRON_SECRET (set to anything).
 */
import fs from 'fs';
import path from 'path';
import { sql } from '@vercel/postgres';

// Per-file header maps cribbed from scripts/import-idle-hour.mjs.
// Keys are the raw CSV header names; values are the snake_case field
// names the /api/import-csv handler expects (or '_skip' to drop).
const HEADER_MAPS = {
  'JCM_Members_F9.csv': {
    'Member #': 'external_id', 'Member Number': '_skip',
    'Given Name': 'first_name', 'Surname': 'last_name',
    'Email': 'email', 'Phone #': 'phone', 'Birthday': 'birthday',
    'Sex': 'sex', 'Membership Type': 'membership_type', 'Status': 'status',
    'Date Joined': 'join_date', 'Date Resigned': 'date_resigned',
    'Household ID': 'household_id', 'Annual Fee': 'annual_dues',
    'Current Balance': 'current_balance', 'Handicap #': 'handicap', 'Mailings': '_skip',
  },
  'TTM_Tee_Sheet_SV.csv': {
    'Reservation ID': 'reservation_id', 'Course': 'course', 'Date': 'date',
    'Tee Time': 'tee_time', 'Players': 'players', 'Guest Flag': 'guest_flag',
    'Transportation': 'transportation', 'Caddie': 'caddie', 'Holes': 'holes',
    'Status': 'status', 'Check-In Time': 'check_in_time',
    'Round Start': 'round_start', 'Round End': 'round_end', 'Duration (min)': 'duration_min',
  },
  'POS_Sales_Detail_SV.csv|pos_checks': {
    'Chk#': 'check_id', 'Sales Area': 'sales_area',
    'Member #': 'member_id', 'Open Time': 'open_time',
    'Close Time': 'close_time', 'First Fire': '_skip', 'Last Fulfilled': '_skip',
    'Net Amount': 'net_amount', 'Tax': 'tax', 'Gratuity': 'gratuity',
    'Comp': 'comp', 'Discount': 'discount', 'Void': 'void',
    'Total Due': 'total_due', 'Settlement Method': 'settlement_method',
  },
  'POS_Sales_Detail_SV.csv': {
    'Chk#': '_skip', 'Sales Area': 'outlet_name',
    'Member #': 'member_id', 'Open Time': 'transaction_date',
    'Close Time': 'close_time', 'First Fire': '_skip', 'Last Fulfilled': '_skip',
    'Net Amount': 'total_amount', 'Tax': 'tax', 'Gratuity': 'gratuity',
    'Comp': 'comp', 'Discount': 'discount', 'Void': 'void',
    'Total Due': '_skip', 'Settlement Method': 'settlement_method',
  },
  'JCM_Communications_RG.csv': {
    'Communication ID': 'feedback_id', 'Member #': 'member_id',
    'Date': 'reported_at', 'Type': 'category',
    'Happometer Score': 'priority', 'Subject': 'description',
    'Complete': 'status', 'Resolution Date': 'resolved_at',
  },
  'TTM_Tee_Sheet_Players_SV.csv': {
    'Player ID': 'player_id', 'Reservation ID': 'reservation_id',
    'Member #': 'member_id', 'Guest Name': 'guest_name',
    'Guest Flag': 'guest_flag', 'Position': 'position',
  },
  'TTM_Course_Setup_F9.csv': {
    'Course Code': 'course_code', 'Course Name': 'course_name',
    'Holes': 'holes', 'Par': 'par', 'Interval (min)': 'interval_min',
    'Start Time': 'start_time', 'End Time': 'end_time',
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
  'POS_Sales_Areas_F9.csv': {
    'Sales Area ID': 'sales_area_id', 'Sales Area Description': 'description',
    'Type': 'type', 'Operating Hours': 'operating_hours',
    'Weekday Covers': 'weekday_covers', 'Weekend Covers': 'weekend_covers',
  },
  '7shifts_Staff_Shifts.csv': {
    'Shift ID': 'shift_id', 'Employee ID': 'employee_id',
    'Date': 'date', 'Location': 'location',
    'Shift Start': 'shift_start', 'Shift End': 'shift_end',
    'Act Hrs': 'actual_hours', 'Notes': 'notes',
  },
  'ADP_Staff_Roster.csv': {
    'Employee ID': 'employee_id', 'First Name': 'first_name',
    'Last Name': 'last_name', 'Dept': 'department',
    'Job Title': 'job_title', 'Hire Date': 'hire_date',
    'Hourly Rate': 'hourly_rate', 'FT/PT': 'ft_pt',
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
  'JCM_Aged_Receivables_SV.csv': {
    'Invoice #': 'invoice_id', 'Member #': 'member_id',
    'Statement Date': 'statement_date', 'Due Date': 'due_date',
    'Net Amount': 'net_amount', 'Billing Code Type': 'billing_code_type',
    'Description': 'description', 'Aging Bucket': 'aging_bucket',
    'Last Payment': 'last_payment', 'Payment Amount': 'payment_amount',
    'Days Past Due': 'days_past_due', 'Late Fee': 'late_fee',
  },
  'JCM_Dependents_F9.csv': {
    'Household ID': 'household_id', 'Primary Member #': 'primary_member_id',
    'Dependent Count': 'dependent_count', 'Home Address': 'home_address',
  },
  'JCM_Membership_Types_F9.csv': {
    'Type Code': 'type_code', 'Description': 'description',
    'Annual Fee': 'annual_fee', 'F&B Minimum': 'fnb_minimum',
    'Golf Eligible': 'golf_eligible',
  },
  'JCM_Service_Requests_RG.csv': {
    'Request ID': 'request_id', 'Member #': 'member_id',
    'Booking Ref': 'booking_ref', 'Type': 'type', 'Date': 'date',
    'Response Time (min)': 'response_time_min',
    'Resolution Date': 'resolution_date', 'Notes': 'notes',
  },
  'JCM_Club_Profile.csv': {
    'Club Name': 'club_name', 'Address': 'address', 'City': 'city',
    'State': 'state', 'Zip': 'zip', 'Phone': 'phone', 'Website': 'website',
    'Founded': 'founded', 'Membership Cap': 'membership_cap',
  },
};

const TEST_CLUB_ID = process.argv[4] || process.env.TEST_CLUB_ID || 'e56ae6f7-e7cd-4198-8786-f2de9f813e17';
const IMPORT_TYPE = process.argv[2];
const CSV_PATH = process.argv[3];

if (!IMPORT_TYPE || !CSV_PATH) {
  console.error('usage: stage-import.mjs <importType> <csvPath> [clubId]');
  process.exit(2);
}

// importType → destination table for row-count verification
const IMPORT_TABLE = {
  members: 'members',
  tee_times: 'bookings',
  transactions: 'transactions',
  complaints: 'complaints',
  pos_checks: 'pos_checks',
  households: 'households',
  booking_players: 'booking_players',
  courses: 'courses',
  line_items: 'pos_line_items',
  payments: 'pos_payments',
  daily_close: 'close_outs',
  sales_areas: 'dining_outlets',
  shifts: 'staff_shifts',
  staff: 'staff',
  events: 'event_definitions',
  event_registrations: 'event_registrations',
  email_campaigns: 'email_campaigns',
  email_events: 'email_events',
  invoices: 'member_invoices',
  membership_types: 'membership_types',
  service_requests: 'service_requests',
  club_profile: 'club',
};

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === ',' && !q) {
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCSV(filePath, headerMap) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') { q = !q; cur += ch; }
    else if ((ch === '\n' || ch === '\r') && !q) {
      if (cur.trim()) lines.push(cur);
      cur = '';
      if (ch === '\r' && content[i + 1] === '\n') i++;
    } else cur += ch;
  }
  if (cur.trim()) lines.push(cur);
  if (!lines.length) return [];
  // Apply header map if provided; otherwise lowercase + snake_case fallback
  const headers = splitCSVLine(lines[0]).map(h => {
    const trimmed = h.trim();
    if (headerMap && headerMap[trimmed]) return headerMap[trimmed];
    return trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '_');
  });
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === '_skip') continue;
      row[headers[j]] = (vals[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

// Tables with no club_id column (multi-tenant via FK to bookings/checks).
const TABLES_WITHOUT_CLUBID = new Set(['booking_players', 'pos_line_items', 'pos_payments']);

async function rowCount(table) {
  try {
    if (TABLES_WITHOUT_CLUBID.has(table)) {
      const r = await sql.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
      return r.rows[0]?.n ?? 0;
    }
    const r = await sql.query(
      `SELECT COUNT(*)::int AS n FROM ${table} WHERE club_id = $1`,
      [TEST_CLUB_ID],
    );
    return r.rows[0]?.n ?? 0;
  } catch (e) {
    if (/does not exist/.test(e.message)) {
      return -1;
    }
    throw e;
  }
}

async function main() {
  const absPath = path.resolve(CSV_PATH);
  if (!fs.existsSync(absPath)) {
    console.error('csv not found:', absPath);
    process.exit(2);
  }

  const table = IMPORT_TABLE[IMPORT_TYPE];
  if (!table) {
    console.error('unknown importType:', IMPORT_TYPE);
    process.exit(2);
  }

  console.log(`[stage-import] type=${IMPORT_TYPE} csv=${path.basename(absPath)} club=${TEST_CLUB_ID.slice(0, 8)}`);

  // Look up by `${filename}|${importType}` first, then fall back to filename alone.
  const baseName = path.basename(absPath);
  const headerMap = HEADER_MAPS[`${baseName}|${IMPORT_TYPE}`] || HEADER_MAPS[baseName] || null;
  const rows = parseCSV(absPath, headerMap);
  console.log(`[stage-import] parsed ${rows.length} rows`);

  const before = await rowCount(table);
  console.log(`[stage-import] ${table} before: ${before === -1 ? '(table missing)' : before}`);

  // Invoke handler in-process via cron-key bypass
  const { default: handler } = await import('../api/import-csv.js');
  const req = {
    method: 'POST',
    headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' },
    body: { importType: IMPORT_TYPE, rows, club_id: TEST_CLUB_ID, clubId: TEST_CLUB_ID },
  };
  const res = {
    code: 0,
    body: null,
    setHeader() {},
    status(c) { this.code = c; return this; },
    json(o) { this.body = o; return this; },
    end() { return this; },
  };
  await handler(req, res);

  const after = await rowCount(table);
  const inserted = (after === -1 ? 0 : after) - (before === -1 ? 0 : before);

  console.log(`[stage-import] response: ${res.code} accepted=${res.body?.accepted ?? '?'} rejected=${res.body?.errors ?? '?'}`);
  console.log(`[stage-import] ${table} after: ${after === -1 ? '(table missing)' : after} (Δ${inserted >= 0 ? '+' : ''}${inserted})`);

  if (res.body?.rejected?.length > 0) {
    console.log('[stage-import] sample rejections:');
    res.body.rejected.slice(0, 3).forEach(r => console.log('  -', JSON.stringify(r).slice(0, 200)));
  }

  if (res.code !== 200) {
    console.error('[stage-import] FAILED:', res.body);
    process.exit(1);
  }
  if (after === -1) {
    console.error(`[stage-import] FAILED: destination table ${table} does not exist after import`);
    process.exit(1);
  }
  // Upserts may give Δ=0 if rows already exist; treat handler-accepted as success.
  const accepted = res.body?.accepted ?? 0;
  if (accepted === 0 && rows.length > 0) {
    console.error(`[stage-import] FAILED: 0 rows accepted by handler despite ${rows.length} parsed`);
    process.exit(1);
  }

  console.log(`[stage-import] ✓ ${IMPORT_TYPE} OK (accepted=${accepted}, table delta=${inserted >= 0 ? '+' : ''}${inserted})`);
  process.exit(0);
}

main().catch(e => { console.error('[stage-import] CRASH:', e); process.exit(1); });
