/**
 * Migration 019: SMS Analytics View
 *
 * Creates the sms_daily_summary view for per-club daily SMS metrics.
 * Used by Phase 7 monitoring dashboards and board reports.
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

  await run('sms_daily_summary view', () =>
    sql.query(`
      CREATE OR REPLACE VIEW sms_daily_summary AS
      SELECT
        club_id,
        DATE(sent_at) AS send_date,
        COUNT(*) FILTER (WHERE direction = 'outbound')                          AS member_messages_sent,
        COUNT(*) FILTER (WHERE direction = 'outbound_staff')                    AS staff_messages_sent,
        COUNT(*) FILTER (WHERE direction = 'inbound')                           AS replies_received,
        COUNT(*) FILTER (WHERE direction = 'inbound' AND reply_keyword IS NOT NULL) AS action_replies,
        COUNT(*) FILTER (WHERE direction != 'inbound' AND status = 'delivered')  AS delivered,
        COUNT(*) FILTER (WHERE direction != 'inbound' AND status = 'failed')    AS failed,
        COUNT(*) FILTER (WHERE reply_keyword = 'STOP')                          AS opt_outs,
        COUNT(*) FILTER (WHERE reply_keyword IN ('YES', 'START'))               AS opt_ins
      FROM sms_log
      GROUP BY club_id, DATE(sent_at)
    `)
  );

  return res.status(errors.length > 0 ? 207 : 200).json({
    migration: '019-sms-analytics',
    results,
    errors,
  });
}
