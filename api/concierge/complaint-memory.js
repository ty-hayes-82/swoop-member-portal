/**
 * GET /api/concierge/complaint-memory
 *
 * Retrieves complaint history for a member with follow-through tracking.
 * For resolved complaints, checks if the issue area has improved.
 * For unresolved, returns aging + escalation status.
 * Generates follow-up suggestions for the concierge.
 *
 * Query: ?club_id=&member_id=
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

/**
 * Compute aging info for an unresolved complaint.
 */
function computeAging(reportedAt) {
  const filed = new Date(reportedAt);
  const now = new Date();
  const hoursOpen = Math.round((now - filed) / (1000 * 60 * 60));
  const daysOpen = Math.round(hoursOpen / 24);

  let escalation = 'normal';
  if (hoursOpen > 72) escalation = 'critical';
  else if (hoursOpen > 48) escalation = 'high';
  else if (hoursOpen > 24) escalation = 'elevated';

  return { hours_open: hoursOpen, days_open: daysOpen, escalation };
}

/**
 * Generate a follow-up suggestion based on complaint category and resolution.
 */
function generateFollowUp(complaint, recentActivityInArea) {
  const category = complaint.category || 'other';
  const status = complaint.status;
  const memberFirst = complaint.member_first_name || 'the member';

  if (status === 'resolved' || status === 'closed') {
    if (recentActivityInArea) {
      const suggestions = {
        food_and_beverage: `Last complaint was about ${category.replace(/_/g, ' ')}. They've dined ${recentActivityInArea.count} time(s) since resolution — ask if things have improved.`,
        golf_operations: `Had a golf ops complaint that was resolved. They've played ${recentActivityInArea.count} round(s) since — check if the experience is better now.`,
        facilities: `Facilities complaint was resolved. They've visited ${recentActivityInArea.count} time(s) since — worth a quick check-in.`,
        staff: `Staff complaint was resolved. A brief "how's everything going?" would show we remember and care.`,
        billing: `Billing issue was resolved. Confirm ${memberFirst} is satisfied with the correction.`,
        other: `Previous complaint was resolved. A brief follow-up shows we take feedback seriously.`,
      };
      return suggestions[category] || suggestions.other;
    }
    return `Complaint was resolved but ${memberFirst} hasn't visited the related area since. A gentle "we'd love to see you back" could help.`;
  }

  // Unresolved
  const aging = computeAging(complaint.created_at);
  if (aging.hours_open > 48) {
    return `URGENT: Complaint open ${aging.days_open} days — escalate immediately. Acknowledge the delay and offer a concrete make-good.`;
  }
  if (aging.hours_open > 24) {
    return `Complaint is ${aging.hours_open}h old — follow up today to show progress. Even a "we're working on it" helps.`;
  }
  return `Complaint filed recently — resolution is in progress. No proactive follow-up needed yet.`;
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const memberId = req.query.member_id;

  if (!memberId) return res.status(400).json({ error: 'member_id query parameter is required' });

  try {
    // Fetch all complaints for this member
    let complaints = [];
    try {
      const result = await sql`
        SELECT id, category, description, status, priority,
               created_at, resolved_at, resolved_by, resolution_notes
        FROM complaints
        WHERE club_id = ${clubId} AND member_id = ${memberId}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      complaints = result.rows;
    } catch (e) {
      console.warn('[complaint-memory] complaints table query error:', e.message);
      // Table may not exist — return empty
      return res.status(200).json({ member_id: memberId, complaints: [], summary: { total: 0, open: 0, resolved: 0 } });
    }

    if (complaints.length === 0) {
      return res.status(200).json({
        member_id: memberId,
        complaints: [],
        summary: { total: 0, open: 0, resolved: 0 },
      });
    }

    // For resolved complaints, check recent activity in the complaint area
    const enriched = [];
    for (const c of complaints) {
      let recentActivity = null;

      if (c.status === 'resolved' || c.status === 'closed') {
        const resolvedDate = c.resolved_at || c.created_at;
        try {
          if (c.category === 'food_and_beverage') {
            const visits = await sql`
              SELECT COUNT(*) AS count FROM pos_checks
              WHERE member_id = ${memberId}
                AND opened_at > ${resolvedDate}
            `;
            recentActivity = { count: parseInt(visits.rows[0]?.count || 0, 10) };
          } else if (c.category === 'golf_operations') {
            const rounds = await sql`
              SELECT COUNT(*) AS count FROM booking_players bp
              JOIN bookings b ON b.booking_id = bp.booking_id
              WHERE bp.member_id = ${memberId}
                AND b.booking_date > ${resolvedDate}
            `;
            recentActivity = { count: parseInt(rounds.rows[0]?.count || 0, 10) };
          } else {
            // Generic: check any pos visits as proxy for club engagement
            const visits = await sql`
              SELECT COUNT(*) AS count FROM pos_checks
              WHERE member_id = ${memberId}
                AND opened_at > ${resolvedDate}
            `;
            recentActivity = { count: parseInt(visits.rows[0]?.count || 0, 10) };
          }
        } catch (e) {
          console.warn('[complaint-memory] activity check error:', e.message);
        }
      }

      const aging = (c.status !== 'resolved' && c.status !== 'closed')
        ? computeAging(c.created_at)
        : null;

      enriched.push({
        id: c.id,
        category: c.category,
        description: c.description,
        status: c.status,
        priority: c.priority,
        filed_date: c.created_at,
        resolved_at: c.resolved_at || null,
        resolution: c.resolution_notes || null,
        aging: aging,
        follow_up_suggestion: generateFollowUp(c, recentActivity),
      });
    }

    const openCount = enriched.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;
    const resolvedCount = enriched.filter(c => c.status === 'resolved' || c.status === 'closed').length;

    return res.status(200).json({
      member_id: memberId,
      complaints: enriched,
      summary: {
        total: enriched.length,
        open: openCount,
        resolved: resolvedCount,
        oldest_open_days: openCount > 0
          ? Math.max(...enriched.filter(c => c.aging).map(c => c.aging.days_open))
          : 0,
      },
    });
  } catch (err) {
    console.error('[complaint-memory] error:', err);
    return res.status(500).json({ error: 'Failed to load complaint memory' });
  }
}

export default withAuth(handler, { allowDemo: true });
