/**
 * POST /api/demo/seed-from-csv
 *
 * Imports ALL 21 CSV seed files from public/demo-data/ into Neon.
 * 1. TRUNCATEs all relevant tables (clean slate)
 * 2. Reads each CSV with fs.readFileSync
 * 3. Parses rows and batch-INSERTs into correct DB tables
 * 4. Creates member_concierge_sessions for 5 key test members
 *
 * Returns: { success, tables: { members: N, bookings: N, ... } }
 */
import { db } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

const CLUB_ID = 'seed_pinetree';

// Vercel serverless: public/ is at the project root
// In Vercel, process.cwd() is /var/task — files in public/ are deployed to /var/task/public/
const DEMO_DIR = path.join(process.cwd(), 'public', 'demo-data');

// ─── CSV parser ──────────────────────────────────────────────────────────────

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

function parseCSV(text) {
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

// ─── Column alias maps ──────────────────────────────────────────────────────

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
  'net amount': 'total_amount', 'total due': 'total_amount', 'total amount': 'total_amount',
  'sales area': 'outlet_name', 'outlet name': 'outlet_name',
  'settlement method': 'settlement_method',
  'happometer score': 'priority', 'reported at': 'reported_at',
  'resolution date': 'resolved_at', 'resolved at': 'resolved_at',
  'event number': 'event_id', 'event id': 'event_id', 'event name': 'event_name',
  'event type': 'event_type', 'start date': 'start_date', 'event date': 'start_date',
  'registration fee': 'registration_fee', 'pricing category': 'registration_fee',
  'registration id': 'registration_id',
  'client code': 'member_id', 'guest count': 'guest_count',
  'fee paid': 'fee_paid', 'registration date': 'registration_date',
  'campaign id': 'campaign_id', 'campaign type': 'campaign_type', 'send date': 'send_date',
  'audience count': 'audience_count',
  'campaign': 'campaign_id', 'occurred at': 'timestamp',
  'link clicked': 'link_clicked', 'device type': 'device',
  'employee id': 'employee_id', 'dept': 'department',
  'job title': 'job_title', 'hire date': 'hire_date', 'hourly rate': 'hourly_rate',
  'ft/pt': 'ft_pt',
  'shift id': 'shift_id', 'shift start': 'shift_start', 'shift end': 'shift_end',
  'act hrs': 'actual_hours', 'shift date': 'date',
  'chk#': 'check_id',
  'item description': 'item_description', 'sales category': 'sales_category',
  'regular price': 'regular_price', 'fire time': 'fire_time',
  'payment id': 'payment_id', 'settlement time': 'processed_at',
  'course code': 'course_code', 'course name': 'course_name', 'interval (min)': 'interval_min',
  'sales area id': 'sales_area_id', 'sales area description': 'description',
  'invoice #': 'invoice_id', 'statement date': 'statement_date',
  'billing code type': 'billing_code_type', 'aging bucket': 'aging_bucket',
  'last payment': 'last_payment', 'payment amount': 'payment_amount',
  'days past due': 'days_past_due', 'late fee': 'late_fee',
  'request id': 'request_id', 'booking ref': 'booking_ref', 'response time (min)': 'response_time_min',
  'close id': 'closeout_id',
  'communication id': 'feedback_id', 'complete': 'status',
};

const ALIAS_OVERRIDES = {
  email_events: { 'member #': 'member_id', 'member id': 'member_id', 'event id': '_skip' },
  event_registrations: { 'member #': 'member_id', 'event number': 'event_id' },
  complaints: { 'type': 'category', 'subject': 'description', 'date': 'reported_at', 'member #': 'member_id' },
  tee_times: { 'member #': 'member_id' },
  pos_checks: { 'member #': 'member_id', 'chk#': 'check_id' },
  line_items: { 'chk#': 'check_id' },
  payments: { 'chk#': 'check_id', 'settlement method': 'payment_method' },
  invoices: { 'member #': 'member_id', 'invoice #': 'invoice_id' },
  service_requests: { 'member #': 'member_id' },
};

function resolveAliases(row, importType) {
  const overrides = ALIAS_OVERRIDES[importType] || {};
  const resolved = {};
  for (const [key, value] of Object.entries(row)) {
    const lower = key.trim().toLowerCase();
    const mapped = overrides[lower] || FIELD_ALIASES[lower] || lower;
    if (mapped !== '_skip') {
      resolved[mapped] = value;
    }
  }
  return resolved;
}

// Use raw IDs from CSV — no prefixing. The member chat and concierge
// reference these IDs directly (mbr_t01, mbr_t04, etc.)
function pfx(id) {
  return id || null;
}

// ─── Batch insert helper ─────────────────────────────────────────────────────

const BATCH_SIZE = 100;

async function batchInsert(client, table, columns, rowsData) {
  let inserted = 0;
  for (let i = 0; i < rowsData.length; i += BATCH_SIZE) {
    const batch = rowsData.slice(i, i + BATCH_SIZE);
    const valueClauses = [];
    const params = [];
    let paramIdx = 1;
    for (const row of batch) {
      const placeholders = row.map(() => `$${paramIdx++}`);
      valueClauses.push(`(${placeholders.join(',')})`);
      params.push(...row);
    }
    const colNames = columns.map(c => `"${c}"`).join(', ');
    try {
      await client.query(
        `INSERT INTO ${table} (${colNames}) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`,
        params
      );
      inserted += batch.length;
    } catch (e) {
      // Fall back to row-by-row on batch failure
      for (const row of batch) {
        const placeholders = row.map((_, idx) => `$${idx + 1}`);
        try {
          await client.query(
            `INSERT INTO ${table} (${colNames}) VALUES (${placeholders.join(', ')}) ON CONFLICT DO NOTHING`,
            row
          );
          inserted++;
        } catch { /* skip row */ }
      }
    }
  }
  return inserted;
}

// ─── Delete order (reverse FK) ───────────────────────────────────────────────

const TRUNCATE_TABLES = [
  'pos_payments', 'pos_line_items', 'pos_checks',
  'staff_shifts', 'staff',
  'member_invoices',
  'email_events', 'email_campaigns',
  'event_registrations', 'event_definitions',
  'feedback', 'service_requests', 'complaints',
  'close_outs',
  'booking_players', 'bookings',
  'member_concierge_sessions',
  'members', 'households',
  'dining_outlets', 'courses', 'membership_types',
  // derived tables
  'transactions', 'data_source_status',
];

async function cleanSlate(client) {
  for (const table of TRUNCATE_TABLES) {
    try {
      await client.query(`DELETE FROM ${table} WHERE club_id = $1`, [CLUB_ID]);
    } catch {
      // Table may not exist or not have club_id — try unconditional for join tables
      try {
        // booking_players, pos_line_items, pos_payments don't have club_id
        // They get cleaned via cascade or we skip
      } catch { /* ignore */ }
    }
  }
  // Also delete club record
  try { await client.query(`DELETE FROM club WHERE club_id = $1`, [CLUB_ID]); } catch { /* */ }
}

// ─── Insert functions (one per CSV type) ─────────────────────────────────────

async function insertClubProfile(client, rows) {
  if (!rows.length) return 0;
  const row = resolveAliases(rows[0], 'club_profile');
  await client.query(
    `INSERT INTO club (club_id, name, city, state, zip, founded_year, member_count, course_count, outlet_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (club_id) DO NOTHING`,
    [CLUB_ID, row.club_name, row.city, row.state, row.zip,
     row.founded_year ? Number(row.founded_year) : null,
     row.member_count ? Number(row.member_count) : null,
     row.course_count ? Number(row.course_count) : null,
     row.outlet_count ? Number(row.outlet_count) : null]
  );
  return 1;
}

async function insertMembershipTypes(client, rows) {
  const columns = ['type_code', 'club_id', 'name', 'annual_dues', 'fb_minimum', 'golf_eligible'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'membership_types');
    const fbMin = rawRow['F&B Minimum'] || rawRow['fnb_minimum'] || 0;
    return [
      pfx(row.type_code), CLUB_ID, row.description || row.name,
      Number(row.annual_fee || row.annual_dues || 0), Number(fbMin),
      row.golf_eligible !== undefined ? Number(row.golf_eligible) : 1,
    ];
  });
  return batchInsert(client, 'membership_types', columns, data);
}

async function insertCourses(client, rows) {
  const columns = ['course_id', 'club_id', 'name', 'holes', 'par', 'tee_interval_min', 'first_tee', 'last_tee'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'courses');
    return [
      pfx(row.course_code), CLUB_ID, row.course_name,
      Number(row.holes || 18), Number(row.par || 72),
      Number(row.interval_min || 10), row.start_time || '07:00', row.end_time || '16:00',
    ];
  });
  return batchInsert(client, 'courses', columns, data);
}

async function insertSalesAreas(client, rows) {
  const columns = ['outlet_id', 'club_id', 'name', 'type', 'meal_periods', 'weekday_covers', 'weekend_covers'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'sales_areas');
    return [
      pfx(row.sales_area_id), CLUB_ID, row.description,
      row.type || 'dining', row.operating_hours || '[]',
      Number(row.weekday_covers || 0), Number(row.weekend_covers || 0),
    ];
  });
  return batchInsert(client, 'dining_outlets', columns, data);
}

async function insertHouseholds(client, rows) {
  const columns = ['household_id', 'club_id', 'primary_member_id', 'member_count', 'address'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'households');
    return [
      pfx(row.household_id), CLUB_ID,
      row.primary_member_id ? pfx(row.primary_member_id) : null,
      row.dependent_count ? Number(row.dependent_count) : 1,
      row.home_address || null,
    ];
  });
  return batchInsert(client, 'households', columns, data);
}

async function insertMembers(client, rows) {
  const columns = [
    'member_id', 'member_number', 'club_id', 'external_id', 'first_name', 'last_name',
    'email', 'phone', 'membership_type', 'annual_dues', 'join_date', 'household_id',
    'date_of_birth', 'gender', 'account_balance', 'membership_status', 'resigned_on',
    'health_tier', 'archetype', 'data_source',
  ];
  const data = rows.map((rawRow, idx) => {
    const row = resolveAliases(rawRow, 'members');
    const memberId = row.external_id || `mbr_${idx}`;
    const memberNumber = rawRow['Member Number'] || rawRow['member_number'] || (idx + 1);
    const statusVal = row.status || 'active';
    const defaultTier = row.date_resigned ? 'Critical' : 'Watch';
    return [
      pfx(memberId), Number(memberNumber), CLUB_ID, row.external_id || null,
      row.first_name, row.last_name, row.email || null, row.phone || null,
      row.membership_type ? pfx(row.membership_type) : null,
      row.annual_dues ? Number(row.annual_dues) : null,
      row.join_date || null, row.household_id ? pfx(row.household_id) : null,
      row.birthday || row.date_of_birth || null, row.sex || row.gender || null,
      row.current_balance ? Number(row.current_balance) : null,
      statusVal, row.date_resigned || null, defaultTier, 'unknown', 'seed',
    ];
  });
  return batchInsert(client, 'members', columns, data);
}

async function insertBookings(client, rows) {
  const columns = [
    'booking_id', 'club_id', 'course_id', 'booking_date', 'tee_time', 'player_count',
    'has_guest', 'transportation', 'has_caddie', 'round_type', 'status',
    'check_in_time', 'round_start', 'round_end', 'duration_minutes',
  ];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'tee_times');
    const holes = rawRow['Holes'] || rawRow['holes'] || '18';
    return [
      pfx(row.reservation_id), CLUB_ID, pfx(row.course),
      row.date, row.tee_time,
      Number(row.players || 1), Number(row.guest_flag || 0),
      row.transportation || 'cart', Number(row.caddie || 0),
      String(holes), row.status || 'confirmed',
      row.check_in_time || null, row.round_start || null,
      row.round_end || null, row.duration_min ? Number(row.duration_min) : null,
    ];
  });
  return batchInsert(client, 'bookings', columns, data);
}

async function insertBookingPlayers(client, rows) {
  const columns = ['player_id', 'booking_id', 'member_id', 'guest_name', 'is_guest', 'position_in_group'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'booking_players');
    return [
      pfx(row.player_id), pfx(row.reservation_id),
      row.member_id ? pfx(row.member_id) : null,
      row.guest_name || null, Number(row.guest_flag || 0), Number(row.position || 1),
    ];
  });
  return batchInsert(client, 'booking_players', columns, data);
}

async function insertPosChecks(client, rows) {
  const columns = [
    'check_id', 'outlet_id', 'member_id', 'opened_at', 'closed_at',
    'first_item_fired_at', 'last_item_fulfilled_at', 'subtotal', 'tax_amount', 'tip_amount',
    'comp_amount', 'discount_amount', 'void_amount', 'total', 'payment_method',
  ];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'pos_checks');
    const outletId = pfx(rawRow['Sales Area'] || row.sales_area || row.outlet_name);
    return [
      pfx(row.check_id), outletId,
      row.member_id ? pfx(row.member_id) : null,
      row.transaction_date || row.open_time || '', row.close_time || null,
      row.first_fire || null, row.last_fulfilled || null,
      Number(row.total_amount || row.net_amount || 0),
      Number(row.tax || 0), Number(row.gratuity || 0),
      Number(row.comp || 0), Number(row.discount || 0), Number(row.void || 0),
      Number(row.total_due || row.total_amount || 0),
      row.settlement_method || 'member_charge',
    ];
  });
  return batchInsert(client, 'pos_checks', columns, data);
}

async function insertLineItems(client, rows) {
  const columns = [
    'line_item_id', 'check_id', 'item_name', 'category', 'unit_price',
    'quantity', 'line_total', 'is_comp', 'is_void', 'fired_at',
  ];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'line_items');
    return [
      pfx(row.line_item_id), pfx(row.check_id),
      row.item_description || '', row.sales_category || 'other',
      Number(row.regular_price || 0), Number(row.qty || row.quantity || 1),
      Number(row.line_total || 0),
      Number(row.comp || row.is_comp || 0), Number(row.void || row.is_void || 0),
      row.fire_time || null,
    ];
  });
  return batchInsert(client, 'pos_line_items', columns, data);
}

async function insertPayments(client, rows) {
  const columns = ['payment_id', 'check_id', 'payment_method', 'amount', 'processed_at', 'is_split'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'payments');
    const isSplit = rawRow['Split'] || rawRow['split'] || row.is_split || '0';
    return [
      pfx(row.payment_id), pfx(row.check_id),
      row.settlement_method || row.payment_method || 'member_charge',
      Number(row.amount || 0), row.processed_at || '',
      (isSplit === '1' || isSplit === 'true') ? 1 : 0,
    ];
  });
  return batchInsert(client, 'pos_payments', columns, data);
}

async function insertDailyClose(client, rows) {
  const columns = ['closeout_id', 'club_id', 'date', 'golf_revenue', 'fb_revenue', 'total_revenue', 'rounds_played', 'covers', 'weather'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'daily_close');
    return [
      pfx(row.closeout_id), CLUB_ID, row.date,
      Number(row.golf_revenue || 0), Number(row.fb_revenue || 0), Number(row.total_revenue || 0),
      Number(row.rounds_played || 0), Number(row.covers || 0), row.weather || 'sunny',
    ];
  });
  return batchInsert(client, 'close_outs', columns, data);
}

async function insertEvents(client, rows) {
  const columns = ['event_id', 'club_id', 'name', 'type', 'event_date', 'capacity', 'registration_fee', 'description'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'events');
    return [
      pfx(row.event_id), CLUB_ID, row.event_name,
      row.event_type || 'social', row.start_date || new Date().toISOString().slice(0, 10),
      Number(row.capacity || 50), Number(row.registration_fee || 0),
      row.description || null,
    ];
  });
  return batchInsert(client, 'event_definitions', columns, data);
}

async function insertEventRegistrations(client, rows) {
  const columns = ['registration_id', 'event_id', 'member_id', 'status', 'guest_count', 'fee_paid', 'registered_at', 'checked_in_at'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'event_registrations');
    return [
      pfx(row.registration_id), pfx(row.event_id),
      row.member_id ? pfx(row.member_id) : null,
      row.status || 'registered', Number(row.guest_count || 0),
      Number(row.fee_paid || 0), row.registration_date || new Date().toISOString(),
      row.check_in_time || null,
    ];
  });
  return batchInsert(client, 'event_registrations', columns, data);
}

async function insertEmailCampaigns(client, rows) {
  const columns = ['campaign_id', 'club_id', 'subject', 'type', 'send_date', 'recipient_count'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'email_campaigns');
    return [
      pfx(row.campaign_id), CLUB_ID, row.subject,
      row.campaign_type || 'newsletter', row.send_date || '',
      Number(row.audience_count || 0),
    ];
  });
  return batchInsert(client, 'email_campaigns', columns, data);
}

async function insertEmailEvents(client, rows) {
  const columns = ['event_id', 'campaign_id', 'member_id', 'event_type', 'occurred_at', 'link_clicked', 'device_type'];
  const now = Date.now();
  const data = rows.map((rawRow, idx) => {
    const row = resolveAliases(rawRow, 'email_events');
    return [
      `ee_${CLUB_ID}_${idx}_${now}`, pfx(row.campaign_id),
      row.member_id ? pfx(row.member_id) : null,
      row.event_type, row.timestamp || new Date().toISOString(),
      row.link_clicked || null, row.device || null,
    ];
  });
  return batchInsert(client, 'email_events', columns, data);
}

async function insertComplaints(client, rows) {
  const columns = ['feedback_id', 'member_id', 'club_id', 'submitted_at', 'category', 'sentiment_score', 'description', 'status', 'resolved_at'];
  const data = rows.map((rawRow, idx) => {
    const row = resolveAliases(rawRow, 'complaints');
    const feedbackId = row.feedback_id ? pfx(row.feedback_id) : `${CLUB_ID}_fb_${idx}`;
    return [
      feedbackId, row.member_id ? pfx(row.member_id) : null, CLUB_ID,
      row.reported_at || new Date().toISOString(),
      row.category || 'General', Number(row.priority || 0),
      row.description || '', row.status || 'acknowledged',
      row.resolved_at || null,
    ];
  });
  return batchInsert(client, 'feedback', columns, data);
}

async function insertServiceRequests(client, rows) {
  const columns = ['request_id', 'club_id', 'member_id', 'booking_id', 'request_type', 'requested_at', 'response_time_min', 'resolved_at', 'resolution_notes'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'service_requests');
    return [
      pfx(row.request_id), CLUB_ID,
      row.member_id ? pfx(row.member_id) : null,
      row.booking_ref ? pfx(row.booking_ref) : null,
      row.type || 'general', row.date || new Date().toISOString(),
      row.response_time_min ? Number(row.response_time_min) : null,
      row.resolution_date || null, row.notes || null,
    ];
  });
  return batchInsert(client, 'service_requests', columns, data);
}

async function insertInvoices(client, rows) {
  const columns = [
    'invoice_id', 'club_id', 'member_id', 'invoice_date', 'due_date', 'amount',
    'type', 'description', 'status', 'paid_date', 'paid_amount', 'days_past_due', 'late_fee',
  ];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'invoices');
    return [
      pfx(row.invoice_id), CLUB_ID, row.member_id ? pfx(row.member_id) : null,
      row.statement_date || null, row.due_date || null,
      row.net_amount ? Number(row.net_amount) : null,
      row.billing_code_type || null, row.description || null,
      row.aging_bucket || null, row.last_payment || null,
      row.payment_amount ? Number(row.payment_amount) : null,
      row.days_past_due ? Number(row.days_past_due) : null,
      row.late_fee ? Number(row.late_fee) : null,
    ];
  });
  return batchInsert(client, 'member_invoices', columns, data);
}

async function insertStaff(client, rows) {
  const columns = ['staff_id', 'club_id', 'first_name', 'last_name', 'department', 'role', 'hire_date', 'hourly_rate', 'is_full_time'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'staff');
    const isFullTime = (String(row.ft_pt).toUpperCase() === 'FT' || row.ft_pt === '1') ? 1 : 0;
    return [
      pfx(row.employee_id), CLUB_ID, row.first_name, row.last_name,
      row.department || 'General', row.job_title || 'Staff',
      row.hire_date || new Date().toISOString().slice(0, 10),
      Number(row.hourly_rate || 15), isFullTime,
    ];
  });
  return batchInsert(client, 'staff', columns, data);
}

async function insertShifts(client, rows) {
  const columns = ['shift_id', 'club_id', 'staff_id', 'shift_date', 'outlet_id', 'start_time', 'end_time', 'hours_worked', 'notes'];
  const data = rows.map(rawRow => {
    const row = resolveAliases(rawRow, 'shifts');
    return [
      pfx(row.shift_id), CLUB_ID, pfx(row.employee_id),
      row.date || '', row.location ? pfx(row.location) : null,
      row.shift_start || '08:00', row.shift_end || '16:00',
      Number(row.actual_hours || 8), row.notes || null,
    ];
  });
  return batchInsert(client, 'staff_shifts', columns, data);
}

// ─── CSV → inserter dispatch ─────────────────────────────────────────────────

const INSERT_ORDER = [
  { csv: 'JCM_Club_Profile.csv',          label: 'club',                fn: insertClubProfile },
  { csv: 'JCM_Membership_Types_F9.csv',   label: 'membership_types',    fn: insertMembershipTypes },
  { csv: 'TTM_Course_Setup_F9.csv',       label: 'courses',             fn: insertCourses },
  { csv: 'POS_Sales_Areas_F9.csv',        label: 'dining_outlets',      fn: insertSalesAreas },
  { csv: 'JCM_Dependents_F9.csv',         label: 'households',          fn: insertHouseholds },
  { csv: 'JCM_Members_F9.csv',            label: 'members',             fn: insertMembers },
  { csv: 'TTM_Tee_Sheet_SV.csv',          label: 'bookings',            fn: insertBookings },
  { csv: 'TTM_Tee_Sheet_Players_SV.csv',  label: 'booking_players',     fn: insertBookingPlayers },
  { csv: 'POS_Sales_Detail_SV.csv',       label: 'pos_checks',          fn: insertPosChecks },
  { csv: 'POS_Line_Items_SV.csv',         label: 'pos_line_items',      fn: insertLineItems },
  { csv: 'POS_Payments_SV.csv',           label: 'pos_payments',        fn: insertPayments },
  { csv: 'POS_Daily_Close_SV.csv',        label: 'close_outs',          fn: insertDailyClose },
  { csv: 'JAM_Event_List_SV.csv',         label: 'event_definitions',   fn: insertEvents },
  { csv: 'JAM_Registrations_SV.csv',      label: 'event_registrations', fn: insertEventRegistrations },
  { csv: 'CHO_Campaigns_SV.csv',          label: 'email_campaigns',     fn: insertEmailCampaigns },
  { csv: 'CHO_Email_Events_SV.csv',       label: 'email_events',        fn: insertEmailEvents },
  { csv: 'JCM_Communications_RG.csv',     label: 'feedback',            fn: insertComplaints },
  { csv: 'JCM_Service_Requests_RG.csv',   label: 'service_requests',    fn: insertServiceRequests },
  { csv: 'JCM_Aged_Receivables_SV.csv',   label: 'member_invoices',     fn: insertInvoices },
  { csv: 'ADP_Staff_Roster.csv',          label: 'staff',               fn: insertStaff },
  { csv: '7shifts_Staff_Shifts.csv',      label: 'staff_shifts',        fn: insertShifts },
];

// ─── Concierge sessions for key test members ─────────────────────────────────

const KEY_MEMBERS = [
  {
    id: 'mbr_t01', name: 'James Whitfield',
    preferences: { dining: 'Prefers the Grill Room', golf: 'Plays weekends, morning tee times', beverage: 'Old Fashioned after rounds', communication: 'Text preferred' },
  },
  {
    id: 'mbr_t04', name: 'Anne Jordan',
    preferences: { dining: 'Main Dining Room regular, vegetarian options', golf: 'Occasional golfer, prefers 9 holes', events: 'Active in social events', communication: 'Email preferred' },
  },
  {
    id: 'mbr_t05', name: 'Robert Callahan',
    preferences: { dining: 'Corporate entertaining at Main Dining', golf: 'Mid-handicap, plays with business guests', events: 'Hosts corporate outings', communication: 'Phone call preferred' },
  },
  {
    id: 'mbr_t06', name: 'Sandra Chen',
    preferences: { dining: 'Enjoys wine dinners and tasting events', golf: 'Non-golfer, social member', events: 'Attends most social and dining events', communication: 'Email preferred' },
  },
  {
    id: 'mbr_t07', name: 'Linda Leonard',
    preferences: { dining: 'Was a regular at Sunday brunch', golf: 'Avid golfer, competitive handicap', events: 'Previously very active', communication: 'Personal outreach needed — resigned member', notes: 'Resigned Jan 2026, retention target' },
  },
];

async function insertConciergeSessions(client) {
  let count = 0;
  for (const m of KEY_MEMBERS) {
    const memberId = pfx(m.id);
    const sessionId = `cs_${CLUB_ID}_${m.id}`;
    try {
      await client.query(
        `INSERT INTO member_concierge_sessions (session_id, club_id, member_id, preferences_cache, conversation_summary)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [sessionId, CLUB_ID, memberId, JSON.stringify(m.preferences), `Key test member: ${m.name}`]
      );
      count++;
    } catch { /* table may not exist */ }
  }
  return count;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  // Accept ?phase=1|2|3 to split the import into chunks (Vercel timeout workaround)
  // phase=1: truncate + members/courses/households/outlets/types
  // phase=2: bookings, POS, complaints
  // phase=3: email, events, staff, sessions
  // phase=all (default): everything at once
  const phase = req.body?.phase || req.query?.phase || 'all';

  const startTime = Date.now();
  const tables = {};
  const errors = [];

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Step 1: Clean slate (only on phase 1 or all)
    if (phase === '1' || phase === 'all') {
      await cleanSlate(client);
    }

    // Step 2: Insert each CSV in FK-safe order
    const phaseFilter = {
      '1': ['membership_types', 'courses', 'dining_outlets', 'households', 'members'],
      '2': ['bookings', 'booking_players', 'pos_checks', 'pos_line_items', 'pos_payments', 'close_outs', 'feedback', 'service_requests', 'invoices'],
      '3': ['event_definitions', 'event_registrations', 'email_campaigns', 'email_events', 'staff', 'staff_shifts'],
    };
    const allowedLabels = phase === 'all' ? null : (phaseFilter[phase] || null);

    for (const { csv, label, fn } of INSERT_ORDER) {
      if (allowedLabels && !allowedLabels.includes(label)) continue;
      const filePath = path.join(DEMO_DIR, csv);
      if (!fs.existsSync(filePath)) {
        errors.push(`${csv}: file not found`);
        continue;
      }
      const text = fs.readFileSync(filePath, 'utf-8');
      const rows = parseCSV(text);
      if (!rows.length) {
        tables[label] = 0;
        continue;
      }
      try {
        const count = await fn(client, rows);
        tables[label] = count;
      } catch (e) {
        errors.push(`${csv} (${label}): ${e.message}`);
        tables[label] = 0;
      }
    }

    // Step 3: Create concierge sessions for key test members (phase 3 or all)
    if (phase === '3' || phase === 'all') {
      try {
        const sessionCount = await insertConciergeSessions(client);
        tables['member_concierge_sessions'] = sessionCount;
      } catch (e) {
        errors.push(`concierge_sessions: ${e.message}`);
      }
    }

    await client.query('COMMIT');

    const totalRows = Object.values(tables).reduce((a, b) => a + b, 0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return res.status(200).json({
      success: true,
      club_id: CLUB_ID,
      total_rows: totalRows,
      elapsed_seconds: Number(elapsed),
      tables,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* */ }
    return res.status(500).json({
      success: false,
      error: e.message,
      errors,
    });
  } finally {
    client.release();
  }
}
