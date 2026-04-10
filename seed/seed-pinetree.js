/**
 * seed-pinetree.js — Seed Pine Tree demo data into Neon under club_id = 'seed_pinetree'
 *
 * Usage:  node seed/seed-pinetree.js
 *
 * Reads all 21 CSV files from public/demo-data/, maps vendor column names
 * to DB columns using the same alias logic as api/import-csv.js, and inserts
 * rows in FK-safe order inside a single transaction.
 *
 * Idempotent: DELETEs all seed_pinetree data before inserting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------- bootstrap @vercel/postgres from env ----------
// Requires POSTGRES_URL (or POSTGRES_URL_NON_POOLING) in environment.
import { sql } from '@vercel/postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = path.join(__dirname, '..', 'public', 'demo-data');
const CLUB_ID = 'seed_pinetree';

// ─── Column alias maps (copied from api/import-csv.js) ───────────────────────

const FIELD_ALIASES = {
  'given name': 'first_name', 'first name': 'first_name', 'surname': 'last_name', 'last name': 'last_name',
  'member #': 'external_id', 'member id': 'external_id',
  'member number': '_skip',
  'phone #': 'phone', 'annual fee': 'annual_dues', 'annual dues': 'annual_dues',
  'date joined': 'join_date', 'membership type': 'membership_type', 'mem type': 'membership_type',
  'household id': 'household_id', 'handicap #': 'handicap', 'current balance': 'current_balance',
  'date resigned': 'date_resigned', 'date of birth': 'birthday',
  'player id': 'player_id', 'reservation id': 'reservation_id',
  'confirmation #': 'reservation_id', 'tee sheet date': 'date',
  'play date': 'date', 'tee time': 'tee_time', 'guest flag': 'guest_flag',
  'number of players': 'players', 'check-in time': 'check_in_time',
  'round start': 'round_start', 'round end': 'round_end', 'duration (min)': 'duration_min',
  'open time': 'transaction_date', 'close time': 'close_time', 'transaction date': 'transaction_date',
  'net amount': 'total_amount', 'total due': 'total_amount', 'total amount': 'total_amount', 'chit total': 'total_amount',
  'sales area': 'outlet_name', 'outlet name': 'outlet_name', 'item count': 'item_count',
  'settlement method': 'settlement_method',
  'happometer score': 'priority', 'reported at': 'reported_at', 'created date': 'reported_at',
  'resolution date': 'resolved_at', 'resolved at': 'resolved_at',
  'event number': 'event_id', 'event id': 'event_id', 'event name': 'event_name',
  'event type': 'event_type', 'start date': 'start_date', 'event date': 'start_date',
  'registration fee': 'registration_fee', 'member price': 'registration_fee',
  'registration id': 'registration_id', 'reg id': 'registration_id',
  'client code': 'member_id', 'event booking number': 'event_id',
  'event registrant status': 'status', 'guest count': 'guest_count',
  'fee paid': 'fee_paid', 'amount paid': 'fee_paid', 'registration date': 'registration_date',
  'campaign id': 'campaign_id', 'email subject': 'subject',
  'campaign type': 'campaign_type', 'send date': 'send_date',
  'audience count': 'audience_count', 'recipient count': 'audience_count',
  'campaign': 'campaign_id', 'occurred at': 'timestamp',
  'link clicked': 'link_clicked', 'device type': 'device',
  'employee id': 'employee_id', 'staff code': 'employee_id',
  'dept': 'department', 'preferred department': 'department',
  'job title': 'job_title', 'preferred job': 'job_title',
  'hire date': 'hire_date', 'hourly rate': 'hourly_rate', 'pay rate': 'hourly_rate',
  'ft/pt': 'ft_pt', 'employment type': 'ft_pt',
  'shift id': 'shift_id', 'shift start': 'shift_start', 'shift end': 'shift_end',
  'act hrs': 'actual_hours', 'actual hours': 'actual_hours', 'hours worked': 'actual_hours',
  'shift date': 'date',
  'chk#': 'check_id',
  'item description': 'item_description', 'sales category': 'sales_category',
  'regular price': 'regular_price', 'fire time': 'fire_time',
  'payment id': 'payment_id', 'settlement time': 'processed_at',
  'course code': 'course_code', 'course name': 'course_name', 'interval (min)': 'interval_min',
  'sales area id': 'sales_area_id', 'sales area description': 'description',
  'pricing category': 'registration_fee',
  'invoice #': 'invoice_id', 'statement date': 'statement_date',
  'billing code type': 'billing_code_type', 'aging bucket': 'aging_bucket',
  'last payment': 'last_payment', 'payment amount': 'payment_amount',
  'days past due': 'days_past_due', 'late fee': 'late_fee',
  'request id': 'request_id', 'booking ref': 'booking_ref', 'response time (min)': 'response_time_min',
  'close id': 'closeout_id',
  'communication id': 'feedback_id', 'complete': 'status',
};

const IMPORT_ALIAS_OVERRIDES = {
  email_events: { 'member #': 'member_id', 'member id': 'member_id', 'event id': '_skip' },
  email_campaigns: { 'subject': 'subject' },
  event_registrations: { 'member #': 'member_id', 'event number': 'event_id' },
  complaints: { 'type': 'category', 'subject': 'description', 'date': 'reported_at', 'member #': 'member_id' },
  tee_times: { 'member #': 'member_id' },
  transactions: { 'member #': 'member_id' },
  pos_checks: { 'member #': 'member_id', 'chk#': 'check_id' },
  line_items: { 'chk#': 'check_id', 'item description': 'item_description', 'sales category': 'sales_category', 'regular price': 'regular_price', 'qty': 'quantity', 'fire time': 'fire_time', 'comp': 'is_comp', 'void': 'is_void' },
  payments: { 'chk#': 'check_id', 'settlement method': 'payment_method' },
  invoices: { 'member #': 'member_id', 'invoice #': 'invoice_id' },
  service_requests: { 'member #': 'member_id' },
  daily_close: { 'close id': 'closeout_id' },
};

// ─── Import type configs (from api/import-csv.js IMPORT_TYPES) ────────────────

const IMPORT_TYPES = {
  members: {
    requiredFields: ['first_name', 'last_name'],
    optionalFields: ['email', 'phone', 'membership_type', 'annual_dues', 'join_date', 'external_id', 'household_id', 'birthday', 'sex', 'handicap', 'current_balance', 'status', 'date_resigned'],
    table: 'members',
  },
  club_profile: {
    requiredFields: ['club_name'],
    optionalFields: ['city', 'state', 'zip', 'founded_year', 'member_count', 'course_count', 'outlet_count'],
    table: 'club',
  },
  membership_types: {
    requiredFields: ['type_code', 'description'],
    optionalFields: ['annual_fee', 'fnb_minimum', 'golf_eligible'],
    table: 'membership_types',
    columnMap: { description: 'name', annual_fee: 'annual_dues', fnb_minimum: 'fb_minimum' },
  },
  households: {
    requiredFields: ['household_id', 'primary_member_id'],
    optionalFields: ['dependent_count', 'home_address'],
    table: 'households',
    columnMap: { dependent_count: 'member_count', home_address: 'address' },
  },
  courses: {
    requiredFields: ['course_code', 'course_name'],
    optionalFields: ['holes', 'par', 'interval_min', 'start_time', 'end_time'],
    table: 'courses',
    columnMap: { course_code: 'course_id', course_name: 'name', interval_min: 'tee_interval_min', start_time: 'first_tee', end_time: 'last_tee' },
  },
  tee_times: {
    requiredFields: ['reservation_id', 'course', 'date', 'tee_time'],
    optionalFields: ['member_id', 'players', 'guest_flag', 'transportation', 'caddie', 'status', 'check_in_time', 'round_start', 'round_end', 'duration_min'],
    table: 'bookings',
    columnMap: { reservation_id: 'booking_id', course: 'course_id', date: 'booking_date', players: 'player_count', guest_flag: 'has_guest', caddie: 'has_caddie', duration_min: 'duration_minutes' },
  },
  booking_players: {
    requiredFields: ['player_id', 'reservation_id'],
    optionalFields: ['member_id', 'guest_name', 'guest_flag', 'position'],
    table: 'booking_players',
    columnMap: { reservation_id: 'booking_id', guest_flag: 'is_guest', position: 'position_in_group' },
  },
  transactions: {
    requiredFields: ['transaction_date', 'total_amount'],
    optionalFields: ['member_id', 'outlet_name', 'category', 'item_count', 'is_post_round', 'tax', 'gratuity', 'comp', 'discount', 'void', 'settlement_method', 'open_time', 'close_time'],
    table: 'transactions',
  },
  sales_areas: {
    requiredFields: ['sales_area_id', 'description'],
    optionalFields: ['type', 'operating_hours', 'weekday_covers', 'weekend_covers'],
    table: 'dining_outlets',
    columnMap: { sales_area_id: 'outlet_id', description: 'name', operating_hours: 'meal_periods' },
  },
  line_items: {
    requiredFields: ['line_item_id', 'check_id'],
    optionalFields: ['item_description', 'sales_category', 'regular_price', 'qty', 'line_total', 'comp', 'void', 'fire_time'],
    table: 'pos_line_items',
    columnMap: { item_description: 'item_name', sales_category: 'category', regular_price: 'unit_price', qty: 'quantity', comp: 'is_comp', void: 'is_void', fire_time: 'fired_at' },
  },
  daily_close: {
    requiredFields: ['closeout_id', 'date'],
    optionalFields: ['golf_revenue', 'fb_revenue', 'total_revenue', 'rounds_played', 'covers', 'weather'],
    table: 'close_outs',
  },
  complaints: {
    requiredFields: ['category', 'description'],
    optionalFields: ['member_id', 'status', 'priority', 'reported_at', 'resolved_at', 'severity'],
    table: 'complaints',
  },
  service_requests: {
    requiredFields: ['request_id', 'type', 'date'],
    optionalFields: ['member_id', 'booking_ref', 'response_time_min', 'resolution_date', 'notes'],
    table: 'service_requests',
    columnMap: { type: 'request_type', date: 'requested_at', booking_ref: 'booking_id', resolution_date: 'resolved_at', notes: 'resolution_notes' },
  },
  events: {
    requiredFields: ['event_id', 'event_name'],
    optionalFields: ['event_type', 'start_date', 'capacity', 'registration_fee', 'description'],
    table: 'event_definitions',
    columnMap: { event_name: 'name', event_type: 'type', start_date: 'event_date' },
    defaults: { capacity: () => 50, type: () => 'social', event_date: () => new Date().toISOString().slice(0, 10), registration_fee: () => 0 },
  },
  event_registrations: {
    requiredFields: ['registration_id', 'event_id'],
    optionalFields: ['member_id', 'status', 'guest_count', 'fee_paid', 'registration_date', 'check_in_time'],
    table: 'event_registrations',
    columnMap: { registration_date: 'registered_at', check_in_time: 'checked_in_at' },
    defaults: { registered_at: () => new Date().toISOString() },
  },
  email_campaigns: {
    requiredFields: ['campaign_id', 'subject'],
    optionalFields: ['campaign_type', 'send_date', 'audience_count'],
    table: 'email_campaigns',
    columnMap: { campaign_type: 'type', audience_count: 'recipient_count' },
  },
  email_events: {
    requiredFields: ['campaign_id', 'member_id', 'event_type'],
    optionalFields: ['timestamp', 'link_clicked', 'device'],
    table: 'email_events',
    columnMap: { timestamp: 'occurred_at', device: 'device_type' },
    defaults: { event_id: () => `ee_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, occurred_at: () => new Date().toISOString() },
  },
  staff: {
    requiredFields: ['employee_id', 'first_name', 'last_name'],
    optionalFields: ['department', 'job_title', 'hire_date', 'hourly_rate', 'ft_pt'],
    table: 'staff',
    columnMap: { employee_id: 'staff_id', job_title: 'role', ft_pt: 'is_full_time' },
    valueTransform: { ft_pt: v => (String(v).toUpperCase() === 'FT' || v === '1' || v === true) ? 1 : 0 },
    defaults: { hire_date: () => new Date().toISOString().slice(0, 10), hourly_rate: () => 15, department: () => 'General', role: () => 'Staff' },
  },
  shifts: {
    requiredFields: ['shift_id', 'employee_id', 'date'],
    optionalFields: ['location', 'shift_start', 'shift_end', 'actual_hours', 'notes'],
    table: 'staff_shifts',
    columnMap: { employee_id: 'staff_id', date: 'shift_date', shift_start: 'start_time', shift_end: 'end_time', actual_hours: 'hours_worked', location: 'outlet_id' },
    defaults: { start_time: () => '08:00', end_time: () => '16:00', hours_worked: () => 8 },
  },
  invoices: {
    requiredFields: ['invoice_id', 'member_id', 'statement_date'],
    optionalFields: ['due_date', 'net_amount', 'billing_code_type', 'description', 'aging_bucket', 'last_payment', 'payment_amount', 'days_past_due', 'late_fee'],
    table: 'member_invoices',
    columnMap: { statement_date: 'invoice_date', net_amount: 'amount', billing_code_type: 'type', aging_bucket: 'status', last_payment: 'paid_date', payment_amount: 'paid_amount' },
  },
  pos_checks: {
    requiredFields: ['check_id', 'sales_area'],
    optionalFields: ['member_id', 'open_time', 'close_time', 'first_fire', 'last_fulfilled', 'net_amount', 'tax', 'gratuity', 'comp', 'discount', 'void', 'total_due', 'settlement_method'],
    table: 'pos_checks',
    columnMap: {
      sales_area: 'outlet_id', open_time: 'opened_at', close_time: 'closed_at',
      first_fire: 'first_item_fired_at', last_fulfilled: 'last_item_fulfilled_at',
      net_amount: 'subtotal', tax: 'tax_amount', gratuity: 'tip_amount',
      comp: 'comp_amount', discount: 'discount_amount', void: 'void_amount',
      total_due: 'total', settlement_method: 'payment_method',
    },
  },
  payments: {
    requiredFields: ['payment_id', 'check_id'],
    optionalFields: ['payment_method', 'amount', 'processed_at', 'is_split'],
    table: 'pos_payments',
    valueTransform: { is_split: v => (v === '1' || v === 'true') ? 1 : 0 },
  },
};

// ─── CSV file → import type mapping ───────────────────────────────────────────

const CSV_TO_IMPORT = {
  'JCM_Club_Profile.csv':          'club_profile',
  'JCM_Membership_Types_F9.csv':   'membership_types',
  'TTM_Course_Setup_F9.csv':       'courses',
  'POS_Sales_Areas_F9.csv':        'sales_areas',
  'JCM_Dependents_F9.csv':         'households',
  'JCM_Members_F9.csv':            'members',
  'TTM_Tee_Sheet_SV.csv':          'tee_times',
  'TTM_Tee_Sheet_Players_SV.csv':  'booking_players',
  'POS_Sales_Detail_SV.csv':       'pos_checks',
  'POS_Line_Items_SV.csv':         'line_items',
  'POS_Payments_SV.csv':           'payments',
  'POS_Daily_Close_SV.csv':        'daily_close',
  'JAM_Event_List_SV.csv':         'events',
  'JAM_Registrations_SV.csv':      'event_registrations',
  'CHO_Campaigns_SV.csv':          'email_campaigns',
  'CHO_Email_Events_SV.csv':       'email_events',
  'JCM_Communications_RG.csv':     'complaints',
  'JCM_Service_Requests_RG.csv':   'service_requests',
  'JCM_Aged_Receivables_SV.csv':   'invoices',
  'ADP_Staff_Roster.csv':          'staff',
  '7shifts_Staff_Shifts.csv':      'shifts',
};

// FK-safe insertion order
const INSERT_ORDER = [
  'JCM_Club_Profile.csv',
  'JCM_Membership_Types_F9.csv',
  'TTM_Course_Setup_F9.csv',
  'POS_Sales_Areas_F9.csv',
  'JCM_Dependents_F9.csv',
  'JCM_Members_F9.csv',
  'TTM_Tee_Sheet_SV.csv',
  'TTM_Tee_Sheet_Players_SV.csv',
  'POS_Sales_Detail_SV.csv',
  'POS_Line_Items_SV.csv',
  'POS_Payments_SV.csv',
  'POS_Daily_Close_SV.csv',
  'JAM_Event_List_SV.csv',
  'JAM_Registrations_SV.csv',
  'CHO_Campaigns_SV.csv',
  'CHO_Email_Events_SV.csv',
  'JCM_Communications_RG.csv',
  'JCM_Service_Requests_RG.csv',
  'JCM_Aged_Receivables_SV.csv',
  'ADP_Staff_Roster.csv',
  '7shifts_Staff_Shifts.csv',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse CSV text into array of {header: value} objects */
function parseCSV(text) {
  // Remove BOM
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[j] || '';
    }
    rows.push(row);
  }
  return rows;
}

/** Parse a single CSV line respecting quoted fields */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

/** Resolve vendor column names → Swoop field names */
function resolveAliases(row, importType) {
  const overrides = IMPORT_ALIAS_OVERRIDES[importType] || {};
  const resolved = {};
  for (const [key, value] of Object.entries(row)) {
    const lower = key.trim().toLowerCase();
    const mapped = overrides[lower] || FIELD_ALIASES[lower] || key;
    if (mapped !== '_skip') {
      resolved[mapped] = value;
    }
  }
  return resolved;
}

/** Prefix a member_id with CLUB_ID if not already prefixed */
function prefixMemberId(id) {
  if (!id) return id;
  return id.startsWith(CLUB_ID) ? id : `${CLUB_ID}_${id}`;
}

/** Check if a field name suggests a numeric value */
function isNumericField(field) {
  return /amount|fee|price|total|revenue|rate|count|hours|covers|capacity|dues|minimum|balance/.test(field);
}

// ─── Delete all seed data (reverse FK order) ─────────────────────────────────

const DELETE_ORDER = [
  // Leaf tables first
  'pos_payments',
  'pos_line_items',
  'pos_checks',
  'staff_shifts',
  'staff',
  'member_invoices',
  'email_events',
  'email_campaigns',
  'event_registrations',
  'event_definitions',
  'complaints',
  'service_requests',
  'close_outs',
  'booking_players',
  'bookings',
  'members',
  'households',
  'dining_outlets',
  'courses',
  'membership_types',
  'club',
  // Also clean derived/metric tables
  'feedback',
  'transactions',
  'data_source_status',
];

async function deleteAllSeedData(client) {
  for (const table of DELETE_ORDER) {
    try {
      await client.query(`DELETE FROM ${table} WHERE club_id = $1`, [CLUB_ID]);
    } catch {
      // Table may not exist or may not have club_id column — try without
      try {
        // Tables without club_id: booking_players, pos_line_items, pos_payments
        // These are cleaned by cascade from parent deletes, but try explicitly
      } catch { /* ignore */ }
    }
  }
  console.log(`  Deleted existing seed_pinetree data from ${DELETE_ORDER.length} tables`);
}

// ─── Insert logic per import type ─────────────────────────────────────────────

async function insertClubProfile(client, rows) {
  if (!rows.length) return 0;
  const row = resolveAliases(rows[0], 'club_profile');
  await client.query(
    `INSERT INTO club (club_id, name, city, state, zip, founded_year, member_count, course_count, outlet_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (club_id) DO NOTHING`,
    [CLUB_ID, row.club_name, row.city, row.state, row.zip,
     row.founded_year ? Number(row.founded_year) : null,
     row.member_count ? Number(row.member_count) : null,
     row.course_count ? Number(row.course_count) : null,
     row.outlet_count ? Number(row.outlet_count) : null]
  );
  return 1;
}

async function insertMembers(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'members');
    const memberId = row.external_id || `mbr_${count}`;
    const uniqueMemberId = `${CLUB_ID}_${memberId}`;
    const statusVal = row.status || 'active';
    const defaultTier = row.date_resigned ? 'Critical' : 'Watch';
    // member_number: use the CSV "Member Number" column (which was _skip'd by alias)
    // We need to grab it from the raw row
    const memberNumber = rawRow['Member Number'] || rawRow['member_number'] || (count + 1);
    await client.query(
      `INSERT INTO members (member_id, member_number, club_id, external_id, first_name, last_name, email, phone,
        membership_type, annual_dues, join_date, household_id, date_of_birth, gender, account_balance,
        membership_status, resigned_on, health_tier, archetype, data_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (member_id) DO NOTHING`,
      [uniqueMemberId, Number(memberNumber), CLUB_ID, row.external_id || null,
       row.first_name, row.last_name, row.email || null, row.phone || null,
       row.membership_type ? `${CLUB_ID}_${row.membership_type}` : null,
       row.annual_dues ? Number(row.annual_dues) : null,
       row.join_date || null,
       row.household_id ? `${CLUB_ID}_${row.household_id}` : null,
       row.birthday || row.date_of_birth || null,
       row.sex || row.gender || null,
       row.current_balance ? Number(row.current_balance) : null,
       statusVal, row.date_resigned || null, defaultTier, 'unknown', 'seed']
    );
    count++;
  }
  return count;
}

async function insertGeneric(client, importType, rows) {
  const config = IMPORT_TYPES[importType];
  if (!config) throw new Error(`Unknown import type: ${importType}`);

  const tablesWithoutClubId = new Set(['booking_players', 'pos_line_items', 'pos_payments']);
  let count = 0;

  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, importType);

    // Prefix member_id for non-member imports
    if (row.member_id && importType !== 'members') {
      row.member_id = prefixMemberId(row.member_id);
    }

    const allFields = [...config.requiredFields, ...config.optionalFields];
    const columnMap = config.columnMap || {};
    const columns = [];
    const values = [];
    const mappedColumns = new Set();

    // Add club_id for tables that have it
    if (!tablesWithoutClubId.has(config.table)) {
      columns.push('club_id');
      values.push(CLUB_ID);
    }

    // Add data_source if table supports it
    columns.push('data_source');
    values.push('seed');

    for (const field of allFields) {
      if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
        const dbColumn = columnMap[field] || field;
        columns.push(dbColumn);
        mappedColumns.add(dbColumn);
        let val = row[field];
        // Apply value transforms
        if (config.valueTransform?.[field]) val = config.valueTransform[field](val);
        // Convert numeric fields
        if (typeof val === 'string' && !isNaN(Number(val)) && isNumericField(field)) val = Number(val);
        values.push(val);
      }
    }

    // Apply defaults for missing columns
    if (config.defaults) {
      for (const [col, defaultFn] of Object.entries(config.defaults)) {
        if (!mappedColumns.has(col)) {
          columns.push(col);
          values.push(typeof defaultFn === 'function' ? defaultFn() : defaultFn);
        }
      }
    }

    // Prefix IDs that reference other seed tables
    // membership_types type_code, household_id, course_id, outlet_id, booking_id, event_id, campaign_id, staff_id
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (['type_code', 'course_id', 'outlet_id', 'booking_id', 'event_id',
           'campaign_id', 'staff_id', 'household_id', 'invoice_id',
           'registration_id', 'request_id', 'closeout_id', 'feedback_id',
           'check_id', 'line_item_id', 'payment_id', 'player_id', 'shift_id',
           'membership_type'].includes(col)) {
        if (values[i] && typeof values[i] === 'string' && !String(values[i]).startsWith(CLUB_ID)) {
          values[i] = `${CLUB_ID}_${values[i]}`;
        }
      }
    }

    const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
    const colNames = columns.map(c => `"${c}"`).join(', ');

    try {
      await client.query(
        `INSERT INTO ${config.table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      count++;
    } catch (e) {
      // Log but continue — some rows may fail due to missing FKs etc.
      if (count === 0) console.warn(`    Warning on first row of ${importType}: ${e.message}`);
    }
  }
  return count;
}

// Special handling for certain import types that need ID prefixing on PKs
async function insertMembershipTypes(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'membership_types');
    const typeCode = `${CLUB_ID}_${row.type_code}`;
    const name = row.description || row.name;
    const annualDues = row.annual_fee ? Number(row.annual_fee) : 0;
    // Handle "F&B Minimum" header — the raw row has it
    const fbMin = rawRow['F&B Minimum'] || rawRow['fnb_minimum'] || 0;
    const golfEligible = row.golf_eligible !== undefined ? Number(row.golf_eligible) : 1;
    await client.query(
      `INSERT INTO membership_types (type_code, club_id, name, annual_dues, fb_minimum, golf_eligible)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (type_code) DO NOTHING`,
      [typeCode, CLUB_ID, name, annualDues, Number(fbMin), golfEligible]
    );
    count++;
  }
  return count;
}

async function insertHouseholds(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'households');
    const hhId = `${CLUB_ID}_${row.household_id}`;
    const primaryMemberId = row.primary_member_id ? `${CLUB_ID}_${row.primary_member_id}` : null;
    const memberCount = row.dependent_count ? Number(row.dependent_count) : 1;
    const address = row.home_address || null;
    await client.query(
      `INSERT INTO households (household_id, club_id, primary_member_id, member_count, address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (household_id) DO NOTHING`,
      [hhId, CLUB_ID, primaryMemberId, memberCount, address]
    );
    count++;
  }
  return count;
}

async function insertCourses(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'courses');
    const courseId = `${CLUB_ID}_${row.course_code}`;
    await client.query(
      `INSERT INTO courses (course_id, club_id, name, holes, par, tee_interval_min, first_tee, last_tee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (course_id) DO NOTHING`,
      [courseId, CLUB_ID, row.course_name, Number(row.holes || 18), Number(row.par || 72),
       Number(row.interval_min || 10), row.start_time || '07:00', row.end_time || '16:00']
    );
    count++;
  }
  return count;
}

async function insertSalesAreas(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'sales_areas');
    const outletId = `${CLUB_ID}_${row.sales_area_id}`;
    await client.query(
      `INSERT INTO dining_outlets (outlet_id, club_id, name, type, meal_periods, weekday_covers, weekend_covers)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (outlet_id) DO NOTHING`,
      [outletId, CLUB_ID, row.description, row.type || 'dining',
       row.operating_hours || '[]',
       Number(row.weekday_covers || 0), Number(row.weekend_covers || 0)]
    );
    count++;
  }
  return count;
}

async function insertBookings(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'tee_times');
    const bookingId = `${CLUB_ID}_${row.reservation_id}`;
    const courseId = `${CLUB_ID}_${row.course}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    // Holes column maps to round_type
    const holes = rawRow['Holes'] || rawRow['holes'] || '18';
    await client.query(
      `INSERT INTO bookings (booking_id, club_id, course_id, booking_date, tee_time, player_count,
        has_guest, transportation, has_caddie, round_type, status, check_in_time, round_start, round_end, duration_minutes, member_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (booking_id) DO NOTHING`,
      [bookingId, CLUB_ID, courseId, row.date, row.tee_time,
       Number(row.players || 1), Number(row.guest_flag || 0),
       row.transportation || 'cart', Number(row.caddie || 0),
       String(holes), row.status || 'confirmed',
       row.check_in_time || null, row.round_start || null,
       row.round_end || null, row.duration_min ? Number(row.duration_min) : null,
       memberId]
    );
    count++;
  }
  return count;
}

async function insertBookingPlayers(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'booking_players');
    const playerId = `${CLUB_ID}_${row.player_id}`;
    const bookingId = `${CLUB_ID}_${row.reservation_id}`;
    // member_id: booking_players override maps 'member #' → member_id (not external_id)
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    await client.query(
      `INSERT INTO booking_players (player_id, booking_id, member_id, guest_name, is_guest, position_in_group)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (player_id) DO NOTHING`,
      [playerId, bookingId, memberId, row.guest_name || null,
       Number(row.guest_flag || 0), Number(row.position || 1)]
    );
    count++;
  }
  return count;
}

async function insertPosChecks(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'pos_checks');
    const checkId = `${CLUB_ID}_${row.check_id}`;
    // sales_area in the resolved row maps to outlet_name via FIELD_ALIASES,
    // but pos_checks override maps it to outlet_id via columnMap
    const outletId = `${CLUB_ID}_${rawRow['Sales Area'] || row.sales_area || row.outlet_name}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    await client.query(
      `INSERT INTO pos_checks (check_id, outlet_id, member_id, opened_at, closed_at,
        first_item_fired_at, last_item_fulfilled_at, subtotal, tax_amount, tip_amount,
        comp_amount, discount_amount, void_amount, total, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (check_id) DO NOTHING`,
      [checkId, outletId, memberId,
       row.transaction_date || row.open_time || '', row.close_time || null,
       row.first_fire || null, row.last_fulfilled || null,
       Number(row.total_amount || row.net_amount || 0),
       Number(row.tax || 0), Number(row.gratuity || 0),
       Number(row.comp || 0), Number(row.discount || 0), Number(row.void || 0),
       Number(row.total_due || row.total_amount || 0),
       row.settlement_method || 'member_charge']
    );
    count++;
  }
  return count;
}

async function insertLineItems(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'line_items');
    const lineItemId = `${CLUB_ID}_${row.line_item_id}`;
    const checkId = `${CLUB_ID}_${row.check_id}`;
    await client.query(
      `INSERT INTO pos_line_items (line_item_id, check_id, item_name, category, unit_price, quantity, line_total, is_comp, is_void, fired_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (line_item_id) DO NOTHING`,
      [lineItemId, checkId,
       row.item_description || '', row.sales_category || 'other',
       Number(row.regular_price || 0), Number(row.qty || row.quantity || 1),
       Number(row.line_total || 0),
       Number(row.comp || row.is_comp || 0), Number(row.void || row.is_void || 0),
       row.fire_time || null]
    );
    count++;
  }
  return count;
}

async function insertPayments(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'payments');
    const paymentId = `${CLUB_ID}_${row.payment_id}`;
    const checkId = `${CLUB_ID}_${row.check_id}`;
    const isSplit = (rawRow['Split'] || rawRow['split'] || row.is_split || '0');
    await client.query(
      `INSERT INTO pos_payments (payment_id, check_id, payment_method, amount, processed_at, is_split)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (payment_id) DO NOTHING`,
      [paymentId, checkId,
       row.settlement_method || row.payment_method || 'member_charge',
       Number(row.amount || 0), row.processed_at || '',
       (isSplit === '1' || isSplit === 'true') ? 1 : 0]
    );
    count++;
  }
  return count;
}

async function insertDailyClose(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'daily_close');
    const closeoutId = `${CLUB_ID}_${row.closeout_id}`;
    await client.query(
      `INSERT INTO close_outs (closeout_id, club_id, date, golf_revenue, fb_revenue, total_revenue, rounds_played, covers, weather)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (closeout_id) DO NOTHING`,
      [closeoutId, CLUB_ID, row.date,
       Number(row.golf_revenue || 0), Number(row.fb_revenue || 0), Number(row.total_revenue || 0),
       Number(row.rounds_played || 0), Number(row.covers || 0), row.weather || 'sunny']
    );
    count++;
  }
  return count;
}

async function insertEvents(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'events');
    const eventId = `${CLUB_ID}_${row.event_id}`;
    await client.query(
      `INSERT INTO event_definitions (event_id, club_id, name, type, event_date, capacity, registration_fee, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, CLUB_ID, row.event_name,
       row.event_type || 'social', row.start_date || new Date().toISOString().slice(0, 10),
       Number(row.capacity || 50), Number(row.registration_fee || 0),
       row.description || null]
    );
    count++;
  }
  return count;
}

async function insertEventRegistrations(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'event_registrations');
    const regId = `${CLUB_ID}_${row.registration_id}`;
    const eventId = `${CLUB_ID}_${row.event_id}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    await client.query(
      `INSERT INTO event_registrations (registration_id, event_id, member_id, status, guest_count, fee_paid, registered_at, checked_in_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (registration_id) DO NOTHING`,
      [regId, eventId, memberId,
       row.status || 'registered', Number(row.guest_count || 0),
       Number(row.fee_paid || 0), row.registration_date || new Date().toISOString(),
       row.check_in_time || null]
    );
    count++;
  }
  return count;
}

async function insertEmailCampaigns(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'email_campaigns');
    const campaignId = `${CLUB_ID}_${row.campaign_id}`;
    await client.query(
      `INSERT INTO email_campaigns (campaign_id, club_id, subject, type, send_date, recipient_count)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (campaign_id) DO NOTHING`,
      [campaignId, CLUB_ID, row.subject,
       row.campaign_type || 'newsletter', row.send_date || '',
       Number(row.audience_count || 0)]
    );
    count++;
  }
  return count;
}

async function insertEmailEvents(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'email_events');
    const eventId = `ee_${CLUB_ID}_${count}_${Date.now()}`;
    const campaignId = `${CLUB_ID}_${row.campaign_id}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    await client.query(
      `INSERT INTO email_events (event_id, campaign_id, member_id, event_type, occurred_at, link_clicked, device_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, campaignId, memberId,
       row.event_type, row.timestamp || new Date().toISOString(),
       row.link_clicked || null, row.device || null]
    );
    count++;
  }
  return count;
}

async function insertComplaints(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'complaints');
    const feedbackId = row.feedback_id ? `${CLUB_ID}_${row.feedback_id}` : `${CLUB_ID}_fb_${count}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    // JCM_Communications maps: Type→category, Subject→description, Happometer Score→priority, Complete→status
    await client.query(
      `INSERT INTO feedback (feedback_id, member_id, club_id, submitted_at, category, sentiment_score, description, status, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (feedback_id) DO NOTHING`,
      [feedbackId, memberId, CLUB_ID,
       row.reported_at || new Date().toISOString(),
       row.category || 'General',
       Number(row.priority || 0),  // happometer score is the sentiment_score
       row.description || '',
       row.status || 'acknowledged',
       row.resolved_at || null]
    );
    count++;
  }
  return count;
}

async function insertServiceRequests(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'service_requests');
    const requestId = `${CLUB_ID}_${row.request_id}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    const bookingId = row.booking_ref ? `${CLUB_ID}_${row.booking_ref}` : null;
    await client.query(
      `INSERT INTO service_requests (request_id, club_id, member_id, booking_id, request_type, requested_at, response_time_min, resolved_at, resolution_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (request_id) DO NOTHING`,
      [requestId, CLUB_ID, memberId, bookingId,
       row.type || 'general', row.date || new Date().toISOString(),
       row.response_time_min ? Number(row.response_time_min) : null,
       row.resolution_date || null, row.notes || null]
    );
    count++;
  }
  return count;
}

async function insertInvoices(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'invoices');
    const invoiceId = `${CLUB_ID}_${row.invoice_id}`;
    const memberId = row.member_id ? prefixMemberId(row.member_id) : null;
    await client.query(
      `INSERT INTO member_invoices (invoice_id, club_id, member_id, invoice_date, due_date, amount, type, description, status, paid_date, paid_amount, days_past_due, late_fee)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (invoice_id) DO NOTHING`,
      [invoiceId, CLUB_ID, memberId,
       row.statement_date || null, row.due_date || null,
       row.net_amount ? Number(row.net_amount) : null,
       row.billing_code_type || null, row.description || null,
       row.aging_bucket || null, row.last_payment || null,
       row.payment_amount ? Number(row.payment_amount) : null,
       row.days_past_due ? Number(row.days_past_due) : null,
       row.late_fee ? Number(row.late_fee) : null]
    );
    count++;
  }
  return count;
}

async function insertStaff(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'staff');
    const staffId = `${CLUB_ID}_${row.employee_id}`;
    const isFullTime = (String(row.ft_pt).toUpperCase() === 'FT' || row.ft_pt === '1') ? 1 : 0;
    await client.query(
      `INSERT INTO staff (staff_id, club_id, first_name, last_name, department, role, hire_date, hourly_rate, is_full_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (staff_id) DO NOTHING`,
      [staffId, CLUB_ID, row.first_name, row.last_name,
       row.department || 'General', row.job_title || 'Staff',
       row.hire_date || new Date().toISOString().slice(0, 10),
       Number(row.hourly_rate || 15), isFullTime]
    );
    count++;
  }
  return count;
}

async function insertShifts(client, rows) {
  let count = 0;
  for (const rawRow of rows) {
    const row = resolveAliases(rawRow, 'shifts');
    const shiftId = `${CLUB_ID}_${row.shift_id}`;
    const staffId = `${CLUB_ID}_${row.employee_id}`;
    await client.query(
      `INSERT INTO staff_shifts (shift_id, club_id, staff_id, shift_date, outlet_id, start_time, end_time, hours_worked, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (shift_id) DO NOTHING`,
      [shiftId, CLUB_ID, staffId,
       row.date || '', row.location ? `${CLUB_ID}_${row.location}` : null,
       row.shift_start || '08:00', row.shift_end || '16:00',
       Number(row.actual_hours || 8), row.notes || null]
    );
    count++;
  }
  return count;
}

// ─── Dispatch table ───────────────────────────────────────────────────────────

const INSERTERS = {
  'JCM_Club_Profile.csv':          (c, r) => insertClubProfile(c, r),
  'JCM_Membership_Types_F9.csv':   (c, r) => insertMembershipTypes(c, r),
  'TTM_Course_Setup_F9.csv':       (c, r) => insertCourses(c, r),
  'POS_Sales_Areas_F9.csv':        (c, r) => insertSalesAreas(c, r),
  'JCM_Dependents_F9.csv':         (c, r) => insertHouseholds(c, r),
  'JCM_Members_F9.csv':            (c, r) => insertMembers(c, r),
  'TTM_Tee_Sheet_SV.csv':          (c, r) => insertBookings(c, r),
  'TTM_Tee_Sheet_Players_SV.csv':  (c, r) => insertBookingPlayers(c, r),
  'POS_Sales_Detail_SV.csv':       (c, r) => insertPosChecks(c, r),
  'POS_Line_Items_SV.csv':         (c, r) => insertLineItems(c, r),
  'POS_Payments_SV.csv':           (c, r) => insertPayments(c, r),
  'POS_Daily_Close_SV.csv':        (c, r) => insertDailyClose(c, r),
  'JAM_Event_List_SV.csv':         (c, r) => insertEvents(c, r),
  'JAM_Registrations_SV.csv':      (c, r) => insertEventRegistrations(c, r),
  'CHO_Campaigns_SV.csv':          (c, r) => insertEmailCampaigns(c, r),
  'CHO_Email_Events_SV.csv':       (c, r) => insertEmailEvents(c, r),
  'JCM_Communications_RG.csv':     (c, r) => insertComplaints(c, r),
  'JCM_Service_Requests_RG.csv':   (c, r) => insertServiceRequests(c, r),
  'JCM_Aged_Receivables_SV.csv':   (c, r) => insertInvoices(c, r),
  'ADP_Staff_Roster.csv':          (c, r) => insertStaff(c, r),
  '7shifts_Staff_Shifts.csv':      (c, r) => insertShifts(c, r),
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding Pine Tree demo data into club_id = '${CLUB_ID}'...\n`);

  // Use sql.query for transaction control
  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // Step 1: Delete existing seed data
    console.log('Step 1: Cleaning existing seed data...');
    await deleteAllSeedData(client);

    // Step 2: Insert in FK order
    console.log('\nStep 2: Inserting seed data...');
    let totalRows = 0;

    for (const csvFile of INSERT_ORDER) {
      const filePath = path.join(DEMO_DIR, csvFile);
      if (!fs.existsSync(filePath)) {
        console.log(`  Skipping ${csvFile} (file not found)`);
        continue;
      }

      const text = fs.readFileSync(filePath, 'utf-8');
      const rows = parseCSV(text);

      if (!rows.length) {
        console.log(`  Skipping ${csvFile} (empty)`);
        continue;
      }

      const inserter = INSERTERS[csvFile];
      if (!inserter) {
        console.log(`  Skipping ${csvFile} (no inserter defined)`);
        continue;
      }

      const count = await inserter(client, rows);
      totalRows += count;
      const importType = CSV_TO_IMPORT[csvFile];
      const table = IMPORT_TYPES[importType]?.table || importType;
      console.log(`  Seeding ${csvFile} → ${table}... ${count} rows inserted`);
    }

    await client.query('COMMIT');
    console.log(`\nDone! ${totalRows} total rows inserted across 21 CSV files.\n`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\nTransaction rolled back due to error:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
