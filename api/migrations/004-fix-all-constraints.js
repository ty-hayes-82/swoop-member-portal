/**
 * Migration 004: Fix ALL remaining NOT NULL constraints on pre-existing members table
 * Queries actual column info and drops NOT NULL on every nullable-in-practice column.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];
  const run = async (label, query) => {
    try { await query; results.push({ step: label, status: 'ok' }); }
    catch (e) { results.push({ step: label, status: 'error', message: e.message }); }
  };

  // Get all columns that are NOT NULL on the members table
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'members' AND is_nullable = 'NO' AND column_name != 'member_id'
  `;

  // Drop NOT NULL on all of them except member_id (the PK)
  for (const col of cols.rows) {
    await run(`drop_not_null_${col.column_name}`,
      sql.query(`ALTER TABLE members ALTER COLUMN ${col.column_name} DROP NOT NULL`)
    );
  }

  // Also set defaults for integer columns that might block inserts
  await run('member_number_default', sql.query("ALTER TABLE members ALTER COLUMN member_number SET DEFAULT 0"));

  const errors = results.filter(r => r.status === 'error');
  res.status(errors.length > 0 ? 207 : 200).json({
    migration: '004-fix-all-constraints',
    total: results.length,
    success: results.filter(r => r.status === 'ok').length,
    errors: errors.length,
    details: results,
  });
}
