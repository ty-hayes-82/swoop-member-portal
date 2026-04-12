/**
 * GET /api/stage-insights
 *
 * Returns one computed insight per imported stage for the current club.
 * Powers the "What your data is showing you" panel on the Today view.
 *
 * Each insight follows the same shape:
 *   {
 *     stage: string,        // 'members' | 'transactions' | 'staff_shifts' | …
 *     label: string,        // 'F&B Transactions'
 *     headline: string,     // 'Club Sandwich is your top seller — 194 sold last 90d'
 *     metric: string|null,  // '$3,492 revenue'
 *     bullets: string[],    // optional supporting facts
 *     unlocked: boolean,    // false if no rows imported yet
 *   }
 *
 * If a stage has zero rows for the club, the insight is still returned with
 * `unlocked: false` and a hint showing what importing that file would unlock.
 * That way the panel doubles as an "import next" prompt.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

// ---------------------------------------------------------------------------
// Per-stage insight computers
// ---------------------------------------------------------------------------

async function membersInsight(clubId) {
  const r = await sql`
    SELECT
      COUNT(*)::int AS total,
      AVG(annual_dues)::numeric(10,0) AS avg_dues,
      COUNT(*) FILTER (WHERE health_tier IN ('At Risk', 'Critical'))::int AS at_risk
    FROM members WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.total) return null;
  const bullets = [
    `${row.total} active members`,
    row.avg_dues ? `$${Number(row.avg_dues).toLocaleString()}/yr average dues` : null,
  ].filter(Boolean);
  if (row.at_risk > 0) bullets.push(`${row.at_risk} flagged at-risk by Member Pulse`);
  return {
    headline: `${row.total} members imported`,
    metric: row.avg_dues ? `$${(Number(row.avg_dues) * row.total).toLocaleString()} annual dues book` : null,
    bullets,
  };
}

async function bookingsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS total,
      MIN(booking_date) AS earliest,
      MAX(booking_date) AS latest,
      AVG(player_count)::numeric(4,2) AS avg_players
    FROM bookings WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.total) return null;
  return {
    headline: `${row.total.toLocaleString()} tee-time bookings tracked`,
    metric: row.avg_players ? `${Number(row.avg_players).toFixed(1)} avg players/group` : null,
    bullets: [
      row.earliest && row.latest ? `Date range: ${String(row.earliest).slice(0, 10)} → ${String(row.latest).slice(0, 10)}` : null,
    ].filter(Boolean),
  };
}

async function bookingPlayersInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS total
    FROM booking_players bp
    JOIN bookings b ON b.booking_id = bp.booking_id
    WHERE b.club_id = ${clubId}
  `;
  if (!r.rows[0]?.total) return null;
  const top = await sql`
    SELECT m.first_name, m.last_name, COUNT(*)::int AS rounds
    FROM booking_players bp
    JOIN bookings b ON b.booking_id = bp.booking_id
    JOIN members m ON m.member_id = bp.member_id AND m.club_id = b.club_id
    WHERE b.club_id = ${clubId}
      AND b.booking_date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY m.first_name, m.last_name
    ORDER BY rounds DESC LIMIT 1
  `;
  const winner = top.rows[0];
  return {
    headline: winner
      ? `Top golfer: ${winner.first_name} ${winner.last_name} — ${winner.rounds} rounds last 90d`
      : `${r.rows[0].total.toLocaleString()} player attributions linked`,
    metric: `${r.rows[0].total.toLocaleString()} player rounds`,
    bullets: ['Powers Member Pulse health-score golf dimension'],
  };
}

async function transactionsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS total,
      SUM(total_amount)::numeric(12,2) AS revenue,
      AVG(total_amount)::numeric(8,2) AS avg_check
    FROM transactions WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.total) return null;
  return {
    headline: `${row.total.toLocaleString()} F&B transactions — $${Number(row.revenue || 0).toLocaleString()} revenue`,
    metric: row.avg_check ? `$${Number(row.avg_check).toFixed(2)} avg check` : null,
    bullets: [`Drives F&B Intelligence agent recommendations`],
  };
}

async function lineItemsInsight(clubId) {
  const r = await sql`
    SELECT li.item_name, li.category, COUNT(*)::int AS sold,
      SUM(li.unit_price * li.quantity)::numeric(10,2) AS revenue
    FROM pos_line_items li
    JOIN pos_checks pc ON pc.check_id = li.check_id
    WHERE pc.club_id = ${clubId}
    GROUP BY li.item_name, li.category
    ORDER BY sold DESC LIMIT 1
  `;
  const top = r.rows[0];
  if (!top) return null;
  return {
    headline: `Top seller: ${top.item_name} — ${top.sold} sold`,
    metric: `$${Number(top.revenue).toLocaleString()} revenue`,
    bullets: [`Category: ${top.category}`, `Powers menu mix card on F&B view`],
  };
}

async function paymentsInsight(clubId) {
  const r = await sql`
    SELECT p.payment_method, COUNT(*)::int AS n,
      SUM(p.amount)::numeric(12,2) AS total
    FROM pos_payments p
    JOIN pos_checks pc ON pc.check_id = p.check_id
    WHERE pc.club_id = ${clubId}
    GROUP BY p.payment_method
    ORDER BY total DESC
  `;
  if (!r.rows.length) return null;
  const grand = r.rows.reduce((s, x) => s + Number(x.total || 0), 0);
  const top = r.rows[0];
  const memberChargePct = r.rows.find(x => x.payment_method === 'member_charge');
  const mcPct = memberChargePct ? Math.round((Number(memberChargePct.total) / grand) * 100) : 0;
  return {
    headline: `Settlement mix: ${top.payment_method} leads at $${Number(top.total).toLocaleString()}`,
    metric: mcPct > 0 ? `${mcPct}% on member account` : null,
    bullets: [
      mcPct > 50 ? 'High member-charge % — AR exposure to monitor' : 'Healthy settlement spread',
    ],
  };
}

async function closeOutsInsight(clubId) {
  const r = await sql`
    SELECT
      SUM(golf_revenue)::numeric(12,2) AS golf,
      SUM(fb_revenue)::numeric(12,2) AS fb,
      SUM(rounds_played)::int AS rounds,
      COUNT(*)::int AS days
    FROM close_outs WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.days) return null;
  return {
    headline: `${row.days} days of operations recorded`,
    metric: `$${Number(row.golf || 0).toLocaleString()} golf · $${Number(row.fb || 0).toLocaleString()} F&B`,
    bullets: [`${row.rounds} total rounds played`, 'Drives Today revenue strip'],
  };
}

async function diningOutletsInsight(clubId) {
  const r = await sql`
    SELECT name, weekday_covers, weekend_covers
    FROM dining_outlets WHERE club_id = ${clubId}
    ORDER BY weekend_covers DESC NULLS LAST LIMIT 1
  `;
  const top = r.rows[0];
  if (!top) return null;
  const c = await sql`SELECT COUNT(*)::int AS n FROM dining_outlets WHERE club_id = ${clubId}`;
  return {
    headline: `${c.rows[0].n} outlets defined — biggest is ${top.name}`,
    metric: top.weekend_covers ? `${top.weekend_covers} weekend covers capacity` : null,
    bullets: ['Powers F&B outlet selector + capacity utilization'],
  };
}

async function staffInsight(clubId) {
  const r = await sql`
    SELECT department, COUNT(*)::int AS n
    FROM staff WHERE club_id = ${clubId}
    GROUP BY department ORDER BY n DESC LIMIT 1
  `;
  if (!r.rows.length) return null;
  const total = await sql`SELECT COUNT(*)::int AS n FROM staff WHERE club_id = ${clubId}`;
  return {
    headline: `${total.rows[0].n} staff members on roster`,
    metric: `${r.rows[0].department || 'Various'}: ${r.rows[0].n}`,
    bullets: ['Joins to staff_shifts for labor cost forecasting'],
  };
}

async function staffShiftsInsight(clubId) {
  const r = await sql`
    SELECT outlet_id, COUNT(*)::int AS shifts,
      SUM(hours_worked)::numeric(8,2) AS hours
    FROM staff_shifts WHERE club_id = ${clubId}
    GROUP BY outlet_id ORDER BY shifts DESC LIMIT 1
  `;
  if (!r.rows.length) return null;
  const total = await sql`SELECT COUNT(*)::int AS shifts, SUM(hours_worked)::numeric(8,2) AS hours FROM staff_shifts WHERE club_id = ${clubId}`;
  return {
    headline: `${total.rows[0].shifts} shifts scheduled — ${Number(total.rows[0].hours || 0).toLocaleString()} hours`,
    metric: r.rows[0].outlet_id ? `Heaviest outlet: ${r.rows[0].outlet_id}` : null,
    bullets: ['Powers Staffing & Demand agent recommendations'],
  };
}

async function eventsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS n FROM event_definitions WHERE club_id = ${clubId}
  `;
  if (!r.rows[0]?.n) return null;
  const upcoming = await sql`
    SELECT name, event_date, capacity
    FROM event_definitions
    WHERE club_id = ${clubId} AND event_date >= CURRENT_DATE
    ORDER BY event_date ASC LIMIT 1
  `;
  const next = upcoming.rows[0];
  return {
    headline: next
      ? `Next event: ${next.name} on ${String(next.event_date).slice(0, 10)}`
      : `${r.rows[0].n} events on the calendar`,
    metric: next?.capacity ? `${next.capacity} seats` : `${r.rows[0].n} total events`,
    bullets: ['Powers Today upcoming-events panel'],
  };
}

async function eventRegistrationsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS n FROM event_registrations WHERE club_id = ${clubId}
  `;
  if (!r.rows[0]?.n) return null;
  const top = await sql`
    SELECT m.first_name, m.last_name, COUNT(*)::int AS rsvps
    FROM event_registrations er
    JOIN members m ON m.member_id = er.member_id
    WHERE er.club_id = ${clubId}
    GROUP BY m.first_name, m.last_name
    ORDER BY rsvps DESC LIMIT 1
  `;
  const champ = top.rows[0];
  return {
    headline: champ
      ? `Event champion: ${champ.first_name} ${champ.last_name} — ${champ.rsvps} RSVPs`
      : `${r.rows[0].n} event registrations tracked`,
    metric: `${r.rows[0].n.toLocaleString()} total RSVPs`,
    bullets: ['Powers Member Pulse engagement scoring'],
  };
}

async function emailCampaignsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS n,
      MAX(send_date) AS latest
    FROM email_campaigns WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.n) return null;
  return {
    headline: `${row.n} email campaigns sent`,
    metric: row.latest ? `Last sent: ${String(row.latest).slice(0, 10)}` : null,
    bullets: ['Joins to email_events for open/click rates'],
  };
}

async function emailEventsInsight(clubId) {
  const r = await sql`
    SELECT event_type, COUNT(*)::int AS n
    FROM email_events
    WHERE club_id = ${clubId}
    GROUP BY event_type ORDER BY n DESC
  `;
  if (!r.rows.length) return null;
  const total = r.rows.reduce((s, x) => s + Number(x.n || 0), 0);
  const opens = r.rows.find(x => x.event_type === 'open');
  const sent = r.rows.find(x => x.event_type === 'sent') || r.rows.find(x => x.event_type === 'delivered');
  let openRate = null;
  if (opens && sent && Number(sent.n) > 0) {
    openRate = Math.round((Number(opens.n) / Number(sent.n)) * 100);
  }
  return {
    headline: openRate !== null
      ? `${openRate}% email open rate across all campaigns`
      : `${total.toLocaleString()} email engagement events tracked`,
    metric: `${total.toLocaleString()} total events`,
    bullets: ['Powers per-member engagement timeline on Member Profile'],
  };
}

async function memberInvoicesInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS n,
      SUM(amount)::numeric(12,2) AS total,
      COUNT(*) FILTER (WHERE status != 'paid')::int AS open_count,
      SUM(amount) FILTER (WHERE status != 'paid')::numeric(12,2) AS open_total
    FROM member_invoices WHERE member_id IN (SELECT member_id FROM members WHERE club_id = ${clubId})
  `;
  const row = r.rows[0] || {};
  if (!row.n) return null;
  return {
    headline: `${row.n.toLocaleString()} invoices on file — $${Number(row.total || 0).toLocaleString()} total`,
    metric: row.open_total
      ? `$${Number(row.open_total).toLocaleString()} open across ${row.open_count} invoices`
      : null,
    bullets: ['Powers AR aging summary'],
  };
}

async function membershipTypesInsight(clubId) {
  const r = await sql`
    SELECT type_code, name, annual_dues
    FROM membership_types WHERE club_id = ${clubId}
    ORDER BY annual_dues DESC NULLS LAST LIMIT 1
  `;
  if (!r.rows.length) return null;
  const c = await sql`SELECT COUNT(*)::int AS n FROM membership_types WHERE club_id = ${clubId}`;
  const top = r.rows[0];
  return {
    headline: `${c.rows[0].n} membership tiers defined`,
    metric: top.annual_dues ? `Top tier: ${top.name} — $${Number(top.annual_dues).toLocaleString()}/yr` : null,
    bullets: ['Drives tier-revenue mix on Members view'],
  };
}

async function complaintsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status != 'resolved')::int AS open
    FROM complaints WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.total) return null;
  return {
    headline: row.open > 0
      ? `${row.open} open complaints — ${row.total} tracked all-time`
      : `${row.total} complaints tracked, all resolved`,
    metric: row.open > 0 ? `${row.open} need attention` : 'All clear',
    bullets: ['Triggers Service Recovery agent on high-tier members'],
  };
}

async function serviceRequestsInsight(clubId) {
  const r = await sql`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE resolved_at IS NULL)::int AS open
    FROM service_requests WHERE club_id = ${clubId}
  `;
  const row = r.rows[0] || {};
  if (!row.total) return null;
  return {
    headline: `${row.total.toLocaleString()} service requests on file`,
    metric: row.open > 0 ? `${row.open} unresolved` : 'All resolved',
    bullets: ['Joins to member tier for prioritization'],
  };
}

async function clubProfileInsight(clubId) {
  const r = await sql`
    SELECT name, city, state, founded_year
    FROM club WHERE club_id = ${clubId}
  `;
  if (!r.rows.length) return null;
  const row = r.rows[0];
  if (!row.name) return null;
  return {
    headline: `${row.name}${row.city ? ` — ${row.city}, ${row.state}` : ''}`,
    metric: row.founded_year ? `Founded ${row.founded_year}` : null,
    bullets: ['Powers club header on every view'],
  };
}

// ---------------------------------------------------------------------------
// Stage registry — order = display order on Today panel
// ---------------------------------------------------------------------------

const STAGES = [
  { key: 'members',             label: 'Members',             unlocksHint: 'Member roster, dues book, health tier setup', compute: membersInsight },
  { key: 'bookings',             label: 'Tee Sheet',           unlocksHint: 'Tee-time tracking, bookings widget',          compute: bookingsInsight },
  { key: 'booking_players',      label: 'Booking Players',     unlocksHint: 'Per-player attribution, golf health score',  compute: bookingPlayersInsight },
  { key: 'transactions',         label: 'F&B Transactions',    unlocksHint: 'Revenue tracking, spend per member',         compute: transactionsInsight },
  { key: 'pos_line_items',       label: 'POS Line Items',      unlocksHint: 'Menu mix, top-selling items',                compute: lineItemsInsight },
  { key: 'pos_payments',         label: 'POS Payments',        unlocksHint: 'Settlement mix, AR exposure',                compute: paymentsInsight },
  { key: 'close_outs',           label: 'Daily Close',         unlocksHint: 'Daily revenue strip, day-of-week heatmap',   compute: closeOutsInsight },
  { key: 'dining_outlets',       label: 'Dining Outlets',      unlocksHint: 'Outlet capacity, F&B utilization',           compute: diningOutletsInsight },
  { key: 'staff',                 label: 'Staff Roster',        unlocksHint: 'Headcount, department mix',                  compute: staffInsight },
  { key: 'staff_shifts',          label: 'Staff Shifts',        unlocksHint: 'Labor forecasting, Staffing & Demand agent', compute: staffShiftsInsight },
  { key: 'event_definitions',    label: 'Events',              unlocksHint: 'Upcoming events panel',                       compute: eventsInsight },
  { key: 'event_registrations',  label: 'Event Registrations', unlocksHint: 'Member event-engagement scoring',             compute: eventRegistrationsInsight },
  { key: 'email_campaigns',      label: 'Email Campaigns',     unlocksHint: 'Campaign cadence tracking',                  compute: emailCampaignsInsight },
  { key: 'email_events',          label: 'Email Events',        unlocksHint: 'Open/click rates, member engagement',        compute: emailEventsInsight },
  { key: 'member_invoices',       label: 'Member Invoices',     unlocksHint: 'AR aging, balance tracking',                 compute: memberInvoicesInsight },
  { key: 'membership_types',     label: 'Membership Types',    unlocksHint: 'Tier definitions, revenue mix by tier',      compute: membershipTypesInsight },
  { key: 'complaints',           label: 'Complaints',          unlocksHint: 'Service Recovery agent triggers',            compute: complaintsInsight },
  { key: 'service_requests',     label: 'Service Requests',    unlocksHint: 'Open ticket tracking',                       compute: serviceRequestsInsight },
  { key: 'club_profile',         label: 'Club Profile',        unlocksHint: 'Club header, founded year, capacity',        compute: clubProfileInsight },
];

async function stageInsightsHandler(req, res) {
  const clubId = getReadClubId(req);
  const insights = await Promise.all(
    STAGES.map(async stage => {
      try {
        const result = await stage.compute(clubId);
        if (result) {
          return {
            stage: stage.key,
            label: stage.label,
            unlocked: true,
            ...result,
          };
        }
      } catch (err) {
        // Don't let one broken stage hide the others
        return {
          stage: stage.key,
          label: stage.label,
          unlocked: false,
          headline: stage.label + ' — query error',
          metric: null,
          bullets: [String(err.message).slice(0, 100)],
        };
      }
      return {
        stage: stage.key,
        label: stage.label,
        unlocked: false,
        headline: `${stage.label} not imported yet`,
        metric: null,
        bullets: [`Import to unlock: ${stage.unlocksHint}`],
      };
    }),
  );
  const unlockedCount = insights.filter(i => i.unlocked).length;
  return res.status(200).json({
    insights,
    unlockedCount,
    totalStages: STAGES.length,
  });
}

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || req.query?.clubId, userId: 'cron', role: 'system' };
    return stageInsightsHandler(req, res);
  }
  return withAuth(stageInsightsHandler)(req, res);
}
