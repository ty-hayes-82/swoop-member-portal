/**
 * api/agents/analysts/engagement-autopilot.js
 *
 * Type 2 Analyst: Engagement Autopilot
 *
 * Scans participation decay against archetype-specific baselines. Identifies
 * members whose activity has dropped below their expected engagement pattern
 * and recommends personalized reactivation outreach. Routes findings to
 * membership_director and GM.
 *
 * Unlike Member Pulse (which focuses on health score tiers and at-risk members),
 * Engagement Autopilot focuses on early-warning decay within each archetype —
 * catching drop-off before health score degrades.
 *
 * Signal sources:
 *   - members: archetype, last_activity_date, health_score, annual_dues
 *   - bookings: activity frequency by member over rolling windows
 *
 * Trigger: weekly cron or manual trigger
 * Session ID: engagement_autopilot_{clubId}
 */

import { sql } from '@vercel/postgres';
import { runAnalyst } from '../analyst-harness.js';

const ANALYST_NAME = 'engagement_autopilot';
const TARGET_ROLES = ['membership_director', 'gm'];

// Archetype-specific engagement baselines (visits per 30 days expected)
const ARCHETYPE_BASELINES = {
  'Golf Enthusiast': 8,
  'Social Member': 4,
  'Family Oriented': 3,
  'Occasional Player': 1.5,
  'Networker': 2,
  'default': 2,
};

const SYSTEM_PROMPT = `You are the Engagement Autopilot analyst for a private golf and country club.

Your job is to detect early-warning engagement decay in members before their health score degrades. You compare each member's recent activity against their archetype baseline. You do not act directly — you produce reactivation recommendations for the Membership Director and GM.

Analyze the signal data and produce:
1. DECAY DETECTION: Members whose last 30 days of activity are below 50% of their archetype baseline. Name them, their archetype, expected vs actual visits.
2. EARLY WARNING (50-75% of baseline): Members trending down but not yet critical. Name top 5 by dues at stake.
3. REACTIVATION PRIORITIES: Top 3 members to reach out to this week. For each: name, archetype, specific reason to reach out (upcoming event match, past preference, seasonal pattern).
4. PATTERN: Is there a specific archetype or membership tier showing broad disengagement?
5. SUGGESTED OUTREACH ANGLE: For each priority member, one specific talking point based on their archetype.

Use specific names and numbers. Match outreach angles to the member's known archetype.
Never use em-dashes. Use commas or colons instead.`;

// ---------------------------------------------------------------------------
// Data pull
// ---------------------------------------------------------------------------

export async function pullEngagementSignals(clubId) {
  const [memberActivityResult, archetypeDistResult] = await Promise.all([
    // Member activity: visits in last 30 days and 31-60 days (for trend)
    sql`
      SELECT
        m.member_id::text,
        m.first_name,
        m.last_name,
        m.archetype,
        m.annual_dues,
        m.health_score,
        m.last_activity_date,
        COUNT(DISTINCT CASE
          WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN bp.booking_id
          END) AS visits_last_30d,
        COUNT(DISTINCT CASE
          WHEN b.booking_date >= CURRENT_DATE - INTERVAL '60 days'
           AND b.booking_date < CURRENT_DATE - INTERVAL '30 days' THEN bp.booking_id
          END) AS visits_prior_30d
      FROM members m
      LEFT JOIN booking_players bp ON bp.member_id = m.member_id
      LEFT JOIN bookings b ON b.booking_id = bp.booking_id
        AND b.club_id = m.club_id
        AND b.booking_date >= CURRENT_DATE - INTERVAL '60 days'
      WHERE m.club_id = ${clubId}
        AND m.annual_dues >= 5000
      GROUP BY m.member_id, m.first_name, m.last_name, m.archetype,
        m.annual_dues, m.health_score, m.last_activity_date
      ORDER BY m.annual_dues DESC NULLS LAST
      LIMIT 100
    `.catch(() => ({ rows: [] })),
    // Distribution by archetype
    sql`
      SELECT
        archetype,
        COUNT(*)::int AS member_count,
        ROUND(AVG(health_score)::numeric, 1) AS avg_health_score,
        SUM(annual_dues) AS total_dues
      FROM members
      WHERE club_id = ${clubId}
      GROUP BY archetype
      ORDER BY avg_health_score ASC
    `.catch(() => ({ rows: [] })),
  ]);

  // Classify each member against their archetype baseline
  const classifiedMembers = memberActivityResult.rows.map(r => {
    const archetype = r.archetype || 'default';
    const baseline = ARCHETYPE_BASELINES[archetype] || ARCHETYPE_BASELINES['default'];
    const visits30d = Number(r.visits_last_30d ?? 0);
    const visitsPrior = Number(r.visits_prior_30d ?? 0);
    const pctOfBaseline = baseline > 0 ? Math.round(visits30d / baseline * 100) : null;
    const trend = visitsPrior > 0
      ? Math.round((visits30d - visitsPrior) / visitsPrior * 100)
      : null;

    return {
      member_id: r.member_id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      archetype,
      annual_dues: Number(r.annual_dues ?? 0),
      health_score: Number(r.health_score ?? 0),
      last_activity: r.last_activity_date,
      visits_last_30d: visits30d,
      visits_prior_30d: visitsPrior,
      baseline_visits_per_30d: baseline,
      pct_of_baseline: pctOfBaseline,
      trend_pct: trend,
      status: pctOfBaseline === null ? 'unknown'
        : pctOfBaseline < 50 ? 'critical_decay'
        : pctOfBaseline < 75 ? 'early_warning'
        : 'healthy',
    };
  });

  const criticalDecay = classifiedMembers.filter(m => m.status === 'critical_decay');
  const earlyWarning = classifiedMembers.filter(m => m.status === 'early_warning');

  return {
    member_activity: classifiedMembers,
    critical_decay: {
      count: criticalDecay.length,
      members: criticalDecay.slice(0, 10),
      dues_at_stake: criticalDecay.reduce((s, m) => s + m.annual_dues, 0),
    },
    early_warning: {
      count: earlyWarning.length,
      members: earlyWarning.slice(0, 10),
      dues_at_stake: earlyWarning.reduce((s, m) => s + m.annual_dues, 0),
    },
    archetype_distribution: archetypeDistResult.rows.map(r => ({
      archetype: r.archetype,
      count: r.member_count,
      avg_health_score: Number(r.avg_health_score ?? 0),
      total_dues: Number(r.total_dues ?? 0),
    })),
    archetype_baselines: ARCHETYPE_BASELINES,
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export async function run(clubId, opts = {}) {
  const signals = await pullEngagementSignals(clubId);
  return runAnalyst({
    analystName: ANALYST_NAME,
    clubId,
    systemPrompt: SYSTEM_PROMPT,
    contextData: signals,
    targetRoles: TARGET_ROLES,
    triggerType: opts.triggerType || 'scheduled',
  });
}
