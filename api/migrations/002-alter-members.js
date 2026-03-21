/**
 * Migration 002: Add missing columns to pre-existing members table
 * The members table existed before migration 001 without club_id and other columns.
 * This migration adds them.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];
  const run = async (label, query) => {
    try { await query; results.push({ step: label, status: 'ok' }); }
    catch (e) { results.push({ step: label, status: e.message.includes('already exists') ? 'already_exists' : 'error', message: e.message }); }
  };

  // Add columns that may be missing from the pre-existing members table
  const columns = [
    { name: 'club_id', type: 'TEXT' },
    { name: 'external_id', type: 'TEXT' },
    { name: 'first_name', type: 'TEXT' },
    { name: 'last_name', type: 'TEXT' },
    { name: 'email', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'membership_type', type: 'TEXT' },
    { name: 'annual_dues', type: 'NUMERIC(10,2)' },
    { name: 'join_date', type: 'DATE' },
    { name: 'status', type: 'TEXT DEFAULT \'active\'' },
    { name: 'household_id', type: 'TEXT' },
    { name: 'preferred_channel', type: 'TEXT DEFAULT \'email\'' },
    { name: 'archetype', type: 'TEXT' },
    { name: 'health_score', type: 'REAL' },
    { name: 'health_tier', type: 'TEXT' },
    { name: 'last_health_update', type: 'TIMESTAMPTZ' },
    { name: 'data_source', type: 'TEXT DEFAULT \'manual\'' },
    { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
    { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT NOW()' },
  ];

  for (const col of columns) {
    await run(`add_${col.name}`, sql.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`));
  }

  // Now create the indexes that failed in migration 001
  await run('idx_members_club', sql.query('CREATE INDEX IF NOT EXISTS idx_members_club ON members(club_id)'));
  await run('idx_members_health', sql.query('CREATE INDEX IF NOT EXISTS idx_members_health ON members(club_id, health_score)'));

  // Also add password columns to users table for auth
  await run('users_password_hash', sql.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT'));
  await run('users_password_salt', sql.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT'));

  const errors = results.filter(r => r.status === 'error');
  res.status(errors.length > 0 ? 207 : 200).json({
    migration: '002-alter-members',
    total: results.length,
    success: results.filter(r => r.status === 'ok').length,
    alreadyExists: results.filter(r => r.status === 'already_exists').length,
    errors: errors.length,
    details: results,
  });
}
