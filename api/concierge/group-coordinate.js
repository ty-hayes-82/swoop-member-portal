/**
 * POST /api/concierge/group-coordinate
 *
 * Group Coordination — finds the best tee time for a group of members by
 * checking each invitee's calendar conflicts and tee sheet bookings, then
 * proposing a time that works for all (or most).
 *
 * Body: { club_id, organizer_id, date, time, invitees: [member_id] }
 * Returns: { proposed_time, confirmed: [], conflicts: [{ member, conflict_reason, alternative }] }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clubId = getReadClubId(req);
  const { organizer_id, date, time, invitees } = req.body;

  if (!organizer_id) return res.status(400).json({ error: 'organizer_id is required' });
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!invitees || !Array.isArray(invitees) || invitees.length === 0) {
    return res.status(400).json({ error: 'invitees array is required and must not be empty' });
  }

  const preferredTime = time || '8:00 AM';
  const allMembers = [organizer_id, ...invitees];

  try {
    // 1. Load member names for all participants
    const memberNames = new Map();
    try {
      const namesResult = await sql`
        SELECT member_id::text, first_name, last_name
        FROM members
        WHERE club_id = ${clubId} AND member_id = ANY(${allMembers})
      `;
      for (const r of namesResult.rows) {
        memberNames.set(r.member_id, `${r.first_name} ${r.last_name}`.trim());
      }
    } catch {}

    // 2. Check existing bookings for each member on the requested date
    const memberConflicts = new Map();
    try {
      const bookingsResult = await sql`
        SELECT bp.member_id::text, b.tee_time, b.course_name, b.booking_date
        FROM booking_players bp
        JOIN tee_sheet_bookings b ON b.booking_id = bp.booking_id
        WHERE b.club_id = ${clubId}
          AND b.booking_date = ${date}
          AND b.status != 'cancelled'
          AND bp.member_id = ANY(${allMembers})
      `;
      for (const r of bookingsResult.rows) {
        if (!memberConflicts.has(r.member_id)) memberConflicts.set(r.member_id, []);
        memberConflicts.get(r.member_id).push({
          type: 'tee_time',
          time: r.tee_time,
          detail: `Already booked at ${r.tee_time} on ${r.course_name}`,
        });
      }
    } catch {}

    // 3. Check dining reservations for conflicts
    try {
      const diningResult = await sql`
        SELECT member_id::text, reservation_time, outlet_name
        FROM dining_reservations
        WHERE club_id = ${clubId}
          AND reservation_date = ${date}
          AND status != 'cancelled'
          AND member_id = ANY(${allMembers})
      `;
      for (const r of diningResult.rows) {
        if (!memberConflicts.has(r.member_id)) memberConflicts.set(r.member_id, []);
        memberConflicts.get(r.member_id).push({
          type: 'dining',
          time: r.reservation_time,
          detail: `Dining reservation at ${r.reservation_time} at ${r.outlet_name}`,
        });
      }
    } catch {}

    // 4. Check event RSVPs for conflicts
    try {
      const eventsResult = await sql`
        SELECT er.member_id::text, ce.event_date, ce.event_time, ce.title
        FROM event_rsvps er
        JOIN club_events ce ON ce.event_id = er.event_id
        WHERE ce.club_id = ${clubId}
          AND ce.event_date = ${date}
          AND er.member_id = ANY(${allMembers})
      `;
      for (const r of eventsResult.rows) {
        if (!memberConflicts.has(r.member_id)) memberConflicts.set(r.member_id, []);
        memberConflicts.get(r.member_id).push({
          type: 'event',
          time: r.event_time,
          detail: `RSVP'd to "${r.title}" at ${r.event_time}`,
        });
      }
    } catch {}

    // 5. Determine who can make the preferred time vs. who has conflicts
    const preferredMinutes = parseTimeToMinutes(preferredTime);
    const confirmed = [];
    const conflicts = [];

    for (const memberId of allMembers) {
      const name = memberNames.get(memberId) || memberId;
      const memberConfs = memberConflicts.get(memberId) || [];

      // Check if any conflict overlaps with preferred time (within 3-hour window)
      const blocking = memberConfs.find(c => {
        const confMinutes = parseTimeToMinutes(c.time);
        return Math.abs(confMinutes - preferredMinutes) < 180; // 3-hour buffer
      });

      if (blocking) {
        // Suggest an alternative time that avoids this conflict
        const conflictMin = parseTimeToMinutes(blocking.time);
        const altMinutes = conflictMin > preferredMinutes
          ? preferredMinutes - 120  // 2 hours earlier
          : preferredMinutes + 120; // 2 hours later
        const altTime = minutesToTime(Math.max(360, Math.min(1020, altMinutes)));

        conflicts.push({
          member_id: memberId,
          member: name,
          conflict_reason: blocking.detail,
          alternative: altTime,
        });
      } else {
        confirmed.push({
          member_id: memberId,
          member: name,
        });
      }
    }

    // 6. Find the best proposed time
    //    If everyone is confirmed, use preferred time.
    //    If there are conflicts, try to find a time that works for all.
    let proposedTime = preferredTime;
    if (conflicts.length > 0 && confirmed.length >= conflicts.length) {
      // Majority can make preferred time — keep it
      proposedTime = preferredTime;
    } else if (conflicts.length > confirmed.length) {
      // Try the most common alternative
      const altTimes = conflicts.map(c => c.alternative);
      const timeFreq = {};
      for (const t of altTimes) { timeFreq[t] = (timeFreq[t] || 0) + 1; }
      const bestAlt = Object.entries(timeFreq).sort((a, b) => b[1] - a[1])[0];
      if (bestAlt) proposedTime = bestAlt[0];
    }

    return res.status(200).json({
      organizer_id,
      organizer_name: memberNames.get(organizer_id) || organizer_id,
      date,
      requested_time: preferredTime,
      proposed_time: proposedTime,
      group_size: allMembers.length,
      confirmed,
      conflicts,
      all_clear: conflicts.length === 0,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/concierge/group-coordinate error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function parseTimeToMinutes(timeStr) {
  const cleaned = (timeStr || '8:00 AM').trim().toUpperCase();
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
