/**
 * GET /api/imported-data-catalog
 *
 * Returns a per-table summary of every CSV-imported dataset for the
 * current club. Powers the "Imported Data" panel on Integrations page —
 * the baseline GM-visible surface for every import stage.
 *
 * Response shape:
 *   {
 *     tables: [
 *       { key, label, table, rowCount, lastImported, sample: [{...}] },
 *       ...
 *     ],
 *     totalRows: number,
 *   }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

// Per-table query plan. Tables without club_id are joined through their
// canonical parent (booking_players → bookings, pos_line_items → pos_checks).
const CATALOG = [
  { key: 'members',             label: 'Members',             table: 'members',             columns: ['first_name', 'last_name', 'membership_type', 'annual_dues'] },
  { key: 'bookings',             label: 'Tee Sheet (Bookings)', table: 'bookings',             columns: ['booking_id', 'booking_date', 'tee_time', 'player_count'] },
  { key: 'booking_players',      label: 'Booking Players',     table: 'booking_players',     columns: ['booking_players.player_id', 'booking_players.booking_id', 'booking_players.member_id'], joinClause: 'JOIN bookings b ON b.booking_id = booking_players.booking_id WHERE b.club_id = $1' },
  { key: 'courses',              label: 'Courses',             table: 'courses',             columns: ['course_id', 'name', 'holes', 'par'] },
  { key: 'transactions',         label: 'F&B Transactions',    table: 'transactions',         columns: ['member_id', 'transaction_date', 'total_amount', 'outlet_name'] },
  { key: 'pos_line_items',       label: 'POS Line Items',      table: 'pos_line_items',       columns: ['pos_line_items.line_item_id', 'pos_line_items.check_id', 'pos_line_items.item_name', 'pos_line_items.unit_price'], joinClause: 'JOIN pos_checks pc ON pc.check_id = pos_line_items.check_id WHERE pc.club_id = $1' },
  { key: 'pos_payments',         label: 'POS Payments',        table: 'pos_payments',         columns: ['pos_payments.payment_id', 'pos_payments.check_id', 'pos_payments.amount', 'pos_payments.payment_method'], joinClause: 'JOIN pos_checks pc ON pc.check_id = pos_payments.check_id WHERE pc.club_id = $1' },
  { key: 'close_outs',           label: 'Daily Close Outs',    table: 'close_outs',           columns: ['closeout_id', 'date', 'total_revenue', 'rounds_played'] },
  { key: 'dining_outlets',       label: 'Dining Outlets',      table: 'dining_outlets',       columns: ['outlet_id', 'name', 'type'] },
  { key: 'staff',                 label: 'Staff Roster',        table: 'staff',                 columns: ['staff_id', 'first_name', 'last_name', 'department'] },
  { key: 'staff_shifts',          label: 'Staff Shifts',        table: 'staff_shifts',          columns: ['shift_id', 'staff_id', 'shift_date', 'outlet_id'] },
  { key: 'event_definitions',    label: 'Events',              table: 'event_definitions',    columns: ['event_id', 'name', 'type', 'event_date'] },
  { key: 'event_registrations',  label: 'Event Registrations', table: 'event_registrations',  columns: ['registration_id', 'event_id', 'member_id', 'status'] },
  { key: 'email_campaigns',      label: 'Email Campaigns',     table: 'email_campaigns',      columns: ['campaign_id', 'subject', 'send_date', 'recipient_count'] },
  { key: 'email_events',          label: 'Email Events',        table: 'email_events',          columns: ['campaign_id', 'member_id', 'event_type', 'occurred_at'] },
  { key: 'member_invoices',       label: 'Member Invoices',     table: 'member_invoices',       columns: ['invoice_id', 'member_id', 'amount', 'status'] },
  { key: 'membership_types',     label: 'Membership Types',    table: 'membership_types',     columns: ['type_code', 'name', 'annual_dues'] },
  { key: 'complaints',           label: 'Complaints',          table: 'complaints',           columns: ['complaint_id', 'member_id', 'category', 'reported_at'] },
  { key: 'service_requests',     label: 'Service Requests',    table: 'service_requests',     columns: ['request_id', 'member_id', 'request_type', 'requested_at'] },
  { key: 'club',                  label: 'Club Profile',        table: 'club',                  columns: ['club_id', 'name'] },
];

async function tableSummary(entry, clubId) {
  const { table, columns, joinClause } = entry;
  // Allow already-qualified `table.column` strings; only quote bare names
  const colList = columns.map(c => (c.includes('.') ? c : `"${c}"`)).join(', ');
  try {
    let countSql, sampleSql;
    if (joinClause) {
      countSql = `SELECT COUNT(*)::int AS n FROM ${table} ${joinClause}`;
      sampleSql = `SELECT ${colList} FROM ${table} ${joinClause} LIMIT 3`;
    } else {
      countSql = `SELECT COUNT(*)::int AS n FROM ${table} WHERE club_id = $1`;
      sampleSql = `SELECT ${colList} FROM ${table} WHERE club_id = $1 LIMIT 3`;
    }
    const [c, s] = await Promise.all([
      sql.query(countSql, [clubId]),
      sql.query(sampleSql, [clubId]),
    ]);
    return { rowCount: c.rows[0]?.n ?? 0, sample: s.rows };
  } catch (e) {
    if (/relation .* does not exist/i.test(e.message)) {
      return { rowCount: 0, sample: [], missing: true };
    }
    return { rowCount: 0, sample: [], error: e.message.slice(0, 120) };
  }
}

async function lastImportedMap(clubId) {
  try {
    const r = await sql`
      SELECT import_type, MAX(completed_at) AS last_at
      FROM csv_imports
      WHERE club_id = ${clubId} AND status IN ('completed', 'partial')
      GROUP BY import_type
    `;
    const map = {};
    for (const row of r.rows) map[row.import_type] = row.last_at;
    return map;
  } catch {
    return {};
  }
}

async function catalogHandler(req, res) {
  const clubId = getReadClubId(req);
  const lastMap = await lastImportedMap(clubId);
  const tables = await Promise.all(
    CATALOG.map(async entry => {
      const summary = await tableSummary(entry, clubId);
      return {
        key: entry.key,
        label: entry.label,
        table: entry.table,
        ...summary,
        lastImported: lastMap[entry.key] || null,
      };
    }),
  );
  const totalRows = tables.reduce((s, t) => s + (t.rowCount || 0), 0);
  return res.status(200).json({ tables, totalRows });
}

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || req.query?.clubId, userId: 'cron', role: 'system' };
    return catalogHandler(req, res);
  }
  return withAuth(catalogHandler)(req, res);
}
