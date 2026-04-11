/**
 * POST /api/cron/concierge-engagement
 *
 * Daily cron (runs at 7 AM): identifies proactive engagement opportunities
 * across 6 outreach types, deduplicates by member (max 1 per run),
 * checks 7-day throttle, and logs to member_proactive_log.
 *
 * Types:
 *   5. Weather-Matched Suggestions
 *   6. Re-Engagement Before Decay
 *   7. Post-Visit Satisfaction Loop
 *   8. Milestone Celebrations
 *   9. Event Matchmaking
 *  10. Lapsed Interest Recovery
 */
import { sql } from '@vercel/postgres';

const CRON_SECRET = process.env.CRON_SECRET;
const THROTTLE_DAYS = 7;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ---------------------------------------------------------------------------
// 5. Weather-Matched Suggestions
// ---------------------------------------------------------------------------
async function findWeatherSuggestions(clubId) {
  try {
    // Good days in next 3 days: clear/partly_cloudy, 65-85 F, wind < 15
    const forecasts = await sql`
      SELECT forecast_date, conditions, high_temp, wind_mph
      FROM weather_forecasts
      WHERE club_id = ${clubId}
        AND forecast_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
        AND conditions IN ('clear', 'partly_cloudy')
        AND high_temp BETWEEN 65 AND 85
        AND wind_mph < 15
      ORDER BY forecast_date
    `;
    if (!forecasts.rows.length) return [];

    const candidates = [];
    for (const day of forecasts.rows) {
      const dow = new Date(day.forecast_date).getDay();
      const dayName = DAY_NAMES[dow];

      // Members with no booking on that day who usually play that DOW
      const members = await sql`
        SELECT m.member_id, m.first_name, m.last_name, m.preferred_channel
        FROM members m
        WHERE m.club_id = ${clubId}
          AND m.membership_status = 'active'
          AND m.member_id NOT IN (
            SELECT bp.member_id FROM booking_players bp
            JOIN bookings b ON b.booking_id = bp.booking_id
            WHERE b.club_id = ${clubId}
              AND b.booking_date = ${day.forecast_date}::text
              AND bp.member_id IS NOT NULL
          )
          AND m.member_id IN (
            SELECT bp2.member_id FROM booking_players bp2
            JOIN bookings b2 ON b2.booking_id = bp2.booking_id
            WHERE b2.club_id = ${clubId}
              AND EXTRACT(DOW FROM b2.booking_date::date) = ${dow}
              AND bp2.member_id IS NOT NULL
            GROUP BY bp2.member_id
            HAVING COUNT(*) >= 2
          )
        LIMIT 10
      `;

      for (const m of members.rows) {
        candidates.push({
          member_id: m.member_id,
          first_name: m.first_name,
          last_name: m.last_name,
          name: `${m.first_name} ${m.last_name}`.trim(),
          preferred_channel: m.preferred_channel,
          outreach_type: 'weather_suggestion',
          message: `${dayName} looks perfect — ${day.high_temp}°F, light wind. Want me to book your usual?`,
          reason: `Good weather ${dayName} (${day.high_temp}°F, ${day.conditions}, wind ${day.wind_mph}mph) — member usually plays this day`,
        });
      }
    }
    return candidates;
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// 6. Re-Engagement Before Decay
// ---------------------------------------------------------------------------
async function findReEngagementCandidates(clubId) {
  try {
    const result = await sql`
      SELECT m.member_id, m.first_name, m.last_name, m.preferred_channel,
             m.health_score,
             s.last_active
      FROM members m
      LEFT JOIN member_concierge_sessions s ON s.member_id = m.member_id AND s.club_id = m.club_id
      WHERE m.club_id = ${clubId}
        AND m.membership_status = 'active'
        AND (s.last_active IS NULL OR s.last_active < NOW() - INTERVAL '14 days')
        AND m.health_score IS NOT NULL AND m.health_score < 60
      ORDER BY m.health_score ASC
      LIMIT 15
    `;
    return result.rows.map(r => {
      const daysSince = r.last_active
        ? Math.floor((Date.now() - new Date(r.last_active).getTime()) / 86400000)
        : 30;
      return {
        member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        name: `${r.first_name} ${r.last_name}`.trim(),
        preferred_channel: r.preferred_channel,
        outreach_type: 're_engagement_decay',
        message: `The course just got re-sanded bunkers — want me to find you a time?`,
        reason: `Inactive ${daysSince} days, health ${r.health_score} — early intervention before full decay`,
      };
    });
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// 7. Post-Visit Satisfaction Loop
// ---------------------------------------------------------------------------
async function findPostVisitFollowups(clubId) {
  try {
    // Today's completed bookings for at-risk members (health < 50)
    const today = new Date().toISOString().split('T')[0];
    const result = await sql`
      SELECT DISTINCT ON (bp.member_id)
        bp.member_id, m.first_name, m.last_name, m.preferred_channel,
        m.health_score, b.tee_time
      FROM bookings b
      JOIN booking_players bp ON bp.booking_id = b.booking_id
      JOIN members m ON m.member_id = bp.member_id AND m.club_id = ${clubId}
      WHERE b.club_id = ${clubId}
        AND b.booking_date = ${today}
        AND b.status IN ('completed', 'checked_in')
        AND bp.is_guest = 0
        AND bp.member_id IS NOT NULL
        AND m.health_score IS NOT NULL AND m.health_score < 50
      ORDER BY bp.member_id, b.tee_time DESC
    `;
    return result.rows.map(r => ({
      member_id: r.member_id,
      first_name: r.first_name,
      last_name: r.last_name,
      name: `${r.first_name} ${r.last_name}`.trim(),
      preferred_channel: r.preferred_channel,
      outreach_type: 'post_visit_followup',
      message: `How was your round today, ${r.first_name}? Everything good at the club?`,
      reason: `At-risk member (health ${r.health_score}) played today — schedule follow-up for tomorrow 10 AM`,
    }));
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// 8. Milestone Celebrations
// ---------------------------------------------------------------------------
async function findMilestoneCelebrations(clubId) {
  try {
    const candidates = [];

    // Birthday within 3 days
    const birthdays = await sql`
      SELECT member_id, first_name, last_name, preferred_channel, date_of_birth
      FROM members
      WHERE club_id = ${clubId}
        AND membership_status = 'active'
        AND date_of_birth IS NOT NULL
        AND (
          TO_CHAR(CURRENT_DATE, 'MM-DD') <= TO_CHAR((date_of_birth::date + INTERVAL '3 days'), 'MM-DD')
          AND TO_CHAR(CURRENT_DATE, 'MM-DD') >= TO_CHAR(date_of_birth::date, 'MM-DD')
          OR (
            EXTRACT(MONTH FROM CURRENT_DATE) = EXTRACT(MONTH FROM date_of_birth::date)
            AND EXTRACT(DAY FROM CURRENT_DATE) BETWEEN EXTRACT(DAY FROM date_of_birth::date)
              AND EXTRACT(DAY FROM date_of_birth::date) + 3
          )
        )
      LIMIT 10
    `;
    for (const r of birthdays.rows) {
      candidates.push({
        member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        name: `${r.first_name} ${r.last_name}`.trim(),
        preferred_channel: r.preferred_channel,
        outreach_type: 'milestone_birthday',
        message: `Happy birthday, ${r.first_name}! The club has a little something for you — stop by the pro shop.`,
        reason: `Birthday within 3 days (DOB: ${r.date_of_birth})`,
      });
    }

    // Join anniversary within 7 days
    const anniversaries = await sql`
      SELECT member_id, first_name, last_name, preferred_channel, join_date,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, join_date::date)) AS years
      FROM members
      WHERE club_id = ${clubId}
        AND membership_status = 'active'
        AND join_date IS NOT NULL
        AND EXTRACT(MONTH FROM join_date::date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM join_date::date) BETWEEN EXTRACT(DAY FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM CURRENT_DATE) + 7
        AND EXTRACT(YEAR FROM join_date::date) < EXTRACT(YEAR FROM CURRENT_DATE)
      LIMIT 10
    `;
    for (const r of anniversaries.rows) {
      const years = Math.floor(r.years);
      candidates.push({
        member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        name: `${r.first_name} ${r.last_name}`.trim(),
        preferred_channel: r.preferred_channel,
        outreach_type: 'milestone_anniversary',
        message: `Congratulations on ${years} year${years !== 1 ? 's' : ''} at the club, ${r.first_name}!`,
        reason: `${years}-year join anniversary within 7 days (joined ${r.join_date})`,
      });
    }

    // Round count milestones (50, 100, 150, 200)
    const milestones = await sql`
      SELECT bp.member_id, m.first_name, m.last_name, m.preferred_channel,
             COUNT(*) AS round_count
      FROM booking_players bp
      JOIN bookings b ON b.booking_id = bp.booking_id
      JOIN members m ON m.member_id = bp.member_id AND m.club_id = ${clubId}
      WHERE b.club_id = ${clubId}
        AND bp.is_guest = 0
        AND bp.member_id IS NOT NULL
        AND b.status IN ('completed', 'checked_in', 'confirmed')
      GROUP BY bp.member_id, m.first_name, m.last_name, m.preferred_channel
      HAVING COUNT(*) IN (50, 100, 150, 200)
      LIMIT 10
    `;
    for (const r of milestones.rows) {
      candidates.push({
        member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        name: `${r.first_name} ${r.last_name}`.trim(),
        preferred_channel: r.preferred_channel,
        outreach_type: 'milestone_rounds',
        message: `${r.round_count} rounds — that's a milestone, ${r.first_name}! The club wants to celebrate.`,
        reason: `Hit ${r.round_count}-round milestone`,
      });
    }

    return candidates;
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// 9. Event Matchmaking
// ---------------------------------------------------------------------------
async function findEventMatchmaking(clubId) {
  try {
    // Upcoming events in next 14 days
    const events = await sql`
      SELECT event_id, name, type, event_date, capacity, description
      FROM event_definitions
      WHERE club_id = ${clubId}
        AND event_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
      ORDER BY event_date
    `;
    if (!events.rows.length) return [];

    // Map event types to matching archetypes
    const TYPE_TO_ARCHETYPE = {
      golf_tournament: ['competitive_golfer', 'avid_golfer'],
      dining: ['social_member', 'family_focused'],
      social: ['social_member', 'family_focused', 'casual_golfer'],
      league: ['competitive_golfer', 'avid_golfer'],
    };

    const candidates = [];
    for (const evt of events.rows) {
      const matchArchetypes = TYPE_TO_ARCHETYPE[evt.type] || ['social_member'];

      // Members whose archetype matches but haven't RSVP'd
      const members = await sql`
        SELECT m.member_id, m.first_name, m.last_name, m.preferred_channel, m.archetype
        FROM members m
        WHERE m.club_id = ${clubId}
          AND m.membership_status = 'active'
          AND m.archetype = ANY(${matchArchetypes})
          AND m.member_id NOT IN (
            SELECT er.member_id FROM event_registrations er
            WHERE er.event_id = ${evt.event_id}
          )
        LIMIT 5
      `;

      for (const m of members.rows) {
        candidates.push({
          member_id: m.member_id,
          first_name: m.first_name,
          last_name: m.last_name,
          name: `${m.first_name} ${m.last_name}`.trim(),
          preferred_channel: m.preferred_channel,
          outreach_type: 'event_matchmaking',
          message: `The ${evt.name} is your kind of event — want me to register you?`,
          reason: `Archetype ${m.archetype} matches ${evt.type} event "${evt.name}" on ${evt.event_date}`,
        });
      }
    }
    return candidates;
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// 10. Lapsed Interest Recovery
// ---------------------------------------------------------------------------
async function findLapsedInterestRecovery(clubId) {
  try {
    // Find upcoming events (next 14 days)
    const upcoming = await sql`
      SELECT event_id, name, type, event_date
      FROM event_definitions
      WHERE club_id = ${clubId}
        AND event_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
      ORDER BY event_date
    `;
    if (!upcoming.rows.length) return [];

    const candidates = [];
    for (const evt of upcoming.rows) {
      // Members who attended past events of the same type but not recently (>60 days)
      const members = await sql`
        SELECT DISTINCT m.member_id, m.first_name, m.last_name, m.preferred_channel
        FROM event_registrations er
        JOIN event_definitions ed ON ed.event_id = er.event_id
        JOIN members m ON m.member_id = er.member_id AND m.club_id = ${clubId}
        WHERE ed.club_id = ${clubId}
          AND ed.type = ${evt.type}
          AND er.status IN ('attended', 'registered')
          AND ed.event_date::date < CURRENT_DATE - 60
          AND m.membership_status = 'active'
          AND m.member_id NOT IN (
            SELECT er2.member_id FROM event_registrations er2
            JOIN event_definitions ed2 ON ed2.event_id = er2.event_id
            WHERE ed2.type = ${evt.type}
              AND ed2.event_date::date >= CURRENT_DATE - 60
          )
          AND m.member_id NOT IN (
            SELECT er3.member_id FROM event_registrations er3
            WHERE er3.event_id = ${evt.event_id}
          )
        LIMIT 5
      `;

      const TYPE_MESSAGES = {
        dining: `The spring pairing menu is from the new chef — want me to grab a table?`,
        golf_tournament: `The tournament field is shaping up nicely — want me to get you in?`,
        social: `It's been a while since the last one — want me to save you a spot?`,
        league: `The league is starting up again — want me to add you to the roster?`,
      };

      for (const m of members.rows) {
        candidates.push({
          member_id: m.member_id,
          first_name: m.first_name,
          last_name: m.last_name,
          name: `${m.first_name} ${m.last_name}`.trim(),
          preferred_channel: m.preferred_channel,
          outreach_type: 'lapsed_interest_recovery',
          message: TYPE_MESSAGES[evt.type] || `${evt.name} is coming up — want me to sign you up?`,
          reason: `Attended ${evt.type} events in the past but lapsed >60 days; upcoming "${evt.name}" on ${evt.event_date}`,
        });
      }
    }
    return candidates;
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// Throttle check
// ---------------------------------------------------------------------------
async function getThrottledMembers(clubId) {
  try {
    const result = await sql`
      SELECT DISTINCT member_id
      FROM member_proactive_log
      WHERE club_id = ${clubId}
        AND sent_at > NOW() - INTERVAL '7 days'
    `;
    return new Set(result.rows.map(r => r.member_id));
  } catch { return new Set(); }
}

// ---------------------------------------------------------------------------
// Log outreach
// ---------------------------------------------------------------------------
async function logOutreach(clubId, memberId, outreachType, channel, message) {
  try {
    await sql`
      INSERT INTO member_proactive_log (club_id, member_id, outreach_type, channel, message_preview, sent_at)
      VALUES (${clubId}, ${memberId}, ${outreachType}, ${channel}, ${message.slice(0, 200)}, NOW())
    `;
  } catch {}
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

// Priority: lower = higher priority
const PRIORITY = {
  milestone_birthday: 1,
  milestone_anniversary: 2,
  milestone_rounds: 3,
  post_visit_followup: 4,
  re_engagement_decay: 5,
  weather_suggestion: 6,
  event_matchmaking: 7,
  lapsed_interest_recovery: 8,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cronKey = req.headers['x-cron-key'] || req.body?.cron_key;
  if (CRON_SECRET && cronKey !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clubId = req.body?.club_id || 'club_pinetree';

  try {
    // Run all 6 types in parallel
    const [weather, reEngagement, postVisit, milestones, eventMatch, lapsed] = await Promise.all([
      findWeatherSuggestions(clubId),
      findReEngagementCandidates(clubId),
      findPostVisitFollowups(clubId),
      findMilestoneCelebrations(clubId),
      findEventMatchmaking(clubId),
      findLapsedInterestRecovery(clubId),
    ]);

    const allCandidates = [
      ...weather,
      ...reEngagement,
      ...postVisit,
      ...milestones,
      ...eventMatch,
      ...lapsed,
    ];

    const summary = {
      weather_suggestion: weather.length,
      re_engagement_decay: reEngagement.length,
      post_visit_followup: postVisit.length,
      milestones: milestones.length,
      event_matchmaking: eventMatch.length,
      lapsed_interest_recovery: lapsed.length,
      total: allCandidates.length,
    };

    // Deduplicate by member_id — keep highest-priority outreach type
    const deduped = new Map();
    for (const c of allCandidates) {
      const existing = deduped.get(c.member_id);
      if (!existing || (PRIORITY[c.outreach_type] || 99) < (PRIORITY[existing.outreach_type] || 99)) {
        deduped.set(c.member_id, c);
      }
    }

    // Check 7-day throttle (batch query)
    const throttledSet = await getThrottledMembers(clubId);

    const outreach = [];
    const throttled = [];
    for (const [memberId, candidate] of deduped) {
      if (throttledSet.has(memberId)) {
        throttled.push({ member_id: memberId, name: candidate.name, reason: 'Throttled (messaged within 7 days)' });
      } else {
        outreach.push(candidate);
      }
    }

    // Log each outreach to member_proactive_log
    for (const o of outreach) {
      await logOutreach(clubId, o.member_id, o.outreach_type, o.preferred_channel || 'email', o.message);
    }

    return res.status(200).json({
      triggered: true,
      club_id: clubId,
      summary,
      after_dedup: deduped.size,
      throttled_count: throttled.length,
      outreach_sent: outreach.length,
      outreach: outreach.map(o => ({
        member_id: o.member_id,
        name: o.name,
        type: o.outreach_type,
        message: o.message,
        reason: o.reason,
        channel: o.preferred_channel || 'email',
      })),
      throttled,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/cron/concierge-engagement error:', err);
    return res.status(500).json({ error: err.message });
  }
}
