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

  // Data source status — partial-data resilience
  await run('data_source_status', sql`
    CREATE TABLE IF NOT EXISTS data_source_status (
      status_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      domain_code TEXT NOT NULL,
      is_connected BOOLEAN NOT NULL DEFAULT FALSE,
      source_vendor TEXT,
      last_sync_at TIMESTAMPTZ,
      row_count INTEGER DEFAULT 0,
      staleness_hours INTEGER,
      health_status TEXT DEFAULT 'unknown',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(club_id, domain_code)
    )
  `);

  // Feature dependency map
  await run('feature_dependency', sql`
    CREATE TABLE IF NOT EXISTS feature_dependency (
      dependency_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      feature_type TEXT NOT NULL,
      feature_key TEXT NOT NULL,
      domain_code TEXT NOT NULL,
      dependency_type TEXT NOT NULL,
      fallback_mode TEXT,
      user_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Feature state log — audit trail
  await run('feature_state_log', sql`
    CREATE TABLE IF NOT EXISTS feature_state_log (
      log_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      feature_type TEXT NOT NULL,
      feature_key TEXT NOT NULL,
      previous_state TEXT,
      new_state TEXT NOT NULL,
      reason TEXT,
      changed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Churn predictions (from Sprint 11 API)
  await run('churn_predictions', sql`
    CREATE TABLE IF NOT EXISTS churn_predictions (
      prediction_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      prob_30d REAL,
      prob_60d REAL,
      prob_90d REAL,
      confidence REAL,
      risk_factors JSONB DEFAULT '[]',
      model_version TEXT DEFAULT 'rules_v1',
      computed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(club_id, member_id)
    )
  `);

  // Correlations (from Sprint 8 API)
  await run('correlations', sql`
    CREATE TABLE IF NOT EXISTS correlations (
      correlation_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      correlation_key TEXT NOT NULL,
      headline TEXT NOT NULL,
      detail TEXT,
      domains TEXT[],
      impact TEXT DEFAULT 'medium',
      metric_value TEXT,
      metric_label TEXT,
      trend REAL[],
      delta TEXT,
      delta_direction TEXT,
      computed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(club_id, correlation_key)
    )
  `);

  // Playbook runs + steps (from Sprint 10 API)
  await run('playbook_runs', sql`
    CREATE TABLE IF NOT EXISTS playbook_runs (
      run_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      playbook_id TEXT NOT NULL,
      playbook_name TEXT NOT NULL,
      member_id TEXT NOT NULL,
      triggered_by TEXT,
      trigger_reason TEXT,
      status TEXT DEFAULT 'active',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      health_score_at_start REAL,
      health_score_at_end REAL,
      outcome TEXT
    )
  `);

  await run('playbook_steps', sql`
    CREATE TABLE IF NOT EXISTS playbook_steps (
      step_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      run_id TEXT NOT NULL,
      club_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT,
      due_date TIMESTAMPTZ,
      status TEXT DEFAULT 'pending',
      completed_at TIMESTAMPTZ,
      completed_by TEXT,
      notes TEXT
    )
  `);

  // Notifications (from Sprint 7 API)
  await run('notifications', sql`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      user_id TEXT,
      channel TEXT NOT NULL DEFAULT 'in_app',
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      priority TEXT DEFAULT 'normal',
      related_member_id TEXT,
      related_action_id TEXT,
      read_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await run('notification_preferences', sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      morning_digest BOOLEAN DEFAULT TRUE,
      digest_time TEXT DEFAULT '07:00',
      digest_channel TEXT DEFAULT 'email',
      high_priority_alerts BOOLEAN DEFAULT TRUE,
      alert_channel TEXT DEFAULT 'email',
      escalation_alerts BOOLEAN DEFAULT TRUE,
      slack_webhook TEXT
    )
  `);

  // Sessions (auth)
  await run('sessions', sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      club_id TEXT NOT NULL,
      role TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Agent activity + config (from Sprint 12 API)
  await run('agent_activity', sql`
    CREATE TABLE IF NOT EXISTS agent_activity (
      activity_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT,
      member_id TEXT,
      confidence REAL,
      auto_executed BOOLEAN DEFAULT FALSE,
      reasoning TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await run('agent_configs', sql`
    CREATE TABLE IF NOT EXISTS agent_configs (
      club_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      auto_approve_threshold REAL DEFAULT 0.80,
      auto_approve_enabled BOOLEAN DEFAULT FALSE,
      last_run TIMESTAMPTZ,
      total_proposals INTEGER DEFAULT 0,
      total_auto_executed INTEGER DEFAULT 0,
      accuracy_score REAL DEFAULT 0.75,
      PRIMARY KEY (club_id, agent_id)
    )
  `);

  // Onboarding progress (from Sprint 9 API)
  await run('onboarding_progress', sql`
    CREATE TABLE IF NOT EXISTS onboarding_progress (
      club_id TEXT NOT NULL,
      step_key TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      notes TEXT,
      PRIMARY KEY (club_id, step_key)
    )
  `);

  // Sentiment ratings (from architecture spike)
  await run('member_sentiment_ratings', sql`
    CREATE TABLE IF NOT EXISTS member_sentiment_ratings (
      rating_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      club_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      rating_type TEXT NOT NULL,
      score REAL NOT NULL,
      comment TEXT,
      context_id TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      source TEXT NOT NULL DEFAULT 'manual',
      archived BOOLEAN DEFAULT FALSE
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
  await run('idx_data_source_status_club', sql`CREATE INDEX IF NOT EXISTS idx_data_source_status_club ON data_source_status(club_id)`);
  await run('idx_feature_dependency_key', sql`CREATE INDEX IF NOT EXISTS idx_feature_dependency_key ON feature_dependency(feature_type, feature_key)`);
  await run('idx_notifications_user', sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(club_id, user_id, read_at)`);
  await run('idx_playbook_runs_club', sql`CREATE INDEX IF NOT EXISTS idx_playbook_runs_club ON playbook_runs(club_id, status)`);
  await run('idx_playbook_steps_run', sql`CREATE INDEX IF NOT EXISTS idx_playbook_steps_run ON playbook_steps(run_id, step_number)`);
  await run('idx_agent_activity_club', sql`CREATE INDEX IF NOT EXISTS idx_agent_activity_club ON agent_activity(club_id, created_at DESC)`);
  await run('idx_churn_predictions_club', sql`CREATE INDEX IF NOT EXISTS idx_churn_predictions_club ON churn_predictions(club_id, member_id)`);
  await run('idx_sentiment_member', sql`CREATE INDEX IF NOT EXISTS idx_sentiment_member ON member_sentiment_ratings(member_id, submitted_at DESC)`);
  await run('idx_correlations_club', sql`CREATE INDEX IF NOT EXISTS idx_correlations_club ON correlations(club_id, correlation_key)`);
  await run('idx_feature_state_log_club', sql`CREATE INDEX IF NOT EXISTS idx_feature_state_log_club ON feature_state_log(club_id, changed_at DESC)`);

  const errors = results.filter(r => r.status === 'error');
  res.status(errors.length > 0 ? 207 : 200).json({
    migration: '001-core-tables',
    total: results.length,
    success: results.filter(r => r.status === 'ok').length,
    errors: errors.length,
    details: results,
  });
}
