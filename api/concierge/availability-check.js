/**
 * POST /api/concierge/availability-check
 *
 * Real-Time Availability Broker — checks tee sheet, weather, and social
 * graph to return the best available slots near a member's preferred time.
 *
 * Body: { club_id, member_id, date, preferred_time }
 * Returns: { available_slots: [{ time, course, weather, partners_nearby }] }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clubId = getReadClubId(req);
  const { member_id, date, preferred_time } = req.body;

  if (!member_id) return res.status(400).json({ error: 'member_id is required' });
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!preferred_time) return res.status(400).json({ error: 'preferred_time is required' });

  try {
    // 1. Find open slots near preferred_time on the requested date
    //    We look for bookings on that date and find gaps in the tee sheet.
    const bookingsResult = await sql`
      SELECT b.booking_id, b.tee_time, b.course_name, b.players_count,
             array_agg(bp.member_id::text) AS player_ids
      FROM tee_sheet_bookings b
      LEFT JOIN booking_players bp ON bp.booking_id = b.booking_id
      WHERE b.club_id = ${clubId}
        AND b.booking_date = ${date}
        AND b.status != 'cancelled'
      GROUP BY b.booking_id, b.tee_time, b.course_name, b.players_count
      ORDER BY b.tee_time
    `;

    // 2. Check weather for the date
    let weather = { conditions: 'clear', high_temp: 75, low_temp: 60 };
    try {
      const weatherResult = await sql`
        SELECT conditions, high_temp, low_temp, wind_speed
        FROM weather_forecasts
        WHERE club_id = ${clubId} AND forecast_date = ${date}
        LIMIT 1
      `;
      if (weatherResult.rows.length) weather = weatherResult.rows[0];
    } catch {}

    // 3. Find the member's known golf partners (people they've played with before)
    let partnerIds = [];
    try {
      const partnersResult = await sql`
        SELECT DISTINCT bp2.member_id::text AS partner_id,
               m.first_name, m.last_name
        FROM booking_players bp1
        JOIN tee_sheet_bookings b ON b.booking_id = bp1.booking_id
        JOIN booking_players bp2 ON bp2.booking_id = b.booking_id AND bp2.member_id != bp1.member_id
        JOIN members m ON m.member_id = bp2.member_id AND m.club_id = ${clubId}
        WHERE bp1.member_id = ${member_id} AND b.club_id = ${clubId}
        LIMIT 20
      `;
      partnerIds = partnersResult.rows;
    } catch {}

    // 4. Check which partners have bookings on the requested date
    const partnerBookings = new Map();
    for (const booking of bookingsResult.rows) {
      const playerIds = booking.player_ids || [];
      for (const pid of playerIds) {
        const partner = partnerIds.find(p => p.partner_id === pid);
        if (partner) {
          if (!partnerBookings.has(pid)) {
            partnerBookings.set(pid, {
              member_id: pid,
              name: `${partner.first_name} ${partner.last_name}`.trim(),
              times: [],
            });
          }
          partnerBookings.get(pid).times.push(booking.tee_time);
        }
      }
    }

    // 5. Build available slots — find times near preferred_time that aren't fully booked
    //    Standard tee sheet: 7-minute intervals, 6 AM to 5 PM
    const bookedTimes = new Set(bookingsResult.rows.map(b => b.tee_time));
    const courses = ['North Course', 'South Course'];
    const preferredMinutes = parseTimeToMinutes(preferred_time);

    const slots = [];
    for (let offsetMin = 0; offsetMin <= 60; offsetMin += 7) {
      for (const sign of [0, 1, -1]) {
        const candidateMin = preferredMinutes + (sign * offsetMin);
        if (candidateMin < 360 || candidateMin > 1020) continue; // 6 AM - 5 PM
        const timeStr = minutesToTime(candidateMin);

        for (const course of courses) {
          const courseBookings = bookingsResult.rows.filter(
            b => b.tee_time === timeStr && b.course_name === course
          );
          if (courseBookings.length === 0) {
            // Find partners playing nearby (within 30 min)
            const nearbyPartners = [];
            for (const [, p] of partnerBookings) {
              const hasNearby = p.times.some(t => {
                const pMin = parseTimeToMinutes(t);
                return Math.abs(pMin - candidateMin) <= 30;
              });
              if (hasNearby) nearbyPartners.push(p.name);
            }

            slots.push({
              time: timeStr,
              course,
              weather: {
                conditions: weather.conditions,
                high_temp: weather.high_temp,
                wind_speed: weather.wind_speed || null,
              },
              partners_nearby: nearbyPartners,
            });
          }
        }
        if (sign === 0) break; // only process offset=0 once
      }
      if (slots.length >= 8) break;
    }

    return res.status(200).json({
      member_id,
      date,
      preferred_time,
      available_slots: slots.slice(0, 8),
      weather_summary: `${weather.high_temp}°F, ${weather.conditions}`,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/concierge/availability-check error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function parseTimeToMinutes(timeStr) {
  // Accept "7:00 AM", "14:00", "2:00 PM", etc.
  const cleaned = (timeStr || '7:00 AM').trim().toUpperCase();
  const pmMatch = cleaned.includes('PM');
  const amMatch = cleaned.includes('AM');
  const parts = cleaned.replace(/[APM\s]/g, '').split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || '0', 10);
  if (pmMatch && hours < 12) hours += 12;
  if (amMatch && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export default withAuth(handler, { allowDemo: true });
