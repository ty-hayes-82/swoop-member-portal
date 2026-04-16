/**
 * api/agents/analysts/member-pulse.js
 *
 * Type 2 Analyst: Member Pulse
 *
 * Scans engagement health trends, visit frequency, and risk tier distributions
 * across the club roster. Surfaces at-risk members and decay patterns.
 * Routes findings to GM concierge and membership_director.
 *
 * Signal sources:
 *   - members table: health_score, health_tier, archetype, last_activity_date, annual_dues
 *   - bookings: visit frequency over last 30/90 days
 *
 * Trigger: daily cron or manual via POST /api/agents/run-analyst
 * Session ID: member_pulse_{clubId}
 */

import { sql } from '@vercel/postgres';
import { runAnalyst } from '../analyst-harness.js';

const ANALYST_NAME = 'member_pulse';
const TARGET_ROLES = ['gm', 'membership_director'];

const SYSTEM_PROMPT = `You are the Member Pulse analyst for a private golf and country club.

Your job is to scan the club's member engagement data and surface actionable intelligence. You do not act directly — you produce recommendations that the GM and Membership Director can act on.

Analyze the signal data and produce:
1. RISK SUMMARY: How many members are at-risk (health score < 50)? Any tier movement (Watch → At-Risk)?
2. TOP 3 AT-RISK MEMBERS: Name, score, tier, what changed, recommended action.
3. GHOST MEMBERS: Members with no activity in 60+ days and high dues at stake.
4. ENGAGEMENT TREND: Is the club's overall health score improving or declining vs 30 days ago?
5. ONE RECOMMENDED ACTION: The single most important intervention the GM should initiate today.

Keep each section concise. Use numbers. Name specific members when recommending outreach.
Never use em-dashes. Use commas or colons instead.`;

// ---------------------------------------------------------------------------
// Data pull
// ---------------------------------------------------------------------------

export async function pullMemberPulseSignals(clubId) {
  const [atRiskResult, ghostResult, trendResult, bookingFreqResult] = await Promise.all([
    // At-risk members: score < 50, sorted by dues desc
    sql`
      SELECT member_id::text, first_name, last_name, health_score, health_tier,
        archetype, annual_dues, last_activity_date
      FROM members
      WHERE club_id = ${clubId} AND health_score < 50
      ORDER BY annual_dues DESC NULLS LAST
      LIMIT 10
    `,
    // Ghost members: no activity in 60+ days
    sql`
      SELECT member_id::text, first_name, last_name, health_score, health_tier,
        archetype, annual_dues, last_activity_date
      FROM members
      WHERE club_id = ${clubId}
        AND (last_activity_date < NOW() - INTERVAL '60 days' OR last_activity_date IS NULL)
        AND annual_dues >= 8000
      ORDER BY annual_dues DESC NULLS LAST
      LIMIT 10
    `,
    // Overall health distribution
    sql`
      SELECT
        health_tier,
        COUNT(*)::int AS member_count,
        ROUND(AVG(health_score)::numeric, 1) AS avg_score,
        SUM(annual_dues)::numeric AS total_dues_at_stake
      FROM members
      WHERE club_id = ${clubId}
      GROUP BY health_tier
      ORDER BY avg_score ASC
    `,
    // Visit frequency: members with 0 bookings in last 30 days but ≥1 in 60-90 day window
    sql`
      SELECT m.member_id::text, m.first_name, m.last_name, m.annual_dues,
        COUNT(bp_recent.booking_id) AS visits_last_30d,
        COUNT(bp_prior.booking_id) AS visits_30_to_90d
      FROM members m
      LEFT JOIN booking_players bp_recent ON bp_recent.member_id = m.member_id
        AND bp_recent.booking_id IN (
          SELECT booking_id FROM bookings
          WHERE club_id = ${clubId}
            AND booking_date >= CURRENT_DATE - INTERVAL '30 days'
        )
      LEFT JOIN booking_players bp_prior ON bp_prior.member_id = m.member_id
        AND bp_prior.booking_id IN (
          SELECT booking_id FROM bookings
          WHERE club_id = ${clubId}
            AND booking_date >= CURRENT_DATE - INTERVAL '90 days'
            AND booking_date < CURRENT_DATE - INTERVAL '30 days'
        )
      WHERE m.club_id = ${clubId} AND m.annual_dues >= 8000
      GROUP BY m.member_id, m.first_name, m.last_name, m.annual_dues
      HAVING COUNT(bp_recent.booking_id) = 0 AND COUNT(bp_prior.booking_id) > 0
      ORDER BY m.annual_dues DESC NULLS LAST
      LIMIT 10
    `.catch(() => ({ rows: [] })),
  ]);

  return {
    at_risk_members: atRiskResult.rows.map(r => ({
      member_id: r.member_id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      health_score: Number(r.health_score ?? 0),
      health_tier: r.health_tier,
      archetype: r.archetype,
      annual_dues: Number(r.annual_dues ?? 0),
      last_activity: r.last_activity_date,
    })),
    ghost_members: ghostResult.rows.map(r => ({
      member_id: r.member_id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      health_score: Number(r.health_score ?? 0),
      annual_dues: Number(r.annual_dues ?? 0),
      last_activity: r.last_activity_date,
    })),
    health_distribution: trendResult.rows.map(r => ({
      tier: r.health_tier,
      count: r.member_count,
      avg_score: Number(r.avg_score ?? 0),
      dues_at_stake: Number(r.total_dues_at_stake ?? 0),
    })),
    drop_off_members: bookingFreqResult.rows.map(r => ({
      member_id: r.member_id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      annual_dues: Number(r.annual_dues ?? 0),
      visits_last_30d: Number(r.visits_last_30d ?? 0),
      visits_30_to_90d: Number(r.visits_30_to_90d ?? 0),
    })),
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export async function run(clubId, opts = {}) {
  const signals = await pullMemberPulseSignals(clubId);
  return runAnalyst({
    analystName: ANALYST_NAME,
    clubId,
    systemPrompt: SYSTEM_PROMPT,
    contextData: signals,
    targetRoles: TARGET_ROLES,
    triggerType: opts.triggerType || 'scheduled',
  });
}
