/**
 * POST /api/concierge/calendar-suggest
 *
 * Calendar-aware scheduling suggestions.
 * Finds free windows in the next 7 days, cross-references tee sheet
 * availability, weather forecasts, and member preferences.
 *
 * Body: { club_id, member_id, calendar_events: [{ start, end }] }
 * Returns: { suggestions: [{ date, time, course, weather, reason }] }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function generateTimeSlots(startHour = 7, endHour = 17, intervalMin = 30) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMin) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

function isSlotBusy(date, time, busyBlocks) {
  const slotStart = new Date(`${date}T${time}:00`);
  const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000); // 2h block
  return busyBlocks.some((b) => {
    const bStart = new Date(b.start);
    const bEnd = new Date(b.end);
    return slotStart < bEnd && slotEnd > bStart;
  });
}

export default withAuth(
  async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clubId = getReadClubId(req);
    const { member_id, calendar_events = [] } = req.body || {};

    if (!member_id) {
      return res.status(400).json({ error: 'member_id is required' });
    }

    try {
      const now = new Date();
      const dates = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        dates.push(toISODate(d));
      }
      const dateStart = dates[0];
      const dateEnd = dates[dates.length - 1];

      // --- Load member preferences ---
      let memberPrefs = {};
      try {
        const mRes = await sql`
          SELECT first_name, last_name, tee_time_preference, dining_preference,
                 preferred_dining_spot, archetype
          FROM members
          WHERE member_id = ${member_id} AND club_id = ${clubId}
        `;
        if (mRes.rows.length) memberPrefs = mRes.rows[0];
      } catch {
        // members table query failed
      }

      // --- Load booked tee times (to find open slots) ---
      let bookedSlots = [];
      try {
        const bRes = await sql`
          SELECT booking_date, tee_time, course_id, player_count
          FROM bookings
          WHERE club_id = ${clubId}
            AND booking_date >= ${dateStart}
            AND booking_date <= ${dateEnd}
            AND status IN ('confirmed', 'completed')
          ORDER BY booking_date, tee_time
        `;
        bookedSlots = bRes.rows;
      } catch {
        // bookings table may not exist
      }

      // --- Load courses ---
      let courses = [];
      try {
        const cRes = await sql`
          SELECT course_id, name, first_tee, last_tee, tee_interval_min
          FROM courses WHERE club_id = ${clubId}
        `;
        courses = cRes.rows;
      } catch {
        // courses table may not exist
      }
      if (!courses.length) {
        courses = [{ course_id: 'course_main', name: 'Main Course', first_tee: '07:00', last_tee: '16:00', tee_interval_min: 10 }];
      }

      // --- Load weather forecasts ---
      let weatherByDate = {};
      try {
        const wRes = await sql`
          SELECT date, condition, temp_high, temp_low, wind_mph, precipitation_in, golf_demand_modifier
          FROM weather_daily
          WHERE date >= ${dateStart} AND date <= ${dateEnd}
        `;
        for (const row of wRes.rows) {
          weatherByDate[row.date] = row;
        }
      } catch {
        // weather_daily table may not exist
      }

      // --- Build booked-slot index for quick lookup ---
      const bookedIndex = new Set();
      for (const b of bookedSlots) {
        bookedIndex.add(`${b.booking_date}|${b.tee_time}|${b.course_id}`);
      }

      // --- Parse member preferred time ---
      const prefTime = memberPrefs.tee_time_preference || '';
      const prefHour = prefTime.match(/(\d{1,2})/)?.[1];
      const preferredHour = prefHour ? parseInt(prefHour, 10) : null;

      // --- Score and collect suggestions ---
      const allSlots = generateTimeSlots(7, 16, 30);
      const candidates = [];

      for (const date of dates) {
        const weather = weatherByDate[date] || null;
        const isGoodWeather =
          weather &&
          ['sunny', 'perfect', 'cloudy'].includes(weather.condition) &&
          (weather.wind_mph == null || weather.wind_mph < 20) &&
          (weather.precipitation_in == null || weather.precipitation_in < 0.1);

        for (const course of courses) {
          for (const time of allSlots) {
            // Skip if booked
            if (bookedIndex.has(`${date}|${time}|${course.course_id}`)) continue;

            // Skip if member is busy
            if (isSlotBusy(date, time, calendar_events)) continue;

            // Score the slot
            let score = 0;
            const reasons = [];

            if (isGoodWeather) {
              score += 3;
              reasons.push(`${weather.condition}, ${weather.temp_high}°F`);
            } else if (weather) {
              score += 1;
            }

            const slotHour = parseInt(time.split(':')[0], 10);
            if (preferredHour && Math.abs(slotHour - preferredHour) <= 1) {
              score += 2;
              reasons.push('matches your usual tee time');
            }

            // Prefer weekend
            const dayOfWeek = new Date(date).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              score += 1;
              reasons.push('weekend');
            }

            candidates.push({
              date,
              time,
              course: course.name,
              course_id: course.course_id,
              weather: weather
                ? { condition: weather.condition, high: weather.temp_high, low: weather.temp_low, wind: weather.wind_mph }
                : null,
              score,
              reason: reasons.length ? reasons.join('; ') : 'open slot',
            });
          }
        }
      }

      // Sort by score desc, take top 5
      candidates.sort((a, b) => b.score - a.score);
      const suggestions = candidates.slice(0, 5).map(({ score, course_id, ...rest }) => rest);

      return res.status(200).json({
        member: memberPrefs.first_name
          ? `${memberPrefs.first_name} ${memberPrefs.last_name}`
          : member_id,
        preferences: {
          tee_time: memberPrefs.tee_time_preference || null,
          archetype: memberPrefs.archetype || null,
        },
        suggestions,
      });
    } catch (err) {
      console.error('calendar-suggest error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  { allowDemo: true }
);
