/**
 * Club SMS Config API
 * GET  /api/sms/config?clubId=X  — read config + coverage stats
 * PUT  /api/sms/config            — upsert config (admin only)
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { cors } from '../lib/cors.js';

const DEFAULTS = {
  enabled: false,
  twilio_phone_number: null,
  messaging_service_sid: null,
  sender_name: 'Your Club',
  quiet_hours_start: '21:00',
  quiet_hours_end: '07:00',
  max_daily_per_member: 3,
  consent_required: true,
  default_opt_in: false,
  welcome_message: null,
  opt_out_message: 'You have been unsubscribed. Reply START to re-subscribe.',
};

async function handler(req, res) {
  if (cors(req, res)) return;

  const clubId = req.method === 'GET'
    ? (req.query.clubId || req.session?.clubId)
    : (req.body?.clubId || req.session?.clubId);

  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  if (req.method === 'GET') {
    const configRes = await sql`SELECT * FROM club_sms_config WHERE club_id = ${clubId}`;
    const config = configRes.rows[0] || { ...DEFAULTS, club_id: clubId };

    // Phone coverage stats
    const coverageRes = await sql`
      SELECT
        COUNT(*) AS total_members,
        COUNT(phone) AS has_phone
      FROM members
      WHERE club_id = ${clubId} AND membership_status = 'active'
    `;
    const { total_members, has_phone } = coverageRes.rows[0];

    // Opted-in count
    const optInRes = await sql`
      SELECT COUNT(*) AS opted_in FROM member_comm_preferences
      WHERE club_id = ${clubId} AND sms_opted_in = TRUE
    `;
    const opted_in = parseInt(optInRes.rows[0]?.opted_in || '0', 10);

    // Last 30d stats
    const statsRes = await sql`
      SELECT
        COUNT(*) FILTER (WHERE direction = 'outbound') AS sent_30d,
        COUNT(*) FILTER (WHERE direction = 'outbound' AND status = 'delivered') AS delivered_30d,
        COUNT(*) FILTER (WHERE direction = 'inbound' AND reply_keyword IS NOT NULL) AS action_replies
      FROM sms_log
      WHERE club_id = ${clubId} AND sent_at >= NOW() - INTERVAL '30 days'
    `;
    const { sent_30d, delivered_30d, action_replies } = statsRes.rows[0];
    const sent30dInt = parseInt(sent_30d, 10);
    const delivery_rate = sent30dInt > 0
      ? Math.round((parseInt(delivered_30d, 10) / sent30dInt) * 1000) / 10
      : null;
    const reply_rate = sent30dInt > 0
      ? Math.round((parseInt(action_replies, 10) / sent30dInt) * 1000) / 10
      : null;

    return res.json({
      config,
      stats: {
        total_members: parseInt(total_members, 10),
        has_phone: parseInt(has_phone, 10),
        phone_coverage_pct: total_members > 0
          ? Math.round((parseInt(has_phone, 10) / parseInt(total_members, 10)) * 100)
          : 0,
        opted_in,
        sent_30d: sent30dInt,
        delivered_30d: parseInt(delivered_30d, 10),
        delivery_rate,
        reply_rate,
      },
    });
  }

  if (req.method === 'PUT') {
    const {
      enabled, sender_name, quiet_hours_start, quiet_hours_end,
      max_daily_per_member, consent_required, default_opt_in,
      welcome_message, opt_out_message,
      twilio_phone_number, messaging_service_sid,
    } = req.body || {};

    await sql`
      INSERT INTO club_sms_config (
        club_id, enabled, sender_name, quiet_hours_start, quiet_hours_end,
        max_daily_per_member, consent_required, default_opt_in,
        welcome_message, opt_out_message, twilio_phone_number, messaging_service_sid,
        updated_at
      ) VALUES (
        ${clubId},
        ${enabled ?? false},
        ${sender_name || 'Your Club'},
        ${quiet_hours_start || '21:00'},
        ${quiet_hours_end || '07:00'},
        ${max_daily_per_member ?? 3},
        ${consent_required ?? true},
        ${default_opt_in ?? false},
        ${welcome_message || null},
        ${opt_out_message || 'You have been unsubscribed. Reply START to re-subscribe.'},
        ${twilio_phone_number || null},
        ${messaging_service_sid || null},
        NOW()
      )
      ON CONFLICT (club_id) DO UPDATE SET
        enabled              = EXCLUDED.enabled,
        sender_name          = EXCLUDED.sender_name,
        quiet_hours_start    = EXCLUDED.quiet_hours_start,
        quiet_hours_end      = EXCLUDED.quiet_hours_end,
        max_daily_per_member = EXCLUDED.max_daily_per_member,
        consent_required     = EXCLUDED.consent_required,
        default_opt_in       = EXCLUDED.default_opt_in,
        welcome_message      = EXCLUDED.welcome_message,
        opt_out_message      = EXCLUDED.opt_out_message,
        twilio_phone_number  = EXCLUDED.twilio_phone_number,
        messaging_service_sid = EXCLUDED.messaging_service_sid,
        updated_at           = NOW()
    `;

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'GET or PUT only' });
}

export default withAuth(handler);
