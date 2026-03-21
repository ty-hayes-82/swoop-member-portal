/**
 * Migration 005: Drop foreign key constraints on members table
 * Pre-existing FK constraints block CSV imports when reference tables
 * aren't populated. For the import pipeline, we need flexible inserts.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];
  const run = async (label, query) => {
    try { await query; results.push({ step: label, status: 'ok' }); }
    catch (e) { results.push({ step: label, status: e.message.includes('does not exist') ? 'not_found' : 'error', message: e.message }); }
  };

  // Find and drop all FK constraints on members table
  const fks = await sql`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'members' AND constraint_type = 'FOREIGN KEY'
  `;

  for (const fk of fks.rows) {
    await run(`drop_fk_${fk.constraint_name}`,
      sql.query(`ALTER TABLE members DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`)
    );
  }

  // Also drop any FK on bookings, pos_checks etc that reference members
  const otherFks = await sql`
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'members' AND tc.constraint_type = 'FOREIGN KEY'
  `;

  for (const fk of otherFks.rows) {
    await run(`drop_ref_fk_${fk.table_name}_${fk.constraint_name}`,
      sql.query(`ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`)
    );
  }

  res.status(200).json({
    migration: '005-drop-fk-constraints',
    total: results.length,
    membersFK: fks.rows.length,
    referencingFK: otherFks.rows.length,
    details: results,
  });
}
