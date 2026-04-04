/**
 * Live Dashboard API — Sprint 5
 * GET /api/dashboard-live?clubId=xxx
 *
 * Returns computed, real-time data for the Today page and Revenue dashboards.
 * Replaces all hardcoded values with live queries.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const clubId = getClubId(req);

  try {
    // Health tier counts
    const tierCounts = await sql`
      SELECT health_tier, COUNT(*) as count
      FROM members WHERE club_id = ${clubId} AND (status = 'active' OR membership_status = 'active' OR status IS NULL)
      GROUP BY health_tier
    `;
    const tiers = {};
    tierCounts.rows.forEach(r => { tiers[r.health_tier] = Number(r.count); });

    // At-risk dues exposure
    const duesAtRisk = await sql`
      SELECT COALESCE(SUM(annual_dues), 0) as total
      FROM members
      WHERE club_id = ${clubId} AND (status = 'active' OR membership_status = 'active' OR status IS NULL) AND health_tier IN ('At Risk', 'Critical')
    `;

    // Open complaints
    const complaints = await sql`
      SELECT COUNT(*) as count FROM complaints
      WHERE club_id = ${clubId} AND status = 'open'
    `;

    // Pending actions
    const pendingActions = await sql`
      SELECT COUNT(*) as count FROM actions
      WHERE club_id = ${clubId} AND status = 'pending'
    `;

    // Week-over-week comparisons
    const thisWeekRevenue = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions
      WHERE club_id = ${clubId}
        AND transaction_date >= DATE_TRUNC('week', NOW())
    `;
    const lastWeekRevenue = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions
      WHERE club_id = ${clubId}
        AND transaction_date >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days'
        AND transaction_date < DATE_TRUNC('week', NOW())
    `;

    const thisWeekRounds = await sql`
      SELECT COUNT(*) as count FROM rounds
      WHERE club_id = ${clubId} AND cancelled = FALSE AND no_show = FALSE
        AND round_date >= DATE_TRUNC('week', CURRENT_DATE)
    `;
    const lastWeekRounds = await sql`
      SELECT COUNT(*) as count FROM rounds
      WHERE club_id = ${clubId} AND cancelled = FALSE AND no_show = FALSE
        AND round_date >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
        AND round_date < DATE_TRUNC('week', CURRENT_DATE)
    `;

    const thisWeekComplaints = await sql`
      SELECT COUNT(*) as count FROM complaints
      WHERE club_id = ${clubId}
        AND reported_at >= DATE_TRUNC('week', NOW())
    `;
    const lastWeekComplaints = await sql`
      SELECT COUNT(*) as count FROM complaints
      WHERE club_id = ${clubId}
        AND reported_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days'
        AND reported_at < DATE_TRUNC('week', NOW())
    `;

    // Recent interventions (Prove It section)
    const recentInterventions = await sql`
      SELECT i.intervention_type, i.description, i.initiated_at,
             i.health_score_before, i.health_score_after, i.outcome,
             i.dues_protected, i.is_member_save,
             m.first_name, m.last_name
      FROM interventions i
      JOIN members m ON i.member_id = m.member_id
      WHERE i.club_id = ${clubId} AND i.outcome IS NOT NULL
      ORDER BY i.initiated_at DESC LIMIT 5
    `;

    // Members saved (Board Report data)
    const memberSaves = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(dues_protected), 0) as total_protected
      FROM interventions
      WHERE club_id = ${clubId} AND is_member_save = TRUE
    `;

    // Revenue opportunity components
    const avgResponseTime = await sql`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at)) / 3600) as avg_hours
      FROM complaints
      WHERE club_id = ${clubId} AND resolved_at IS NOT NULL
    `;

    const twv = Number(thisWeekRevenue.rows[0]?.total) || 0;
    const lwv = Number(lastWeekRevenue.rows[0]?.total) || 0;
    const revenueChange = lwv > 0 ? ((twv - lwv) / lwv * 100).toFixed(1) : '0.0';

    const twr = Number(thisWeekRounds.rows[0]?.count) || 0;
    const lwr = Number(lastWeekRounds.rows[0]?.count) || 0;
    const roundsChange = lwr > 0 ? ((twr - lwr) / lwr * 100).toFixed(1) : '0.0';

    const twc = Number(thisWeekComplaints.rows[0]?.count) || 0;
    const lwc = Number(lastWeekComplaints.rows[0]?.count) || 0;
    const complaintsChange = lwc > 0 ? ((twc - lwc) / lwc * 100).toFixed(1) : '0.0';

    res.status(200).json({
      clubId,
      computedAt: new Date().toISOString(),

      // Today dashboard
      healthTiers: {
        Healthy: tiers['Healthy'] || 0,
        Watch: tiers['Watch'] || 0,
        'At Risk': tiers['At Risk'] || 0,
        Critical: tiers['Critical'] || 0,
      },
      totalMembers: Object.values(tiers).reduce((s, v) => s + v, 0),
      atRiskCount: (tiers['At Risk'] || 0) + (tiers['Critical'] || 0),
      duesAtRisk: Number(duesAtRisk.rows[0]?.total) || 0,
      openComplaints: Number(complaints.rows[0]?.count) || 0,
      pendingActions: Number(pendingActions.rows[0]?.count) || 0,

      // Week-over-week
      weekOverWeek: {
        revenue: { current: twv, prior: lwv, change: `${revenueChange}%`, positive: twv >= lwv },
        rounds: { current: twr, prior: lwr, change: `${roundsChange}%`, positive: twr >= lwr },
        complaints: { current: twc, prior: lwc, change: `${complaintsChange}%`, positive: twc <= lwc },
        atRiskMembers: { current: (tiers['At Risk'] || 0) + (tiers['Critical'] || 0), prior: null, change: null, positive: null },
        avgResponseTime: { current: Number(avgResponseTime.rows[0]?.avg_hours)?.toFixed(1) || '—', prior: null },
      },

      // Prove It
      recentInterventions: recentInterventions.rows.map(r => ({
        type: r.intervention_type,
        description: r.description,
        date: r.initiated_at,
        memberName: `${r.first_name} ${r.last_name}`,
        scoreBefore: r.health_score_before,
        scoreAfter: r.health_score_after,
        outcome: r.outcome,
        duesProtected: r.dues_protected,
        isSave: r.is_member_save,
      })),

      // Board Report summary
      boardReportSummary: {
        membersSaved: Number(memberSaves.rows[0]?.count) || 0,
        duesProtected: Number(memberSaves.rows[0]?.total_protected) || 0,
      },

      // Weather summary for board report
      weatherSummary: await (async () => {
        try {
          const wxResult = await sql`
            SELECT
              COUNT(*) FILTER (WHERE wind_max_mph > 15 OR precip_total_in > 0.1 OR high_temp < 45) AS adverse_days,
              COUNT(*) AS total_days
            FROM weather_daily_log
            WHERE club_id = ${clubId}
              AND date >= DATE_TRUNC('month', CURRENT_DATE)
          `;
          const cwcResult = await sql`
            SELECT COUNT(*) AS weather_complaints
            FROM complaint_weather_context
            WHERE club_id = ${clubId}
              AND is_weather_impacted = true
              AND date >= DATE_TRUNC('month', CURRENT_DATE)
          `;
          return {
            adverseDays: Number(wxResult.rows[0]?.adverse_days || 0),
            totalDays: Number(wxResult.rows[0]?.total_days || 0),
            weatherComplaints: Number(cwcResult.rows[0]?.weather_complaints || 0),
          };
        } catch { return null; }
      })(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}, { allowDemo: true });
