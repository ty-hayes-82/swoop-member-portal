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
import { getOrCreateSession, updateSessionSummary, emitConciergeEvent, getConciergeEvents, getPendingRequestDetails } from '../agents/concierge-session.js';
import { getOrCreateAgentSession, emitAgentEvent } from '../agents/session-core.js';
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
    input_schema: { type: 'object', properties: { department: { type: 'string', enum: ['golf_ops', 'dining', 'events', 'membership', 'facilities', 'general', 'gm', 'front_desk', 'cart_staff', 'fb_pickup'] }, message: { type: 'string', description: 'The request or message to send' }, urgency: { type: 'string', enum: ['normal', 'high'], default: 'normal' } }, required: ['department', 'message'] }
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

    // ── BOOK TEE TIME (human-in-the-loop: submits request, pro shop confirms) ──
    case 'book_tee_time': {
      const course = input.course || 'North Course';
      const players = input.players || 4;
      const requestId = `req_tt_${Date.now().toString(36)}`;

      try {
        const detail = JSON.stringify({
          date: input.date, time: input.time, course, players,
          member_id: memberId, member_name: profile.name, request_id: requestId,
        });
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, status, meta)
          VALUES ('concierge_request', 'tee_time', ${memberId}, ${profile.name}, ${requestId}, 'booking_request',
            ${`Tee time request: ${input.date} at ${input.time} on ${course} for ${players}`},
            'pending_staff_confirmation',
            ${detail}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] book_tee_time log error (continuing):', e.message);
      }
      // Fire event to close the confirmation loop (Pro Shop auto-confirms in simulation)
      try {
        await routeEvent(clubId, 'booking_request_submitted', {
          member_id: memberId,
          member_name: profile.name,
          phone: profile.phone || null,
          request_id: requestId,
          request_type: 'book_tee_time',
          routed_to: 'Pro Shop',
          details: { date: input.date, time: input.time, course, players },
        });
      } catch (e) { console.warn('[concierge] book_tee_time event routing error:', e.message); }

      return {
        status: 'request_submitted',
        pending: true,
        request_id: requestId,
        routed_to: 'Pro Shop',
        details: `Tee time request: ${input.date} at ${input.time} on the ${course} for ${players} players.`,
        expected_response: 'Pro shop will confirm within the hour.',
        member_name: profile.name,
      };
    }

    // ── MAKE DINING RESERVATION (human-in-the-loop: submits request, F&B team confirms) ──
    case 'make_dining_reservation': {
      const party = input.party_size || 2;
      const time = input.time || '19:00';
      const requestId = `req_dr_${Date.now().toString(36)}`;

      try {
        const detail = JSON.stringify({
          date: input.date, time, outlet: input.outlet, party_size: party,
          preferences: input.preferences, member_id: memberId, member_name: profile.name, request_id: requestId,
        });
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, status, meta)
          VALUES ('concierge_request', 'dining_reservation', ${memberId}, ${profile.name}, ${requestId}, 'booking_request',
            ${`Dining reservation request: ${input.date} at ${time} at ${input.outlet} for ${party}`},
            'pending_staff_confirmation',
            ${detail}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] make_dining_reservation log error (continuing):', e.message);
      }

      // Fire event to close the confirmation loop (Front Desk auto-confirms in simulation)
      try {
        await routeEvent(clubId, 'booking_request_submitted', {
          member_id: memberId,
          member_name: profile.name,
          phone: profile.phone || null,
          request_id: requestId,
          request_type: 'make_dining_reservation',
          routed_to: 'Front Desk',
          details: { date: input.date, time, outlet: input.outlet || 'Main Dining Room', party_size: party, preferences: input.preferences },
        });
      } catch (e) { console.warn('[concierge] make_dining_reservation event routing error:', e.message); }

      return {
        status: 'request_submitted',
        pending: true,
        request_id: requestId,
        routed_to: 'Front Desk',
        details: `Dining reservation request: ${input.date} at ${time} at ${input.outlet || 'Main Dining Room'} for ${party} guests.${input.preferences ? ` Notes: ${input.preferences}` : ''}`,
        expected_response: 'Front desk will confirm within the hour.',
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

    // ── RSVP EVENT (human-in-the-loop: submits request, events team confirms) ──
    case 'rsvp_event': {
      const eventTitle = input.event_title || 'Event';
      const who = input.member_name || profile.name;
      const guestCount = input.guest_count || 0;
      const requestId = `req_ev_${Date.now().toString(36)}`;

      // Try to find the event for context, but don't auto-register
      let eventName = eventTitle;
      let eventDate = null;
      try {
        const eventResult = await sql`
          SELECT event_id, name, event_date
          FROM event_definitions
          WHERE club_id = ${clubId} AND name ILIKE '%' || ${eventTitle} || '%'
            AND event_date >= CURRENT_DATE
          ORDER BY event_date
          LIMIT 1
        `;
        if (eventResult.rows.length > 0) {
          eventName = eventResult.rows[0].name;
          eventDate = eventResult.rows[0].event_date;
        }
      } catch (e) {
        console.warn('[concierge] rsvp_event lookup error (continuing):', e.message);
      }

      try {
        const detail = JSON.stringify({
          event_title: eventName, event_date: eventDate, registered_for: who,
          guest_count: guestCount, member_id: memberId, member_name: profile.name, request_id: requestId,
        });
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, status, meta)
          VALUES ('concierge_request', 'event_rsvp', ${memberId}, ${profile.name}, ${requestId}, 'booking_request',
            ${`RSVP request: ${eventName}${eventDate ? ` on ${eventDate}` : ''} for ${who}${guestCount > 0 ? ` +${guestCount} guests` : ''}`},
            'pending_staff_confirmation',
            ${detail}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] rsvp_event log error (continuing):', e.message);
      }

      // Fire event to close the confirmation loop (Events Team auto-confirms in simulation)
      try {
        await routeEvent(clubId, 'booking_request_submitted', {
          member_id: memberId,
          member_name: profile.name,
          phone: profile.phone || null,
          request_id: requestId,
          request_type: 'rsvp_event',
          routed_to: 'Events Team',
          details: { event: eventName, event_date: eventDate, registered_for: who, guest_count: guestCount },
        });
      } catch (e) { console.warn('[concierge] rsvp_event event routing error:', e.message); }

      return {
        status: 'request_submitted',
        pending: true,
        request_id: requestId,
        routed_to: 'Events Team',
        event: eventName,
        event_date: eventDate,
        registered_for: who,
        guest_count: guestCount,
        details: `RSVP request submitted for ${eventName}${eventDate ? ` on ${eventDate}` : ''} for ${who}${guestCount > 0 ? ` +${guestCount} guests` : ''}.`,
        expected_response: 'Events team will confirm your spot.',
        member_name: profile.name,
      };
    }

    // ── CANCEL TEE TIME (human-in-the-loop: submits request, pro shop confirms) ──
    case 'cancel_tee_time': {
      const requestId = `req_cx_${Date.now().toString(36)}`;

      // Look up the booking for context, but don't auto-cancel
      let bookingInfo = null;
      try {
        const lookupResult = await sql`
          SELECT b.booking_id, b.booking_date, b.tee_time, c.name AS course_name
          FROM bookings b
          JOIN booking_players bp ON bp.booking_id = b.booking_id
          JOIN courses c ON c.course_id = b.course_id
          WHERE b.club_id = ${clubId} AND bp.member_id = ${memberId}
            AND b.booking_date = ${input.booking_date}
            AND b.status = 'confirmed'
            AND (${input.tee_time || null}::text IS NULL OR b.tee_time = ${input.tee_time})
          ORDER BY b.booking_date, b.tee_time
          LIMIT 1
        `;
        if (lookupResult.rows.length > 0) {
          bookingInfo = lookupResult.rows[0];
        }
      } catch (e) {
        console.warn('[concierge] cancel_tee_time lookup error (continuing):', e.message);
      }

      try {
        const detail = JSON.stringify({
          booking_date: input.booking_date,
          tee_time: bookingInfo?.tee_time || input.tee_time,
          course: bookingInfo?.course_name,
          booking_id: bookingInfo?.booking_id,
          member_id: memberId, member_name: profile.name, request_id: requestId,
        });
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, status, meta)
          VALUES ('concierge_request', 'tee_time_cancel', ${memberId}, ${profile.name}, ${requestId}, 'booking_request',
            ${`Cancellation request: tee time on ${input.booking_date}${bookingInfo?.tee_time ? ` at ${bookingInfo.tee_time}` : ''}`},
            'pending_staff_confirmation',
            ${detail}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] cancel_tee_time log error (continuing):', e.message);
      }

      // Fire event to close the confirmation loop (Pro Shop auto-confirms in simulation)
      try {
        await routeEvent(clubId, 'booking_request_submitted', {
          member_id: memberId,
          member_name: profile.name,
          phone: profile.phone || null,
          request_id: requestId,
          request_type: 'cancel_tee_time',
          routed_to: 'Pro Shop',
          details: {
            booking_date: input.booking_date,
            tee_time: bookingInfo?.tee_time || input.tee_time,
            course: bookingInfo?.course_name,
          },
        });
      } catch (e) { console.warn('[concierge] cancel_tee_time event routing error:', e.message); }

      return {
        status: 'request_submitted',
        pending: true,
        request_id: requestId,
        routed_to: 'Pro Shop',
        booking_date: input.booking_date,
        tee_time: bookingInfo?.tee_time || input.tee_time,
        course: bookingInfo?.course_name,
        details: `Cancellation request submitted for tee time on ${input.booking_date}${bookingInfo?.tee_time ? ` at ${bookingInfo.tee_time}` : ''}${bookingInfo?.course_name ? ` on ${bookingInfo.course_name}` : ''}.`,
        expected_response: 'Pro shop will process and confirm the cancellation.',
        member_name: profile.name,
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
        join_date: '2016-03-15', status: 'at-risk',
        health_score: 28,
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
        join_date: '2021-06-01', status: 'at-risk',
        health_score: 22,
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
        join_date: '2020-09-15', status: 'at-risk',
        health_score: 36,
        household: [
          { member_id: 'mbr_t06b', name: 'David Chen', membership_type: 'Full Golf' },
          { member_id: 'mbr_t06c', name: 'Lily Chen', membership_type: 'Junior' },
        ],
        preferences: {
          teeWindows: 'N/A — social member, does not golf',
          dining: 'Grill Room for casual lunches, Main Dining for events. Used to spend $142/visit, now $18. Loves wine tastings and social events.',
          favoriteSpots: 'Grill Room, Event lawn, Wine cellar',
          channel: 'SMS',
          notes: 'Social Butterfly archetype. Dining cliff from $142 to $18 per visit, 87% drop. Declined 3 consecutive event invites. Health score 36. $9K dues. Prior unresolved complaint: slow service at the bar (March), no follow-up received.',
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
  const { member_id, message, debug } = req.body;

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

  // Phase 2a: dual-write to universal agent session (fire-and-forget)
  getOrCreateAgentSession(`mbr_${member_id}_concierge`, 'identity', member_id, clubId).catch(() => {});

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

  // Build conversation context (Sprint B: prefer durable event log over text summary)
  const sessionId = `mbr_${member_id}_concierge`;
  let conversationContext = '';
  let pendingRequestsContext = '';
  try {
    // Fetch general recent events for conversational context
    const recentEvents = await getConciergeEvents(member_id, { last: 20 });
    if (recentEvents?.length) {
      const lines = recentEvents
        .slice()
        .reverse()
        .map(ev => {
          const ts = ev.emitted_at ? new Date(ev.emitted_at).toISOString().slice(0, 16) : '';
          const p = ev.payload || {};
          switch (ev.event_type) {
            case 'user_message':    return `[${ts}] Member: ${p.text || ''}`;
            case 'agent_response':  return `[${ts}] Concierge: ${(p.text || '').slice(0, 200)}`;
            case 'tool_call':       return `[${ts}] Tool: ${p.tool}(${JSON.stringify(p.args || {})}) → ${p.status || 'ok'}`;
            case 'staff_confirmed': return `[${ts}] CONFIRMED: ${p.text || ''}`;
            case 'request_submitted': return `[${ts}] PENDING: ${p.request_id} via ${p.request_type} → ${p.routed_to} (${p.details || ''})`;
            case 'preference_observed': return `[${ts}] Preference: ${p.field} = ${p.value}`;
            case 'complaint_filed': return `[${ts}] Complaint: ${p.category} — ${(p.description || '').slice(0, 100)}`;
            default: return `[${ts}] ${ev.event_type}: ${JSON.stringify(p).slice(0, 100)}`;
          }
        });
      conversationContext = `\n\nPrevious interaction history (most recent ${recentEvents.length} events):\n${lines.join('\n')}`;
    }

    // Always surface pending/confirmed requests so the model can answer status questions
    // and avoid re-routing requests that already have a pending submission.
    const requestDetails = await getPendingRequestDetails(member_id);
    const isStatusQuery = /\b(did it go through|was it confirmed|has my request|did you send|did that go|was that processed|confirm|go through|get it|receive it|been processed|still pending|any update|heard back|follow.?up|status)\b/i.test(message);
    if (requestDetails.pending.length > 0 || requestDetails.confirmed.length > 0) {
      const pendingLines = requestDetails.pending.map(r =>
        `  ⏳ PENDING: ${r.request_type} sent to ${r.routed_to} ${r.time_label}${r.details ? ` — ${r.details}` : ''}. ${r.expected_response || ''}`
      );
      const confirmedLines = requestDetails.confirmed.map(r =>
        `  ✓ CONFIRMED ${r.time_label}: ${r.text}`
      );
      const allLines = [...pendingLines, ...confirmedLines];
      const contextLabel = isStatusQuery
        ? 'MEMBER\'S PENDING AND CONFIRMED REQUESTS — IMPORTANT: Answer the status question using these records. If a pending request exists for what they asked about, tell them it was submitted and is still pending. Do NOT fire send_request_to_club again for the same thing:'
        : 'MEMBER\'S RECENT REQUESTS (for context — if asked about status, use these records before routing to staff):';
      pendingRequestsContext = `\n\n${contextLabel}\n${allLines.join('\n')}`;
    }
  } catch (_) { /* event log not available — fall through */ }

  // Check for undelivered analyst recommendations for this member's session
  let recommendationContext = '';
  try {
    const { getAgentEvents } = await import('../agents/session-core.js');
    const memberSessionId = `mbr_${member_id}_concierge`;
    const recEvents = await getAgentEvents(memberSessionId, { types: ['recommendation_received'], last: 3 });
    if (recEvents.length > 0) {
      const lines = recEvents.map(ev => {
        const p = typeof ev.payload === 'string' ? JSON.parse(ev.payload) : (ev.payload || {});
        const snippet = (p.findings || p.summary || '').slice(0, 200);
        return snippet ? `- ${snippet}` : null;
      }).filter(Boolean);
      if (lines.length > 0) {
        recommendationContext = `\n\nPENDING ANALYST SIGNALS (surface proactively if natural — e.g. after completing their request):\n${lines.join('\n')}`;
      }
    }
  } catch (_) { /* recommendation events not available */ }

  // Fall back to text summary if event log is empty
  if (!conversationContext && session.conversation_summary) {
    conversationContext = `\n\nPrevious conversation context: ${session.conversation_summary}`;
  }

  // Emit the incoming user message to the durable event log
  try {
    await emitConciergeEvent(member_id, clubId, { type: 'user_message', text: message });
  } catch (_) { /* non-blocking */ }
  // Phase 2a: dual-write to universal session event log (fire-and-forget)
  emitAgentEvent(`mbr_${member_id}_concierge`, clubId, { type: 'user_message', text: message, source_agent: 'member_concierge' }).catch(() => {});

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

  // Derive persona flags (mirrors logic in conciergePrompt.js) — used for temperature + opener injection
  const isGhostMember = profile.archetype === 'Ghost'
    || profile.status === 'ghost'
    || (profile.last_visit && (() => {
        const d = new Date(profile.last_visit);
        return !isNaN(d) && (Date.now() - d.getTime()) > 90 * 24 * 60 * 60 * 1000;
      })());
  const isAtRiskMember = !isGhostMember && (
    profile.status === 'at-risk'
    || profile.archetype === 'At Risk'
    || (typeof profile.health_score === 'number' && profile.health_score < 40)
  );
  const notesLowerChat = (profile.preferences?.notes || '').toLowerCase();
  const hasPriorComplaintFlag = notesLowerChat.includes('complaint') || notesLowerChat.includes('unresolved');
  // Mirrors conciergePrompt.js: declining members get reactivation opener, not complaint opener
  const isDeclineMemberFlag = notesLowerChat.startsWith('declining')
    || (typeof profile.archetype === 'string' && profile.archetype.toLowerCase().includes('declining'));
  const isComplaintFirstFlag = isAtRiskMember && hasPriorComplaintFlag && !isDeclineMemberFlag;
  const memberFirstName = (profile.first_name || profile.name?.split(' ')[0] || 'there');

  // Sprint D: intent-based temperature selection
  // Ghost/at-risk members always get 0.5 — warmth must not be overridden by booking efficiency
  // booking-concierge (0) — deterministic for reservations
  // service-recovery-concierge (0.3) — slight warmth for complaint handling
  // personal-concierge (0.5) — conversational for general / re-engagement
  const msgLower = message.toLowerCase();
  const isBookingIntent = /\b(book|reserve|cancel|tee\s*time|reservation|rsvp|sign\s*up|register)\b/.test(msgLower);
  const isComplaintIntent = /\b(complain|complaint|issue|problem|terrible|slow|wrong|never|awful|bad|frustrated|upset|billing|invoice|charge)\b/.test(msgLower);
  const needsWarmth = isGhostMember || isAtRiskMember || hasPriorComplaintFlag;
  const conciergeTemperature = needsWarmth ? 0.5 : isComplaintIntent ? 0.3 : isBookingIntent ? 0 : 0.5;

  // Live mode: call Claude API
  try {
    const client = getAnthropicClient();
    const messages = [{ role: 'user', content: message }];
    let result = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: conciergeTemperature,
      system: systemPrompt + conversationContext + pendingRequestsContext + recommendationContext,
      messages,
      tools: availableTools,
    });

    // Collect tool call trace for debug mode; also track successful submissions for fallback use
    const toolCallLog = [];
    const successfulSubmissions = [];

    // Tool-use loop: execute ALL tool_use blocks per turn, feed results back, repeat until text
    let loopGuard = 0;
    const seenToolCalls = new Set(); // dedup: prevent same tool+args twice in a session
    while (result.stop_reason === 'tool_use' && loopGuard++ < 5) {
      const rawToolUses = result.content.filter(c => c.type === 'tool_use');
      if (rawToolUses.length === 0) break;

      // Deduplication guard: skip calls with identical tool+args already seen this turn
      const toolUses = rawToolUses.filter(toolUse => {
        const key = `${toolUse.name}:${JSON.stringify(toolUse.input)}`;
        if (seenToolCalls.has(key)) {
          console.warn(`[concierge] dedup: skipping duplicate ${toolUse.name} call`);
          return false;
        }
        seenToolCalls.add(key);
        return true;
      });
      if (toolUses.length === 0) break;

      // Execute all tools in this turn (may be multiple simultaneous calls)
      const toolResults = await Promise.all(toolUses.map(async (toolUse) => {
        let toolResult;
        try {
          toolResult = await executeConciergeTool(toolUse.name, toolUse.input, profile, clubId);
        } catch (toolErr) {
          console.warn(`[concierge] tool ${toolUse.name} threw:`, toolErr.message);
          toolResult = { error: 'Tool execution failed', message: 'Unable to complete that action. Let me connect you with staff.' };
        }
        // Track successful submissions regardless of debug mode (needed for fallback response)
        if (toolResult?.status === 'submitted' || toolResult?.status === 'request_submitted') {
          successfulSubmissions.push({ tool: toolUse.name, result: toolResult });
        }
        if (debug) {
          toolCallLog.push({ tool_name: toolUse.name, arguments: toolUse.input, result: toolResult, ts: new Date().toISOString() });
        }
        // Emit tool_call event to durable log (Sprint B)
        try {
          await emitConciergeEvent(member_id, clubId, {
            type: 'tool_call',
            tool: toolUse.name,
            args: toolUse.input,
            status: toolResult?.status || 'ok',
            result_summary: JSON.stringify(toolResult).slice(0, 200),
          });
        } catch (_) { /* non-blocking */ }
        // Phase 2a: dual-write tool_call to universal session event log (fire-and-forget)
        emitAgentEvent(`mbr_${member_id}_concierge`, clubId, {
          type: 'tool_call',
          tool: toolUse.name,
          args: toolUse.input,
          status: toolResult?.status || 'ok',
          result_summary: JSON.stringify(toolResult).slice(0, 200),
          source_agent: 'member_concierge',
        }).catch(() => {});
        // Emit dedicated request_submitted event for follow-up status queries (Sprint B)
        if (toolResult?.status === 'request_submitted' && toolResult?.request_id) {
          try {
            await emitConciergeEvent(member_id, clubId, {
              type: 'request_submitted',
              request_id: toolResult.request_id,
              request_type: toolUse.name,
              routed_to: toolResult.routed_to,
              details: toolResult.details,
              expected_response: toolResult.expected_response,
            });
          } catch (_) { /* non-blocking */ }
          // Phase 2a: dual-write request_submitted to universal session event log (fire-and-forget)
          emitAgentEvent(`mbr_${member_id}_concierge`, clubId, {
            type: 'request_submitted',
            request_id: toolResult.request_id,
            request_type: toolUse.name,
            routed_to: toolResult.routed_to,
            details: toolResult.details,
            expected_response: toolResult.expected_response,
            source_agent: 'member_concierge',
          }).catch(() => {});
        }
        // Sanitize em-dashes from tool result text before returning to model (prevents echoing in responses)
        const toolResultStr = JSON.stringify(toolResult).replace(/\u2014/g, ',');
        return { type: 'tool_result', tool_use_id: toolUse.id, content: toolResultStr };
      }));

      messages.push({ role: 'assistant', content: result.content });

      // Inject persona opener reminder as final content block in the tool-results user message.
      // This is read by the model immediately before generating text, ensuring STEP 1 compliance
      // even after tool calls have run (where the model otherwise jumps to action summary).
      if (needsWarmth) {
        let openerLine;
        if (isGhostMember) {
          openerLine = `a varied warm welcome-back (e.g. "${memberFirstName}! We've missed you so much — so glad you reached out." or "${memberFirstName}! You just made my day." — VARY it, never repeat the same phrase)`;
        } else if (isComplaintFirstFlag) {
          // Complaint is the PRIMARY persona driver (e.g. Sandra Chen) — complaint opener first
          const hasBillingIssue = notesLowerChat.includes('billing') || notesLowerChat.includes('invoice') || notesLowerChat.includes('charge');
          const hasServiceIssue = notesLowerChat.includes('slow service') || notesLowerChat.includes('slow at the bar') || notesLowerChat.includes('service at the bar') || notesLowerChat.includes('wait');
          const specificAck = hasBillingIssue
            ? `"${memberFirstName}, I know that billing issue still hasn't been resolved, let me make sure we get that fixed."`
            : hasServiceIssue
            ? `"${memberFirstName}, I know that wait wasn't what you deserved, I want to make this visit better."`
            : `"${memberFirstName}, I know your last experience wasn't what it should have been, I want to make this one different."`;
          openerLine = `${specificAck} (VARY on subsequent turns, do not repeat verbatim)`;
        } else if (isAtRiskMember) {
          // Declining/reactivation member (e.g. Robert Callahan, Anne Jordan) — warm re-engagement first
          openerLine = `a warm re-engagement opener (e.g. "${memberFirstName}, always love hearing from you!" or "${memberFirstName}! Great to hear from you, we'd love to see you out here more." or "So good to hear from you, ${memberFirstName}!" — VARY it, never repeat the same phrase)`;
        } else {
          openerLine = `"${memberFirstName}, I know your last experience wasn't what it should have been, I want to make sure this one is different."`;
        }
        toolResults.push({
          type: 'text',
          text: `[MANDATORY OPENER — write this as your FIRST sentence before anything else: ${openerLine}. Do not skip it. Do not start with the action summary. The opener is sentence one.]`,
        });
      }

      messages.push({ role: 'user', content: toolResults });

      result = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: conciergeTemperature,
        system: systemPrompt + conversationContext + pendingRequestsContext + recommendationContext,
        messages,
        tools: availableTools,
      });
    }

    let responseText = result.content?.find(c => c.type === 'text')?.text ?? '';

    // Sanitize em-dashes from final response (belt-and-suspenders, model also instructed to avoid them)
    responseText = responseText.replace(/\u2014/g, ',');

    // Sanitize: strip raw XML/parameter markup that occasionally leaks from model thinking.
    // When this pattern is detected, substitute a graceful fallback rather than exposing internals.
    if (/<parameter\s+name=|<invoke>|<parameter>/.test(responseText)) {
      console.warn('[concierge/chat] XML parameter leak detected — using fallback response');
      const firstName = profile.first_name || profile.name?.split(' ')[0] || 'there';
      responseText = `Hey ${firstName}, I ran into a hiccup processing that — let me flag it for the team. In the meantime, call the front desk and they'll take care of you right away.`;
    }

    // Fallback for empty response (model returned no text block).
    // If a request was actually submitted successfully, confirm it positively rather than apologizing.
    if (!responseText) {
      const firstName = profile.first_name || profile.name?.split(' ')[0] || 'there';
      if (successfulSubmissions.length > 0) {
        const sub = successfulSubmissions[0];
        const dept = sub.result.routed_to || 'the team';
        const expected = sub.result.expected_response || 'They will follow up shortly.';
        responseText = `${firstName}, your request has been sent to ${dept}. ${expected}`;
      } else {
        responseText = `Hey ${firstName}, I ran into a snag on my end. Give the front desk a call and they will sort it out for you right away.`;
      }
    }

    // Emit agent_response event to durable log (Sprint B)
    try {
      await emitConciergeEvent(member_id, clubId, { type: 'agent_response', text: responseText });
    } catch (_) { /* non-blocking */ }
    // Phase 2a: dual-write agent_response to universal session event log (fire-and-forget)
    emitAgentEvent(`mbr_${member_id}_concierge`, clubId, { type: 'agent_response', text: responseText, source_agent: 'member_concierge' }).catch(() => {});

    // Update conversation summary (fallback for clusters that lack event log)
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
      ...(debug && { tool_calls: toolCallLog }),
    });
  } catch (err) {
    console.error('Concierge chat error:', err);
    // Return graceful fallback instead of 500 — member should never see a raw error
    const firstName = profile?.first_name || profile?.name?.split(' ')[0] || 'there';
    return res.status(200).json({
      session_id: null,
      member_id,
      response: `Hey ${firstName}, I'm having a moment — let me connect you with the front desk. They'll take great care of you.`,
      simulated: false,
      error_handled: true,
    });
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
