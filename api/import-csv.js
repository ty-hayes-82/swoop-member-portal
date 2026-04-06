/**
 * CSV Import API — Sprint 1
 * POST /api/import-csv
 * Body: { clubId, importType, rows: [...], uploadedBy }
 *
 * Accepts pre-parsed CSV rows (frontend handles file parsing)
 * and imports them into the appropriate table with validation.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';
import { cors } from './lib/cors.js';

const IMPORT_TYPES = {
  // Phase 1: Club Setup + Members
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
  },
  households: {
    requiredFields: ['household_id', 'primary_member_id'],
    optionalFields: ['dependent_count', 'home_address'],
    table: 'households',
  },
  // Phase 2: Golf Operations
  courses: {
    requiredFields: ['course_code', 'course_name'],
    optionalFields: ['holes', 'par', 'interval_min', 'start_time', 'end_time'],
    table: 'courses',
  },
  tee_times: {
    requiredFields: ['reservation_id', 'course', 'date', 'tee_time'],
    optionalFields: ['players', 'guest_flag', 'transportation', 'caddie', 'status', 'check_in_time', 'round_start', 'round_end', 'duration_min'],
    table: 'bookings',
    columnMap: { reservation_id: 'booking_id', course: 'course_id', date: 'booking_date', players: 'player_count', guest_flag: 'has_guest', caddie: 'has_caddie', duration_min: 'duration_minutes' },
  },
  booking_players: {
    requiredFields: ['player_id', 'reservation_id'],
    optionalFields: ['member_id', 'guest_name', 'guest_flag', 'position'],
    table: 'booking_players',
  },
  rounds: {
    requiredFields: ['member_id', 'round_date'],
    optionalFields: ['tee_time', 'course_id', 'duration_minutes', 'pace_rating', 'players', 'cancelled', 'no_show'],
    table: 'rounds',
  },
  // Phase 3: F&B + Service
  transactions: {
    requiredFields: ['transaction_date', 'total_amount'],
    optionalFields: ['member_id', 'outlet_name', 'category', 'item_count', 'is_post_round', 'tax', 'gratuity', 'comp', 'discount', 'void', 'settlement_method', 'open_time', 'close_time'],
    table: 'transactions',
  },
  sales_areas: {
    requiredFields: ['sales_area_id', 'description'],
    optionalFields: ['type', 'operating_hours', 'weekday_covers', 'weekend_covers'],
    table: 'dining_outlets',
  },
  line_items: {
    requiredFields: ['line_item_id', 'check_id'],
    optionalFields: ['item_description', 'sales_category', 'regular_price', 'qty', 'line_total', 'comp', 'void', 'fire_time'],
    table: 'pos_line_items',
  },
  daily_close: {
    requiredFields: ['date'],
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
  },
  // Phase 4: Events + Email
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
    insertOnly: true,
  },
  // Phase 5: Staffing + Billing
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
    insertOnly: true,
  },
  invoices: {
    requiredFields: ['invoice_id', 'member_id', 'statement_date'],
    optionalFields: ['due_date', 'net_amount', 'billing_code_type', 'description', 'aging_bucket', 'last_payment', 'payment_amount', 'days_past_due', 'late_fee'],
    table: 'member_invoices',
  },
};

function validateRow(row, config, rowIndex) {
  const errors = [];
  for (const field of config.requiredFields) {
    if (!row[field] || String(row[field]).trim() === '') {
      errors.push({ row: rowIndex + 1, field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (row.annual_dues && isNaN(Number(row.annual_dues))) {
    errors.push({ row: rowIndex + 1, field: 'annual_dues', message: 'annual_dues must be a number' });
  }
  if (row.total_amount && isNaN(Number(row.total_amount))) {
    errors.push({ row: rowIndex + 1, field: 'total_amount', message: 'total_amount must be a number' });
  }
  return errors;
}

export default withAuth(async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const clubId = getClubId(req);
  const { importType, rows, uploadedBy } = req.body;

  if (!importType || !rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Missing required fields: importType, rows[]' });
  }

  const config = IMPORT_TYPES[importType];
  if (!config) {
    return res.status(400).json({ error: `Unknown import type: ${importType}. Valid types: ${Object.keys(IMPORT_TYPES).join(', ')}` });
  }

  // Create import tracking record
  const importId = `imp_${Date.now()}`;
  await sql`
    INSERT INTO csv_imports (import_id, club_id, uploaded_by, import_type, status, total_rows)
    VALUES (${importId}, ${clubId}, ${uploadedBy || 'system'}, ${importType}, 'processing', ${rows.length})
  `;

  let successCount = 0;
  let errorCount = 0;
  const allErrors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors = validateRow(row, config, i);

    if (rowErrors.length > 0) {
      allErrors.push(...rowErrors);
      errorCount++;
      continue;
    }

    try {
      if (importType === 'members') {
        const memberId = row.external_id || `mbr_${Date.now()}_${i}`;
        const uniqueMemberId = `${clubId}_${memberId}`;
        const statusVal = row.status || 'active';
        await sql`
          INSERT INTO members (member_id, club_id, external_id, first_name, last_name, email, phone, membership_type, annual_dues, join_date, household_id, date_of_birth, gender, account_balance, membership_status, resigned_on, data_source)
          VALUES (${uniqueMemberId}, ${clubId}, ${row.external_id || null}, ${row.first_name}, ${row.last_name}, ${row.email || null}, ${row.phone || null}, ${row.membership_type || null}, ${row.annual_dues ? Number(row.annual_dues) : null}, ${row.join_date || null}, ${row.household_id || null}, ${row.birthday || row.date_of_birth || null}, ${row.sex || row.gender || null}, ${row.current_balance ? Number(row.current_balance) : null}, ${statusVal}, ${row.date_resigned || null}, 'csv_import')
          ON CONFLICT (member_id) DO UPDATE SET
            club_id = EXCLUDED.club_id,
            first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
            email = COALESCE(EXCLUDED.email, members.email),
            phone = COALESCE(EXCLUDED.phone, members.phone),
            membership_type = COALESCE(EXCLUDED.membership_type, members.membership_type),
            annual_dues = COALESCE(EXCLUDED.annual_dues, members.annual_dues),
            date_of_birth = COALESCE(EXCLUDED.date_of_birth, members.date_of_birth),
            gender = COALESCE(EXCLUDED.gender, members.gender),
            account_balance = COALESCE(EXCLUDED.account_balance, members.account_balance),
            membership_status = COALESCE(EXCLUDED.membership_status, members.membership_status),
            resigned_on = COALESCE(EXCLUDED.resigned_on, members.resigned_on),
            updated_at = NOW()
        `;
      } else if (importType === 'rounds') {
        await sql`
          INSERT INTO rounds (club_id, member_id, round_date, tee_time, course_id, duration_minutes, pace_rating, players, cancelled, no_show, data_source)
          VALUES (${clubId}, ${row.member_id}, ${row.round_date}, ${row.tee_time || null}, ${row.course_id || null}, ${row.duration_minutes ? Number(row.duration_minutes) : null}, ${row.pace_rating || null}, ${row.players ? Number(row.players) : 1}, ${row.cancelled === 'true' || row.cancelled === '1' || false}, ${row.no_show === 'true' || row.no_show === '1' || false}, 'csv_import')
        `;
      } else if (importType === 'transactions') {
        await sql`
          INSERT INTO transactions (club_id, member_id, transaction_date, total_amount, outlet_name, category, item_count, is_post_round, data_source)
          VALUES (${clubId}, ${row.member_id || null}, ${row.transaction_date}, ${Number(row.total_amount)}, ${row.outlet_name || null}, ${row.category || null}, ${row.item_count ? Number(row.item_count) : null}, ${row.is_post_round === 'true' || row.is_post_round === '1' || false}, 'csv_import')
        `;
      } else if (importType === 'complaints') {
        await sql`
          INSERT INTO complaints (club_id, member_id, category, description, status, priority, reported_at, data_source)
          VALUES (${clubId}, ${row.member_id || null}, ${row.category}, ${row.description}, ${row.status || 'open'}, ${row.priority || 'medium'}, ${row.reported_at || new Date().toISOString()}, 'csv_import')
        `;
      } else {
        // Generic insert for all other import types
        const allFields = [...config.requiredFields, ...config.optionalFields];
        const columnMap = config.columnMap || {};
        // Not all tables have club_id or data_source columns
        const tablesWithoutClubId = new Set(['event_registrations', 'email_events', 'booking_players', 'pos_line_items', 'pos_payments']);
        const tablesWithDataSource = new Set(['members', 'rounds', 'transactions', 'complaints']);
        const columns = [];
        const values = [];
        if (!tablesWithoutClubId.has(config.table)) {
          columns.push('club_id');
          values.push(clubId);
        }
        if (tablesWithDataSource.has(config.table)) {
          columns.push('data_source');
          values.push('csv_import');
        }
        const mappedColumns = new Set(); // track which DB columns we've added
        for (const field of allFields) {
          if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
            const dbColumn = columnMap[field] || field;
            columns.push(dbColumn);
            mappedColumns.add(dbColumn);
            let val = row[field];
            // Apply value transforms (e.g., ft_pt "FT"→1, "PT"→0)
            if (config.valueTransform?.[field]) val = config.valueTransform[field](val);
            values.push(typeof val === 'string' && !isNaN(Number(val)) && field.match(/amount|fee|price|total|revenue|rate|count|hours|covers|capacity/) ? Number(val) : val);
          }
        }
        // Apply defaults for missing NOT NULL columns
        if (config.defaults) {
          for (const [col, defaultFn] of Object.entries(config.defaults)) {
            if (!mappedColumns.has(col)) {
              columns.push(col);
              values.push(typeof defaultFn === 'function' ? defaultFn() : defaultFn);
            }
          }
        }
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');
        let upsertSuffix = '';
        if (!config.insertOnly) {
          const pkCol = config.requiredFields[0];
          const dbPkCol = columnMap[pkCol] || pkCol;
          const updateCols = columns.filter(c => c !== dbPkCol && c !== 'club_id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
          upsertSuffix = updateCols ? ` ON CONFLICT ("${dbPkCol}") DO UPDATE SET ${updateCols}` : ' ON CONFLICT DO NOTHING';
        }
        await sql.query(`INSERT INTO ${config.table} (${colNames}) VALUES (${placeholders})${upsertSuffix}`, values);
      }
      successCount++;
    } catch (e) {
      allErrors.push({ row: i + 1, field: 'database', message: e.message });
      errorCount++;
    }
  }

  // Update import record
  await sql`
    UPDATE csv_imports
    SET status = ${errorCount === rows.length ? 'failed' : errorCount > 0 ? 'partial' : 'completed'},
        success_rows = ${successCount}, error_rows = ${errorCount},
        errors = ${JSON.stringify(allErrors.slice(0, 50))}::jsonb,
        completed_at = NOW()
    WHERE import_id = ${importId}
  `;

  // Update data_source_status so Data Health dashboard reflects CSV imports
  if (successCount > 0) {
    const IMPORT_TO_DOMAIN = { members: 'CRM', rounds: 'TEE_SHEET', tee_times: 'TEE_SHEET', transactions: 'POS', complaints: 'CRM', events: 'EMAIL', event_registrations: 'EMAIL', email_campaigns: 'EMAIL', email_events: 'EMAIL', staff: 'LABOR', shifts: 'LABOR' };
    const domain = IMPORT_TO_DOMAIN[importType];
    if (domain) {
      try {
        // Ensure table exists before inserting
        await sql`
          CREATE TABLE IF NOT EXISTS data_source_status (
            club_id TEXT NOT NULL,
            domain_code TEXT NOT NULL,
            is_connected BOOLEAN DEFAULT FALSE,
            source_vendor TEXT,
            row_count INTEGER DEFAULT 0,
            health_status TEXT DEFAULT 'unknown',
            last_sync_at TIMESTAMPTZ,
            staleness_hours NUMERIC,
            PRIMARY KEY (club_id, domain_code)
          )
        `;
        await sql`
          INSERT INTO data_source_status (club_id, domain_code, is_connected, source_vendor, row_count, health_status, last_sync_at)
          VALUES (${clubId}, ${domain}, TRUE, 'csv_import', ${successCount}, 'healthy', NOW())
          ON CONFLICT (club_id, domain_code) DO UPDATE SET
            is_connected = TRUE, row_count = data_source_status.row_count + ${successCount},
            health_status = 'healthy', last_sync_at = NOW(), source_vendor = COALESCE(data_source_status.source_vendor, 'csv_import')
        `;
      } catch (e) { console.error('[import-csv] data_source_status update failed:', e.message); }
    }
  }

  res.status(200).json({
    importId,
    importType,
    totalRows: rows.length,
    success: successCount,
    errors: errorCount,
    errorDetails: allErrors.slice(0, 20),
    status: errorCount === rows.length ? 'failed' : errorCount > 0 ? 'partial' : 'completed',
  });
}, { roles: ['gm', 'assistant_gm', 'swoop_admin'] });
