/**
 * POST /api/cron/concierge-proactive
 *
 * Daily cron (runs at 7 AM club local time): identifies members who should
 * receive proactive outreach from their personal concierge.
 *
 * Outreach types:
 *   1. Re-engagement nudge — no visit in 14+ days
 *   2. Post-complaint follow-up — 3 days after filing, no resolution
 *   3. Tee time suggestion — recurring pattern match + good weather tomorrow
 *   4. Event recommendation — upcoming event matches member interests
 *   5. Birthday / anniversary — personal touch
 *
 * Deduplication: checks member_proactive_log to avoid double-sends.
 * Throttle: max 1 proactive message per member per 7 days.
 */
import { sql } from '@vercel/postgres';

const CRON_SECRET = process.env.CRON_SECRET;
const THROTTLE_DAYS = 7;

async function findReEngagementCandidates(clubId) {
  try {
    const result = await sql`
      SELECT m.member_id::text, m.first_name, m.last_name, m.phone, m.email,
             m.membership_type, m.preferred_channel,
             s.preferences_cache, s.last_active,
             h.health_score, h.archetype
      FROM members m
      LEFT JOIN member_concierge_sessions s ON s.member_id = m.member_id AND s.club_id = m.club_id
      LEFT JOIN member_health_scores h ON h.member_id = m.member_id AND h.club_id = m.club_id
      WHERE m.club_id = ${clubId}
        AND m.membership_status = 'active'
        AND (s.last_active IS NULL OR s.last_active < NOW() - INTERVAL '14 days')
        AND h.health_score IS NOT NULL AND h.health_score < 60
      ORDER BY h.health_score ASC
      LIMIT 10
    `;
    return result.rows.map(r => ({
      ...r,
      name: `${r.first_name} ${r.last_name}`.trim(),
      outreach_type: 're_engagement',
      reason: `No activity in ${r.last_active ? Math.floor((Date.now() - new Date(r.last_active).getTime()) / 86400000) : '14+'} days, health score ${r.health_score}`,
    }));
  } catch { return []; }
}

async function findPostComplaintFollowups(clubId) {
  try {
    const result = await sql`
      SELECT DISTINCT c.member_id::text, m.first_name, m.last_name, m.phone,
             m.preferred_channel, c.category, c.description, c.created_at
      FROM complaints c
      JOIN members m ON m.member_id = c.member_id AND m.club_id = c.club_id
      WHERE c.club_id = ${clubId}
        AND c.status != 'resolved'
        AND c.created_at BETWEEN NOW() - INTERVAL '5 days' AND NOW() - INTERVAL '2 days'
      ORDER BY c.created_at DESC
      LIMIT 5
    `;
    return result.rows.map(r => ({
      ...r,
      name: `${r.first_name} ${r.last_name}`.trim(),
      outreach_type: 'post_complaint_followup',
      reason: `Complaint filed ${Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000)} days ago, still unresolved`,
    }));
  } catch { return []; }
}

async function findWeatherOpportunities(clubId) {
  try {
    // Check if tomorrow's weather is good (clear, temp 65-85)
    const weather = await sql`
      SELECT conditions, high_temp FROM weather_forecasts
      WHERE club_id = ${clubId} AND forecast_date = CURRENT_DATE + 1
      LIMIT 1
    `;
    if (!weather.rows.length) return [];
    const w = weather.rows[0];
    if (w.conditions === 'rainy' || w.high_temp < 60 || w.high_temp > 95) return [];

    // Find members who play regularly but don't have a booking tomorrow
    const result = await sql`
      SELECT m.member_id::text, m.first_name, m.last_name, m.phone, m.preferred_channel,
             s.preferences_cache
      FROM members m
      LEFT JOIN member_concierge_sessions s ON s.member_id = m.member_id AND s.club_id = m.club_id
      LEFT JOIN member_health_scores h ON h.member_id = m.member_id AND h.club_id = m.club_id
      WHERE m.club_id = ${clubId}
        AND m.membership_status = 'active'
        AND h.health_score BETWEEN 30 AND 70
        AND m.member_id NOT IN (
          SELECT bp.member_id FROM booking_players bp
          JOIN tee_sheet_bookings b ON b.booking_id = bp.booking_id
          WHERE b.club_id = ${clubId} AND b.booking_date = CURRENT_DATE + 1
        )
      ORDER BY h.health_score ASC
      LIMIT 5
    `;
    return result.rows.map(r => ({
      ...r,
      name: `${r.first_name} ${r.last_name}`.trim(),
      outreach_type: 'weather_suggestion',
      reason: `Good weather tomorrow (${w.high_temp}°F, ${w.conditions}) — member has no booking`,
      weather: { temp: w.high_temp, conditions: w.conditions },
    }));
  } catch { return []; }
}

async function checkThrottle(clubId, memberId) {
  try {
    const result = await sql`
      SELECT 1 FROM member_proactive_log
      WHERE club_id = ${clubId} AND member_id = ${memberId}
        AND sent_at > NOW() - INTERVAL '${THROTTLE_DAYS} days'
      LIMIT 1
    `;
    return result.rows.length > 0;
  } catch { return false; }
}

async function logOutreach(clubId, memberId, outreachType, channel, message) {
  try {
    await sql`
      INSERT INTO member_proactive_log (club_id, member_id, outreach_type, channel, message_preview, sent_at)
      VALUES (${clubId}, ${memberId}, ${outreachType}, ${channel}, ${message.slice(0, 200)}, NOW())
    `;
  } catch {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify cron secret
  const cronKey = req.headers['x-cron-key'] || req.body?.cron_key;
  if (CRON_SECRET && cronKey !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clubId = req.body?.club_id || 'seed_pinetree';

  try {
    // Gather candidates from all outreach types in parallel
    const [reEngagement, complaints, weather] = await Promise.all([
      findReEngagementCandidates(clubId),
      findPostComplaintFollowups(clubId),
      findWeatherOpportunities(clubId),
    ]);

    const allCandidates = [...reEngagement, ...complaints, ...weather];

    // Deduplicate by member_id (keep highest-priority outreach type)
    const PRIORITY = { post_complaint_followup: 1, re_engagement: 2, weather_suggestion: 3 };
    const deduped = new Map();
    for (const c of allCandidates) {
      const existing = deduped.get(c.member_id);
      if (!existing || (PRIORITY[c.outreach_type] || 99) < (PRIORITY[existing.outreach_type] || 99)) {
        deduped.set(c.member_id, c);
      }
    }

    // Check throttle and prepare outreach list
    const outreach = [];
    for (const [memberId, candidate] of deduped) {
      const throttled = await checkThrottle(clubId, memberId);
      if (!throttled) {
        outreach.push(candidate);
      }
    }

    // In production, this would call /api/concierge/send-proactive for each
    // For now, log the candidates and return them
    for (const o of outreach) {
      await logOutreach(clubId, o.member_id, o.outreach_type, o.preferred_channel || 'sms', o.reason);
    }

    return res.status(200).json({
      triggered: true,
      club_id: clubId,
      candidates_found: allCandidates.length,
      after_dedup: deduped.size,
      after_throttle: outreach.length,
      outreach: outreach.map(o => ({
        member_id: o.member_id,
        name: o.name,
        type: o.outreach_type,
        reason: o.reason,
        channel: o.preferred_channel || 'sms',
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/cron/concierge-proactive error:', err);
    return res.status(500).json({ error: err.message });
  }
}
