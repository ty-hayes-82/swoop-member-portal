// api/pipeline.js — Phase 2 backend for pipelineService.js
// Tables: booking_players, members, member_waitlist, member_engagement_weekly
// Return shapes IDENTICAL to pipelineService.js

import { sql } from '@vercel/postgres';

const normalizeHealthScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const normalized = numeric <= 1 ? numeric * 100 : numeric;
  return Math.round(normalized);
};

const deriveRiskLevel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

export default async function handler(req, res) {
  try {
    const [leads, waitlist] = await Promise.all([

      // Warm leads = guests (is_guest=1, is_warm_lead=1) from booking_players
      sql`
        SELECT
          bp.player_id,
          bp.guest_name                                             AS name,
          bp.booking_id,
          b.booking_date,
          b.course_id,
          m_sponsor.first_name || ' ' || m_sponsor.last_name       AS sponsored_by,
          m_sponsor.archetype                                       AS sponsor_archetype,
          COUNT(DISTINCT bp2.booking_id)                           AS visit_count,
          ROUND(SUM(pc.total)::numeric, 2)                         AS total_spend,
          mt.annual_dues                                           AS potential_dues
        FROM booking_players bp
        JOIN bookings b ON bp.booking_id = b.booking_id
        JOIN booking_players bp_sponsor ON bp_sponsor.booking_id = b.booking_id
                                        AND bp_sponsor.is_guest = 0
        JOIN members m_sponsor ON bp_sponsor.member_id = m_sponsor.member_id
        LEFT JOIN booking_players bp2 ON bp2.guest_name = bp.guest_name AND bp2.is_guest = 1
        LEFT JOIN pos_checks pc ON pc.member_id = m_sponsor.member_id
                                 AND pc.opened_at::date = b.booking_date::date
        CROSS JOIN (SELECT annual_dues FROM membership_types WHERE type_code = 'FG') mt
        WHERE bp.is_guest = 1 AND bp.is_warm_lead = 1
          AND bp.guest_name IS NOT NULL AND bp.guest_name <> ''
        GROUP BY bp.player_id, bp.guest_name, bp.booking_id, b.booking_date, b.course_id,
                 m_sponsor.first_name, m_sponsor.last_name, m_sponsor.archetype, mt.annual_dues
        ORDER BY visit_count DESC, total_spend DESC`,

      // Member waitlist — retention-priority sorted
      sql`
        SELECT
          mw.waitlist_id,
          mw.member_id,
          m.first_name || ' ' || m.last_name                       AS member_name,
          m.archetype,
          mw.requested_slot,
          mw.days_waiting,
          mw.alternatives_accepted,
          mw.retention_priority,
          mw.dining_incentive_attached,
          mw.notified_at,
          mw.filled_at,
          w.engagement_score                                       AS health_score,
          CASE
            WHEN w.engagement_score >= 70 THEN 'Healthy'
            WHEN w.engagement_score >= 50 THEN 'Watch'
            WHEN w.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END                                                      AS risk_level,
          (
            SELECT MAX(b.booking_date) FROM bookings b
            JOIN booking_players bp ON b.booking_id = bp.booking_id
            WHERE bp.member_id = mw.member_id AND b.status = 'completed'
          )                                                        AS last_round
        FROM member_waitlist mw
        JOIN members m ON mw.member_id = m.member_id
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        ORDER BY
          CASE mw.retention_priority WHEN 'HIGH' THEN 0 ELSE 1 END,
          w.engagement_score ASC`,
    ]);

    // Tier leads by visit count + spend
    const tieredLeads = leads.rows.map(l => {
      const visits = Number(l.visit_count);
      const spend  = Number(l.total_spend);
      const tier   = visits >= 3 || spend > 400 ? 'hot'
                   : visits === 2 || spend > 200 ? 'warm'
                   : visits === 1 && spend > 100 ? 'cool'
                   : 'cold';
      const score  = Math.min(100, (visits * 12) + (spend / 20));
      return {
        playerId:        l.player_id,
        guestName:       l.name,
        name:            l.name,
        tier,
        visits,
        visitCount:      visits,
        totalSpend:      spend,
        sponsor:         l.sponsored_by,
        sponsoredBy:     l.sponsored_by,
        likelyArchetype: l.sponsor_archetype,
        lastVisit:       l.booking_date,
        potentialDues:   Number(l.potential_dues),
        score:           Math.round(score),
        rounds:          visits,
        dining:          Math.floor(visits * 0.6),
        events:          Math.floor(visits * 0.2),
      };
    });

    const waitlistEntries = waitlist.rows.map(w => {
      const healthScore = normalizeHealthScore(w.health_score);
      return {
        waitlistId:            w.waitlist_id,
        memberId:              w.member_id,
        memberName:            w.member_name,
        archetype:             w.archetype,
        requestedSlot:         w.requested_slot,
        daysWaiting:           Number(w.days_waiting),
        alternatesAccepted:    JSON.parse(w.alternatives_accepted ?? '[]'),
        retentionPriority:     w.retention_priority,
        diningIncentiveAttached: w.dining_incentive_attached === 1,
        notifiedAt:            w.notified_at,
        filledAt:              w.filled_at,
        healthScore,
        riskLevel:             deriveRiskLevel(healthScore),
        lastRound:             w.last_round,
      };
    });

    const byTier = t => tieredLeads.filter(l => l.tier === t);

    res.status(200).json({
      warmLeads: tieredLeads,

      pipelineSummary: {
        hot:  byTier('hot').length,
        warm: byTier('warm').length,
        cool: byTier('cool').length,
        cold: byTier('cold').length,
        totalGuests: tieredLeads.length,
        hotRevenuePotential:   byTier('hot').reduce((s, l) => s + l.potentialDues, 0),
        totalRevenuePotential: tieredLeads.reduce((s, l) => s + l.potentialDues, 0),
      },

      waitlistEntries,

      waitlistSummary: {
        total:           waitlistEntries.length,
        highPriority:    waitlistEntries.filter(w => w.retentionPriority === 'HIGH').length,
        atRisk:          waitlistEntries.filter(w => ['At Risk','Critical'].includes(w.riskLevel)).length,
        avgDaysWaiting:  waitlistEntries.length
          ? Math.round(waitlistEntries.reduce((s, w) => s + w.daysWaiting, 0) / waitlistEntries.length)
          : 0,
      },
    });
  } catch (err) {
    console.error('/api/pipeline error:', err);
    res.status(500).json({ error: err.message });
  }
}
