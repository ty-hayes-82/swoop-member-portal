/**
 * POST /api/cron/pre-arrival-brief
 *
 * Daily cron (runs at 5 PM club local time — day before):
 * For each member with a tee time tomorrow, generates a pre-arrival
 * briefing with health score, preferences, open complaints, and
 * talking points for staff.
 *
 * Stores results in `pre_arrival_briefs` table and returns a GM
 * morning briefing summary.
 */
import { sql } from '@vercel/postgres';

const CRON_SECRET = process.env.CRON_SECRET;

function riskLevel(score) {
  if (score == null) return 'unknown';
  if (score >= 70) return 'healthy';
  if (score >= 50) return 'monitor';
  if (score >= 30) return 'at_risk';
  return 'critical';
}

function shouldGmGreet(healthScore, hasOpenComplaints, membershipType) {
  // GM should greet critical/at-risk members, anyone with open complaints,
  // or high-value membership types
  if (healthScore != null && healthScore < 50) return true;
  if (hasOpenComplaints) return true;
  if (['platinum', 'legacy', 'honorary'].includes(membershipType?.toLowerCase())) return true;
  return false;
}

function buildTalkingPoints(member) {
  const points = [];

  if (member.health_score != null && member.health_score < 50) {
    points.push(`Health score is ${member.health_score} (${riskLevel(member.health_score)}) — extra attention recommended`);
  }

  if (member.open_complaints?.length) {
    for (const c of member.open_complaints) {
      points.push(`Open complaint: ${c.category} — "${c.description?.slice(0, 80)}"`);
    }
  }

  if (member.preferences) {
    const prefs = member.preferences;
    if (prefs.beverage) points.push(`Beverage preference: ${prefs.beverage}`);
    if (prefs.dining) points.push(`Dining preference: ${prefs.dining}`);
    if (prefs.cart_setup) points.push(`Cart setup: ${prefs.cart_setup}`);
    if (prefs.favorite_course) points.push(`Favors: ${prefs.favorite_course}`);
  }

  if (member.archetype) {
    points.push(`Archetype: ${member.archetype}`);
  }

  if (points.length === 0) {
    points.push('No special notes — standard warm greeting');
  }

  return points;
}

async function getTomorrowBookings(clubId) {
  try {
    const result = await sql`
      SELECT
        b.booking_id, b.booking_date, b.tee_time, b.transportation,
        b.has_caddie, b.round_type, b.player_count,
        c.course_id, c.course_name,
        bp.member_id,
        m.first_name, m.last_name, m.email, m.phone,
        m.membership_type, m.archetype, m.preferred_channel,
        m.health_score, m.health_tier
      FROM bookings b
      JOIN courses c ON c.course_id = b.course_id
      JOIN booking_players bp ON bp.booking_id = b.booking_id
      JOIN members m ON m.member_id = bp.member_id AND m.club_id = ${clubId}
      WHERE b.club_id = ${clubId}
        AND b.booking_date = (CURRENT_DATE + INTERVAL '1 day')::date::text
        AND b.status IN ('confirmed', 'pending')
        AND bp.is_guest = 0
      ORDER BY b.tee_time ASC
    `;
    return result.rows;
  } catch { return []; }
}

async function getHealthScores(clubId, memberIds) {
  if (!memberIds.length) return new Map();
  try {
    const result = await sql`
      SELECT DISTINCT ON (member_id)
        member_id, score, tier, golf_score, dining_score,
        email_score, event_score, archetype, score_delta
      FROM health_scores
      WHERE club_id = ${clubId} AND member_id = ANY(${memberIds})
      ORDER BY member_id, computed_at DESC
    `;
    const map = new Map();
    for (const r of result.rows) map.set(r.member_id, r);
    return map;
  } catch { return new Map(); }
}

async function getPreferences(clubId, memberIds) {
  if (!memberIds.length) return new Map();
  try {
    const result = await sql`
      SELECT member_id, preferences_cache
      FROM member_concierge_sessions
      WHERE club_id = ${clubId} AND member_id = ANY(${memberIds})
    `;
    const map = new Map();
    for (const r of result.rows) {
      const prefs = typeof r.preferences_cache === 'string'
        ? JSON.parse(r.preferences_cache)
        : r.preferences_cache;
      map.set(r.member_id, prefs || {});
    }
    return map;
  } catch { return new Map(); }
}

async function getOpenComplaints(clubId, memberIds) {
  if (!memberIds.length) return new Map();
  try {
    const result = await sql`
      SELECT member_id, complaint_id, category, description, priority, reported_at
      FROM complaints
      WHERE club_id = ${clubId}
        AND member_id = ANY(${memberIds})
        AND status != 'resolved'
      ORDER BY reported_at DESC
    `;
    const map = new Map();
    for (const r of result.rows) {
      if (!map.has(r.member_id)) map.set(r.member_id, []);
      map.get(r.member_id).push(r);
    }
    return map;
  } catch { return new Map(); }
}

async function getRecentNegativeInteractions(clubId, memberIds) {
  if (!memberIds.length) return new Map();
  try {
    const result = await sql`
      SELECT member_id, rating_type, score, feedback_text, rated_at
      FROM member_sentiment_ratings
      WHERE club_id = ${clubId}
        AND member_id = ANY(${memberIds})
        AND score <= 2
        AND rated_at > NOW() - INTERVAL '30 days'
      ORDER BY rated_at DESC
    `;
    const map = new Map();
    for (const r of result.rows) {
      if (!map.has(r.member_id)) map.set(r.member_id, []);
      map.get(r.member_id).push(r);
    }
    return map;
  } catch { return new Map(); }
}

async function ensureBriefsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pre_arrival_briefs (
        id              SERIAL PRIMARY KEY,
        club_id         TEXT NOT NULL,
        brief_date      DATE NOT NULL,
        member_id       TEXT NOT NULL,
        booking_id      TEXT NOT NULL,
        tee_time        TEXT,
        course_name     TEXT,
        health_score    REAL,
        risk_level      TEXT,
        preferences     JSONB DEFAULT '{}',
        open_complaints JSONB DEFAULT '[]',
        talking_points  JSONB DEFAULT '[]',
        gm_greet        BOOLEAN DEFAULT FALSE,
        brief_json      JSONB DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(club_id, brief_date, member_id, booking_id)
      )
    `;
  } catch {}
}

async function storeBrief(clubId, brief) {
  try {
    await sql`
      INSERT INTO pre_arrival_briefs (
        club_id, brief_date, member_id, booking_id, tee_time, course_name,
        health_score, risk_level, preferences, open_complaints,
        talking_points, gm_greet, brief_json
      ) VALUES (
        ${clubId},
        (CURRENT_DATE + INTERVAL '1 day')::date,
        ${brief.member_id},
        ${brief.booking_id},
        ${brief.tee_time},
        ${brief.course_name},
        ${brief.health_score},
        ${brief.risk_level},
        ${JSON.stringify(brief.preferences)},
        ${JSON.stringify(brief.open_complaints)},
        ${JSON.stringify(brief.talking_points)},
        ${brief.gm_greet},
        ${JSON.stringify(brief)}
      )
      ON CONFLICT (club_id, brief_date, member_id, booking_id) DO UPDATE SET
        health_score    = EXCLUDED.health_score,
        risk_level      = EXCLUDED.risk_level,
        preferences     = EXCLUDED.preferences,
        open_complaints = EXCLUDED.open_complaints,
        talking_points  = EXCLUDED.talking_points,
        gm_greet        = EXCLUDED.gm_greet,
        brief_json      = EXCLUDED.brief_json,
        created_at      = NOW()
    `;
  } catch (err) {
    console.error('storeBrief error:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cronKey = req.headers['x-cron-key'] || req.body?.cron_key;
  if (CRON_SECRET && cronKey !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clubId = req.body?.club_id || 'seed_pinetree';

  try {
    await ensureBriefsTable();

    // 1. Get all bookings for tomorrow
    const bookings = await getTomorrowBookings(clubId);
    if (!bookings.length) {
      return res.status(200).json({
        triggered: true,
        club_id: clubId,
        briefs: [],
        summary: 'No bookings found for tomorrow',
        generated_at: new Date().toISOString(),
      });
    }

    // 2. Gather member IDs and fetch enrichment data in parallel
    const memberIds = [...new Set(bookings.map(b => b.member_id).filter(Boolean))];

    const [healthMap, prefsMap, complaintsMap, negativeMap] = await Promise.all([
      getHealthScores(clubId, memberIds),
      getPreferences(clubId, memberIds),
      getOpenComplaints(clubId, memberIds),
      getRecentNegativeInteractions(clubId, memberIds),
    ]);

    // 3. Build per-member briefs
    const briefs = [];
    for (const booking of bookings) {
      const mid = booking.member_id;
      const health = healthMap.get(mid);
      const prefs = prefsMap.get(mid) || {};
      const complaints = complaintsMap.get(mid) || [];
      const negatives = negativeMap.get(mid) || [];

      const effectiveScore = health?.score ?? booking.health_score;
      const risk = riskLevel(effectiveScore);
      const gmGreet = shouldGmGreet(effectiveScore, complaints.length > 0, booking.membership_type);

      const memberData = {
        health_score: effectiveScore,
        open_complaints: complaints,
        preferences: prefs,
        archetype: health?.archetype || booking.archetype,
      };
      const talkingPoints = buildTalkingPoints(memberData);

      if (negatives.length) {
        for (const n of negatives.slice(0, 2)) {
          talkingPoints.push(`Recent negative: ${n.rating_type} rated ${n.score}/5 — "${n.feedback_text?.slice(0, 60) || 'no comment'}"`);
        }
      }

      const brief = {
        member_id: mid,
        member_name: `${booking.first_name} ${booking.last_name}`.trim(),
        booking_id: booking.booking_id,
        tee_time: booking.tee_time,
        course_name: booking.course_name,
        transportation: booking.transportation,
        round_type: booking.round_type,
        player_count: booking.player_count,
        membership_type: booking.membership_type,
        health_score: effectiveScore,
        risk_level: risk,
        archetype: memberData.archetype,
        preferences: prefs,
        open_complaints: complaints.map(c => ({
          complaint_id: c.complaint_id,
          category: c.category,
          description: c.description?.slice(0, 120),
          priority: c.priority,
        })),
        recent_negatives: negatives.slice(0, 3).map(n => ({
          type: n.rating_type,
          score: n.score,
          text: n.feedback_text?.slice(0, 80),
        })),
        talking_points: talkingPoints,
        gm_greet: gmGreet,
      };

      briefs.push(brief);
      await storeBrief(clubId, brief);
    }

    // 4. Build GM summary
    const gmGreetCount = briefs.filter(b => b.gm_greet).length;
    const atRiskCount = briefs.filter(b => ['at_risk', 'critical'].includes(b.risk_level)).length;
    const withComplaints = briefs.filter(b => b.open_complaints.length > 0).length;

    return res.status(200).json({
      triggered: true,
      club_id: clubId,
      brief_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      total_bookings: briefs.length,
      gm_greet_required: gmGreetCount,
      at_risk_members: atRiskCount,
      members_with_complaints: withComplaints,
      briefs: briefs.map(b => ({
        member_id: b.member_id,
        member_name: b.member_name,
        tee_time: b.tee_time,
        course_name: b.course_name,
        health_score: b.health_score,
        risk_level: b.risk_level,
        gm_greet: b.gm_greet,
        talking_points: b.talking_points,
        open_complaints_count: b.open_complaints.length,
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/cron/pre-arrival-brief error:', err);
    return res.status(500).json({ error: err.message });
  }
}
