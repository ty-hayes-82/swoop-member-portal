/**
 * Migration 003: Relax NOT NULL constraints on pre-existing tables
 * Pre-existing members and club tables have strict NOT NULL on columns
 * that may not be available during initial import.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];
  const run = async (label, query) => {
    try { await query; results.push({ step: label, status: 'ok' }); }
    catch (e) { results.push({ step: label, status: 'error', message: e.message }); }
  };

  // Relax members table constraints
  await run('members_member_number', sql.query('ALTER TABLE members ALTER COLUMN member_number DROP NOT NULL'));
  await run('members_name', sql.query('ALTER TABLE members ALTER COLUMN name DROP NOT NULL'));
  await run('members_membership_type_id', sql.query('ALTER TABLE members ALTER COLUMN membership_type_id DROP NOT NULL'));

  // Relax club table constraints
  await run('club_city', sql.query('ALTER TABLE club ALTER COLUMN city DROP NOT NULL'));
  await run('club_state', sql.query('ALTER TABLE club ALTER COLUMN state DROP NOT NULL'));
  await run('club_zip', sql.query('ALTER TABLE club ALTER COLUMN zip DROP NOT NULL'));
  await run('club_name', sql.query('ALTER TABLE club ALTER COLUMN name DROP NOT NULL'));

  // Add default for member_number if it exists
  await run('members_member_number_default', sql.query("ALTER TABLE members ALTER COLUMN member_number SET DEFAULT ''"));

  const errors = results.filter(r => r.status === 'error');
  res.status(errors.length > 0 ? 207 : 200).json({
    migration: '003-relax-constraints',
    total: results.length,
    success: results.filter(r => r.status === 'ok').length,
    errors: errors.length,
    details: results,
  });
}
