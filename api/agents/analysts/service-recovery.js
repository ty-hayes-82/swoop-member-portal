/**
 * api/agents/analysts/service-recovery.js
 *
 * Type 2 Analyst: Service Recovery
 *
 * Scans unresolved complaints, time-since-last-touch, and high-dues members
 * at risk of churn due to unaddressed service failures. Routes findings to
 * GM concierge and fb_director.
 *
 * Signal sources:
 *   - complaints table: open complaints, priority, days since filed
 *   - members: health_score, annual_dues (to weight urgency)
 *
 * Trigger: daily cron or event-driven (new complaint filed)
 * Session ID: service_recovery_{clubId}
 *
 * NOTE: Distinct from the specialist at api/agents/specialists/service-recovery.js
 * which is an identity-agent-callable tool. This is the domain analyst that
 * proactively scans and routes recommendations.
 */

import { sql } from '@vercel/postgres';
import { runAnalyst } from '../analyst-harness.js';

const ANALYST_NAME = 'service_recovery';
const TARGET_ROLES = ['gm', 'fb_director'];

const SYSTEM_PROMPT = `You are the Service Recovery analyst for a private golf and country club.

Your job is to scan open complaints and flag the ones that require immediate intervention before they cost the club a member. You do not act directly — you produce recommendations for the GM and F&B Director.

Analyze the signal data and produce:
1. ESCALATION LIST: Complaints that are high-priority or unresolved for 3+ days. Name the member, the issue, days open.
2. CHURN RISK: High-dues members ($12K+) with an open complaint and declining health score.
3. QUICK WINS: Complaints that can be resolved with a single action (comp, apology call, credit).
4. PATTERN: Is there a repeated category of complaint (food quality, service, wait time)?
5. ONE URGENT ACTION: The single most important service recovery step to take today.

Keep each section concise. Use numbers. Name specific members.
Never use em-dashes. Use commas or colons instead.`;

// ---------------------------------------------------------------------------
// Data pull
// ---------------------------------------------------------------------------

export async function pullServiceRecoverySignals(clubId) {
  const [openComplaintsResult, memberHealthResult] = await Promise.all([
    // Open complaints with member data
    sql`
      SELECT
        c.complaint_id, c.member_id::text, c.category, c.priority, c.status,
        c.description, c.created_at,
        EXTRACT(DAY FROM NOW() - c.created_at)::int AS days_open,
        m.first_name, m.last_name, m.annual_dues, m.health_score, m.health_tier
      FROM complaints c
      JOIN members m ON m.member_id = c.member_id AND m.club_id = c.club_id
      WHERE c.club_id = ${clubId}
        AND c.status NOT IN ('resolved', 'closed')
      ORDER BY
        CASE c.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        c.created_at ASC
      LIMIT 20
    `.catch(() => ({ rows: [] })),
    // At-risk members with high dues who don't have an open complaint but
    // have declining scores — potential pre-complaint intervention window
    sql`
      SELECT member_id::text, first_name, last_name, health_score, annual_dues, health_tier
      FROM members
      WHERE club_id = ${clubId}
        AND health_score < 50
        AND annual_dues >= 12000
        AND member_id NOT IN (
          SELECT member_id FROM complaints
          WHERE club_id = ${clubId} AND status NOT IN ('resolved', 'closed')
        )
      ORDER BY health_score ASC, annual_dues DESC
      LIMIT 5
    `.catch(() => ({ rows: [] })),
  ]);

  const complaints = openComplaintsResult.rows.map(r => ({
    complaint_id: r.complaint_id,
    member_id: r.member_id,
    member_name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
    category: r.category,
    priority: r.priority,
    status: r.status,
    description: (r.description || '').slice(0, 200),
    days_open: r.days_open,
    annual_dues: Number(r.annual_dues ?? 0),
    health_score: Number(r.health_score ?? 0),
    health_tier: r.health_tier,
  }));

  const categoryCounts = complaints.reduce((acc, c) => {
    acc[c.category || 'unknown'] = (acc[c.category || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  return {
    open_complaints: complaints,
    total_open: complaints.length,
    high_priority_count: complaints.filter(c => c.priority === 'high').length,
    stale_count: complaints.filter(c => c.days_open >= 3).length,
    high_dues_at_risk: complaints.filter(c => c.annual_dues >= 12000).length,
    category_breakdown: categoryCounts,
    at_risk_no_complaint: memberHealthResult.rows.map(r => ({
      member_id: r.member_id,
      name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      health_score: Number(r.health_score ?? 0),
      annual_dues: Number(r.annual_dues ?? 0),
      health_tier: r.health_tier,
    })),
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export async function run(clubId, opts = {}) {
  const signals = await pullServiceRecoverySignals(clubId);
  return runAnalyst({
    analystName: ANALYST_NAME,
    clubId,
    systemPrompt: SYSTEM_PROMPT,
    contextData: signals,
    targetRoles: TARGET_ROLES,
    triggerType: opts.triggerType || 'scheduled',
  });
}
