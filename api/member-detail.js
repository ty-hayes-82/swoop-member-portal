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

const diffInDays = (date) => {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now - target) / (1000 * 60 * 60 * 24)));
};

const trendPercent = (current = 0, previous = 0) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return Number.isFinite(current) ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

const safeJsonParse = (str, fallback = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
};

export default async function handler(req, res) {
  const memberId = req.query.memberId || req.query.id;

  if (!memberId) {
    res.status(400).json({ error: 'memberId query parameter is required' });
    return;
  }

  try {
    const [memberRes, weeklyRes, feedbackRes, visitsRes, emailRes, eventsRes, spendRes, outreachRes, invoiceRes] = await Promise.all([
      sql`
        SELECT
          m.member_id, m.first_name, m.last_name, m.membership_type,
          m.join_date, m.annual_dues, m.archetype, m.membership_status,
          m.household_id, m.email, m.phone, m.account_balance,
          m.preferred_dining_spot, m.tee_time_preference, m.dining_preference,
          m.member_notes, m.family_members, m.last_seen_location
        FROM members m
        WHERE m.member_id = ${memberId}
      `,
      sql`
        SELECT week_number, week_start, engagement_score, rounds_played, dining_spend, events_attended, email_open_rate
        FROM member_engagement_weekly
        WHERE member_id = ${memberId}
        ORDER BY week_number DESC
        LIMIT 12
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
          DATE_PART('year', pc.opened_at::timestamp) AS spend_year,
          COALESCE(SUM(CASE WHEN pc.post_round_dining = 1 THEN pc.total ELSE 0 END), 0) AS dining_spend,
          COALESCE(SUM(pc.total), 0) AS total_spend
        FROM pos_checks pc
        WHERE pc.member_id = ${memberId}
          AND DATE_PART('year', pc.opened_at::timestamp) IN (DATE_PART('year', CURRENT_DATE), DATE_PART('year', CURRENT_DATE) - 1)
        GROUP BY spend_year
      `,
      sql`
        SELECT occurred_at, event_type
        FROM email_events
        WHERE member_id = ${memberId}
        ORDER BY occurred_at DESC
        LIMIT 1
      `,
      // Invoice data
      sql`
        SELECT invoice_id, invoice_date, due_date, amount, type, description,
               status, paid_date, paid_amount, days_past_due, late_fee, collection_status
        FROM member_invoices
        WHERE member_id = ${memberId}
        ORDER BY due_date DESC
        LIMIT 20
      `.catch(() => ({ rows: [] })),
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
    const healthTrend = scoreDelta > 2 ? 'improving' : scoreDelta < -2 ? 'declining' : 'stable';

    const currentYear = new Date().getFullYear();
    const spendRows = spendRes.rows.map((row) => ({
      year: Number(row.spend_year),
      dining: numberOr(row.dining_spend),
      total: numberOr(row.total_spend),
    }));

    const currentSpend = spendRows.find((row) => row.year === currentYear) ?? { dining: 0, total: 0 };
    const priorSpend = spendRows.find((row) => row.year === currentYear - 1) ?? { dining: 0, total: 0 };

    const eventsSpendYtd = eventsRes.rows
      .filter((evt) => evt.event_date && new Date(evt.event_date).getFullYear() === currentYear)
      .reduce((sum, evt) => sum + numberOr(evt.fee_paid), 0);

    const ytdGolfSpend = weekly.reduce((sum, row) => sum + row.rounds * 120, 0);
    const ytdDiningSpend = currentSpend.dining;
    const ytdProShopSpend = Math.max(currentSpend.total - currentSpend.dining, 0);
    const ytdEventSpend = eventsSpendYtd;
    const ytdTotalSpend = ytdGolfSpend + ytdDiningSpend + ytdProShopSpend + ytdEventSpend;

    const weeksCurrent = weekly.slice(-4);
    const weeksPrev = weekly.slice(-8, -4);
    const sumBy = (rows, key) => rows.reduce((sum, row) => sum + (row[key] ?? 0), 0);

    const roundsCurrent = sumBy(weeksCurrent, 'rounds');
    const roundsPrev = weeksPrev.length ? sumBy(weeksPrev, 'rounds') : 0;
    const diningCurrent = sumBy(weeksCurrent, 'diningSpend');
    const diningPrev = weeksPrev.length ? sumBy(weeksPrev, 'diningSpend') : 0;
    const eventsCurrent = sumBy(weeksCurrent, 'eventsAttended');
    const eventsPrev = weeksPrev.length ? sumBy(weeksPrev, 'eventsAttended') : 0;

    const lastVisitDate = visitsRes.rows[0]?.session_date ?? null;
    const prevVisitDate = visitsRes.rows[1]?.session_date ?? null;
    const daysSinceLastVisit = diffInDays(lastVisitDate);
    const prevDaysSince = diffInDays(prevVisitDate);

    const keyMetrics = [
      { id: 'rounds', label: 'Rounds this month', value: roundsCurrent, unit: 'rounds', trend: trendPercent(roundsCurrent, roundsPrev), comparison: 'vs prior month' },
      { id: 'dining', label: 'Dining spend (MTD)', value: diningCurrent, unit: 'currency', trend: trendPercent(diningCurrent, diningPrev), comparison: 'vs prior month' },
      { id: 'events', label: 'Event attendance', value: eventsCurrent, unit: 'events', trend: trendPercent(eventsCurrent, eventsPrev), comparison: 'vs prior month' },
      { id: 'visit-gap', label: 'Days since last visit', value: daysSinceLastVisit ?? '—', unit: 'days', trend: Number.isFinite(prevDaysSince) && Number.isFinite(daysSinceLastVisit) ? prevDaysSince - daysSinceLastVisit : 0, comparison: 'change vs prior visit' },
    ];

    // Risk signals
    const riskSignals = [];
    const lastWeek = weekly.at(-1);
    const secondLastWeek = weekly.at(-2);

    if (lastWeek && lastWeek.emailOpenRate < 0.2) {
      riskSignals.push({ id: 'email-decay', label: 'Email engagement dropped', detail: `Open rate ${Math.round(lastWeek.emailOpenRate * 100)}%`, action: 'Membership coordinator to send personal note within 24h.', severity: 'warning' });
    }
    if (lastWeek && secondLastWeek && lastWeek.score + 12 <= secondLastWeek.score) {
      riskSignals.push({ id: 'score-drop', label: 'Health score fell sharply', detail: `${secondLastWeek.score} → ${lastWeek.score}`, action: 'GM to phone member this afternoon.', severity: 'critical' });
    }
    (feedbackRes.rows || []).forEach((row) => {
      riskSignals.push({ id: row.feedback_id, label: `${row.category} issue`, detail: row.description?.slice(0, 120) ?? 'Service issue logged', action: `Resolve complaint (${row.status}) and follow up today.`, severity: row.sentiment_score < -0.5 ? 'critical' : 'warning' });
    });

    // Invoice risk signals
    const invoiceRows = invoiceRes.rows ?? [];
    const pastDueInvoices = invoiceRows.filter((inv) => inv.status && inv.status.startsWith('past_due'));
    if (pastDueInvoices.length > 0) {
      const totalPastDue = pastDueInvoices.reduce((s, inv) => s + numberOr(inv.amount) - numberOr(inv.paid_amount), 0);
      const maxDays = Math.max(...pastDueInvoices.map((inv) => numberOr(inv.days_past_due)));
      riskSignals.push({
        id: 'payment-risk',
        label: 'Past-due balance',
        detail: `$${Math.round(totalPastDue).toLocaleString()} outstanding (${maxDays} days)`,
        action: maxDays >= 90 ? 'Escalate to collections review.' : maxDays >= 60 ? 'Send second notice immediately.' : 'Send payment reminder.',
        severity: maxDays >= 60 ? 'critical' : 'warning',
      });
    }

    // Timeline
    const timelineEntries = formatTimelineEntry([
      ...visitsRes.rows.map((visit) => ({
        id: visit.session_id, type: visit.anchor_type,
        icon: visit.anchor_type === 'dining' ? '🍽️' : visit.anchor_type === 'event' ? '🎟️' : '⛳',
        date: visit.session_date, description: `${visit.anchor_type?.toUpperCase?.() ?? 'Visit'} · $${numberOr(visit.total_spend).toFixed(0)} spend`,
      })),
      ...emailRes.rows.map((email) => ({
        id: email.event_id, type: email.event_type,
        icon: email.event_type === 'open' ? '✉️' : '📩',
        date: email.occurred_at, description: `${email.event_type === 'open' ? 'Opened' : email.event_type === 'click' ? 'Clicked' : 'Sent'} "${email.subject}"`,
      })),
      ...eventsRes.rows.map((evt) => ({
        id: evt.registration_id, type: 'event', icon: '🎯',
        date: evt.event_date, description: `${evt.name} · ${evt.status === 'attended' ? 'Attended' : evt.status}`,
      })),
      ...feedbackRes.rows.map((fb) => ({
        id: `${fb.feedback_id}-feedback`, type: 'feedback', icon: '⚠️',
        date: fb.submitted_at, description: `${fb.category} complaint (${fb.status})`,
      })),
    ]);

    const timelineOutreach = outreachRes.rows[0];

    const noteEntries = [
      ...(feedbackRes.rows || []).map((row) => ({
        id: `note-${row.feedback_id}`, owner: 'GM', channel: 'In Person',
        note: row.description?.slice(0, 140) ?? 'Service issue logged', date: row.submitted_at,
      })),
      timelineOutreach ? {
        id: 'last-outreach', owner: 'Membership Director', channel: 'Email',
        note: `Sent ${timelineOutreach.event_type} follow-up`, date: timelineOutreach.occurred_at,
      } : null,
    ].filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

    const tenureYears = (() => {
      if (!memberRow.join_date) return 1;
      const joinDate = new Date(memberRow.join_date);
      if (Number.isNaN(joinDate.getTime())) return 1;
      return Math.max(1, new Date().getFullYear() - joinDate.getFullYear() + 1);
    })();

    // Parse personalization fields
    const familyMembers = safeJsonParse(memberRow.family_members, []);
    const favoriteSpots = memberRow.preferred_dining_spot
      ? memberRow.preferred_dining_spot.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Build invoice summary
    const invoiceSummary = invoiceRows.length ? {
      items: invoiceRows.map((inv) => ({
        invoiceId: inv.invoice_id, date: inv.invoice_date, dueDate: inv.due_date,
        amount: numberOr(inv.amount), type: inv.type, description: inv.description,
        status: inv.status, paidDate: inv.paid_date, paidAmount: numberOr(inv.paid_amount),
        daysPastDue: numberOr(inv.days_past_due), lateFee: numberOr(inv.late_fee),
        collectionStatus: inv.collection_status,
      })),
      totalOutstanding: pastDueInvoices.reduce((s, inv) => s + numberOr(inv.amount) - numberOr(inv.paid_amount), 0),
      oldestPastDue: pastDueInvoices.length ? Math.max(...pastDueInvoices.map((inv) => numberOr(inv.days_past_due))) : 0,
      paymentStatus: pastDueInvoices.length >= 3 ? 'chronic' : pastDueInvoices.length >= 1 ? 'delinquent' : 'current',
    } : null;

    res.status(200).json({
      member: {
        id: memberRow.member_id, name: fullName,
        initials: `${memberRow.first_name?.[0] ?? ''}${memberRow.last_name?.[0] ?? ''}`.toUpperCase(),
        membershipType: memberRow.membership_type, joinDate: memberRow.join_date,
        status: memberRow.membership_status, archetype: memberRow.archetype,
        healthScore: latestScore, scoreDelta, healthTrend,
      },
      healthTimeline: weekly.map((row) => ({ label: `Week ${row.weekNumber}`, score: row.score, weekStart: row.start })),
      engagementHistory: weekly.map((row) => ({ label: `W${row.weekNumber}`, score: row.score })),
      keyMetrics,
      riskSignals,
      activityTimeline: timelineEntries,
      engagementTimeline: timelineEntries,
      contact: {
        email: memberRow.email, phone: memberRow.phone,
        preferredChannel: memberRow.email ? 'Email' : memberRow.phone ? 'Phone' : 'Unspecified',
        lastOutreach: timelineOutreach?.occurred_at,
        lastVisitDate, daysSinceLastVisit,
        lastSeenLocation: memberRow.last_seen_location,
      },
      family: familyMembers,
      preferences: {
        favoriteSpots: favoriteSpots.length ? favoriteSpots : null,
        teeWindows: memberRow.tee_time_preference || null,
        dining: memberRow.dining_preference || null,
        notes: memberRow.member_notes || null,
      },
      notes: noteEntries,
      financials: {
        annualDues: numberOr(memberRow.annual_dues),
        breakdown: { golf: ytdGolfSpend, dining: ytdDiningSpend, events: ytdEventSpend, proShop: ytdProShopSpend },
        renewalDate: memberRow.join_date,
        ytdTotal: ytdTotalSpend, priorYearTotal: priorSpend.total,
        deltaVsPrior: ytdTotalSpend - priorSpend.total,
        lifetimeValue: numberOr(memberRow.annual_dues) * tenureYears + currentSpend.total,
      },
      invoices: invoiceSummary,
      activitySummary: {},
    });
  } catch (error) {
    console.error('member-detail error', error);
    res.status(500).json({ error: 'Failed to load member detail' });
  }
}
