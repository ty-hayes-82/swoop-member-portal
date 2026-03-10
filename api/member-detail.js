import { sql } from '@vercel/postgres';

const numberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatTimelineEntry = (entries = []) =>
  entries
    .filter((entry) => entry?.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

export default async function handler(req, res) {
  const memberId = req.query.memberId || req.query.id;

  if (!memberId) {
    res.status(400).json({ error: 'memberId query parameter is required' });
    return;
  }

  try {
    const [memberRes, weeklyRes, feedbackRes, visitsRes, emailRes, eventsRes, spendRes, outreachRes] = await Promise.all([
      sql`
        SELECT
          m.member_id,
          m.first_name,
          m.last_name,
          m.membership_type,
          m.join_date,
          m.annual_dues,
          m.archetype,
          m.membership_status,
          m.household_id,
          m.email,
          m.phone,
          m.account_balance
        FROM members m
        WHERE m.member_id = ${memberId}
      `,
      sql`
        SELECT week_number, week_start, engagement_score, rounds_played, dining_spend, events_attended, email_open_rate
        FROM member_engagement_weekly
        WHERE member_id = ${memberId}
        ORDER BY week_number DESC
        LIMIT 6
      `,
      sql`
        SELECT feedback_id, category, sentiment_score, description, submitted_at, status
        FROM feedback
        WHERE member_id = ${memberId}
        ORDER BY submitted_at DESC
        LIMIT 5
      `,
      sql`
        SELECT session_id, session_date, anchor_type, total_spend, activities
        FROM visit_sessions
        WHERE member_id = ${memberId}
        ORDER BY session_date DESC
        LIMIT 8
      `,
      sql`
        SELECT ee.event_id, ee.event_type, ee.occurred_at, ec.subject
        FROM email_events ee
        JOIN email_campaigns ec ON ee.campaign_id = ec.campaign_id
        WHERE ee.member_id = ${memberId}
        ORDER BY ee.occurred_at DESC
        LIMIT 8
      `,
      sql`
        SELECT er.registration_id, er.status, er.checked_in_at, er.fee_paid, ed.name, ed.event_date
        FROM event_registrations er
        JOIN event_definitions ed ON er.event_id = ed.event_id
        WHERE er.member_id = ${memberId}
        ORDER BY ed.event_date DESC
        LIMIT 8
      `,
      sql`
        SELECT
          COALESCE(SUM(CASE WHEN pc.post_round_dining = 1 THEN pc.total ELSE 0 END), 0) AS dining_spend,
          COALESCE(SUM(pc.total), 0) AS total_spend
        FROM pos_checks pc
        WHERE pc.member_id = ${memberId}
          AND DATE_PART('year', pc.opened_at::timestamp) = DATE_PART('year', CURRENT_DATE)
      `,
      sql`
        SELECT occurred_at, event_type
        FROM email_events
        WHERE member_id = ${memberId}
        ORDER BY occurred_at DESC
        LIMIT 1
      `,
    ]);

    if (!memberRes.rowCount) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const memberRow = memberRes.rows[0];
    const fullName = `${memberRow.first_name ?? ''} ${memberRow.last_name ?? ''}`.trim() || 'Member';

    const weekly = [...weeklyRes.rows]
      .map((row) => ({
        weekNumber: Number(row.week_number),
        start: row.week_start,
        score: numberOr(row.engagement_score),
        rounds: numberOr(row.rounds_played),
        diningSpend: numberOr(row.dining_spend),
        eventsAttended: numberOr(row.events_attended),
        emailOpenRate: numberOr(row.email_open_rate),
      }))
      .sort((a, b) => a.weekNumber - b.weekNumber);

    const latestScore = weekly.at(-1)?.score ?? null;
    const prevScore = weekly.at(-2)?.score ?? latestScore;
    const scoreDelta = latestScore !== null && prevScore !== null ? latestScore - prevScore : 0;

    const activitySummary = {
      rounds: {
        label: 'Rounds this month',
        value: weekly.reduce((sum, row) => sum + row.rounds, 0),
        trend: scoreDelta,
      },
      dining: {
        label: 'Dining spend',
        value: weekly.reduce((sum, row) => sum + row.diningSpend, 0),
        trend: weekly.at(-1)?.diningSpend ?? 0,
      },
      email: {
        label: 'Email engagement',
        value: Number(((weekly.at(-1)?.emailOpenRate ?? 0) * 100).toFixed(1)),
        trend: ((weekly.at(-1)?.emailOpenRate ?? 0) - (weekly.at(-2)?.emailOpenRate ?? 0)) * 100,
      },
      events: {
        label: 'Events attended',
        value: weekly.reduce((sum, row) => sum + row.eventsAttended, 0),
        trend: weekly.at(-1)?.eventsAttended ?? 0,
      },
    };

    const riskSignals = [];
    const lastWeek = weekly.at(-1);
    const secondLastWeek = weekly.at(-2);

    if (lastWeek && lastWeek.emailOpenRate < 0.2) {
      riskSignals.push({
        id: 'email-decay',
        label: 'Email engagement dropped',
        detail: `Open rate ${Math.round(lastWeek.emailOpenRate * 100)}%`,
        action: 'Membership coordinator to send personal note within 24h.',
        severity: 'warning',
      });
    }

    if (lastWeek && secondLastWeek && lastWeek.score + 12 <= secondLastWeek.score) {
      riskSignals.push({
        id: 'score-drop',
        label: 'Health score fell sharply',
        detail: `${secondLastWeek.score} → ${lastWeek.score}`,
        action: 'GM to phone member this afternoon.',
        severity: 'critical',
      });
    }

    (feedbackRes.rows || []).forEach((row) => {
      riskSignals.push({
        id: row.feedback_id,
        label: `${row.category} issue`,
        detail: row.description?.slice(0, 120) ?? 'Service issue logged',
        action: `Resolve complaint (${row.status}) and follow up today.`,
        severity: row.sentiment_score < -0.5 ? 'critical' : 'warning',
      });
    });

    const engagementTimeline = formatTimelineEntry([
      ...visitsRes.rows.map((visit) => ({
        id: visit.session_id,
        type: visit.anchor_type,
        icon: visit.anchor_type === 'dining' ? '🍽️' : visit.anchor_type === 'event' ? '🎟️' : '⛳',
        date: visit.session_date,
        description: `${visit.anchor_type?.toUpperCase?.() ?? 'Visit'} · $${numberOr(visit.total_spend).toFixed(0)} spend`,
      })),
      ...emailRes.rows.map((email) => ({
        id: email.event_id,
        type: email.event_type,
        icon: email.event_type === 'open' ? '✉️' : '📩',
        date: email.occurred_at,
        description: `${email.event_type === 'open' ? 'Opened' : 'Clicked'} “${email.subject}”`,
      })),
      ...eventsRes.rows.map((evt) => ({
        id: evt.registration_id,
        type: 'event',
        icon: '🎯',
        date: evt.event_date,
        description: `${evt.name} · ${evt.status === 'attended' ? 'Attended' : evt.status}`,
      })),
      ...feedbackRes.rows.map((fb) => ({
        id: `${fb.feedback_id}-feedback`,
        type: 'feedback',
        icon: '⚠️',
        date: fb.submitted_at,
        description: `${fb.category} complaint (${fb.status})`,
      })),
    ]);

    const diningSpendYtd = numberOr(spendRes.rows[0]?.dining_spend);
    const totalDiningYtd = numberOr(spendRes.rows[0]?.total_spend);
    const eventsSpendYtd = eventsRes.rows
      .filter((evt) => evt.event_date && new Date(evt.event_date).getFullYear() === new Date().getFullYear())
      .reduce((sum, evt) => sum + numberOr(evt.fee_paid), 0);

    const tenureYears = (() => {
      if (!memberRow.join_date) return 1;
      const joinDate = new Date(memberRow.join_date);
      if (Number.isNaN(joinDate.getTime())) return 1;
      const diff = new Date().getFullYear() - joinDate.getFullYear();
      return Math.max(1, diff + 1);
    })();

    const timelineOutreach = outreachRes.rows[0];

    res.status(200).json({
      member: {
        id: memberRow.member_id,
        name: fullName,
        initials: `${memberRow.first_name?.[0] ?? ''}${memberRow.last_name?.[0] ?? ''}`.toUpperCase(),
        membershipType: memberRow.membership_type,
        joinDate: memberRow.join_date,
        status: memberRow.membership_status,
        archetype: memberRow.archetype,
        healthScore: latestScore,
        scoreDelta,
      },
      healthTimeline: weekly.map((row) => ({
        label: `Week ${row.weekNumber}`,
        score: row.score,
        weekStart: row.start,
      })),
      activitySummary,
      riskSignals,
      engagementTimeline,
      contact: {
        email: memberRow.email,
        phone: memberRow.phone,
        preferredChannel: memberRow.email ? 'Email' : memberRow.phone ? 'Phone' : 'Unspecified',
        lastOutreach: timelineOutreach?.occurred_at,
      },
      outreachHistory: {
        lastOutreachDate: timelineOutreach?.occurred_at ?? null,
        lastOutreachType: timelineOutreach?.event_type ?? null,
        owner: 'Membership Director',
        notes: timelineOutreach ? `Automated ${timelineOutreach.event_type} sent` : 'No outreach logged recently.',
      },
      financials: {
        annualDues: numberOr(memberRow.annual_dues),
        ytdDiningSpend: diningSpendYtd,
        ytdGolfSpend: weekly.reduce((sum, row) => sum + row.rounds * 120, 0),
        ytdEventSpend: eventsSpendYtd,
        lifetimeValue: numberOr(memberRow.annual_dues) * tenureYears + totalDiningYtd,
        renewalDate: memberRow.join_date,
      },
    });
  } catch (error) {
    console.error('member-detail error', error);
    res.status(500).json({ error: 'Failed to load member detail' });
  }
}
