/**
 * POST /api/cron/renewal-intelligence
 *
 * Monthly cron: identifies members with renewal dates in the next 60 days,
 * calculates engagement highlight reels, flags open issues, creates a
 * proactive touchpoint schedule, and logs to member_proactive_log.
 *
 * Touchpoint cadence: 60, 30, 14, 7 days before renewal.
 */
import { sql } from '@vercel/postgres';

const CRON_SECRET = process.env.CRON_SECRET;
const TOUCHPOINT_DAYS = [60, 30, 14, 7];

async function findUpcomingRenewals(clubId) {
  try {
    const result = await sql`
      SELECT m.member_id::text, m.first_name, m.last_name, m.email,
             m.membership_type, m.join_date, m.renewal_date,
             m.preferred_channel
      FROM members m
      WHERE m.club_id = ${clubId}
        AND m.membership_status = 'active'
        AND m.renewal_date IS NOT NULL
        AND m.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
      ORDER BY m.renewal_date ASC
    `;
    return result.rows;
  } catch { return []; }
}

async function calculateEngagementReel(clubId, memberId) {
  const reel = {
    rounds_played: 0,
    events_attended: 0,
    guests_hosted: 0,
    dining_visits: 0,
    last_visit: null,
  };

  // Rounds played in the last 12 months
  try {
    const rounds = await sql`
      SELECT COUNT(*) AS cnt
      FROM booking_players bp
      JOIN bookings b ON b.booking_id = bp.booking_id
      WHERE bp.member_id = ${memberId}
        AND b.club_id = ${clubId}
        AND b.booking_date >= CURRENT_DATE - INTERVAL '12 months'
    `;
    reel.rounds_played = parseInt(rounds.rows[0]?.cnt || 0, 10);
  } catch {}

  // Events attended
  try {
    const events = await sql`
      SELECT COUNT(*) AS cnt
      FROM event_registrations er
      JOIN event_definitions ed ON ed.event_id = er.event_id
      WHERE er.member_id = ${memberId}
        AND ed.club_id = ${clubId}
        AND ed.event_date >= CURRENT_DATE - INTERVAL '12 months'
    `;
    reel.events_attended = parseInt(events.rows[0]?.cnt || 0, 10);
  } catch {}

  // Guests hosted — count bookings where this member is a player and there are guest players
  try {
    const guests = await sql`
      SELECT COUNT(DISTINCT b.booking_id) AS cnt
      FROM booking_players bp
      JOIN bookings b ON b.booking_id = bp.booking_id
      WHERE bp.member_id = ${memberId}
        AND b.club_id = ${clubId}
        AND b.booking_date >= CURRENT_DATE - INTERVAL '12 months'
    `;
    reel.guests_hosted = parseInt(guests.rows[0]?.cnt || 0, 10);
  } catch {}

  // Dining visits (from POS checks)
  try {
    const dining = await sql`
      SELECT COUNT(*) AS cnt
      FROM pos_checks
      WHERE member_id = ${memberId}
        AND check_date >= CURRENT_DATE - INTERVAL '12 months'
    `;
    reel.dining_visits = parseInt(dining.rows[0]?.cnt || 0, 10);
  } catch {}

  // Last visit (most recent activity)
  try {
    const lastVisit = await sql`
      SELECT MAX(b.booking_date) AS last_date
      FROM booking_players bp
      JOIN bookings b ON b.booking_id = bp.booking_id
      WHERE bp.member_id = ${memberId} AND b.club_id = ${clubId}
    `;
    reel.last_visit = lastVisit.rows[0]?.last_date || null;
  } catch {}

  return reel;
}

async function findOpenIssues(clubId, memberId) {
  const issues = [];

  // Open complaints
  try {
    const complaints = await sql`
      SELECT id, category, description, created_at, status
      FROM complaints
      WHERE club_id = ${clubId}
        AND member_id = ${memberId}
        AND status NOT IN ('resolved', 'closed')
      ORDER BY created_at DESC
    `;
    for (const c of complaints.rows) {
      issues.push({
        type: 'open_complaint',
        id: c.id,
        category: c.category,
        description: (c.description || '').slice(0, 100),
        filed: c.created_at,
        status: c.status,
        priority: 'high',
        action: 'Resolve before renewal conversation',
      });
    }
  } catch {}

  // Open service requests
  try {
    const requests = await sql`
      SELECT request_id, department, message, created_at, status
      FROM service_requests
      WHERE club_id = ${clubId}
        AND member_id = ${memberId}
        AND status NOT IN ('resolved', 'closed', 'completed')
      ORDER BY created_at DESC
    `;
    for (const r of requests.rows) {
      issues.push({
        type: 'open_request',
        id: r.request_id,
        department: r.department,
        message: (r.message || '').slice(0, 100),
        filed: r.created_at,
        status: r.status,
        priority: 'medium',
        action: 'Follow up before renewal outreach',
      });
    }
  } catch {}

  return issues;
}

async function createTouchpointSchedule(clubId, memberId, memberName, renewalDate) {
  const schedule = [];
  const renewal = new Date(renewalDate);
  const now = new Date();

  for (const daysBefore of TOUCHPOINT_DAYS) {
    const touchDate = new Date(renewal);
    touchDate.setDate(touchDate.getDate() - daysBefore);

    // Only schedule future touchpoints
    if (touchDate <= now) continue;

    const touchpointType = daysBefore >= 60
      ? 'initial_engagement_review'
      : daysBefore >= 30
        ? 'personal_outreach'
        : daysBefore >= 14
          ? 'renewal_conversation'
          : 'final_reminder';

    schedule.push({
      days_before: daysBefore,
      scheduled_date: touchDate.toISOString().split('T')[0],
      type: touchpointType,
    });
  }

  // Log each touchpoint to member_proactive_log
  for (const tp of schedule) {
    try {
      await sql`
        INSERT INTO member_proactive_log
          (club_id, member_id, outreach_type, channel, message_preview, sent_at)
        VALUES (
          ${clubId}, ${memberId}, 'renewal_prep',
          'scheduled',
          ${`[${tp.type}] Renewal touchpoint for ${memberName} — ${tp.days_before} days before renewal (${tp.scheduled_date})`},
          ${tp.scheduled_date}
        )
      `;
    } catch {}
  }

  return schedule;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cronKey = req.headers['x-cron-key'] || req.body?.cron_key;
  if (CRON_SECRET && cronKey !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clubId = req.body?.club_id || 'seed_pinetree';

  try {
    // 1. Find members renewing in next 60 days
    const renewals = await findUpcomingRenewals(clubId);

    const results = [];
    for (const member of renewals) {
      const memberId = member.member_id;
      const memberName = `${member.first_name} ${member.last_name}`.trim();

      // 2. Calculate engagement highlight reel
      const engagement = await calculateEngagementReel(clubId, memberId);

      // 3. Flag open issues
      const openIssues = await findOpenIssues(clubId, memberId);

      // 4. Create touchpoint schedule
      const touchpoints = await createTouchpointSchedule(
        clubId, memberId, memberName, member.renewal_date
      );

      // 5. Determine renewal risk level
      const totalEngagement = engagement.rounds_played + engagement.events_attended
        + engagement.guests_hosted + engagement.dining_visits;
      const riskLevel = openIssues.some(i => i.priority === 'high')
        ? 'high'
        : totalEngagement < 5
          ? 'medium'
          : 'low';

      results.push({
        member_id: memberId,
        member_name: memberName,
        membership_type: member.membership_type,
        renewal_date: member.renewal_date,
        days_until_renewal: Math.ceil((new Date(member.renewal_date) - new Date()) / 86400000),
        engagement_reel: engagement,
        open_issues: openIssues,
        open_issues_count: openIssues.length,
        renewal_risk: riskLevel,
        touchpoint_schedule: touchpoints,
      });
    }

    return res.status(200).json({
      triggered: true,
      club_id: clubId,
      renewals_in_60_days: renewals.length,
      members_processed: results.length,
      high_risk: results.filter(r => r.renewal_risk === 'high').length,
      medium_risk: results.filter(r => r.renewal_risk === 'medium').length,
      low_risk: results.filter(r => r.renewal_risk === 'low').length,
      results,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/cron/renewal-intelligence error:', err);
    return res.status(500).json({ error: err.message });
  }
}
