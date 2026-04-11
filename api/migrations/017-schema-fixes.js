/**
 * Migration 017: Fix schema issues found during seed QA
 *
 * 1. close_outs: change UNIQUE(date) to UNIQUE(club_id, date)
 * 2. Date columns: ALTER TEXT → DATE/TIMESTAMPTZ for INTERVAL arithmetic
 * 3. club table: add missing columns (latitude, longitude)
 *
 * Fully idempotent — safe to re-run.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const run = async (label, query) => {
    try {
      await query;
      results.push({ step: label, status: 'ok' });
    } catch (e) {
      results.push({ step: label, status: 'error', message: e.message });
    }
  };

  // 1. Fix close_outs unique constraint: UNIQUE(date) → UNIQUE(club_id, date)
  // First drop any existing unique constraint on date alone
  const closeOutConstraints = await sql`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'close_outs' AND constraint_type = 'UNIQUE'
  `;
  for (const c of closeOutConstraints.rows) {
    await run(`drop_close_outs_${c.constraint_name}`,
      sql.query(`ALTER TABLE close_outs DROP CONSTRAINT IF EXISTS ${c.constraint_name}`)
    );
  }
  // Also drop the unique index if it was created as an index rather than constraint
  await run('drop_close_outs_date_idx',
    sql`DROP INDEX IF EXISTS close_outs_date_key`
  );
  // Create the correct composite unique constraint
  await run('add_close_outs_club_date_unique',
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_close_outs_club_date ON close_outs(club_id, date)`
  );

  // 2. Convert TEXT date columns to proper types for INTERVAL arithmetic
  // Using ALTER COLUMN ... TYPE ... USING to cast existing data
  const dateConversions = [
    { table: 'bookings', column: 'booking_date', type: 'DATE', using: "booking_date::DATE" },
    { table: 'event_definitions', column: 'event_date', type: 'DATE', using: "event_date::DATE" },
    { table: 'members', column: 'join_date', type: 'DATE', using: "join_date::DATE" },
    { table: 'members', column: 'birthday', type: 'DATE', using: "birthday::DATE" },
    { table: 'members', column: 'date_resigned', type: 'DATE', using: "date_resigned::DATE" },
    { table: 'email_campaigns', column: 'send_date', type: 'DATE', using: "send_date::DATE" },
    { table: 'pos_checks', column: 'opened_at', type: 'TIMESTAMPTZ', using: "opened_at::TIMESTAMPTZ" },
    { table: 'pos_checks', column: 'closed_at', type: 'TIMESTAMPTZ', using: "closed_at::TIMESTAMPTZ" },
    { table: 'feedback', column: 'submitted_at', type: 'TIMESTAMPTZ', using: "submitted_at::TIMESTAMPTZ" },
    { table: 'feedback', column: 'resolved_at', type: 'TIMESTAMPTZ', using: "resolved_at::TIMESTAMPTZ" },
    { table: 'service_requests', column: 'requested_at', type: 'TIMESTAMPTZ', using: "requested_at::TIMESTAMPTZ" },
    { table: 'service_requests', column: 'resolved_at', type: 'TIMESTAMPTZ', using: "resolved_at::TIMESTAMPTZ" },
  ];

  for (const { table, column, type, using } of dateConversions) {
    await run(`${table}.${column}_to_${type}`,
      sql.query(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${type} USING ${using}`)
    );
  }

  // 3. Add missing club table columns
  await run('club_add_latitude',
    sql`ALTER TABLE club ADD COLUMN IF NOT EXISTS latitude REAL`
  );
  await run('club_add_longitude',
    sql`ALTER TABLE club ADD COLUMN IF NOT EXISTS longitude REAL`
  );
  await run('club_add_brand_voice',
    sql`ALTER TABLE club ADD COLUMN IF NOT EXISTS brand_voice TEXT DEFAULT 'professional'`
  );
  await run('club_add_timezone',
    sql`ALTER TABLE club ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York'`
  );
  await run('club_add_updated_at',
    sql`ALTER TABLE club ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`
  );

  return res.status(200).json({ success: true, results });
}
