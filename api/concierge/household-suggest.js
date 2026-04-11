/**
 * POST /api/concierge/household-suggest
 *
 * Household coordination suggestions.
 * For each household member, finds free windows and matches against
 * club events, tee times, and dining availability.
 *
 * Body: {
 *   club_id, member_id,
 *   household_calendars: { "member_name": [{ start, end }] }
 * }
 * Returns: { suggestions: [{ household_member, event, date, reason }] }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function isTimeBusy(date, time, busyBlocks = []) {
  const slotStart = new Date(`${date}T${time}:00`);
  const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);
  return busyBlocks.some((b) => {
    const bStart = new Date(b.start);
    const bEnd = new Date(b.end);
    return slotStart < bEnd && slotEnd > bStart;
  });
}

// Interest matching: map membership type / archetype keywords to event types
const INTEREST_MAP = {
  junior: ['golf_tournament', 'league', 'social'],
  jr: ['golf_tournament', 'league', 'social'],
  social: ['social', 'dining'],
  spouse: ['social', 'dining'],
  golfer: ['golf_tournament', 'league'],
  balanced: ['golf_tournament', 'social', 'dining'],
  'die-hard': ['golf_tournament', 'league'],
};

function inferInterests(member) {
  const type = (member.membership_type || '').toLowerCase();
  const archetype = (member.archetype || '').toLowerCase();
  const combined = `${type} ${archetype}`;

  for (const [keyword, types] of Object.entries(INTEREST_MAP)) {
    if (combined.includes(keyword)) return types;
  }
  return ['golf_tournament', 'social', 'dining']; // default
}

export default withAuth(
  async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clubId = getReadClubId(req);
    const { member_id, household_calendars = {} } = req.body || {};

    if (!member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    try {
      // --- Load household members ---
      let householdMembers = [];
      try {
        const hRes = await sql`
          SELECT m.member_id, m.first_name, m.last_name, m.membership_type,
                 m.archetype, m.household_id
          FROM members m
          WHERE m.household_id = (
            SELECT household_id FROM members WHERE member_id = ${member_id} AND club_id = ${clubId}
          )
          AND m.club_id = ${clubId}
          ORDER BY m.join_date
        `;
        householdMembers = hRes.rows;
      } catch {
        // fall back to just the requesting member
      }

      if (!householdMembers.length) {
        // Try loading just the requesting member
        try {
          const mRes = await sql`
            SELECT member_id, first_name, last_name, membership_type, archetype, household_id
            FROM members
            WHERE member_id = ${member_id} AND club_id = ${clubId}
          `;
          householdMembers = mRes.rows;
        } catch {
          return res.status(404).json({ error: 'Member not found' });
        }
      }

      // --- Date range: next 7 days ---
      const now = new Date();
      const dates = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        dates.push(toISODate(d));
      }
      const dateStart = dates[0];
      const dateEnd = dates[dates.length - 1];

      // --- Load upcoming club events ---
      let events = [];
      try {
        const eRes = await sql`
          SELECT event_id, name, type, event_date, capacity, registration_fee, description
          FROM event_definitions
          WHERE club_id = ${clubId}
            AND event_date >= ${dateStart}
            AND event_date <= ${dateEnd}
          ORDER BY event_date
        `;
        events = eRes.rows;
      } catch {
        // event_definitions table may not exist
      }

      // --- Load already-registered events ---
      const memberIds = householdMembers.map((m) => m.member_id);
      let registrations = new Set();
      try {
        const rRes = await sql`
          SELECT event_id, member_id
          FROM event_registrations
          WHERE member_id = ANY(${memberIds})
            AND status IN ('registered', 'attended')
        `;
        for (const r of rRes.rows) {
          registrations.add(`${r.member_id}|${r.event_id}`);
        }
      } catch {
        // table may not exist
      }

      // --- Load open tee times ---
      let openTeeSlots = [];
      try {
        const tRes = await sql`
          SELECT booking_date, tee_time, course_id
          FROM bookings
          WHERE club_id = ${clubId}
            AND booking_date >= ${dateStart}
            AND booking_date <= ${dateEnd}
            AND status = 'confirmed'
          ORDER BY booking_date, tee_time
        `;
        const bookedSet = new Set(tRes.rows.map((r) => `${r.booking_date}|${r.tee_time}`));
        // Generate open morning slots
        for (const date of dates) {
          for (let h = 7; h <= 15; h++) {
            for (const m of ['00', '30']) {
              const time = `${String(h).padStart(2, '0')}:${m}`;
              if (!bookedSet.has(`${date}|${time}`)) {
                openTeeSlots.push({ date, time });
              }
            }
          }
        }
      } catch {
        // bookings table may not exist
      }

      // --- Load weather ---
      let weatherByDate = {};
      try {
        const wRes = await sql`
          SELECT date, condition, temp_high FROM weather_daily
          WHERE date >= ${dateStart} AND date <= ${dateEnd}
        `;
        for (const w of wRes.rows) {
          weatherByDate[w.date] = w;
        }
      } catch {
        // ignore
      }

      // --- Generate suggestions per household member ---
      const suggestions = [];

      for (const member of householdMembers) {
        const fullName = `${member.first_name} ${member.last_name}`;
        const busyTimes = household_calendars[fullName] ||
          household_calendars[member.first_name] ||
          household_calendars[member.member_id] ||
          [];
        const interests = inferInterests(member);

        // Match events
        for (const event of events) {
          if (registrations.has(`${member.member_id}|${event.event_id}`)) continue;
          if (!interests.includes(event.type)) continue;
          if (isTimeBusy(event.event_date, '10:00', busyTimes)) continue;

          const weather = weatherByDate[event.event_date];
          const weatherNote = weather ? ` (${weather.condition}, ${weather.temp_high}°F)` : '';

          suggestions.push({
            household_member: fullName,
            member_id: member.member_id,
            event: event.name,
            event_type: event.type,
            date: event.event_date,
            reason: `Matches ${member.first_name}'s interests (${event.type})${weatherNote}`,
          });
        }

        // Suggest tee times for golf-eligible members
        if (interests.includes('golf_tournament') || interests.includes('league')) {
          const bestTeeSlots = openTeeSlots
            .filter((s) => !isTimeBusy(s.date, s.time, busyTimes))
            .filter((s) => {
              const w = weatherByDate[s.date];
              return !w || ['sunny', 'perfect', 'cloudy'].includes(w.condition);
            })
            .slice(0, 2);

          for (const slot of bestTeeSlots) {
            const weather = weatherByDate[slot.date];
            const weatherNote = weather ? ` (${weather.condition}, ${weather.temp_high}°F)` : '';

            suggestions.push({
              household_member: fullName,
              member_id: member.member_id,
              event: 'Open tee time',
              event_type: 'tee_time',
              date: slot.date,
              time: slot.time,
              reason: `Open slot on good weather day${weatherNote}`,
            });
          }
        }
      }

      // Sort: events first, then tee times, by date
      suggestions.sort((a, b) => {
        if (a.event_type !== 'tee_time' && b.event_type === 'tee_time') return -1;
        if (a.event_type === 'tee_time' && b.event_type !== 'tee_time') return 1;
        return a.date.localeCompare(b.date);
      });

      return res.status(200).json({
        household: householdMembers.map((m) => ({
          member_id: m.member_id,
          name: `${m.first_name} ${m.last_name}`,
          type: m.membership_type,
          archetype: m.archetype,
        })),
        suggestions: suggestions.slice(0, 10),
      });
    } catch (err) {
      console.error('household-suggest error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  { allowDemo: true }
);
