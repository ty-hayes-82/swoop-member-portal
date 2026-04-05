/**
 * Health Score Computation Engine — Sprint 3
 * POST /api/compute-health-scores?clubId=xxx
 *
 * Computes health scores for all members of a club based on real engagement data.
 * Runs after each data sync. Stores historical scores for trending.
 *
 * Weight distribution:
 *   Golf Engagement:  30%
 *   Dining Frequency: 25%
 *   Email Engagement: 25%
 *   Event Attendance: 20%
 *
 * Tiers: Healthy (67+), Watch (45-66), At Risk (25-44), Critical (0-24)
 * Archetypes: Die-Hard Golfer, Social Butterfly, Balanced Active, Weekend Warrior, Declining, New Member, Ghost, Snowbird
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

const WEIGHTS = { golf: 0.30, dining: 0.25, email: 0.25, events: 0.20 };

function getTier(score) {
  if (score >= 67) return 'Healthy';
  if (score >= 45) return 'Watch';
  if (score >= 25) return 'At Risk';
  return 'Critical';
}

function classifyArchetype(golf, dining, email, events, joinDaysAgo, lastRoundDaysAgo) {
  // New Member: joined within 120 days
  if (joinDaysAgo < 120) return 'New Member';
  // Ghost: minimal activity across all dimensions
  if (golf < 10 && dining < 10 && events < 10 && email < 15) return 'Ghost';
  // Snowbird: high activity variance (seasonal) — simplified heuristic
  // In production, compare current month activity to 6-month average
  if (golf > 50 && lastRoundDaysAgo > 60) return 'Snowbird';
  // Declining: all dimensions below 35
  if (golf < 35 && dining < 35 && events < 35 && email < 35) return 'Declining';
  // Die-Hard Golfer: golf dominant, dining/events low
  if (golf > 70 && dining < 45 && events < 40) return 'Die-Hard Golfer';
  // Social Butterfly: events/dining dominant, golf low
  if (events > 60 && dining > 60 && golf < 40) return 'Social Butterfly';
  // Weekend Warrior: moderate golf, concentrated on weekends
  if (golf > 40 && golf < 75 && dining < 50) return 'Weekend Warrior';
  // Balanced Active: reasonable engagement across all
  return 'Balanced Active';
}

async function computeGolfScore(memberId, clubId) {
  // Score based on rounds in last 90 days relative to club average
  const result = await sql`
    SELECT COUNT(*) as round_count,
           MAX(round_date) as last_round,
           AVG(duration_minutes) as avg_duration
    FROM rounds
    WHERE member_id = ${memberId} AND club_id = ${clubId}
      AND round_date >= CURRENT_DATE - INTERVAL '90 days'
      AND cancelled = FALSE AND no_show = FALSE
  `;
  const { round_count, last_round } = result.rows[0];
  const rounds = Number(round_count) || 0;

  // Benchmark: 12 rounds in 90 days = 100 score
  const frequencyScore = Math.min(100, (rounds / 12) * 100);

  // Recency penalty: no round in 30+ days = -20, 60+ days = -40
  let recencyPenalty = 0;
  if (last_round) {
    const daysSince = Math.floor((Date.now() - new Date(last_round).getTime()) / 86400000);
    if (daysSince > 60) recencyPenalty = 40;
    else if (daysSince > 30) recencyPenalty = 20;
  } else {
    recencyPenalty = 50; // Never played
  }

  return Math.max(0, Math.min(100, Math.round(frequencyScore - recencyPenalty)));
}

async function computeDiningScore(memberId, clubId) {
  const result = await sql`
    SELECT COUNT(*) as visit_count,
           SUM(total_amount) as total_spend,
           MAX(transaction_date) as last_visit
    FROM transactions
    WHERE member_id = ${memberId} AND club_id = ${clubId}
      AND transaction_date >= NOW() - INTERVAL '90 days'
  `;
  const { visit_count, total_spend, last_visit } = result.rows[0];
  const visits = Number(visit_count) || 0;
  const spend = Number(total_spend) || 0;

  // Benchmark: 12 dining visits in 90 days = 100
  const frequencyScore = Math.min(100, (visits / 12) * 100);

  // Spend bonus: higher average check = higher engagement
  const avgCheck = visits > 0 ? spend / visits : 0;
  const spendBonus = Math.min(15, avgCheck / 10);

  let recencyPenalty = 0;
  if (last_visit) {
    const daysSince = Math.floor((Date.now() - new Date(last_visit).getTime()) / 86400000);
    if (daysSince > 45) recencyPenalty = 30;
    else if (daysSince > 21) recencyPenalty = 15;
  } else {
    recencyPenalty = 40;
  }

  return Math.max(0, Math.min(100, Math.round(frequencyScore + spendBonus - recencyPenalty)));
}

async function computeEmailScore(memberId, clubId) {
  // Check if we have email engagement data
  const result = await sql`
    SELECT email_open_rate
    FROM member_engagement_weekly
    WHERE member_id = ${memberId} AND club_id = ${clubId}
    ORDER BY week_start DESC LIMIT 4
  `;

  if (result.rows.length === 0) {
    // No email data — return neutral score (won't penalize)
    return 50;
  }

  const rates = result.rows.map(r => Number(r.email_open_rate) || 0);
  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;

  // Benchmark: 40% open rate = 100, 15% = 50, 0% = 0
  return Math.max(0, Math.min(100, Math.round((avgRate / 0.4) * 100)));
}

async function computeEventScore(memberId, clubId) {
  // Check event_registrations table if it exists, else use engagement_weekly
  try {
    const result = await sql`
      SELECT COUNT(*) as event_count
      FROM event_registrations
      WHERE member_id = ${memberId} AND club_id = ${clubId}
        AND event_date >= CURRENT_DATE - INTERVAL '90 days'
        AND status = 'attended'
    `;
    const events = Number(result.rows[0]?.event_count) || 0;
    // Benchmark: 3 events in 90 days = 100
    return Math.min(100, Math.round((events / 3) * 100));
  } catch {
    // Table doesn't exist yet — check engagement weekly
    try {
      const result = await sql`
        SELECT events_attended
        FROM member_engagement_weekly
        WHERE member_id = ${memberId} AND club_id = ${clubId}
        ORDER BY week_start DESC LIMIT 12
      `;
      const totalEvents = result.rows.reduce((sum, r) => sum + (Number(r.events_attended) || 0), 0);
      return Math.min(100, Math.round((totalEvents / 3) * 100));
    } catch {
      return 50; // No data — neutral
    }
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const clubId = getClubId(req);

  try {
    // Ensure health score columns exist on members table
    try {
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS health_score REAL`;
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS health_tier TEXT`;
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS archetype TEXT`;
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS data_completeness INTEGER DEFAULT 0`;
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS last_health_update TIMESTAMPTZ`;
    } catch { /* columns may already exist */ }

    // Ensure health_scores history table exists
    try {
      await sql`CREATE TABLE IF NOT EXISTS health_scores (
        id SERIAL PRIMARY KEY,
        member_id TEXT NOT NULL,
        club_id TEXT NOT NULL,
        score REAL, tier TEXT, golf_score REAL, dining_score REAL, email_score REAL, event_score REAL,
        archetype TEXT, score_delta REAL,
        computed_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    } catch { /* table may already exist */ }

    // Ensure data_syncs table exists
    try {
      await sql`CREATE TABLE IF NOT EXISTS data_syncs (
        id SERIAL PRIMARY KEY, club_id TEXT, source_type TEXT, status TEXT,
        records_processed INTEGER, records_failed INTEGER, completed_at TIMESTAMPTZ
      )`;
    } catch {}

    // Get all members for this club
    const members = await sql`
      SELECT member_id, join_date FROM members WHERE club_id = ${clubId} AND (status = 'active' OR membership_status = 'active' OR status IS NULL)
    `;

    if (members.rows.length === 0) {
      return res.status(200).json({ message: 'No active members found', computed: 0 });
    }

    let computed = 0;
    let errors = 0;
    const alerts = []; // Members with 10+ point drop

    for (const member of members.rows) {
      try {
        // Each dimension defaults to null if its data source isn't available
        let golf = null, dining = null, email = null, events = null;
        try { golf = await computeGolfScore(member.member_id, clubId); } catch { /* no rounds data */ }
        try { dining = await computeDiningScore(member.member_id, clubId); } catch { /* no POS data */ }
        try { email = await computeEmailScore(member.member_id, clubId); } catch { /* no email data */ }
        try { events = await computeEventScore(member.member_id, clubId); } catch { /* no event data */ }

        // Data completeness gate: count how many dimensions have real data
        const dimensions = [golf, dining, email, events];
        const availableDimensions = dimensions.filter(d => d !== null);
        const dataCompleteness = availableDimensions.length;

        // If fewer than 2 dimensions have data, mark as "Insufficient Data"
        if (dataCompleteness < 2) {
          await sql`
            UPDATE members
            SET health_score = NULL, health_tier = 'Insufficient Data', archetype = 'New Member',
                data_completeness = ${dataCompleteness}, last_health_update = NOW()
            WHERE member_id = ${member.member_id} AND club_id = ${clubId}
          `;
          computed++;
          continue;
        }

        // Use neutral score (50) for missing dimensions in computation
        const golfScore = golf ?? 50;
        const diningScore = dining ?? 50;
        const emailScore = email ?? 50;
        const eventScore = events ?? 50;

        const score = Math.round(
          golfScore * WEIGHTS.golf +
          diningScore * WEIGHTS.dining +
          emailScore * WEIGHTS.email +
          eventScore * WEIGHTS.events
        );
        const tier = getTier(score);

        // Compute days since join for archetype
        const joinDaysAgo = member.join_date
          ? Math.floor((Date.now() - new Date(member.join_date).getTime()) / 86400000)
          : 999;

        // Last round days ago
        const lastRoundResult = await sql`
          SELECT MAX(round_date) as lr FROM rounds
          WHERE member_id = ${member.member_id} AND club_id = ${clubId} AND cancelled = FALSE
        `;
        const lastRoundDaysAgo = lastRoundResult.rows[0]?.lr
          ? Math.floor((Date.now() - new Date(lastRoundResult.rows[0].lr).getTime()) / 86400000)
          : 999;

        const archetype = classifyArchetype(golfScore, diningScore, emailScore, eventScore, joinDaysAgo, lastRoundDaysAgo);

        // Get previous score for delta detection
        const prevResult = await sql`
          SELECT score FROM health_scores
          WHERE member_id = ${member.member_id} AND club_id = ${clubId}
          ORDER BY computed_at DESC LIMIT 1
        `;
        const prevScore = prevResult.rows[0]?.score ?? null;
        const delta = prevScore !== null ? score - prevScore : null;

        // Store historical score
        await sql`
          INSERT INTO health_scores (member_id, club_id, score, tier, golf_score, dining_score, email_score, event_score, archetype, score_delta)
          VALUES (${member.member_id}, ${clubId}, ${score}, ${tier}, ${golfScore}, ${diningScore}, ${emailScore}, ${eventScore}, ${archetype}, ${delta})
        `;

        // Update member record
        await sql`
          UPDATE members
          SET health_score = ${score}, health_tier = ${tier}, archetype = ${archetype},
              data_completeness = ${dataCompleteness}, last_health_update = NOW()
          WHERE member_id = ${member.member_id} AND club_id = ${clubId}
        `;

        // Alert on significant drops
        if (delta !== null && delta <= -10) {
          alerts.push({
            memberId: member.member_id,
            previousScore: prevScore,
            newScore: score,
            drop: Math.abs(delta),
            tier,
            archetype,
          });
        }

        computed++;
      } catch (e) {
        errors++;
      }
    }

    // Log the sync
    await sql`
      INSERT INTO data_syncs (club_id, source_type, status, records_processed, records_failed, completed_at)
      VALUES (${clubId}, 'health_score_compute', ${errors > 0 ? 'partial' : 'completed'}, ${computed}, ${errors}, NOW())
    `;

    res.status(200).json({
      clubId,
      totalMembers: members.rows.length,
      computed,
      errors,
      alerts: alerts.length,
      alertDetails: alerts.slice(0, 10),
      message: `Health scores computed for ${computed} members. ${alerts.length} members with significant score drops.`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}, { roles: ['gm', 'assistant_gm', 'swoop_admin'] });
