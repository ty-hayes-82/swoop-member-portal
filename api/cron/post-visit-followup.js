/**
 * POST /api/cron/post-visit-followup
 *
 * Daily cron (runs at 8 PM club local time):
 * For each member who had a booking today, checks if they are at-risk
 * (health < 50) and sends a proactive follow-up message via concierge.
 *
 * Throttle: skips members who already received a proactive message in
 * the last 7 days.
 *
 * Logs all follow-ups to member_proactive_log with type 'post_visit_followup'.
 */
import { sql } from '@vercel/postgres';

const CRON_SECRET = process.env.CRON_SECRET;
const THROTTLE_DAYS = 7;
const AT_RISK_THRESHOLD = 50;

function buildFollowUpMessage(firstName) {
  return `How was your round today, ${firstName}? Everything good at the club?`;
}

async function getTodayVisitors(clubId) {
  try {
    // Members who had a confirmed booking today (checked in or completed)
    const result = await sql`
      SELECT DISTINCT ON (bp.member_id)
        bp.member_id,
        m.first_name, m.last_name, m.email, m.phone,
        m.membership_type, m.preferred_channel,
        m.health_score, m.health_tier, m.archetype,
        b.booking_id, b.tee_time, b.check_in_time,
        c.course_name
      FROM bookings b
      JOIN booking_players bp ON bp.booking_id = b.booking_id
      JOIN members m ON m.member_id = bp.member_id AND m.club_id = ${clubId}
      JOIN courses c ON c.course_id = b.course_id
      WHERE b.club_id = ${clubId}
        AND b.booking_date = CURRENT_DATE::text
        AND b.status IN ('confirmed', 'completed', 'checked_in')
        AND bp.is_guest = 0
        AND bp.member_id IS NOT NULL
      ORDER BY bp.member_id, b.tee_time DESC
    `;
    return result.rows;
  } catch { return []; }
}

async function getHealthScores(clubId, memberIds) {
  if (!memberIds.length) return new Map();
  try {
    const result = await sql`
      SELECT DISTINCT ON (member_id)
        member_id, score, tier
      FROM health_scores
      WHERE club_id = ${clubId} AND member_id = ANY(${memberIds})
      ORDER BY member_id, computed_at DESC
    `;
    const map = new Map();
    for (const r of result.rows) map.set(r.member_id, r);
    return map;
  } catch { return new Map(); }
}

async function checkThrottle(clubId, memberId) {
  try {
    const result = await sql`
      SELECT 1 FROM member_proactive_log
      WHERE club_id = ${clubId}
        AND member_id = ${memberId}
        AND sent_at > NOW() - INTERVAL '7 days'
      LIMIT 1
    `;
    return result.rows.length > 0;
  } catch { return false; }
}

async function logFollowUp(clubId, memberId, channel, message) {
  try {
    await sql`
      INSERT INTO member_proactive_log (club_id, member_id, outreach_type, channel, message_preview, sent_at)
      VALUES (${clubId}, ${memberId}, 'post_visit_followup', ${channel}, ${message.slice(0, 200)}, NOW())
    `;
  } catch (err) {
    console.error('logFollowUp error:', err.message);
  }
}

async function logToActivityLog(clubId, memberId, memberName, message) {
  try {
    await sql`
      INSERT INTO activity_log (action_type, action_subtype, actor, member_id, member_name, description, meta, status, created_at)
      VALUES (
        'proactive_outreach',
        'post_visit_followup',
        'concierge_bot',
        ${memberId},
        ${memberName},
        ${message},
        ${JSON.stringify({ club_id: clubId, trigger: 'post_visit_cron' })},
        'sent',
        NOW()
      )
    `;
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cronKey = req.headers['x-cron-key'] || req.body?.cron_key;
  if (CRON_SECRET && cronKey !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clubId = req.body?.club_id || 'seed_pinetree';

  try {
    // 1. Get today's visitors
    const visitors = await getTodayVisitors(clubId);
    if (!visitors.length) {
      return res.status(200).json({
        triggered: true,
        club_id: clubId,
        visitors_today: 0,
        at_risk_found: 0,
        followups_sent: 0,
        followups: [],
        generated_at: new Date().toISOString(),
      });
    }

    // 2. Get latest health scores for enrichment
    const memberIds = visitors.map(v => v.member_id);
    const healthMap = await getHealthScores(clubId, memberIds);

    // 3. Filter to at-risk members (health < 50)
    const atRiskVisitors = visitors.filter(v => {
      const healthRecord = healthMap.get(v.member_id);
      const score = healthRecord?.score ?? v.health_score;
      return score != null && score < AT_RISK_THRESHOLD;
    });

    // 4. Check throttle and send follow-ups
    const followups = [];
    const throttled = [];

    for (const visitor of atRiskVisitors) {
      const isThrottled = await checkThrottle(clubId, visitor.member_id);
      if (isThrottled) {
        throttled.push({
          member_id: visitor.member_id,
          name: `${visitor.first_name} ${visitor.last_name}`.trim(),
          reason: 'Already messaged within 7 days',
        });
        continue;
      }

      const message = buildFollowUpMessage(visitor.first_name);
      const channel = visitor.preferred_channel || 'sms';
      const memberName = `${visitor.first_name} ${visitor.last_name}`.trim();

      // Log to proactive log and activity log
      await logFollowUp(clubId, visitor.member_id, channel, message);
      await logToActivityLog(clubId, visitor.member_id, memberName, message);

      const healthRecord = healthMap.get(visitor.member_id);
      followups.push({
        member_id: visitor.member_id,
        name: memberName,
        health_score: healthRecord?.score ?? visitor.health_score,
        tee_time: visitor.tee_time,
        course_name: visitor.course_name,
        channel,
        message,
      });
    }

    return res.status(200).json({
      triggered: true,
      club_id: clubId,
      visit_date: new Date().toISOString().split('T')[0],
      visitors_today: visitors.length,
      at_risk_found: atRiskVisitors.length,
      throttled_count: throttled.length,
      followups_sent: followups.length,
      followups,
      throttled,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/cron/post-visit-followup error:', err);
    return res.status(500).json({ error: err.message });
  }
}
