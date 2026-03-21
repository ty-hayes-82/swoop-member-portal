/**
 * Migration 001: Core Tables
 * Sprint 1 — Database Foundation
 *
 * Creates the core tables needed for real data flow.
 * Many of these tables are already defined in vercelPostgresSchema.js
 * but may not exist in production Postgres. This migration is idempotent.
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
      results.push({ table: label, status: 'ok' });
    } catch (e) {
      results.push({ table: label, status: 'error', message: e.message });
    }
  };

  // Club (multi-tenant root)
  await run('club', sql`
    CREATE TABLE IF NOT EXISTS club (
      club_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT,
      state TEXT,
      zip TEXT,
      founded_year INTEGER,
      member_count INTEGER,
      course_count INTEGER,
      outlet_count INTEGER,
      logo_url TEXT,
      brand_voice TEXT DEFAULT 'professional',
      timezone TEXT DEFAULT 'America/New_York',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Members (core entity)
  await run('members', sql`
    CREATE TABLE IF NOT EXISTS members (
      member_id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      external_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      membership_type TEXT,
      annual_dues NUMERIC(10,2),
      join_date DATE,
      status TEXT DEFAULT 'active',
      household_id TEXT,
      preferred_channel TEXT DEFAULT 'email',
      archetype TEXT,
      health_score REAL,
      health_tier TEXT,
      last_health_update TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      data_source TEXT DEFAULT 'manual'
    )
  `);

  // Health score history (time series)
  await run('health_scores', sql`
    CREATE TABLE IF NOT EXISTS health_scores (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      member_id TEXT NOT NULL,
      club_id TEXT NOT NULL,
      score REAL NOT NULL,
      tier TEXT NOT NULL,
      golf_score REAL,
      dining_score REAL,
      email_score REAL,
      event_score REAL,
      computed_at TIMESTAMPTZ DEFAULT NOW(),
      archetype TEXT,
      score_delta REAL
    )
  `);

  // Rounds / Tee sheet data
  await run('rounds', sql`
    CREATE TABLE IF NOT EXISTS rounds (
      round_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      booking_id TEXT,
      round_date DATE NOT NULL,
      tee_time TIME,
      course_id TEXT,
      duration_minutes INTEGER,
      pace_rating TEXT,
      players INTEGER DEFAULT 1,
      cancelled BOOLEAN DEFAULT FALSE,
      no_show BOOLEAN DEFAULT FALSE,
      data_source TEXT DEFAULT 'tee_sheet',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // POS Transactions
  await run('transactions', sql`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT,
      outlet_id TEXT,
      outlet_name TEXT,
      transaction_date TIMESTAMPTZ NOT NULL,
      total_amount NUMERIC(10,2),
      item_count INTEGER,
      category TEXT,
      is_post_round BOOLEAN DEFAULT FALSE,
      data_source TEXT DEFAULT 'pos',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Complaints / Service issues
  await run('complaints', sql`
    CREATE TABLE IF NOT EXISTS complaints (
      complaint_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT,
      category TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      reported_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      resolved_by TEXT,
      resolution_notes TEXT,
      sla_hours INTEGER DEFAULT 24,
      data_source TEXT DEFAULT 'manual'
    )
  `);

  // Actions / Interventions
  await run('actions', sql`
    CREATE TABLE IF NOT EXISTS actions (
      action_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT,
      action_type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      assigned_to TEXT,
      source TEXT DEFAULT 'system',
      impact_metric TEXT,
      approved_at TIMESTAMPTZ,
      approved_by TEXT,
      executed_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ,
      dismiss_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Interventions (tracked outcomes)
  await run('interventions', sql`
    CREATE TABLE IF NOT EXISTS interventions (
      intervention_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      action_id TEXT,
      intervention_type TEXT NOT NULL,
      description TEXT,
      initiated_by TEXT,
      initiated_at TIMESTAMPTZ DEFAULT NOW(),
      health_score_before REAL,
      health_score_after REAL,
      outcome TEXT,
      outcome_measured_at TIMESTAMPTZ,
      dues_protected NUMERIC(10,2),
      revenue_recovered NUMERIC(10,2),
      is_member_save BOOLEAN DEFAULT FALSE
    )
  `);

  // Data sync log
  await run('data_syncs', sql`
    CREATE TABLE IF NOT EXISTS data_syncs (
      sync_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT DEFAULT 'running',
      records_processed INTEGER DEFAULT 0,
      records_failed INTEGER DEFAULT 0,
      error_message TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);

  // Users / Auth
  await run('users', sql`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      title TEXT,
      active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // CSV Import tracking
  await run('csv_imports', sql`
    CREATE TABLE IF NOT EXISTS csv_imports (
      import_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      uploaded_by TEXT,
      file_name TEXT,
      import_type TEXT NOT NULL,
      status TEXT DEFAULT 'processing',
      total_rows INTEGER,
      success_rows INTEGER DEFAULT 0,
      error_rows INTEGER DEFAULT 0,
      errors JSONB DEFAULT '[]',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);

  // Create indexes
  await run('idx_members_club', sql`CREATE INDEX IF NOT EXISTS idx_members_club ON members(club_id)`);
  await run('idx_members_health', sql`CREATE INDEX IF NOT EXISTS idx_members_health ON members(club_id, health_score)`);
  await run('idx_health_scores_member', sql`CREATE INDEX IF NOT EXISTS idx_health_scores_member ON health_scores(member_id, computed_at DESC)`);
  await run('idx_rounds_member', sql`CREATE INDEX IF NOT EXISTS idx_rounds_member ON rounds(member_id, round_date DESC)`);
  await run('idx_transactions_member', sql`CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id, transaction_date DESC)`);
  await run('idx_complaints_club', sql`CREATE INDEX IF NOT EXISTS idx_complaints_club ON complaints(club_id, status)`);
  await run('idx_actions_club', sql`CREATE INDEX IF NOT EXISTS idx_actions_club ON actions(club_id, status)`);
  await run('idx_interventions_member', sql`CREATE INDEX IF NOT EXISTS idx_interventions_member ON interventions(member_id)`);
  await run('idx_data_syncs_club', sql`CREATE INDEX IF NOT EXISTS idx_data_syncs_club ON data_syncs(club_id, started_at DESC)`);

  const errors = results.filter(r => r.status === 'error');
  res.status(errors.length > 0 ? 207 : 200).json({
    migration: '001-core-tables',
    total: results.length,
    success: results.filter(r => r.status === 'ok').length,
    errors: errors.length,
    details: results,
  });
}
