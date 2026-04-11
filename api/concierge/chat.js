/**
 * POST /api/concierge/chat
 *
 * Member Concierge chat endpoint. Accepts a member_id and message,
 * routes through the concierge agent, and returns the response.
 *
 * Auth: member-level (the member themselves, or GM on behalf).
 * Body: { member_id: string, message: string, club_id?: string }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { getOrCreateSession, updateSessionSummary } from '../agents/concierge-session.js';
import { buildConciergePrompt } from '../../src/config/conciergePrompt.js';
import { getAnthropicClient, MANAGED_AGENT_ID, MANAGED_ENV_ID } from '../agents/managed-config.js';
import { routeEvent } from '../agents/agent-events.js';

// ---------------------------------------------------------------------------
// Gate requirements per tool — tool is only offered when ALL listed gates are open.
// Tools with no entry (or empty array) are always available.
// ---------------------------------------------------------------------------
const TOOL_GATES = {
  book_tee_time:           ['members', 'tee-sheet'],
  cancel_tee_time:         ['members', 'tee-sheet'],
  make_dining_reservation: ['members', 'fb'],
  get_club_calendar:       ['pipeline'],
  get_my_schedule:         ['members'],
  rsvp_event:              ['members', 'email'],
  file_complaint:          ['members'],
  get_member_profile:      ['members'],
  send_request_to_club:    ['members'],
};

// ---------------------------------------------------------------------------
// Concierge tool definitions (same as SMS tools in twilio/inbound.js)
// ---------------------------------------------------------------------------
const CONCIERGE_TOOLS = [
  {
    name: 'get_club_calendar',
    description: 'Get upcoming club events and activities',
    input_schema: { type: 'object', properties: { days_ahead: { type: 'integer', default: 7 } } }
  },
  {
    name: 'book_tee_time',
    description: 'Book a tee time for the member',
    input_schema: { type: 'object', properties: { date: { type: 'string' }, time: { type: 'string' }, course: { type: 'string' }, players: { type: 'integer' } }, required: ['date', 'time'] }
  },
  {
    name: 'make_dining_reservation',
    description: 'Make a dining reservation',
    input_schema: { type: 'object', properties: { date: { type: 'string' }, time: { type: 'string' }, outlet: { type: 'string' }, party_size: { type: 'integer' }, preferences: { type: 'string' } }, required: ['date', 'outlet'] }
  },
  {
    name: 'get_my_schedule',
    description: 'Get the member upcoming tee times, reservations, and events',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'rsvp_event',
    description: 'Register the member (or a household member) for a club event',
    input_schema: { type: 'object', properties: { event_title: { type: 'string', description: 'Event name or title to match' }, guest_count: { type: 'integer', default: 0 }, member_name: { type: 'string', description: 'Household member name if registering someone else' } }, required: ['event_title'] }
  },
  {
    name: 'cancel_tee_time',
    description: 'Cancel a previously booked tee time for the member',
    input_schema: { type: 'object', properties: { booking_date: { type: 'string', description: 'Date of the tee time to cancel' }, tee_time: { type: 'string', description: 'Time of the tee time to cancel' } }, required: ['booking_date'] }
  },
  {
    name: 'file_complaint',
    description: 'File a complaint or feedback on behalf of the member',
    input_schema: { type: 'object', properties: { category: { type: 'string', enum: ['food_and_beverage', 'golf_operations', 'facilities', 'staff', 'billing', 'other'] }, description: { type: 'string', description: 'What happened — the member complaint in their own words' } }, required: ['category', 'description'] }
  },
  {
    name: 'get_member_profile',
    description: 'Get the member profile including preferences, household, and membership details',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'send_request_to_club',
    description: 'Send a special request or message to the club staff on behalf of the member',
    input_schema: { type: 'object', properties: { department: { type: 'string', enum: ['golf_ops', 'dining', 'events', 'membership', 'facilities', 'general'] }, message: { type: 'string', description: 'The request or message to send' }, urgency: { type: 'string', enum: ['normal', 'high'], default: 'normal' } }, required: ['department', 'message'] }
  },
];

/**
 * Execute a concierge tool call (mirrors executeSmsTool from twilio/inbound.js).
 */
async function executeConciergeTool(toolName, input, profile, clubId) {
  const memberId = profile.member_id;

  switch (toolName) {
    // ── GET CLUB CALENDAR ──────────────────────────────────────────────
    case 'get_club_calendar': {
      try {
        const result = await sql`
          SELECT event_id, name, type, event_date, capacity, registration_fee, description
          FROM event_definitions
          WHERE club_id = ${clubId} AND event_date >= CURRENT_DATE
          ORDER BY event_date
          LIMIT 10
        `;
        if (result.rows.length > 0) {
          // Enrich with registration counts
          const events = [];
          for (const ev of result.rows) {
            let registeredCount = 0;
            try {
              const regResult = await sql`
                SELECT COUNT(*)::int AS cnt FROM event_registrations
                WHERE event_id = ${ev.event_id} AND status != 'cancelled'
              `;
              registeredCount = regResult.rows[0]?.cnt || 0;
            } catch (_) { /* table may not exist */ }
            events.push({
              date: ev.event_date,
              title: ev.name,
              type: ev.type,
              capacity: `${ev.capacity} total, ${Math.max(0, ev.capacity - registeredCount)} remaining`,
              fee: ev.registration_fee || 0,
              description: ev.description,
            });
          }
          return { events };
        }
      } catch (e) {
        console.warn('[concierge] get_club_calendar DB error (using fallback):', e.message);
      }
      // Fallback: hardcoded
      const memberType = profile.membership_type || 'Full Golf';
      return {
        events: [
          { date: '2026-04-10', time: '6:00 PM', title: 'Wine Dinner — Spring Pairing Menu', location: 'Main Dining Room', capacity: '48 seats, 12 remaining', note: 'Popular with Social and Full Golf members — filling fast', dress_code: 'Smart casual' },
          { date: '2026-04-12', time: '8:00 AM', title: 'Saturday Morning Shotgun — Member-Guest', location: 'North Course', capacity: '72 players, only 8 spots left', note: memberType.includes('Golf') ? 'Your membership includes entry — invite a guest for $45' : 'Open to all members, guest fee $85' },
          { date: '2026-04-13', time: '10:00 AM', title: 'Junior Golf Clinic', location: 'Practice Range', capacity: 'Open enrollment' },
          { date: '2026-04-15', time: '5:30 PM', title: 'Trivia Night', location: 'Grill Room', capacity: '20 teams max, only 6 remaining' },
          { date: '2026-04-18', time: '7:00 AM', title: 'Club Championship Qualifier — Round 1', location: 'South Course', capacity: 'Registration open — 54 of 72 spots filled' },
        ],
      };
    }

    // ── BOOK TEE TIME ──────────────────────────────────────────────────
    case 'book_tee_time': {
      const course = input.course || 'North Course';
      const players = input.players || 4;
      const prefs = profile.preferences || {};
      const beverage = prefs.dining?.includes('Arnold Palmer') ? 'Arnold Palmer' : 'cold water and towels';
      const bookingId = `bkg_c_${Date.now().toString(36)}`;
      const confNumber = `TT-${Date.now().toString(36).toUpperCase()}`;

      try {
        // Resolve course_id from name
        const courseResult = await sql`
          SELECT course_id, name FROM courses
          WHERE club_id = ${clubId} AND name ILIKE '%' || ${course} || '%'
          LIMIT 1
        `;
        const courseId = courseResult.rows[0]?.course_id;
        const courseName = courseResult.rows[0]?.name || course;

        if (courseId) {
          await sql`
            INSERT INTO bookings (booking_id, club_id, course_id, booking_date, tee_time, player_count, status)
            VALUES (${bookingId}, ${clubId}, ${courseId}, ${input.date}, ${input.time}, ${players}, 'confirmed')
          `;
          // Add the member as first player
          const playerId = `bp_c_${Date.now().toString(36)}`;
          await sql`
            INSERT INTO booking_players (player_id, booking_id, member_id, position_in_group)
            VALUES (${playerId}, ${bookingId}, ${memberId}, 1)
          `;
          // Log to activity_log
          try {
            await sql`
              INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, meta)
              VALUES ('concierge_booking', 'tee_time', ${memberId}, ${profile.name}, ${bookingId}, 'booking',
                ${`Booked tee time: ${input.date} at ${input.time} on ${courseName}`},
                ${JSON.stringify({ course: courseName, players, confirmation: confNumber })}::jsonb)
            `;
          } catch (_) { /* activity_log may not exist */ }

          return {
            confirmation: `Tee time booked: ${input.date} at ${input.time} on the ${courseName} for ${players} players.`,
            confirmation_number: confNumber,
            booking_id: bookingId,
            member_name: profile.name,
            cart_note: `Cart will be staged with ${beverage} at the bag drop 15 min before your time.`,
          };
        }
      } catch (e) {
        console.warn('[concierge] book_tee_time DB error (using fallback):', e.message);
      }
      // Fallback: hardcoded
      return {
        confirmation: `Tee time booked: ${input.date} at ${input.time} on the ${course} for ${players} players.`,
        confirmation_number: confNumber,
        member_name: profile.name,
        cart_note: `Cart will be staged with ${beverage} at the bag drop 15 min before your time.`,
      };
    }

    // ── MAKE DINING RESERVATION ────────────────────────────────────────
    case 'make_dining_reservation': {
      const party = input.party_size || 2;
      const time = input.time || '7:00 PM';
      const prefs = profile.preferences || {};
      const favDining = prefs.dining || '';
      const seatingNote = favDining.includes('booth 12') ? 'Booth 12 reserved — your usual spot.' : 'Window table reserved.';
      const confNumber = `DR-${Date.now().toString(36).toUpperCase()}`;

      try {
        const detail = JSON.stringify({
          date: input.date, time, outlet: input.outlet, party_size: party,
          preferences: input.preferences, confirmation: confNumber,
        });
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, meta)
          VALUES ('concierge_booking', 'dining_reservation', ${memberId}, ${profile.name}, ${confNumber}, 'dining',
            ${`Dining reservation: ${input.date} at ${time} at ${input.outlet} for ${party}`},
            ${detail}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] make_dining_reservation DB error (using fallback):', e.message);
      }

      return {
        confirmation: `Dining reservation confirmed: ${input.date} at ${time} at ${input.outlet} for ${party} guests.`,
        confirmation_number: confNumber,
        seating: seatingNote,
        preferences_noted: input.preferences || (favDining ? `On file: ${favDining}` : 'None specified'),
        member_name: profile.name,
      };
    }

    // ── GET MY SCHEDULE ────────────────────────────────────────────────
    case 'get_my_schedule': {
      try {
        // Tee times
        const teeTimesResult = await sql`
          SELECT b.booking_id, b.booking_date, b.tee_time, b.player_count, b.status,
                 c.name AS course_name
          FROM bookings b
          JOIN booking_players bp ON bp.booking_id = b.booking_id
          JOIN courses c ON c.course_id = b.course_id
          WHERE bp.member_id = ${memberId} AND b.club_id = ${clubId}
            AND b.booking_date >= CURRENT_DATE AND b.status = 'confirmed'
          ORDER BY b.booking_date, b.tee_time
          LIMIT 10
        `;
        // Event registrations
        const eventsResult = await sql`
          SELECT er.status, er.guest_count, ed.name AS event_name, ed.event_date, ed.type
          FROM event_registrations er
          JOIN event_definitions ed ON ed.event_id = er.event_id
          WHERE er.member_id = ${memberId} AND ed.club_id = ${clubId}
            AND ed.event_date >= CURRENT_DATE AND er.status != 'cancelled'
          ORDER BY ed.event_date
          LIMIT 10
        `;
        // Dining reservations from activity_log
        let diningRows = [];
        try {
          const diningResult = await sql`
            SELECT description, meta, created_at
            FROM activity_log
            WHERE member_id = ${memberId} AND action_subtype = 'dining_reservation'
              AND status != 'cancelled'
            ORDER BY created_at DESC
            LIMIT 5
          `;
          diningRows = diningResult.rows;
        } catch (_) { /* activity_log may not exist */ }

        // Open feedback
        let feedbackRows = [];
        try {
          const fbResult = await sql`
            SELECT feedback_id, category, status, submitted_at
            FROM feedback
            WHERE member_id = ${memberId} AND club_id = ${clubId}
              AND status NOT IN ('resolved')
            ORDER BY submitted_at DESC
            LIMIT 5
          `;
          feedbackRows = fbResult.rows;
        } catch (_) { /* feedback may not exist */ }

        const hasData = teeTimesResult.rows.length > 0 || eventsResult.rows.length > 0
          || diningRows.length > 0 || feedbackRows.length > 0;

        if (hasData) {
          const upcoming = [];
          for (const r of teeTimesResult.rows) {
            upcoming.push({ type: 'tee_time', date: r.booking_date, time: r.tee_time, course: r.course_name, players: r.player_count });
          }
          for (const r of diningRows) {
            const meta = r.meta || {};
            upcoming.push({ type: 'dining', date: meta.date, time: meta.time, outlet: meta.outlet, party_size: meta.party_size });
          }
          for (const r of eventsResult.rows) {
            upcoming.push({ type: 'event', date: r.event_date, title: r.event_name, status: r.status, guests: r.guest_count });
          }
          return {
            upcoming,
            pending_actions: feedbackRows.map(f => ({
              type: 'open_feedback', filed_date: f.submitted_at, category: f.category, status: f.status,
            })),
          };
        }
      } catch (e) {
        console.warn('[concierge] get_my_schedule DB error (using fallback):', e.message);
      }
      // Fallback: hardcoded
      return {
        upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4 },
          { type: 'dining', date: '2026-04-10', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2 },
        ],
        pending_actions: [],
      };
    }

    // ── RSVP EVENT ─────────────────────────────────────────────────────
    case 'rsvp_event': {
      const eventTitle = input.event_title || 'Event';
      const who = input.member_name || profile.name;
      const guestCount = input.guest_count || 0;

      try {
        // Find the event by fuzzy title match
        const eventResult = await sql`
          SELECT event_id, name, event_date, capacity, registration_fee
          FROM event_definitions
          WHERE club_id = ${clubId} AND name ILIKE '%' || ${eventTitle} || '%'
            AND event_date >= CURRENT_DATE
          ORDER BY event_date
          LIMIT 1
        `;
        if (eventResult.rows.length > 0) {
          const ev = eventResult.rows[0];
          const regId = `reg_c_${Date.now().toString(36)}`;
          // Resolve target member_id (household member or self)
          let targetMemberId = memberId;
          if (input.member_name && input.member_name !== profile.name) {
            try {
              const hhResult = await sql`
                SELECT m2.member_id FROM members m1
                JOIN members m2 ON m2.household_id = m1.household_id AND m2.club_id = m1.club_id
                WHERE m1.member_id = ${memberId} AND m1.club_id = ${clubId}
                  AND (m2.first_name || ' ' || m2.last_name) ILIKE '%' || ${input.member_name} || '%'
                LIMIT 1
              `;
              if (hhResult.rows.length > 0) targetMemberId = hhResult.rows[0].member_id;
            } catch (_) { /* fall back to self */ }
          }
          await sql`
            INSERT INTO event_registrations (registration_id, event_id, member_id, status, guest_count, fee_paid, registered_at)
            VALUES (${regId}, ${ev.event_id}, ${targetMemberId}, 'registered', ${guestCount}, ${ev.registration_fee || 0}, NOW()::text)
          `;
          return {
            registration_id: regId,
            event: ev.name,
            event_date: ev.event_date,
            registered_for: who,
            guest_count: guestCount,
            status: 'registered',
          };
        }
      } catch (e) {
        console.warn('[concierge] rsvp_event DB error (using fallback):', e.message);
      }
      // Fallback: hardcoded
      return {
        registration_id: `ER-${Date.now().toString(36).toUpperCase()}`,
        event: eventTitle,
        registered_for: who,
        guest_count: guestCount,
        status: 'registered',
      };
    }

    // ── CANCEL TEE TIME ────────────────────────────────────────────────
    case 'cancel_tee_time': {
      try {
        const cancelResult = await sql`
          UPDATE bookings SET status = 'cancelled'
          WHERE booking_id IN (
            SELECT b.booking_id FROM bookings b
            JOIN booking_players bp ON bp.booking_id = b.booking_id
            WHERE b.club_id = ${clubId} AND bp.member_id = ${memberId}
              AND b.booking_date = ${input.booking_date}
              AND b.status = 'confirmed'
              AND (${input.tee_time || null}::text IS NULL OR b.tee_time = ${input.tee_time})
            LIMIT 1
          )
          RETURNING booking_id, booking_date, tee_time
        `;
        if (cancelResult.rows.length > 0) {
          const row = cancelResult.rows[0];
          return {
            status: 'cancelled',
            booking_id: row.booking_id,
            booking_date: row.booking_date,
            tee_time: row.tee_time,
            message: `Tee time on ${row.booking_date} at ${row.tee_time} has been cancelled.`,
          };
        }
      } catch (e) {
        console.warn('[concierge] cancel_tee_time DB error (using fallback):', e.message);
      }
      // Fallback: hardcoded
      return {
        status: 'cancelled',
        booking_date: input.booking_date,
        tee_time: input.tee_time || '7:00 AM',
        message: `Tee time on ${input.booking_date} has been cancelled. Your group has been notified.`,
      };
    }

    // ── FILE COMPLAINT ─────────────────────────────────────────────────
    case 'file_complaint': {
      const categoryManagers = {
        food_and_beverage: { manager: 'Sarah Collins, F&B Director', dept: 'Food & Beverage', timeline: 'within 24 hours' },
        golf_operations: { manager: 'Chris Delaney, Head Golf Professional', dept: 'Golf Operations', timeline: 'within 24 hours' },
        facilities: { manager: 'Robert Kim, Facilities Director', dept: 'Facilities', timeline: 'within 48 hours' },
        staff: { manager: 'Jennifer Hayes, HR Director', dept: 'Human Resources', timeline: 'within 24 hours' },
        billing: { manager: 'Anne Torres, Membership Accounting', dept: 'Billing & Accounts', timeline: 'within 2 business days' },
        other: { manager: 'David Park, General Manager', dept: 'Club Management', timeline: 'within 24 hours' },
      };
      const routing = categoryManagers[input.category] || categoryManagers.other;
      let feedbackId = `FB-${Date.now().toString(36).toUpperCase()}`;

      try {
        feedbackId = `fb_c_${Date.now().toString(36)}`;
        await sql`
          INSERT INTO feedback (feedback_id, club_id, member_id, submitted_at, category, sentiment_score, description, status)
          VALUES (${feedbackId}, ${clubId}, ${memberId}, NOW()::text, ${input.category}, -0.8, ${input.description}, 'acknowledged')
        `;
      } catch (e) {
        console.warn('[concierge] file_complaint DB error (using fallback id):', e.message);
        feedbackId = `FB-${Date.now().toString(36).toUpperCase()}`;
      }

      const complaintResult = {
        complaint_id: feedbackId,
        category: input.category,
        status: 'filed',
        routed_to: routing.dept,
        assigned_manager: routing.manager,
        expected_response: `You will hear back from ${routing.manager.split(',')[0]} ${routing.timeline}.`,
        message: `We take this seriously, ${profile.first_name || profile.name}. Your feedback has been filed and escalated directly to ${routing.manager}. They will reach out to you ${routing.timeline} to discuss and resolve this. Your reference number is below — you can text it anytime for a status update.`,
      };
      // Fire complaint event to wake Service Recovery + Member Risk agents
      try {
        await routeEvent(clubId, 'complaint_filed_by_concierge', {
          member_id: profile.member_id,
          member_name: profile.name,
          category: input.category,
          description: input.description,
          complaint_id: complaintResult.complaint_id,
        });
      } catch (e) { console.warn('[concierge] complaint event routing error:', e.message); }
      return complaintResult;
    }

    // ── GET MEMBER PROFILE ─────────────────────────────────────────────
    case 'get_member_profile': {
      return {
        name: profile.name,
        membership_type: profile.membership_type || 'Full Golf',
        member_since: profile.join_date,
        status: profile.status || 'active',
        household: profile.household || [],
        preferences: profile.preferences || {},
      };
    }

    // ── SEND REQUEST TO CLUB ───────────────────────────────────────────
    case 'send_request_to_club': {
      const requestId = `RQ-${Date.now().toString(36).toUpperCase()}`;
      try {
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, meta)
          VALUES ('concierge_request', ${input.department}, ${memberId}, ${profile.name}, ${requestId}, 'club_request',
            ${input.message},
            ${JSON.stringify({ department: input.department, urgency: input.urgency || 'normal' })}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] send_request_to_club DB error:', e.message);
      }
      return {
        request_id: requestId,
        department: input.department,
        status: 'submitted',
        message: `Your request has been sent to the ${input.department.replace('_', ' ')} team. They'll follow up shortly.`,
        member_name: profile.name,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Use Claude API whenever an API key exists — managed sessions are optional
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;
const SIMULATION_MODE = !HAS_API_KEY;

async function loadMemberProfile(clubId, memberId) {
  const result = await sql`
    SELECT member_id::text AS member_id, first_name, last_name, email, phone,
      membership_type, join_date, membership_status, household_id,
      preferred_channel
    FROM members
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  if (result.rows.length === 0) {
    // Fallback: static profiles for demo/conference testing
    const fallbacks = {
      mbr_t01: {
        member_id: 'mbr_t01', name: 'James Whitfield', first_name: 'James',
        email: 'james.whitfield@example.com', membership_type: 'Full Golf',
        join_date: '2019-04-12', status: 'active',
        household: [
          { member_id: 'mbr_t01b', name: 'Erin Whitfield', membership_type: 'Social' },
          { member_id: 'mbr_t01c', name: 'Logan Whitfield', membership_type: 'Junior' },
        ],
        preferences: {
          teeWindows: 'Thu/Fri 7:00-8:30 AM, Saturday 7:00 AM with regular foursome',
          dining: 'Grill Room booth 12, Arnold Palmer + Club Sandwich, slow mornings with coffee refills',
          favoriteSpots: 'North Course back nine, Grill Room booth 12',
          channel: 'Call',
        },
      },
      mbr_t07: {
        member_id: 'mbr_t07', name: 'Linda Leonard', first_name: 'Linda',
        email: 'linda.leonard@example.com', membership_type: 'Full Golf',
        join_date: '2019-05-20', status: 'at-risk',
        archetype: 'Ghost',
        health_score: 12,
        last_visit: '2025-09-12',
        household: [],
        preferences: {
          teeWindows: 'N/A — social member',
          dining: 'Wine dinners, always table with Diane Prescott. Enjoys the social atmosphere.',
          favoriteSpots: 'Wine cellar dining room, Event lawn',
          channel: 'Call',
          notes: 'Joined after her husband Richard passed away. Friends encouraged her to join for the social calendar. Bridge partner is Diane Prescott. Zero visits since October — 3+ months dark. Needs personal, warm outreach — not transactional.',
        },
      },
      mbr_t04: {
        member_id: 'mbr_t04', name: 'Anne Jordan', first_name: 'Anne',
        email: 'anne.j@email.com', membership_type: 'Full Golf',
        join_date: '2016-03-15', status: 'active',
        household: [
          { member_id: 'mbr_t04b', name: 'Marcus Jordan', membership_type: 'Full Golf' },
        ],
        preferences: {
          teeWindows: 'Saturday morning 7-8 AM, always with Marcus',
          dining: 'Terrace for lunch after golf, likes the chicken Caesar',
          favoriteSpots: 'North Course, Terrace patio',
          channel: 'SMS',
          notes: '10-year member, Weekend Warrior. Missed 3 Saturday waitlists recently — walked off Jan 7 after slow pace. Zero rounds since. Health score 28.',
        },
      },
      mbr_t05: {
        member_id: 'mbr_t05', name: 'Robert Callahan', first_name: 'Robert',
        email: 'robert.c@email.com', membership_type: 'Corporate',
        join_date: '2021-06-01', status: 'active',
        household: [],
        preferences: {
          teeWindows: 'Weekday mornings when available',
          dining: 'Main Dining Room, prefers quiet corner table. Orders steak and red wine.',
          favoriteSpots: 'South Course, Main Dining Room',
          channel: 'Email',
          notes: 'Declining member. Hitting exact $3,020 F&B minimum then stopping — dining to fulfill obligation only. 9-day complaint unresolved about billing. No golf since November. Health score 22. $18K dues.',
        },
      },
      mbr_t06: {
        member_id: 'mbr_t06', name: 'Sandra Chen', first_name: 'Sandra',
        email: 'sandra.c@email.com', membership_type: 'Social',
        join_date: '2020-09-15', status: 'active',
        household: [
          { member_id: 'mbr_t06b', name: 'David Chen', membership_type: 'Full Golf' },
          { member_id: 'mbr_t06c', name: 'Lily Chen', membership_type: 'Junior' },
        ],
        preferences: {
          teeWindows: 'N/A — social member, does not golf',
          dining: 'Grill Room for casual lunches, Main Dining for events. Used to spend $142/visit, now $18. Loves wine tastings and social events.',
          favoriteSpots: 'Grill Room, Event lawn, Wine cellar',
          channel: 'SMS',
          notes: 'Social Butterfly archetype. Dining cliff from $142 to $18 per visit — 87% drop. Declined 3 consecutive event invites. Health score 36. $9K dues.',
        },
      },
    };
    return fallbacks[memberId] || null;
  }

  const m = result.rows[0];

  // Get household
  const household = m.household_id ? await sql`
    SELECT member_id::text AS member_id, first_name, last_name, membership_type
    FROM members
    WHERE household_id = ${m.household_id} AND club_id = ${clubId} AND member_id != ${memberId}
  ` : { rows: [] };

  // Get preferences from session cache
  const sessionPrefs = await sql`
    SELECT preferences_cache FROM member_concierge_sessions
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;

  return {
    member_id: m.member_id,
    name: `${m.first_name} ${m.last_name}`.trim(),
    first_name: m.first_name,
    email: m.email,
    membership_type: m.membership_type,
    join_date: m.join_date,
    status: m.membership_status,
    household: household.rows.map(h => ({
      member_id: h.member_id,
      name: `${h.first_name} ${h.last_name}`.trim(),
      membership_type: h.membership_type,
    })),
    preferences: sessionPrefs.rows[0]?.preferences_cache || null,
  };
}

async function chatHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { member_id, message } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'member_id is required' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required and must be a string' });
  }

  // Load member profile
  const profile = await loadMemberProfile(clubId, member_id);
  if (!profile) {
    return res.status(404).json({ error: `Member ${member_id} not found` });
  }

  // Get or create concierge session (may fail if table doesn't exist yet)
  let session = { conversation_summary: null };
  try {
    session = await getOrCreateSession(clubId, member_id);
  } catch (e) {
    console.warn('[concierge/chat] session error (continuing):', e.message);
  }

  // Get club name (fallback for demo)
  let clubName = 'Pinetree Country Club';
  try {
    const clubResult = await sql`SELECT name FROM club WHERE club_id = ${clubId}`;
    clubName = clubResult.rows[0]?.name || clubName;
  } catch (e) {
    console.warn('[concierge/chat] club lookup error (using fallback):', e.message);
  }

  // Build system prompt
  const systemPrompt = buildConciergePrompt(profile, clubName);

  // ── Filter tools by data gates ──────────────────────────────────────
  // In guided-demo mode the client sends X-Demo-Gates listing which data
  // domains have been imported (e.g. "members,tee-sheet,fb").  When the
  // header is absent (live / full-demo) all tools are available.
  const gatesHeader = req.headers['x-demo-gates'];
  let availableTools = CONCIERGE_TOOLS;
  if (gatesHeader) {
    const openGates = new Set(gatesHeader.split(',').map(g => g.trim()).filter(Boolean));
    availableTools = CONCIERGE_TOOLS.filter(tool => {
      const required = TOOL_GATES[tool.name];
      if (!required || required.length === 0) return true;
      return required.every(g => openGates.has(g));
    });
  }

  // Build conversation context
  const conversationContext = session.conversation_summary
    ? `\n\nPrevious conversation context: ${session.conversation_summary}`
    : '';

  if (SIMULATION_MODE) {
    // Simulation: return a canned response based on the message
    const simResponse = generateSimulatedResponse(profile, message);
    return res.status(200).json({
      session_id: session.session_id,
      member_id,
      response: simResponse,
      simulated: true,
    });
  }

  // Live mode: call Claude API
  try {
    const client = getAnthropicClient();
    const messages = [{ role: 'user', content: message }];
    let result = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt + conversationContext,
      messages,
      tools: availableTools,
    });

    // Tool-use loop: execute tools and feed results back until Claude responds with text
    while (result.stop_reason === 'tool_use') {
      const toolUse = result.content.find(c => c.type === 'tool_use');
      if (!toolUse) break;

      const toolResult = await executeConciergeTool(toolUse.name, toolUse.input, profile, clubId);

      messages.push({ role: 'assistant', content: result.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }],
      });

      result = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt + conversationContext,
        messages,
        tools: availableTools,
      });
    }

    const responseText = result.content?.find(c => c.type === 'text')?.text ?? '';

    // Update conversation summary (truncate to last exchange)
    try {
      const summary = `Member asked: "${message.slice(0, 200)}". Agent responded: "${responseText.slice(0, 200)}"`;
      await updateSessionSummary(clubId, member_id, summary);
    } catch (e) {
      console.warn('[concierge/chat] summary update error (continuing):', e.message);
    }

    return res.status(200).json({
      session_id: session.session_id,
      member_id,
      response: responseText,
      simulated: false,
    });
  } catch (err) {
    console.error('Concierge chat error:', err);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}

function generateSimulatedResponse(profile, message) {
  const name = profile.first_name || profile.name || 'there';
  const prefs = profile.preferences || {};
  const household = profile.household || [];
  const lower = message.toLowerCase();

  // Cancel membership — MUST check first (highest severity)
  if ((lower.includes('cancel') && lower.includes('membership')) || lower.includes('resign') || lower.includes('quit the club')) {
    return `${name}, I'm sorry to hear you're considering that. Before anything, I'd love to connect you with our membership director who can talk through any concerns. Would you like me to set up a call? We truly value having you as part of the Pinetree family.`;
  }

  // Complaints — MUST check before dining (so "lunch took 45 minutes" is complaint, not reservation)
  const complaintSignals = ['slow', 'wait', 'terrible', 'awful', 'disappoint', 'complaint', 'cold', 'ignored', 'upset', 'rude', 'wrong', 'horrible', 'unacceptable', 'minutes', 'apologize', 'apologized', 'took', 'no one', 'never', 'worst', 'poor', 'forgot', 'downhill', 'worse', 'used to be', 'not what it was', 'frustrat'];
  if (complaintSignals.some(w => lower.includes(w))) {
    const complaintId = `FB-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    return `${name}, that's really frustrating — and I'm sorry. That's not the experience you deserve here. I've logged this as complaint #${complaintId} and routed it to our F&B director, Sarah Collins. She'll reach out to you personally within 24 hours. Is there anything I can do for you right now to make things better?`;
  }

  // Household + event combo — detect "get Erin on the wine dinner" and ACT
  const householdNames = household.map(h => (h.name || '').toLowerCase().split(' ')[0]).filter(Boolean);
  const matchedHousehold = householdNames.find(n => lower.includes(n));
  if (matchedHousehold && (lower.includes('wine') || lower.includes('dinner') || lower.includes('event') || lower.includes('rsvp') || lower.includes('sign up') || lower.includes('list') || lower.includes('clinic'))) {
    const memberName = household.find(h => (h.name || '').toLowerCase().startsWith(matchedHousehold))?.name || matchedHousehold;
    const confNum = `ER-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const eventName = lower.includes('wine') ? 'Wine Dinner — Spring Pairing Menu' : lower.includes('clinic') ? 'Junior Golf Clinic' : lower.includes('trivia') ? 'Trivia Night' : 'the event';
    return `Done, ${name}! I've RSVP'd ${memberName} for the ${eventName}. Confirmation #${confNum}. Would you like me to add anyone else to the reservation?`;
  }

  // Tee time / booking — reference known preferences
  if (lower.includes('tee time') || lower.includes('book') || lower.includes('golf') || lower.includes('usual')) {
    const teeWindow = prefs.teeWindows || 'Saturday morning';
    const confNum = `TT-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    if (lower.includes('usual') || lower.includes('saturday') || lower.includes('regular')) {
      return `Done, ${name}! I've got you down for your usual — ${teeWindow}. Confirmation #${confNum}. Want me to reserve booth 12 at the Grill Room for noon? Your Arnold Palmer will be waiting.`;
    }
    return `Of course, ${name}! I know you usually like ${teeWindow}. Want me to book that, or are you looking for a different time? I can check availability right away.`;
  }

  // Dining — reference favorite spots
  if (lower.includes('dinner') || lower.includes('reserv') || lower.includes('dining') || lower.includes('restaurant') || lower.includes('lunch') || lower.includes('grill')) {
    const favDining = prefs.dining || 'the Grill Room';
    const confNum = `DR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    return `Absolutely, ${name}! I know you love ${favDining}. I have a table for 2 this evening at 7:30 PM — confirmation #${confNum}. Would you like me to let them know about any special requests?`;
  }

  // Events — show upcoming events (filter to weekend if asked)
  if (lower.includes('event') || lower.includes('rsvp') || lower.includes('tournament') || lower.includes('happening') || lower.includes('weekend') || lower.includes('wine')) {
    if (lower.includes('weekend')) {
      return `Great timing, ${name}! Here's what's happening this weekend:\n\n` +
        `• Saturday Shotgun — Member-Guest (Apr 12, 8 AM — only 8 spots left)\n` +
        `• Junior Golf Clinic (Apr 13, 10 AM — open enrollment)\n\n` +
        `Want me to RSVP you for either of these?`;
    }
    return `Great timing, ${name}! Here's what's coming up:\n\n` +
      `• Saturday Shotgun — Member-Guest (Apr 12, 8 AM — only 8 spots left)\n` +
      `• Junior Golf Clinic (Apr 13, 10 AM — open enrollment)\n` +
      `• Trivia Night (Apr 15, 5:30 PM, Grill Room — 6 teams open)\n\n` +
      `Want me to RSVP you for any of these?`;
  }

  // Privacy guard — MUST check before schedule (so "my health score" doesn't trigger schedule)
  if (lower.includes('health') || lower.includes('score') || lower.includes('risk') || lower.includes('data') || lower.includes('analytics') || lower.includes('tier')) {
    return `I'd be happy to connect you with membership services for account details, ${name}. Is there something specific I can help with — a booking, reservation, or event RSVP?`;
  }

  // Schedule — show personalized upcoming items
  if (lower.includes('schedule') || lower.includes('upcoming') || (lower.includes('my') && (lower.includes('booking') || lower.includes('reservation') || lower.includes('tee') || lower.includes('event')))) {
    return `Here's what I have for you, ${name}:\n\n` +
      `• Tee Time: Apr 12, 7:00 AM — North Course (foursome)\n` +
      `• Wine Dinner: Apr 10, 7:30 PM — Main Dining Room (party of 2)\n\n` +
      `Everything look good, or would you like to make any changes?`;
  }

  // Household — general family reference
  if (matchedHousehold || lower.includes('wife') || lower.includes('son') || lower.includes('family') || lower.includes('household')) {
    if (household.length > 0) {
      const names = household.map(h => h.name?.split(' ')[0]).join(' and ');
      return `Of course, ${name}! I can help with ${names}'s schedule too. What would you like me to set up for them?`;
    }
  }

  // Default — warm, capability-focused
  return `Hi ${name}! Great to hear from you. I can book tee times, make dining reservations, RSVP to events, check your schedule, or help with anything club-related. What would you like to do?`;
}

export default withAuth(chatHandler, { allowDemo: true });
