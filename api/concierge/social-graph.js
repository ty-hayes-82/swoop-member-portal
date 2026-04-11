/**
 * GET /api/concierge/social-graph
 *
 * Builds a social graph for a member based on co-bookings, co-dining,
 * co-event attendance, and referrals/sponsorships.
 *
 * Query: ?club_id=&member_id=
 *
 * Returns top 5 connections with interaction frequency across:
 *   frequent_golf_partners, dining_companions, event_buddies, referrals
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

/**
 * Merge connection maps into a single ranked list.
 */
function buildTopConnections(golfMap, diningMap, eventMap, referralSet) {
  const combined = new Map();

  for (const [id, info] of golfMap) {
    if (!combined.has(id)) combined.set(id, { member_id: id, name: info.name, golf: 0, dining: 0, events: 0, referral: false });
    combined.get(id).golf = info.count;
  }

  for (const [id, info] of diningMap) {
    if (!combined.has(id)) combined.set(id, { member_id: id, name: info.name, golf: 0, dining: 0, events: 0, referral: false });
    combined.get(id).dining = info.count;
  }

  for (const [id, info] of eventMap) {
    if (!combined.has(id)) combined.set(id, { member_id: id, name: info.name, golf: 0, dining: 0, events: 0, referral: false });
    combined.get(id).events = info.count;
  }

  for (const id of referralSet) {
    if (combined.has(id)) combined.get(id).referral = true;
  }

  // Score: golf counts 3x (intentional invite), dining 2x, events 1x, referral bonus
  const scored = [...combined.values()].map(c => ({
    ...c,
    total_interactions: c.golf + c.dining + c.events,
    score: c.golf * 3 + c.dining * 2 + c.events + (c.referral ? 5 : 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const memberId = req.query.member_id;

  if (!memberId) return res.status(400).json({ error: 'member_id query parameter is required' });

  try {
    // 1. Golf partners: other players in the same bookings
    const golfPartners = new Map();
    try {
      const golfResult = await sql`
        SELECT m.member_id::text AS partner_id,
               m.first_name || ' ' || m.last_name AS partner_name,
               COUNT(*) AS times_played
        FROM booking_players bp1
        JOIN booking_players bp2 ON bp2.booking_id = bp1.booking_id AND bp2.member_id != bp1.member_id
        JOIN members m ON m.member_id = bp2.member_id
        WHERE bp1.member_id = ${memberId}
          AND bp2.member_id IS NOT NULL
        GROUP BY m.member_id, m.first_name, m.last_name
        ORDER BY times_played DESC
        LIMIT 10
      `;
      for (const row of golfResult.rows) {
        golfPartners.set(row.partner_id, { name: row.partner_name, count: parseInt(row.times_played, 10) });
      }
    } catch (e) {
      console.warn('[social-graph] golf partners query error:', e.message);
    }

    // 2. Dining companions: other members with checks at the same outlet on same day, close timestamps
    const diningCompanions = new Map();
    try {
      const diningResult = await sql`
        SELECT m.member_id::text AS companion_id,
               m.first_name || ' ' || m.last_name AS companion_name,
               COUNT(*) AS times_dined
        FROM pos_checks c1
        JOIN pos_checks c2 ON c2.outlet_id = c1.outlet_id
          AND c2.member_id != c1.member_id
          AND c2.member_id IS NOT NULL
          AND DATE(c2.opened_at) = DATE(c1.opened_at)
          AND ABS(EXTRACT(EPOCH FROM (c2.opened_at::timestamp - c1.opened_at::timestamp))) < 3600
        JOIN members m ON m.member_id = c2.member_id
        WHERE c1.member_id = ${memberId}
        GROUP BY m.member_id, m.first_name, m.last_name
        ORDER BY times_dined DESC
        LIMIT 10
      `;
      for (const row of diningResult.rows) {
        diningCompanions.set(row.companion_id, { name: row.companion_name, count: parseInt(row.times_dined, 10) });
      }
    } catch (e) {
      console.warn('[social-graph] dining companions query error:', e.message);
    }

    // 3. Event buddies: other members registered for the same events
    const eventBuddies = new Map();
    try {
      const eventResult = await sql`
        SELECT m.member_id::text AS buddy_id,
               m.first_name || ' ' || m.last_name AS buddy_name,
               COUNT(*) AS events_shared
        FROM event_registrations er1
        JOIN event_registrations er2 ON er2.event_id = er1.event_id AND er2.member_id != er1.member_id
        JOIN members m ON m.member_id = er2.member_id
        WHERE er1.member_id = ${memberId}
          AND er1.status IN ('registered', 'attended')
          AND er2.status IN ('registered', 'attended')
        GROUP BY m.member_id, m.first_name, m.last_name
        ORDER BY events_shared DESC
        LIMIT 10
      `;
      for (const row of eventResult.rows) {
        eventBuddies.set(row.buddy_id, { name: row.buddy_name, count: parseInt(row.events_shared, 10) });
      }
    } catch (e) {
      console.warn('[social-graph] event buddies query error:', e.message);
    }

    // 4. Referrals/sponsorships: check household links as proxy (no dedicated referral table)
    const referrals = new Set();
    try {
      const refResult = await sql`
        SELECT m2.member_id::text AS related_id
        FROM members m1
        JOIN members m2 ON m2.household_id = m1.household_id AND m2.member_id != m1.member_id
        WHERE m1.member_id = ${memberId} AND m1.household_id IS NOT NULL
      `;
      for (const row of refResult.rows) {
        referrals.add(row.related_id);
      }
    } catch (e) {
      console.warn('[social-graph] referrals query error:', e.message);
    }

    // Build top connections
    const topConnections = buildTopConnections(golfPartners, diningCompanions, eventBuddies, referrals);

    return res.status(200).json({
      member_id: memberId,
      frequent_golf_partners: [...golfPartners.entries()].map(([id, info]) => ({
        member_id: id, name: info.name, rounds_together: info.count,
      })).slice(0, 5),
      dining_companions: [...diningCompanions.entries()].map(([id, info]) => ({
        member_id: id, name: info.name, meals_together: info.count,
      })).slice(0, 5),
      event_buddies: [...eventBuddies.entries()].map(([id, info]) => ({
        member_id: id, name: info.name, events_shared: info.count,
      })).slice(0, 5),
      referrals: [...referrals].map(id => ({ member_id: id })),
      top_connections: topConnections,
    });
  } catch (err) {
    console.error('[social-graph] error:', err);
    return res.status(500).json({ error: 'Failed to build social graph' });
  }
}

export default withAuth(handler, { allowDemo: true });
