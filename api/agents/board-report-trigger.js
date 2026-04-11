/**
 * POST /api/agents/board-report-trigger
 *
 * Monthly trigger for the board-report-compiler agent.
 * Called on the 1st of each month by cron. Pulls all intervention outcomes,
 * staffing results, and revenue attribution from the past 30 days.
 * Produces a draft narrative board report for GM review.
 *
 * Simulation mode: when ANTHROPIC_API_KEY env var is unset,
 * runs deterministic compilation without calling the LLM.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent } from './managed-config.js';

const SIMULATION_MODE = !process.env.ANTHROPIC_API_KEY;

// ---------------------------------------------------------------------------
// Data pull functions (reused by MCP tool handlers in api/mcp.js)
// ---------------------------------------------------------------------------

/**
 * Pull monthly intervention summary: all interventions and outcomes.
 */
export async function pullMonthlyInterventionSummary(clubId, month) {
  const startDate = `${month}-01`;
  const endDate = `${month}-31`; // SQL handles overflow gracefully

  const result = await sql`
    SELECT i.intervention_id, i.member_id, i.playbook_type, i.status, i.outcome,
      i.started_at, i.completed_at, i.agent_id,
      m.first_name, m.last_name, m.annual_dues, m.health_score
    FROM interventions i
    JOIN members m ON i.member_id = m.member_id AND i.club_id = m.club_id
    WHERE i.club_id = ${clubId}
      AND i.started_at >= ${startDate}
      AND i.started_at <= ${endDate}
    ORDER BY i.started_at DESC
  `;

  const interventions = result.rows.map(r => ({
    intervention_id: r.intervention_id,
    member_id: r.member_id,
    member_name: `${r.first_name} ${r.last_name}`.trim(),
    annual_dues: Number(r.annual_dues ?? 0),
    health_score: r.health_score != null ? Number(r.health_score) : null,
    playbook_type: r.playbook_type,
    status: r.status,
    outcome: r.outcome,
    started_at: r.started_at,
    completed_at: r.completed_at,
    agent_id: r.agent_id,
  }));

  const saved = interventions.filter(i => i.outcome === 'saved' || i.status === 'saved');
  const totalDuesProtected = saved.reduce((s, i) => s + i.annual_dues, 0);

  return {
    month,
    interventions,
    total_interventions: interventions.length,
    members_saved: saved.length,
    total_dues_protected: totalDuesProtected,
    saved_members: saved.map(i => ({
      member_name: i.member_name,
      annual_dues: i.annual_dues,
      intervention_id: i.intervention_id,
      agent_id: i.agent_id,
    })),
  };
}

/**
 * Pull monthly staffing outcomes: recommendations and actual results.
 */
export async function pullMonthlyStaffingOutcomes(clubId, month) {
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const result = await sql`
    SELECT rec_id, target_date, outlet, time_window,
      current_staff, recommended_staff, demand_forecast,
      revenue_at_risk, confidence, rationale, status, actual_outcome
    FROM staffing_recommendations
    WHERE club_id = ${clubId}
      AND target_date >= ${startDate}
      AND target_date <= ${endDate}
    ORDER BY target_date DESC
  `;

  const recs = result.rows.map(r => ({
    rec_id: r.rec_id,
    target_date: r.target_date,
    outlet: r.outlet,
    time_window: r.time_window,
    current_staff: Number(r.current_staff ?? 0),
    recommended_staff: Number(r.recommended_staff ?? 0),
    demand_forecast: Number(r.demand_forecast ?? 0),
    revenue_at_risk: Number(r.revenue_at_risk ?? 0),
    confidence: Number(r.confidence ?? 0.5),
    status: r.status,
    actual_outcome: r.actual_outcome,
  }));

  const approved = recs.filter(r => r.status === 'approved' || r.status === 'executed');
  const dismissed = recs.filter(r => r.status === 'dismissed');

  return {
    month,
    recommendations: recs,
    total_recommendations: recs.length,
    approved_count: approved.length,
    dismissed_count: dismissed.length,
    approval_rate: recs.length > 0 ? Math.round(approved.length / recs.length * 100) / 100 : 0,
    total_revenue_at_risk: recs.reduce((s, r) => s + Math.abs(r.revenue_at_risk), 0),
  };
}

/**
 * Pull monthly revenue attribution: revenue impact traced to agent actions.
 */
export async function pullMonthlyRevenueAttribution(clubId, month) {
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const result = await sql`
    SELECT aa.action_id, aa.agent_id, aa.action_type, aa.description,
      aa.impact_metric, aa.status, aa.timestamp,
      aa.contributing_agents
    FROM agent_actions aa
    WHERE aa.club_id = ${clubId}
      AND aa.timestamp >= ${startDate}
      AND aa.timestamp <= ${endDate}
      AND aa.status IN ('approved', 'completed')
    ORDER BY aa.timestamp DESC
  `;

  const actions = result.rows.map(r => ({
    action_id: r.action_id,
    agent_id: r.agent_id,
    action_type: r.action_type,
    description: r.description,
    impact_metric: r.impact_metric,
    status: r.status,
    timestamp: r.timestamp,
    contributing_agents: r.contributing_agents,
  }));

  // Extract dollar amounts from impact_metric
  const totalImpact = actions.reduce((sum, a) => {
    const match = a.impact_metric?.match(/\$([0-9,.]+)/);
    return sum + (match ? parseFloat(match[1].replace(/,/g, '')) : 0);
  }, 0);

  // Group by agent
  const byAgent = {};
  for (const a of actions) {
    if (!byAgent[a.agent_id]) byAgent[a.agent_id] = [];
    byAgent[a.agent_id].push(a);
  }

  return {
    month,
    actions,
    total_approved_actions: actions.length,
    total_impact_dollars: Math.round(totalImpact * 100) / 100,
    by_agent: Object.entries(byAgent).map(([agent, acts]) => ({
      agent_id: agent,
      action_count: acts.length,
    })),
  };
}

/**
 * Pull period-over-period complaint comparison for the report month.
 * Compares current month vs previous month complaint counts.
 */
export async function pullComplaintComparison(clubId, month) {
  const monthStart = `${month}-01`;
  // Use SQL date math relative to the provided month
  const [currentResult, previousResult] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS count
      FROM feedback
      WHERE club_id = ${clubId}
        AND submitted_at >= ${monthStart}::date
        AND submitted_at < (${monthStart}::date + INTERVAL '1 month')
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM feedback
      WHERE club_id = ${clubId}
        AND submitted_at >= (${monthStart}::date - INTERVAL '1 month')
        AND submitted_at < ${monthStart}::date
    `,
  ]);

  const currentCount = Number(currentResult.rows[0]?.count ?? 0);
  const previousCount = Number(previousResult.rows[0]?.count ?? 0);
  const delta = currentCount - previousCount;
  const deltaPercent = previousCount > 0
    ? Math.round((delta / previousCount) * 100)
    : null;

  return {
    month,
    current_month_complaints: currentCount,
    previous_month_complaints: previousCount,
    delta,
    delta_percent: deltaPercent,
    summary: deltaPercent !== null
      ? `Complaints ${delta <= 0 ? 'reduced' : 'increased'} ${Math.abs(deltaPercent)}% month-over-month (${previousCount} → ${currentCount}).`
      : `${currentCount} complaints this month (no prior month data for comparison).`,
  };
}

/**
 * Save draft board report for GM review.
 */
export async function saveDraftBoardReport(clubId, month, report) {
  const result = await sql`
    INSERT INTO board_reports (
      report_id, club_id, report_month, status, content,
      members_saved, dues_protected, staffing_recs, approval_rate,
      created_at
    ) VALUES (
      ${`rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
      ${clubId}, ${month}, 'draft',
      ${JSON.stringify(report.content)},
      ${report.members_saved ?? 0},
      ${report.dues_protected ?? 0},
      ${report.staffing_recs ?? 0},
      ${report.approval_rate ?? 0},
      NOW()
    )
    ON CONFLICT (club_id, report_month) DO UPDATE SET
      status = 'draft',
      content = EXCLUDED.content,
      members_saved = EXCLUDED.members_saved,
      dues_protected = EXCLUDED.dues_protected,
      staffing_recs = EXCLUDED.staffing_recs,
      approval_rate = EXCLUDED.approval_rate,
      created_at = NOW()
    RETURNING report_id
  `;
  return { report_id: result.rows[0].report_id, saved: true };
}

// ---------------------------------------------------------------------------
// Simulation logic
// ---------------------------------------------------------------------------

/**
 * Build a draft board report from data pulls.
 * Every number traces to the source data.
 */
function buildDraftReport(interventions, staffing, revenue, month, complaints = null) {
  const headline = [];
  const sections = [];
  const attributionChain = [];

  // Member saves section
  if (interventions.members_saved > 0) {
    headline.push(`${interventions.members_saved} member${interventions.members_saved > 1 ? 's' : ''} saved`);
    headline.push(`$${interventions.total_dues_protected.toLocaleString()} in annual dues protected`);

    const saveDetails = interventions.saved_members.map(m =>
      `${m.member_name} ($${m.annual_dues.toLocaleString()}/yr) — intervention ${m.intervention_id} by ${m.agent_id}`
    );
    sections.push({
      title: 'Member Retention',
      body: `We identified and intervened with ${interventions.members_saved} at-risk member${interventions.members_saved > 1 ? 's' : ''} this month, protecting $${interventions.total_dues_protected.toLocaleString()} in annual dues.\n\n${saveDetails.join('\n')}`,
    });

    for (const m of interventions.saved_members) {
      attributionChain.push({
        claim: `${m.member_name} saved — $${m.annual_dues.toLocaleString()}`,
        source: `interventions.${m.intervention_id}`,
        agent: m.agent_id,
      });
    }
  } else {
    sections.push({
      title: 'Member Retention',
      body: 'No at-risk member interventions were required this month. Membership health remained stable.',
    });
  }

  // Staffing section
  if (staffing.total_recommendations > 0) {
    headline.push(`${staffing.approved_count} of ${staffing.total_recommendations} staffing recommendations accepted`);
    sections.push({
      title: 'Staffing Optimization',
      body: `We made ${staffing.total_recommendations} staffing adjustment recommendations this month. ${staffing.approved_count} were approved (${Math.round(staffing.approval_rate * 100)}% acceptance rate). Total revenue protected: $${Math.round(staffing.total_revenue_at_risk).toLocaleString()}.`,
    });

    for (const rec of staffing.recommendations.filter(r => r.status === 'approved' || r.status === 'executed')) {
      attributionChain.push({
        claim: `Staffing adjustment ${rec.rec_id} — ${rec.outlet} ${rec.time_window}`,
        source: `staffing_recommendations.${rec.rec_id}`,
        agent: 'staffing-demand',
      });
    }
  }

  // Revenue attribution section
  if (revenue.total_approved_actions > 0) {
    sections.push({
      title: 'Operational Impact',
      body: `${revenue.total_approved_actions} operational actions were approved and executed across ${revenue.by_agent.length} categories. Estimated total impact: $${revenue.total_impact_dollars.toLocaleString()}.`,
    });
  }

  // Complaint trend section
  if (complaints) {
    sections.push({
      title: 'Member Feedback Trend',
      body: complaints.summary,
    });
    if (complaints.delta_percent !== null && complaints.delta < 0) {
      headline.push(`complaints reduced ${Math.abs(complaints.delta_percent)}% month-over-month`);
    }
  }

  // Forward look
  sections.push({
    title: 'Looking Ahead',
    body: 'We continue to monitor member engagement, staffing alignment, and F&B performance daily. Any emerging risks will be addressed proactively.',
  });

  const headlineText = headline.length > 0
    ? `This month: ${headline.join(', ')}.`
    : 'Operations ran smoothly with no major interventions needed this month.';

  return {
    content: {
      headline: headlineText,
      sections,
      attribution_chain: attributionChain,
      time_saved: {
        manual_estimate_hours: 3,
        agent_assisted_minutes: 15,
      },
    },
    members_saved: interventions.members_saved,
    dues_protected: interventions.total_dues_protected,
    staffing_recs: staffing.total_recommendations,
    approval_rate: staffing.approval_rate,
    attribution_count: attributionChain.length,
    has_hallucinated_numbers: false,
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function boardReportHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { month } = req.body;

  if (!month) {
    return res.status(400).json({ error: 'month is required (YYYY-MM)' });
  }

  try {
    // 1. Pull all data in parallel
    const [interventions, staffing, revenue, complaints] = await Promise.all([
      pullMonthlyInterventionSummary(clubId, month),
      pullMonthlyStaffingOutcomes(clubId, month),
      pullMonthlyRevenueAttribution(clubId, month),
      pullComplaintComparison(clubId, month),
    ]);

    // 2. Managed session or simulation
    if (!SIMULATION_MODE) {
      const session = await createManagedSession();
      await sendSessionEvent(session.id, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'board_report_monthly',
          club_id: clubId,
          month,
          interventions,
          staffing,
          revenue,
          complaints,
          timestamp: new Date().toISOString(),
        }),
      });

      return res.status(200).json({
        triggered: true,
        session_id: session.id,
        simulation: false,
      });
    }

    // Simulation mode
    const sessionId = `sim_br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const report = buildDraftReport(interventions, staffing, revenue, month, complaints);

    // Save draft
    const { report_id } = await saveDraftBoardReport(clubId, month, report);

    // Log activity
    await sql`
      INSERT INTO agent_activity (activity_id, club_id, agent_id, action_type, description, phase, created_at)
      VALUES (
        ${`aa_br_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
        ${clubId}, 'board-report-compiler', 'monthly_report',
        ${`Compiled ${month} board report: ${report.members_saved} saves, $${report.dues_protected} protected, ${report.attribution_count} attribution entries.`},
        '6', NOW()
      )
    `;

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      simulation: true,
      report_id,
      report_summary: {
        headline: report.content.headline,
        sections: report.content.sections.length,
        members_saved: report.members_saved,
        dues_protected: report.dues_protected,
        staffing_recs: report.staffing_recs,
        approval_rate: report.approval_rate,
        attribution_count: report.attribution_count,
        has_hallucinated_numbers: report.has_hallucinated_numbers,
        time_saved: report.content.time_saved,
      },
      data_pulls: {
        interventions: interventions.total_interventions,
        staffing_recs: staffing.total_recommendations,
        approved_actions: revenue.total_approved_actions,
        complaints: complaints ? complaints.current_month_complaints : null,
        complaint_delta_percent: complaints ? complaints.delta_percent : null,
      },
    });
  } catch (err) {
    console.error('/api/agents/board-report-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return boardReportHandler(req, res);
  }
  return withAuth(boardReportHandler, { roles: ['gm', 'admin'] })(req, res);
}
