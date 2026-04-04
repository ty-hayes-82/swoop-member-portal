// api/pipeline.js — Phase 2 backend for pipelineService.js
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

const normalizeHealthScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric <= 1 ? numeric * 100 : numeric);
};

const deriveRiskLevel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

const inferPotentialDues = (visits, totalSpend) => {
  const visitCount = Number(visits) || 0;
  const spend = Number(totalSpend) || 0;
  if (visitCount >= 4 || spend >= 3000) return 36000;
  if (visitCount >= 3 || spend >= 1500) return 24000;
  if (visitCount >= 2 || spend >= 600) return 18000;
  return 12000;
};

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);
  try {
    const [leads, waitlist] = await Promise.all([
      sql`
        SELECT
          bp.guest_name AS name,
          COUNT(DISTINCT bp.booking_id) AS visit_count,
          ROUND(COALESCE(SUM(pc.total), 0)::numeric, 2) AS total_spend,
          MAX(b.booking_date) AS last_visit,
          MAX(m_sponsor.first_name || ' ' || m_sponsor.last_name) AS sponsored_by,
          MAX(m_sponsor.archetype) AS sponsor_archetype
        FROM booking_players bp
        JOIN bookings b ON bp.booking_id = b.booking_id
        JOIN booking_players bp_sponsor ON bp_sponsor.booking_id = b.booking_id AND bp_sponsor.is_guest = 0
        JOIN members m_sponsor ON bp_sponsor.member_id = m_sponsor.member_id
        LEFT JOIN pos_checks pc ON pc.member_id = m_sponsor.member_id AND pc.opened_at::date = b.booking_date::date
        WHERE b.club_id = ${clubId}
          AND bp.is_guest = 1
          AND bp.is_warm_lead = 1
          AND bp.guest_name IS NOT NULL
          AND bp.guest_name <> ''
        GROUP BY bp.guest_name
        ORDER BY visit_count DESC, total_spend DESC`,

      sql`
        SELECT
          mw.waitlist_id, mw.member_id,
          m.first_name || ' ' || m.last_name AS member_name,
          m.archetype, m.annual_dues AS member_value_annual,
          mw.requested_slot, mw.days_waiting,
          mw.alternatives_accepted, mw.retention_priority,
          mw.dining_incentive_attached, mw.notified_at, mw.filled_at,
          w.engagement_score AS health_score,
          CASE
            WHEN w.engagement_score >= 70 THEN 'Healthy'
            WHEN w.engagement_score >= 50 THEN 'Watch'
            WHEN w.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END AS risk_level,
          (SELECT MAX(b.booking_date) FROM bookings b
           JOIN booking_players bp ON b.booking_id = bp.booking_id
           WHERE bp.member_id = mw.member_id AND b.status = 'completed') AS last_round
        FROM member_waitlist mw
        JOIN members m ON mw.member_id = m.member_id AND m.club_id = ${clubId}
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly WHERE club_id = ${clubId})
        WHERE mw.club_id = ${clubId}
        ORDER BY
          CASE mw.retention_priority WHEN 'HIGH' THEN 0 ELSE 1 END,
          w.engagement_score ASC`,
    ]);

    const tieredLeads = leads.rows.map(l => {
      const visits = Number(l.visit_count);
      const spend = Number(l.total_spend);
      // ON-42 data model note: backend now emits Hot/Warm/Cold only.
      const tier = visits >= 3 || spend > 400 ? 'hot'
                 : visits === 2 || spend > 200 ? 'warm'
                 : 'cold';
      const score = Math.min(100, (visits * 12) + (spend / 20));
      const potentialDues = inferPotentialDues(visits, spend);
      return {
        guestName: l.name, name: l.name, tier, visits, visitCount: visits,
        totalSpend: spend, sponsor: l.sponsored_by, sponsoredBy: l.sponsored_by,
        likelyArchetype: l.sponsor_archetype, lastVisit: l.last_visit,
        potentialDues, score: Math.round(score),
        rounds: visits, dining: Math.floor(visits * 0.6), events: Math.floor(visits * 0.2),
      };
    });

    const waitlistEntries = waitlist.rows.map(w => {
      const healthScore = normalizeHealthScore(w.health_score);
      return {
        waitlistId: w.waitlist_id, memberId: w.member_id,
        memberName: w.member_name, archetype: w.archetype,
        memberValueAnnual: Number(w.member_value_annual) || 0,
        requestedSlot: w.requested_slot, daysWaiting: Number(w.days_waiting),
        alternatesAccepted: JSON.parse(w.alternatives_accepted ?? '[]'),
        retentionPriority: w.retention_priority,
        diningIncentiveAttached: w.dining_incentive_attached === 1,
        notifiedAt: w.notified_at, filledAt: w.filled_at,
        healthScore, riskLevel: deriveRiskLevel(healthScore), lastRound: w.last_round,
      };
    });

    const byTier = t => tieredLeads.filter(l => l.tier === t);
    const atRiskQueue = waitlistEntries.filter((entry) => ['At Risk', 'Critical'].includes(entry.riskLevel));

    res.status(200).json({
      warmLeads: tieredLeads,
      pipelineSummary: {
        hot: byTier('hot').length, warm: byTier('warm').length,
        cold: byTier('cold').length,
        totalGuests: tieredLeads.length,
        hotRevenuePotential: byTier('hot').reduce((s, l) => s + l.potentialDues, 0),
        totalRevenuePotential: tieredLeads.reduce((s, l) => s + l.potentialDues, 0),
      },
      waitlistEntries,
      waitlistSummary: {
        total: waitlistEntries.length,
        highPriority: waitlistEntries.filter(w => w.retentionPriority === 'HIGH').length,
        atRisk: atRiskQueue.length,
        critical: waitlistEntries.filter((w) => w.riskLevel === 'Critical').length,
        avgDaysWaiting: waitlistEntries.length
          ? Math.round(waitlistEntries.reduce((s, w) => s + w.daysWaiting, 0) / waitlistEntries.length) : 0,
        riskScoredToday: waitlistEntries.filter((w) => Number.isFinite(w.healthScore) && w.healthScore > 0).length,
        atRiskDuesExposed: Math.round(atRiskQueue.reduce((sum, row) => sum + (row.memberValueAnnual || 0), 0)),
      },
    });
  } catch (err) {
    console.error('/api/pipeline error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
