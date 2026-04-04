/**
 * generate-jonas-exports.mjs
 *
 * Reads docs/swoop-db-export.xlsx and produces CSV files in docs/jonas-exports/
 * that simulate what a club administrator would export from Jonas Club Software
 * using Smart Viewer (SV), F9 Lister, and Report Generator (RG).
 *
 * Usage: node scripts/generate-jonas-exports.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const INPUT = join(ROOT, 'docs', 'swoop-db-export.xlsx');
const OUTPUT_DIR = join(ROOT, 'docs', 'jonas-exports');

// ── Export definitions ──────────────────────────────────────────────────────
// Each entry: { outputFile, sourceSheet, columnMap: { swoopCol: 'Jonas Col' } }
// columnMap order determines CSV column order.

const JONAS_EXPORTS = [
  // ── 1. Club Reference ──
  {
    outputFile: 'JCM_Club_Profile.csv',
    sourceSheet: 'club',
    columnMap: {
      name: 'Club Name',
      city: 'City',
      state: 'State',
      zip: 'ZIP',
      founded_year: 'Founded Year',
      member_count: 'Member Count',
      course_count: 'Course Count',
      outlet_count: 'Outlet Count',
    },
  },
  {
    outputFile: 'TTM_Course_Setup_F9.csv',
    sourceSheet: 'courses',
    columnMap: {
      course_id: 'Course Code',
      name: 'Course Name',
      holes: 'Holes',
      par: 'Par',
      tee_interval_min: 'Interval (min)',
      first_tee: 'Start Time',
      last_tee: 'End Time',
    },
  },
  {
    outputFile: 'POS_Sales_Areas_F9.csv',
    sourceSheet: 'dining_outlets',
    columnMap: {
      outlet_id: 'Sales Area ID',
      name: 'Sales Area Description',
      type: 'Type',
      meal_periods: 'Operating Hours',
      weekday_covers: 'Weekday Covers',
      weekend_covers: 'Weekend Covers',
    },
  },
  {
    outputFile: 'JCM_Membership_Types_F9.csv',
    sourceSheet: 'membership_types',
    columnMap: {
      type_code: 'Type Code',
      name: 'Description',
      annual_dues: 'Annual Fee',
      fb_minimum: 'F&B Minimum',
      golf_eligible: 'Golf Eligible',
    },
  },

  // ── 2. Members ──
  {
    outputFile: 'JCM_Dependents_F9.csv',
    sourceSheet: 'households',
    columnMap: {
      household_id: 'Household ID',
      primary_member_id: 'Primary Member #',
      member_count: 'Dependent Count',
      address: 'Home Address',
    },
  },
  {
    outputFile: 'JCM_Members_F9.csv',
    sourceSheet: 'members',
    columnMap: {
      member_id: 'Member #',
      member_number: 'Member Number',
      first_name: 'Given Name',
      last_name: 'Surname',
      email: 'Email',
      phone: 'Phone #',
      date_of_birth: 'Birthday',
      gender: 'Sex',
      membership_type: 'Membership Type',
      membership_status: 'Status',
      join_date: 'Date Joined',
      resigned_on: 'Date Resigned',
      household_id: 'Household ID',
      annual_dues: 'Annual Fee',
      account_balance: 'Current Balance',
      ghin_number: 'Handicap #',
      communication_opt_in: 'Mailings',
    },
  },
  {
    outputFile: 'JCM_Aged_Receivables_SV.csv',
    sourceSheet: 'member_invoices',
    columnMap: {
      invoice_id: 'Invoice #',
      member_id: 'Member #',
      invoice_date: 'Statement Date',
      due_date: 'Due Date',
      amount: 'Net Amount',
      type: 'Billing Code Type',
      description: 'Description',
      status: 'Aging Bucket',
      paid_date: 'Last Payment',
      paid_amount: 'Payment Amount',
      days_past_due: 'Days Past Due',
      late_fee: 'Late Fee',
    },
  },

  // ── 3. Golf Operations ──
  {
    outputFile: 'TTM_Tee_Sheet_SV.csv',
    sourceSheet: 'bookings',
    columnMap: {
      booking_id: 'Reservation ID',
      course_id: 'Course',
      booking_date: 'Date',
      tee_time: 'Tee Time',
      player_count: 'Players',
      has_guest: 'Guest Flag',
      transportation: 'Transportation',
      has_caddie: 'Caddie',
      round_type: 'Holes',
      status: 'Status',
      check_in_time: 'Check-In Time',
      round_start: 'Round Start',
      round_end: 'Round End',
      duration_minutes: 'Duration (min)',
    },
  },
  {
    outputFile: 'TTM_Tee_Sheet_Players_SV.csv',
    sourceSheet: 'booking_players',
    columnMap: {
      player_id: 'Player ID',
      booking_id: 'Reservation ID',
      member_id: 'Member #',
      guest_name: 'Guest Name',
      is_guest: 'Guest Flag',
      position_in_group: 'Position',
    },
  },

  // ── 4. Food & Beverage ──
  {
    outputFile: 'POS_Sales_Detail_SV.csv',
    sourceSheet: 'pos_checks',
    columnMap: {
      check_id: 'Chk#',
      outlet_id: 'Sales Area',
      member_id: 'Member #',
      opened_at: 'Open Time',
      closed_at: 'Close Time',
      first_item_fired_at: 'First Fire',
      last_item_fulfilled_at: 'Last Fulfilled',
      subtotal: 'Net Amount',
      tax_amount: 'Tax',
      tip_amount: 'Gratuity',
      comp_amount: 'Comp',
      discount_amount: 'Discount',
      void_amount: 'Void',
      total: 'Total Due',
      payment_method: 'Settlement Method',
    },
  },
  {
    outputFile: 'POS_Line_Items_SV.csv',
    sourceSheet: 'pos_line_items',
    columnMap: {
      line_item_id: 'Line Item ID',
      check_id: 'Chk#',
      item_name: 'Item Description',
      category: 'Sales Category',
      unit_price: 'Regular Price',
      quantity: 'Qty',
      line_total: 'Line Total',
      is_comp: 'Comp',
      is_void: 'Void',
      fired_at: 'Fire Time',
    },
  },
  {
    outputFile: 'POS_Payments_SV.csv',
    sourceSheet: 'pos_payments',
    columnMap: {
      payment_id: 'Payment ID',
      check_id: 'Chk#',
      payment_method: 'Settlement Method',
      amount: 'Amount',
      processed_at: 'Settlement Time',
      is_split: 'Split',
    },
  },
  {
    outputFile: 'POS_Daily_Close_SV.csv',
    sourceSheet: 'close_outs',
    columnMap: {
      closeout_id: 'Close ID',
      date: 'Date',
      golf_revenue: 'Golf Revenue',
      fb_revenue: 'F&B Revenue',
      total_revenue: 'Total Revenue',
      rounds_played: 'Rounds Played',
      covers: 'Covers',
      weather: 'Weather',
    },
  },

  // ── 5. Events & Communications ──
  {
    outputFile: 'JAM_Event_List_SV.csv',
    sourceSheet: 'event_definitions',
    columnMap: {
      event_id: 'Event Number',
      name: 'Event Name',
      type: 'Event Type',
      event_date: 'Start Date',
      capacity: 'Capacity',
      registration_fee: 'Pricing Category',
      description: 'Description',
    },
  },
  {
    outputFile: 'JAM_Registrations_SV.csv',
    sourceSheet: 'event_registrations',
    columnMap: {
      registration_id: 'Registration ID',
      event_id: 'Event Number',
      member_id: 'Client Code',
      status: 'Status',
      guest_count: 'Guest Count',
      fee_paid: 'Fee Paid',
      registered_at: 'Registration Date',
      checked_in_at: 'Check-In Time',
    },
  },
  {
    outputFile: 'CHO_Campaigns_SV.csv',
    sourceSheet: 'email_campaigns',
    columnMap: {
      campaign_id: 'Campaign ID',
      subject: 'Subject',
      type: 'Campaign Type',
      send_date: 'Send Date',
      recipient_count: 'Audience Count',
    },
  },
  {
    outputFile: 'CHO_Email_Events_SV.csv',
    sourceSheet: 'email_events',
    columnMap: {
      event_id: 'Event ID',
      campaign_id: 'Campaign',
      member_id: 'Member #',
      event_type: 'Event Type',
      occurred_at: 'Timestamp',
      link_clicked: 'Link Clicked',
      device_type: 'Device',
    },
  },

  // ── 6. Service & Staffing ──
  {
    outputFile: 'JCM_Communications_RG.csv',
    sourceSheet: 'feedback',
    columnMap: {
      feedback_id: 'Communication ID',
      member_id: 'Member #',
      submitted_at: 'Date',
      category: 'Type',
      sentiment_score: 'Happometer Score',
      description: 'Subject',
      status: 'Complete',
      resolved_at: 'Resolution Date',
    },
  },
  {
    outputFile: 'JCM_Service_Requests_RG.csv',
    sourceSheet: 'service_requests',
    columnMap: {
      request_id: 'Request ID',
      member_id: 'Member #',
      booking_id: 'Booking Ref',
      request_type: 'Type',
      requested_at: 'Date',
      response_time_min: 'Response Time (min)',
      resolved_at: 'Resolution Date',
      resolution_notes: 'Notes',
    },
  },
  {
    outputFile: 'ADP_Staff_Roster.csv',
    sourceSheet: 'staff',
    columnMap: {
      staff_id: 'Employee ID',
      first_name: 'First Name',
      last_name: 'Last Name',
      department: 'Dept',
      role: 'Job Title',
      hire_date: 'Hire Date',
      hourly_rate: 'Hourly Rate',
      is_full_time: 'FT/PT',
    },
  },
  {
    outputFile: '7shifts_Staff_Shifts.csv',
    sourceSheet: 'staff_shifts',
    columnMap: {
      shift_id: 'Shift ID',
      staff_id: 'Employee ID',
      shift_date: 'Date',
      outlet_id: 'Location',
      start_time: 'Shift Start',
      end_time: 'Shift End',
      hours_worked: 'Act Hrs',
      notes: 'Notes',
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Excel serial date → ISO date string */
function excelDateToISO(serial) {
  if (serial == null) return '';
  if (typeof serial === 'string') return serial; // already a string
  // Excel epoch: 1900-01-01, with the Lotus 1-2-3 leap-year bug (+1 day)
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const ms = serial * 86400000;
  const d = new Date(epoch.getTime() + ms);
  return d.toISOString().slice(0, 10);
}

/** Detect if a value looks like an Excel serial date (number between ~40000-50000) */
function looksLikeExcelDate(val, colName) {
  if (typeof val !== 'number') return false;
  const dateLike =
    /date|_at$|_on$|joined|resigned|birthday|hire|sent|occurred|submitted|registered|checked|resolved|close|open|fire|settle|processed|start$|end$/i;
  return val > 30000 && val < 60000 && dateLike.test(colName);
}

/** Escape a CSV field */
function csvField(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Convert a row object + columnMap to a CSV line */
function rowToCsv(row, columnMap) {
  return Object.entries(columnMap)
    .map(([swoopCol]) => {
      let val = row[swoopCol];
      if (looksLikeExcelDate(val, swoopCol)) {
        val = excelDateToISO(val);
      }
      return csvField(val);
    })
    .join(',');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(INPUT)) {
    console.error(`Input file not found: ${INPUT}`);
    process.exit(1);
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Reading ${INPUT}...`);
  const wb = XLSX.readFile(INPUT);

  let totalFiles = 0;
  let totalRows = 0;

  for (const def of JONAS_EXPORTS) {
    const ws = wb.Sheets[def.sourceSheet];
    if (!ws) {
      console.warn(`  SKIP: Sheet "${def.sourceSheet}" not found`);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(ws);
    if (rows.length === 0) {
      console.warn(`  SKIP: Sheet "${def.sourceSheet}" is empty`);
      continue;
    }

    // Header row
    const header = Object.values(def.columnMap).map(csvField).join(',');

    // Data rows
    const lines = rows.map((row) => rowToCsv(row, def.columnMap));

    // UTF-8 BOM + content
    const csv = '\uFEFF' + header + '\n' + lines.join('\n') + '\n';

    const outPath = join(OUTPUT_DIR, def.outputFile);
    writeFileSync(outPath, csv, 'utf8');

    totalFiles++;
    totalRows += rows.length;
    console.log(`  ${def.outputFile} — ${rows.length} rows, ${Object.keys(def.columnMap).length} columns`);
  }

  console.log(`\nDone. ${totalFiles} files, ${totalRows} total rows → ${OUTPUT_DIR}`);
}

main();
