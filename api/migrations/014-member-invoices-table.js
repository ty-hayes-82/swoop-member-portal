/**
 * Migration 014: Create member_invoices table
 *
 * The member_invoices table was previously defined only in seed/schema.sql,
 * which meant fresh deployments running `npm run db:migrate` never actually
 * created it. Migrations 008 (data_source column), 009 (club_id ensure),
 * and 012 (rebrand) all assume the table exists and would silently
 * no-op or log "table not found".
 *
 * This migration closes that gap by creating member_invoices with the
 * canonical schema from seed/schema.sql, INCLUDING club_id TEXT NOT NULL
 * and data_source TEXT from day 1, so 008 / 009 ALTERs become idempotent
 * no-ops on subsequent runs.
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
      results.push({ object: label, status: 'ok' });
    } catch (e) {
      results.push({ object: label, status: 'error', message: e.message });
    }
  };

  await run('member_invoices', sql`
    CREATE TABLE IF NOT EXISTS member_invoices (
      invoice_id          TEXT PRIMARY KEY,
      club_id             TEXT NOT NULL,
      member_id           TEXT NOT NULL,
      invoice_date        TEXT NOT NULL,
      due_date            TEXT NOT NULL,
      amount              REAL NOT NULL,
      type                TEXT NOT NULL DEFAULT 'dues',
      description         TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'paid',
      paid_date           TEXT,
      paid_amount         REAL DEFAULT 0,
      days_past_due       INTEGER NOT NULL DEFAULT 0,
      late_fee            REAL DEFAULT 0,
      collection_status   TEXT DEFAULT 'none',
      data_source         TEXT
    )
  `);

  // Canonical indexes from seed/schema.sql
  await run('idx_invoices_member', sql`
    CREATE INDEX IF NOT EXISTS idx_invoices_member ON member_invoices(member_id)
  `);
  await run('idx_invoices_status', sql`
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON member_invoices(status)
  `);

  // Tenant-isolation indexes to match the club_id-everywhere pattern
  await run('idx_member_invoices_club_member', sql`
    CREATE INDEX IF NOT EXISTS idx_member_invoices_club_member
      ON member_invoices(club_id, member_id)
  `);
  await run('idx_member_invoices_club_status', sql`
    CREATE INDEX IF NOT EXISTS idx_member_invoices_club_status
      ON member_invoices(club_id, status)
  `);

  const created = results.filter((r) => r.status === 'ok').length;
  const errors = results.filter((r) => r.status === 'error');

  res.status(200).json({
    migration: '014-member-invoices-table',
    tablesCreated: created,
    results,
    errors,
    summary: `${created} objects ensured, ${errors.length} errors`,
  });
}
