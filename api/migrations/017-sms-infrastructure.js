/**
 * Migration 017: SMS Infrastructure
 *
 * Adds 5 new tables (club_sms_config, member_comm_preferences, sms_templates,
 * sms_log) and 3 columns on users (phone, sms_alerts_enabled, alert_categories).
 * Seeds 12 system-default SMS message templates.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const errors = [];

  async function run(label, fn) {
    try {
      await fn();
      results.push(`${label}: ok`);
    } catch (e) {
      errors.push(`${label}: ${e.message}`);
    }
  }

  // --- users columns ---
  await run('users.phone', () =>
    sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`)
  );
  await run('users.sms_alerts_enabled', () =>
    sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_alerts_enabled BOOLEAN DEFAULT TRUE`)
  );
  await run('users.alert_categories', () =>
    sql.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_categories TEXT[] DEFAULT '{}'`)
  );

  // --- club_sms_config ---
  await run('club_sms_config table', () => sql.query(`
    CREATE TABLE IF NOT EXISTS club_sms_config (
      club_id              TEXT PRIMARY KEY,
      enabled              BOOLEAN DEFAULT FALSE,
      twilio_phone_number  TEXT,
      messaging_service_sid TEXT,
      sender_name          TEXT NOT NULL DEFAULT 'Your Club',
      quiet_hours_start    TEXT DEFAULT '21:00',
      quiet_hours_end      TEXT DEFAULT '07:00',
      max_daily_per_member INTEGER DEFAULT 3,
      consent_required     BOOLEAN DEFAULT TRUE,
      default_opt_in       BOOLEAN DEFAULT FALSE,
      welcome_message      TEXT,
      opt_out_message      TEXT DEFAULT 'You have been unsubscribed. Reply START to re-subscribe.',
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `));

  // --- member_comm_preferences ---
  await run('member_comm_preferences table', () => sql.query(`
    CREATE TABLE IF NOT EXISTS member_comm_preferences (
      member_id            TEXT NOT NULL,
      club_id              TEXT NOT NULL,
      sms_opted_in         BOOLEAN DEFAULT FALSE,
      sms_consent_date     TIMESTAMPTZ,
      sms_consent_method   TEXT,
      email_opted_in       BOOLEAN DEFAULT TRUE,
      preferred_channel    TEXT DEFAULT 'sms',
      opt_out_date         TIMESTAMPTZ,
      categories_enabled   TEXT[] DEFAULT '{tee_time,dining,weather,milestone,general}',
      categories_disabled  TEXT[] DEFAULT '{}',
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (member_id, club_id)
    )
  `));

  // --- sms_templates ---
  await run('sms_templates table', () => sql.query(`
    CREATE TABLE IF NOT EXISTS sms_templates (
      template_id     TEXT PRIMARY KEY,
      club_id         TEXT,
      category        TEXT NOT NULL,
      trigger_type    TEXT NOT NULL,
      body            TEXT NOT NULL,
      reply_keywords  TEXT[],
      max_length      INTEGER DEFAULT 160,
      active          BOOLEAN DEFAULT TRUE,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `));

  // --- sms_log ---
  await run('sms_log table', () => sql.query(`
    CREATE TABLE IF NOT EXISTS sms_log (
      log_id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      club_id        TEXT NOT NULL,
      member_id      TEXT,
      user_id        TEXT,
      template_id    TEXT,
      direction      TEXT NOT NULL,
      body           TEXT NOT NULL,
      twilio_sid     TEXT,
      status         TEXT DEFAULT 'queued',
      error_message  TEXT,
      intent_id      TEXT,
      reply_keyword  TEXT,
      sent_at        TIMESTAMPTZ DEFAULT NOW(),
      delivered_at   TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `));

  await run('idx_sms_log_member', () =>
    sql.query(`CREATE INDEX IF NOT EXISTS idx_sms_log_member ON sms_log(member_id, club_id, sent_at DESC)`)
  );
  await run('idx_sms_log_club_date', () =>
    sql.query(`CREATE INDEX IF NOT EXISTS idx_sms_log_club_date ON sms_log(club_id, sent_at DESC)`)
  );

  // --- seed default templates ---
  const templates = [
    {
      id: 'dining_nudge',
      category: 'dining',
      trigger: 'post_round_dining_bridge',
      body: '{{club_name}}: Great round, {{first_name}}. {{table_info}} is open{{special_text}}. Hold for 20 min? Reply HOLD',
      keywords: '{HOLD}',
    },
    {
      id: 'dining_hold_confirmed',
      category: 'dining',
      trigger: 'member_replied_HOLD',
      body: '{{club_name}}: Done. {{table_info}} held until {{hold_until}}. See you in there, {{first_name}}.',
      keywords: null,
    },
    {
      id: 'tee_time_offer',
      category: 'tee_time',
      trigger: 'demand_optimizer_slot',
      body: '{{club_name}}: {{slot_time}} just opened on {{course}}. {{partner_text}}Reply BOOK to grab it.',
      keywords: '{BOOK}',
    },
    {
      id: 'tee_time_confirmed',
      category: 'tee_time',
      trigger: 'member_replied_BOOK',
      body: '{{club_name}}: Booked. {{slot_time}} {{course}}. See you out there.',
      keywords: null,
    },
    {
      id: 'tee_time_reminder',
      category: 'tee_time',
      trigger: 'tee_time_t_minus_90',
      body: '{{club_name}}: {{first_name}}, your {{slot_time}} is in 90 min. {{course}}, {{equipment}}. {{weather_note}}',
      keywords: null,
    },
    {
      id: 'weather_pivot',
      category: 'weather',
      trigger: 'weather_pivot_concierge',
      body: '{{club_name}}: {{weather_alert}}. We can {{option_1}} or {{option_2}}. Reply EARLY or SIM.',
      keywords: '{EARLY,SIM}',
    },
    {
      id: 'milestone',
      category: 'milestone',
      trigger: 'milestone_concierge',
      body: '{{club_name}}: {{first_name}}, {{milestone_text}}. We left a little something at the pro shop.',
      keywords: null,
    },
    {
      id: 'welcome_opt_in',
      category: 'consent',
      trigger: 'bulk_consent_request',
      body: "{{club_name}}: We're upgrading how we stay in touch. Reply YES for tee time, dining, and club updates via text. Reply STOP anytime. Msg&data rates apply.",
      keywords: '{YES,STOP}',
    },
    {
      id: 'staff_complaint',
      category: 'staff_alert',
      trigger: 'service_recovery_escalation',
      body: 'SWOOP [{{club_name}}]: {{member_name}} (health {{health_score}}, ${{dues}} dues) — complaint {{days}}d unresolved. {{action}}. {{link}}',
      keywords: '{CONFIRM}',
    },
    {
      id: 'staff_cancellation',
      category: 'staff_alert',
      trigger: 'demand_optimizer_cancellation',
      body: 'SWOOP [{{club_name}}]: {{slot_time}} cancelled. Fill candidate: {{candidate_name}}. Reply CONFIRM to approve.',
      keywords: '{CONFIRM}',
    },
    {
      id: 'staff_staffing_gap',
      category: 'staff_alert',
      trigger: 'labor_optimizer_gap',
      body: 'SWOOP [{{club_name}}]: {{outlet}} short {{count}} staff {{shift}}. Reply CONFIRM to reassign floater.',
      keywords: '{CONFIRM}',
    },
    {
      id: 'staff_arrival_brief',
      category: 'staff_alert',
      trigger: 'arrival_anticipation',
      body: 'SWOOP [{{club_name}}]: {{member_name}} arriving {{time}}. {{brief}}. Full brief: {{link}}',
      keywords: null,
    },
  ];

  for (const t of templates) {
    await run(`template:${t.id}`, () => sql.query(
      `INSERT INTO sms_templates (template_id, club_id, category, trigger_type, body, reply_keywords)
       VALUES ($1, NULL, $2, $3, $4, $5)
       ON CONFLICT (template_id) DO NOTHING`,
      [t.id, t.category, t.trigger, t.body, t.keywords]
    ));
  }

  res.status(200).json({
    migration: '017-sms-infrastructure',
    results,
    errors,
    summary: `${results.length} operations ok, ${errors.length} errors`,
  });
}
