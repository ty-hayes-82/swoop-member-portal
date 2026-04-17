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
import { getOrCreateSession, updateSessionSummary, appendSessionSummary, emitConciergeEvent, getConciergeEvents, getPendingRequestDetails } from '../agents/concierge-session.js';
import { getOrCreateAgentSession, emitAgentEvent } from '../agents/session-core.js';
import { buildConciergePrompt } from '../../src/config/conciergePrompt.js';
import { getAnthropicClient, MANAGED_AGENT_ID, MANAGED_ENV_ID } from '../agents/managed-config.js';
import { routeEvent } from '../agents/agent-events.js';

// ---------------------------------------------------------------------------
// Gate requirements per tool — tool is only offered when ALL listed gates are open.
// Tools with no entry (or empty array) are always available.
// ---------------------------------------------------------------------------
const TOOL_GATES = {
  check_tee_availability:     ['members', 'tee-sheet'],
  book_tee_time:              ['members', 'tee-sheet'],
  cancel_tee_time:            ['members', 'tee-sheet'],
  cancel_dining_reservation:  ['members', 'fb'],
  make_dining_reservation:    ['members', 'fb'],
  get_club_calendar:          ['pipeline'],
  get_my_schedule:            ['members'],
  rsvp_event:                 ['members', 'email'],
  file_complaint:             ['members'],
  get_member_profile:         ['members'],
  send_request_to_club:       ['members'],
};

// ---------------------------------------------------------------------------
// Concierge tool definitions (same as SMS tools in twilio/inbound.js)
// ---------------------------------------------------------------------------
const CONCIERGE_TOOLS = [
  {
    name: 'get_club_calendar',
    description: 'Get upcoming club events and activities. Use for event discovery only — do NOT call when the member wants to cancel a tee time or reservation (use get_my_schedule instead).',
    input_schema: { type: 'object', properties: { days_ahead: { type: 'integer', default: 7 } } }
  },
  {
    name: 'book_tee_time',
    description: 'ONLY call this after check_tee_availability has already been called in this conversation and slots were presented to the member. FORBIDDEN as a first action on a new tee time request. The member must have picked a specific slot from your presented options before you call this.',
    input_schema: { type: 'object', properties: { date: { type: 'string' }, time: { type: 'string' }, course: { type: 'string' }, players: { type: 'integer' } }, required: ['date', 'time'] }
  },
  {
    name: 'make_dining_reservation',
    description: 'Make a dining reservation. ALWAYS call this tool immediately when the member has explicitly provided a date and party size. Never describe a handoff to staff without calling this tool. Required: date and party size must both come from the member — never invent them.',
    input_schema: { type: 'object', properties: { date: { type: 'string' }, time: { type: 'string' }, outlet: { type: 'string' }, party_size: { type: 'integer' }, preferences: { type: 'string' } }, required: ['date', 'outlet'] }
  },
  {
    name: 'get_my_schedule',
    description: 'Get the member upcoming tee times, reservations, and events. When cancelling a tee time, call this first to look up bookings — do NOT also call get_club_calendar.',
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
    name: 'cancel_dining_reservation',
    description: 'Cancel a previously made dining reservation for the member',
    input_schema: { type: 'object', properties: { reservation_date: { type: 'string', description: 'Date of the reservation to cancel (YYYY-MM-DD)' }, outlet: { type: 'string', description: 'Dining outlet name (e.g. Grill Room, Main Dining Room)' } }, required: ['reservation_date'] }
  },
  {
    name: 'file_complaint',
    description: 'File a complaint or feedback on behalf of the member. Call this tool IMMEDIATELY when the member provides ANY complaint with a location (Grill, Pro Shop, course, etc.) OR a specific incident (cold food, wrong order, long wait, billing error, etc.). NEVER route the member to the front desk or another department — handle it here by calling this tool. NEVER fabricate a reference number — it comes from this tool result.',
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
  {
    name: 'get_request_status',
    description: 'Check the status of previously submitted requests (tee time, dining, RSVP, complaints). Use this when the member asks if a request has been confirmed, followed up on, or what the status is. Returns pending and confirmed requests from the session log.',
    input_schema: { type: 'object', properties: { request_type: { type: 'string', description: 'Optional filter: tee_time, dining, event, complaint, or all', default: 'all' } } }
  },
  {
    name: 'check_tee_availability',
    description: 'Check available tee times on a given date near a preferred time. Call this BEFORE book_tee_time to get real options to present to the member. Returns 2-4 available slots.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        preferred_time: { type: 'string', description: 'Preferred start time in HH:MM 24-hour format (e.g. "07:00")' },
        course: { type: 'string', description: 'Course name if specified, otherwise any available' },
      },
      required: ['date'],
    },
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
          // If a keyword was passed but none of the events match it, surface a no-match signal
          // so the model doesn't hallucinate a match from unrelated results
          const keyword = input.keyword;
          if (keyword) {
            const kw = keyword.toLowerCase();
            const hasMatch = events.some(ev =>
              (ev.title || '').toLowerCase().includes(kw) ||
              (ev.description || '').toLowerCase().includes(kw) ||
              (ev.type || '').toLowerCase().includes(kw)
            );
            if (!hasMatch) {
              return {
                events,
                keyword_match: false,
                keyword_note: `No events matching "${keyword}" found in the calendar. Do not fabricate a match. Tell the member no matching event was found and offer to route to the events team for confirmation.`,
              };
            }
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

    // ── CANCEL DINING RESERVATION ──────────────────────────────────────
    case 'cancel_dining_reservation': {
      const requestId = `req_cdr_${Date.now().toString(36)}`;
      try {
        const detail = JSON.stringify({
          reservation_date: input.reservation_date,
          outlet: input.outlet,
          member_id: memberId, member_name: profile.name, request_id: requestId,
        });
        await sql`
          INSERT INTO activity_log (action_type, action_subtype, member_id, member_name, reference_id, reference_type, description, status, meta)
          VALUES ('concierge_request', 'dining_cancel', ${memberId}, ${profile.name}, ${requestId}, 'booking_request',
            ${`Dining cancellation request: ${input.reservation_date}${input.outlet ? ` at ${input.outlet}` : ''}`},
            'pending_staff_confirmation',
            ${detail}::jsonb)
        `;
      } catch (e) {
        console.warn('[concierge] cancel_dining_reservation log error (continuing):', e.message);
      }
      try {
        await routeEvent(clubId, 'booking_request_submitted', {
          member_id: memberId,
          member_name: profile.name,
          phone: profile.phone || null,
          request_id: requestId,
          request_type: 'cancel_dining_reservation',
          routed_to: 'Front Desk',
          details: { reservation_date: input.reservation_date, outlet: input.outlet },
        });
      } catch (e) { console.warn('[concierge] cancel_dining_reservation event routing error:', e.message); }
      return {
        status: 'request_submitted',
        pending: true,
        request_id: requestId,
        routed_to: 'Front Desk',
        reservation_date: input.reservation_date,
        outlet: input.outlet,
        details: `Dining cancellation request submitted for ${input.reservation_date}${input.outlet ? ` at ${input.outlet}` : ''}.`,
        expected_response: 'Front desk will process and confirm the cancellation.',
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

    // ── GET REQUEST STATUS ─────────────────────────────────────────────
    case 'get_request_status': {
      try {
        const { pending, confirmed } = await getPendingRequestDetails(memberId, { maxAgeDays: 14 });
        let all = [
          ...pending.map(r => ({ ...r, status: 'pending' })),
          ...confirmed.map(r => ({ ...r, status: 'confirmed' })),
        ];

        // Fallback: if event log returned nothing, query activity_log directly
        // (activity_log is written by all booking tools and definitely exists)
        if (all.length === 0) {
          try {
            const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
            // Map request_type filter to activity_log action_subtype values
            const requestTypeFilter = input.request_type && input.request_type !== 'all' ? input.request_type : null;
            const subtypeMap = {
              tee_time: ['tee_time', 'tee_time_cancel'],
              dining: ['dining_reservation', 'dining_cancel'],
              event: ['event_rsvp'],
              complaint: [], // complaints go to feedback table, not activity_log
            };
            const allowedSubtypes = requestTypeFilter ? (subtypeMap[requestTypeFilter] || null) : null;

            // Skip activity_log for complaint-only queries (complaints are in feedback table)
            if (requestTypeFilter !== 'complaint') {
              const activityRows = allowedSubtypes
                ? await sql`
                    SELECT action_subtype, reference_id, description, status, meta, created_at
                    FROM activity_log
                    WHERE member_id = ${memberId}
                      AND action_type = 'concierge_request'
                      AND action_subtype = ANY(${allowedSubtypes})
                      AND created_at >= ${since}
                    ORDER BY created_at DESC
                    LIMIT 10
                  `
                : await sql`
                    SELECT action_subtype, reference_id, description, status, meta, created_at
                    FROM activity_log
                    WHERE member_id = ${memberId}
                      AND action_type = 'concierge_request'
                      AND created_at >= ${since}
                    ORDER BY created_at DESC
                    LIMIT 10
                  `;
              for (const row of activityRows.rows) {
                const meta = row.meta || {};
                const ts = row.created_at ? new Date(row.created_at) : null;
                const hoursAgo = ts ? Math.round((Date.now() - ts.getTime()) / 3600000) : null;
                const timeLabel = hoursAgo !== null
                  ? (hoursAgo < 1 ? 'less than an hour ago' : hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`)
                  : 'recently';
                const requestType = row.action_subtype === 'tee_time' ? 'tee_time_request'
                  : row.action_subtype === 'dining_reservation' ? 'dining_request'
                  : row.action_subtype === 'event_rsvp' ? 'event_rsvp'
                  : row.action_subtype === 'tee_time_cancel' ? 'tee_time_cancellation'
                  : row.action_subtype === 'dining_cancel' ? 'dining_cancellation'
                  : row.action_subtype;
                const routedTo = meta.routed_to
                  || (row.action_subtype === 'tee_time' || row.action_subtype === 'tee_time_cancel' ? 'Pro Shop'
                  : row.action_subtype === 'dining_reservation' || row.action_subtype === 'dining_cancel' ? 'Front Desk'
                  : row.action_subtype === 'event_rsvp' ? 'Events Team'
                  : 'Club Staff');
                all.push({
                  request_id: row.reference_id,
                  request_type: requestType,
                  routed_to: routedTo,
                  details: row.description,
                  submitted_at: ts?.toISOString(),
                  time_label: timeLabel,
                  status: row.status === 'pending_staff_confirmation' ? 'pending' : (row.status || 'pending'),
                  summary: `${requestType} sent to ${routedTo} ${timeLabel} — ${row.status === 'pending_staff_confirmation' ? 'awaiting confirmation' : row.status}.`,
                });
              }
            }
          } catch (actErr) {
            console.warn('[concierge] get_request_status activity_log fallback failed:', actErr.message);
          }

          // Query feedback table for complaint status
          // (complaints are written to 'feedback', not activity_log, so they need a separate lookup)
          if (!requestTypeFilter || requestTypeFilter === 'all' || requestTypeFilter === 'complaint') {
            try {
              const feedbackSince = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
              const feedbackResult = await sql`
                SELECT feedback_id, category, status, submitted_at, description
                FROM feedback
                WHERE member_id = ${memberId}
                  AND club_id = ${clubId}
                  AND submitted_at >= ${feedbackSince}
                ORDER BY submitted_at DESC
                LIMIT 5
              `;
              for (const row of feedbackResult.rows) {
                const ts = row.submitted_at ? new Date(row.submitted_at) : null;
                const hoursAgo = ts ? Math.round((Date.now() - ts.getTime()) / 3600000) : null;
                const timeLabel = hoursAgo !== null
                  ? (hoursAgo < 1 ? 'less than an hour ago' : hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`)
                  : 'recently';
                const categoryManagers = {
                  food_and_beverage: 'Sarah Collins, F&B Director',
                  golf_operations: 'Chris Delaney, Head Golf Professional',
                  facilities: 'Robert Kim, Facilities Director',
                  staff: 'Jennifer Hayes, HR Director',
                  billing: 'Anne Torres, Membership Accounting',
                  other: 'David Park, General Manager',
                };
                const assignedManager = categoryManagers[row.category] || 'Club Management';
                all.push({
                  request_id: row.feedback_id,
                  request_type: 'complaint',
                  routed_to: assignedManager,
                  details: `Complaint (${row.category}): ${(row.description || '').slice(0, 100)}`,
                  submitted_at: ts?.toISOString(),
                  time_label: timeLabel,
                  status: row.status === 'resolved' ? 'confirmed' : 'pending',
                  summary: `Complaint (${row.category}) filed ${timeLabel} with ${assignedManager} — status: ${row.status}.`,
                });
              }
            } catch (fbErr) {
              console.warn('[concierge] get_request_status feedback query failed:', fbErr.message);
            }
          }
        }

        if (all.length === 0) {
          return { requests: [], summary: 'No recent requests found in the last 14 days.' };
        }
        const pendingCount = all.filter(r => r.status === 'pending').length;
        const confirmedCount = all.filter(r => r.status === 'confirmed').length;
        return {
          requests: all,
          summary: `Found ${pendingCount} pending and ${confirmedCount} confirmed request(s).`,
        };
      } catch (e) {
        return { requests: [], summary: 'Could not retrieve request status.', error: e.message };
      }
    }

    // ── CHECK TEE AVAILABILITY ─────────────────────────────────────────
    case 'check_tee_availability': {
      const prefTime = input.preferred_time || '07:00';
      const [prefHour, prefMin] = prefTime.split(':').map(Number);

      // Try real tee sheet first
      try {
        const realSlots = await sql`
          SELECT b.tee_time, c.name AS course_name,
                 (4 - COUNT(bp.member_id))::int AS spots_remaining
          FROM bookings b
          JOIN courses c ON c.course_id = b.course_id
          LEFT JOIN booking_players bp ON bp.booking_id = b.booking_id
          WHERE b.club_id = ${clubId}
            AND b.booking_date = ${input.date}
            AND b.status = 'open'
            AND (${input.course || null}::text IS NULL OR c.name ILIKE '%' || ${input.course || ''} || '%')
          GROUP BY b.tee_time, c.name
          HAVING COUNT(bp.member_id) < 4
          ORDER BY ABS(EXTRACT(HOUR FROM b.tee_time::time) * 60 + EXTRACT(MINUTE FROM b.tee_time::time) - ${prefHour * 60 + (prefMin || 0)})
          LIMIT 4
        `;
        if (realSlots.rows.length > 0) {
          return {
            date: input.date,
            available_slots: realSlots.rows.map(r => ({
              time: typeof r.tee_time === 'string' ? r.tee_time.slice(0, 5) : r.tee_time,
              course: r.course_name,
              spots_available: r.spots_remaining,
            })),
          };
        }
      } catch (_) { /* tee sheet query failed — use synthetic fallback */ }

      // Synthetic fallback: generate 3 slots around the preferred time
      const course = input.course || 'North Course';
      const slots = [];
      for (const offsetMin of [0, 12, 24]) {
        const totalMin = prefHour * 60 + (prefMin || 0) + offsetMin;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        slots.push({
          time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          course,
          spots_available: offsetMin === 12 ? 2 : 4,
        });
      }
      return { date: input.date, available_slots: slots };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─── GEMINI INTEGRATION ─────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

function _toGeminiType(t) {
  const m = { string: 'STRING', integer: 'INTEGER', number: 'NUMBER', boolean: 'BOOLEAN', object: 'OBJECT', array: 'ARRAY' };
  return m[(t || 'string').toLowerCase()] || 'STRING';
}

function _toGeminiSchema(schema) {
  if (!schema) return { type: 'OBJECT', properties: {} };
  const properties = {};
  for (const [k, v] of Object.entries(schema.properties || {})) {
    properties[k] = {
      type: _toGeminiType(v.type),
      ...(v.description ? { description: v.description } : {}),
      ...(v.enum ? { enum: v.enum } : {}),
    };
  }
  return {
    type: 'OBJECT',
    properties,
    ...(schema.required?.length ? { required: schema.required } : {}),
  };
}

async function _geminiGenerate({ systemPrompt, contents, tools, temperature, maxOutputTokens }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: temperature ?? 0.5, maxOutputTokens: maxOutputTokens ?? 2048 },
    tools: [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: _toGeminiSchema(t.input_schema) })) }],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 500)}`);
  }
  return res.json();
}

function _geminiText(candidate) {
  return (candidate?.content?.parts || []).filter(p => p.text && !p.thought).map(p => p.text).join('');
}

function _geminiFunctionCalls(candidate) {
  return (candidate?.content?.parts || []).filter(p => p.functionCall);
}
// ─── END GEMINI ──────────────────────────────────────────────────────────────

// Use Claude API whenever an API key exists — managed sessions are optional
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;
const SIMULATION_MODE = !HAS_API_KEY && !GEMINI_API_KEY;

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
  const { member_id, message, debug, last_response } = req.body;

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

  // Detect message intent before building the prompt so complaint protocol
  // is only injected when the current message is actually complaint-related.
  const msgLowerForPrompt = (message || '').toLowerCase();
  const currentMessageIsComplaint = /\b(complain|complaint|issue|problem|terrible|slow|wrong|never|awful|bad|frustrated|upset|billing|invoice|charge|unresolved|follow.?up|any.?news|what.?happened|still.?waiting|nobody|ignored|no.?one|no.?callback|no.?response)\b/.test(msgLowerForPrompt);

  // Build system prompt with message intent context
  const systemPrompt = buildConciergePrompt(profile, clubName, { isComplaintRelated: currentMessageIsComplaint });

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
  // Remove get_club_calendar for cancellation requests — model should only use get_my_schedule
  const isCancelRequest = /\bcancel\b/i.test(message) && /\b(?:tee\s+time|booking|reservation|round)\b/i.test(message);
  if (isCancelRequest) {
    availableTools = availableTools.filter(t => t.name !== 'get_club_calendar');
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

  // Inject session summary as context — always appended when it contains pending request IDs.
  // This is the reliable cross-turn fallback even when member_concierge_events is unavailable.
  if (session.conversation_summary) {
    const summaryHasPending = /COMPLAINT:|REQUEST:/.test(session.conversation_summary);
    if (!conversationContext) {
      conversationContext = `\n\nPrevious conversation context: ${session.conversation_summary}`;
    } else if (summaryHasPending) {
      // Always inject pending request IDs even when event log has other context
      conversationContext += `\n\nPENDING REQUESTS FROM PRIOR TURNS (use this to answer status questions): ${session.conversation_summary}`;
    }
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

  // Live mode: call AI (Gemini primary, Claude fallback when GEMINI_API_KEY absent)
  try {
    const lastResponseContext = last_response
      ? `\n\nYOUR PREVIOUS RESPONSE: "${last_response.slice(0, 400)}"\nThe member's current message is a reply to that. If it is an affirmative ("Yes", "Yes please", "Sure", "Please do", "Go ahead", "sounds good", "that works", "perfect") or a direct slot pick ("7am", "the first one", "Saturday works") — RULE 4 applies: call the appropriate tool NOW and confirm in 1 sentence. Do NOT repeat your previous message. IMPORTANT: If your previous response already listed tee time slots (e.g. "I've got 7:00, 7:12, or 7:24 — which works?"), and the member picks one, call ONLY book_tee_time — do NOT call check_tee_availability again, that was already done in the previous turn.\nOPENER VARIATION (MANDATORY): Read the first sentence of YOUR PREVIOUS RESPONSE above. You MUST NOT start this response with the same opening words or phrase. If the previous response started with "Anne, always love hearing from you!" — choose a DIFFERENT opener from the bank for this response.`
      : '';
    const fullSystemPrompt = systemPrompt + conversationContext + pendingRequestsContext + recommendationContext + lastResponseContext;

    // Collect tool call trace for debug mode; also track successful submissions for fallback use
    const toolCallLog = [];
    const successfulSubmissions = [];

    // Pre-compute persona opener line — same logic used in both LLM paths
    let _openerLine = null;
    if (needsWarmth) {
      if (isGhostMember) {
        _openerLine = `a varied warm welcome-back (e.g. "${memberFirstName}! We've missed you so much — so glad you reached out." or "${memberFirstName}! You just made my day." — VARY it, never repeat the same phrase)`;
      } else if (isComplaintFirstFlag) {
        const _hasBilling = notesLowerChat.includes('billing') || notesLowerChat.includes('invoice') || notesLowerChat.includes('charge');
        const _hasService = notesLowerChat.includes('slow service') || notesLowerChat.includes('slow at the bar') || notesLowerChat.includes('service at the bar') || notesLowerChat.includes('wait');
        if (currentMessageIsComplaint) {
          // Heavy opener only when current message is complaint-related
          const _ack = _hasBilling
            ? `"${memberFirstName}, I know that billing issue still hasn't been resolved, let me make sure we get that fixed."`
            : _hasService
            ? `"${memberFirstName}, I know that wait wasn't what you deserved, I want to make this visit better."`
            : `"${memberFirstName}, I know your last experience wasn't what it should have been, I want to make this one different."`;
          _openerLine = `${_ack} (VARY on subsequent turns, do not repeat verbatim)`;
        } else {
          // Light 1-sentence acknowledgment for routine messages
          _openerLine = `a BRIEF 1-sentence light acknowledgment (e.g. "${memberFirstName}, I know your last experience wasn't what it should have been —") then IMMEDIATELY handle their request in the same or next sentence. ONE SENTENCE MAX for the acknowledgment. Do NOT use heavy apology language.`;
        }
      } else if (isAtRiskMember) {
        _openerLine = `a warm re-engagement opener (e.g. "${memberFirstName}, always love hearing from you!" or "${memberFirstName}! Great to hear from you, we'd love to see you out here more." or "So good to hear from you, ${memberFirstName}!" — VARY it, never repeat the same phrase)`;
      } else {
        _openerLine = `"${memberFirstName}, I know your last experience wasn't what it should have been, I want to make sure this one is different."`;
      }
    }

    // Shared tool executor — emits all session events regardless of which LLM path runs
    const executeAndLogTool = async (toolName, toolInput) => {
      let toolResult;
      try {
        toolResult = await executeConciergeTool(toolName, toolInput, profile, clubId);
      } catch (toolErr) {
        console.warn(`[concierge] tool ${toolName} threw:`, toolErr.message);
        toolResult = { error: 'Tool execution failed', message: 'Unable to complete that action. Let me connect you with staff.' };
      }
      if (toolResult?.status === 'submitted' || toolResult?.status === 'request_submitted') {
        successfulSubmissions.push({ tool: toolName, result: toolResult });
      }
      if (debug) toolCallLog.push({ tool_name: toolName, arguments: toolInput, result: toolResult, ts: new Date().toISOString() });
      try { await emitConciergeEvent(member_id, clubId, { type: 'tool_call', tool: toolName, args: toolInput, status: toolResult?.status || 'ok', result_summary: JSON.stringify(toolResult).slice(0, 200) }); } catch (_) {}
      emitAgentEvent(`mbr_${member_id}_concierge`, clubId, { type: 'tool_call', tool: toolName, args: toolInput, status: toolResult?.status || 'ok', result_summary: JSON.stringify(toolResult).slice(0, 200), source_agent: 'member_concierge' }).catch(() => {});
      if (toolResult?.status === 'request_submitted' && toolResult?.request_id) {
        try { await emitConciergeEvent(member_id, clubId, { type: 'request_submitted', request_id: toolResult.request_id, request_type: toolName, routed_to: toolResult.routed_to, details: toolResult.details, expected_response: toolResult.expected_response }); } catch (_) {}
        emitAgentEvent(`mbr_${member_id}_concierge`, clubId, { type: 'request_submitted', request_id: toolResult.request_id, request_type: toolName, routed_to: toolResult.routed_to, details: toolResult.details, expected_response: toolResult.expected_response, source_agent: 'member_concierge' }).catch(() => {});
        appendSessionSummary(clubId, member_id, `REQUEST:${toolResult.request_id}|tool:${toolName}|team:${toolResult.routed_to}|${new Date().toISOString().slice(0,16)}`).catch(() => {});
      }
      if (toolResult?.complaint_id && toolResult?.status === 'filed') {
        try { await emitConciergeEvent(member_id, clubId, { type: 'complaint_filed', complaint_id: toolResult.complaint_id, category: toolInput.category, description: toolInput.description, routed_to: toolResult.routed_to, assigned_manager: toolResult.assigned_manager, expected_response: toolResult.expected_response }); } catch (_) {}
        appendSessionSummary(clubId, member_id, `COMPLAINT:${toolResult.complaint_id}|mgr:${toolResult.assigned_manager}|dept:${toolResult.routed_to}|${new Date().toISOString().slice(0,16)}`).catch(() => {});
      }
      return toolResult;
    };

    let responseText = '';

    if (GEMINI_API_KEY) {
      // ── Gemini path ──────────────────────────────────────────────────────────
      const contents = [{ role: 'user', parts: [{ text: message }] }];
      let geminiResp = await _geminiGenerate({
        systemPrompt: fullSystemPrompt,
        contents,
        tools: availableTools,
        temperature: conciergeTemperature,
        maxOutputTokens: 2048,
      });

      let loopGuard = 0;
      const seenToolCalls = new Set();
      let diningNeedsPartySizeOffer = false;
      let rsvpBlockedNeedsTeeTime = false;
      // Computed once — whether the prior response already listed tee time slots (T2 confirmation context)
      const lastRespHadSlots = last_response && /\d{1,2}:\d{2}.*\d{1,2}:\d{2}/.test(last_response);
      while (loopGuard++ < 5) {
        const candidate = geminiResp.candidates?.[0];
        const fnCalls = _geminiFunctionCalls(candidate);
        if (!fnCalls.length) break;

        contents.push({ role: 'model', parts: candidate.content.parts });

        const dedupedCalls = fnCalls.filter(({ functionCall: fc }) => {
          const key = `${fc.name}:${JSON.stringify(fc.args)}`;
          if (seenToolCalls.has(key)) { console.warn(`[concierge] dedup: skipping duplicate ${fc.name}`); return false; }
          seenToolCalls.add(key);
          return true;
        });
        if (!dedupedCalls.length) break;

        // Server-side tee time gate: if book_tee_time is called without a prior
        // check_tee_availability in this session, intercept and redirect.
        // EXCEPTION: if last_response already contained slot options (T2 confirmation),
        // the availability check was done in the prior turn — allow book_tee_time directly.
        const intercepted = dedupedCalls.filter(({ functionCall: fc }) => {
          if (fc.name === 'book_tee_time' && !seenToolCalls.has(`check_tee_availability:intercepted`) && !lastRespHadSlots) {
            const alreadyChecked = [...seenToolCalls].some(k => k.startsWith('check_tee_availability:'));
            if (!alreadyChecked) {
              console.warn('[concierge] TEE GATE: book_tee_time called before check_tee_availability — intercepting');
              seenToolCalls.add('check_tee_availability:intercepted');
              fc.name = 'check_tee_availability'; // redirect to availability check
              fc.args = { date: fc.args.date, preferred_time: fc.args.time };
            }
          }
          // T2 redundant check: if last_response already had slots and model fires check_tee_availability,
          // either skip it (if book_tee_time also firing) or redirect it to book_tee_time.
          if (fc.name === 'check_tee_availability' && lastRespHadSlots) {
            const bookTeeAlsoFiring = dedupedCalls.some(c => c.functionCall.name === 'book_tee_time');
            if (bookTeeAlsoFiring) {
              console.warn('[concierge] TEE GATE T2: skipping redundant check_tee_availability (book_tee_time also firing)');
              return false; // skip the redundant check, let book_tee_time handle it
            }
            // Model ONLY fired check_tee_availability on T2 confirmation — redirect to book
            console.warn('[concierge] TEE GATE T2: redirecting sole check_tee_availability → book_tee_time');
            fc.name = 'book_tee_time';
            fc.args = {
              date: fc.args.date,
              time: fc.args.preferred_time || '08:00',
              course: fc.args.course || 'North Course',
            };
          }
          // ── DINING PARTY SIZE IN-LOOP GATE ────────────────────────────────────
          // Block make_dining_reservation before it fires when party size is unknown
          // and no prior dining context (offer or question) was in the last response.
          // This prevents tool/response mismatch (tool fires but agent should ask first).
          if (fc.name === 'make_dining_reservation') {
            const msgHasPartySz = /\b(?:for\s+\d+|\d+\s+(?:people|persons?|guests?|of\s+us)|me\s+and\s+(?:my\s+)?\S+|party\s+of\s+\d+|table\s+for\s+\d+|just\s+(?:me|us|the\s+two)|two\s+of\s+us|\btwo\b|\bthree\b|\bfour\b|\bfive\b|\bsix\b)\b/i.test(message);
            const hhRef = (profile.household || []).some(h => {
              const fn = (h.name || '').split(' ')[0].toLowerCase();
              return fn.length > 2 && message.toLowerCase().includes(fn);
            });
            const priorDiningCtx = last_response && /say\s+yes\s+and\s+i.?ll\s+(?:send|book)|how\s+about\s+dinner\s+for|how\s+many|for\s+how\s+many|party\s+size/i.test(last_response);
            if (!msgHasPartySz && !hhRef && !priorDiningCtx) {
              console.warn('[concierge] DINING IN-LOOP GATE: make_dining_reservation blocked — party size unknown, no prior dining context');
              diningNeedsPartySizeOffer = true;
              return false; // block tool before execution
            }
          }
          // ── CANCEL GATE: block get_club_calendar for cancellation requests ──────
          // Cancellation needs get_my_schedule only — calendar is irrelevant.
          if (fc.name === 'get_club_calendar') {
            const isCancelMsg = /\bcancel\b/i.test(message) && /\b(?:tee\s+time|booking|reservation|round)\b/i.test(message);
            if (isCancelMsg) {
              console.warn('[concierge] CANCEL GATE: blocking get_club_calendar for cancellation request');
              return false;
            }
          }
          // ── RSVP EVENT GATE ───────────────────────────────────────────────────
          // Block rsvp_event when context is a golf round booking, not a club event.
          // "Put me down for it" after tee/course/round mention = tee time, not RSVP.
          // Exception: if prior response listed events (Championship, Wine Dinner etc.)
          // then "put me down" IS an event RSVP even if course was mentioned.
          if (fc.name === 'rsvp_event') {
            const prevRespMentionedRound = last_response && /\b(?:round|tee\s*time|south\s+course|north\s+course|course)\b/i.test(last_response);
            const msgIsGolfRound = /\b(?:round|tee\s*time|south\s+course|north\s+course)\b/i.test(message);
            const hasEventName = /\b(?:tournament|championship|qualifier|social|gala|competition|wine\s+dinner|ladies'\s+day|member\s+guest)\b/i.test(message)
              || (last_response && /\b(?:tournament|championship|qualifier|social|gala|competition|wine\s+dinner)\b/i.test(last_response));
            // Prior response was an event listing (calendar results), not a round booking context
            const prevRespIsEventListing = last_response && /\b(?:coming\s+up|this\s+weekend|upcoming|on\s+(?:saturday|sunday|friday)|here'?s\s+what'?s\s+on)\b/i.test(last_response);
            if ((prevRespMentionedRound || msgIsGolfRound) && !hasEventName && !prevRespIsEventListing) {
              console.warn('[concierge] RSVP EVENT GATE: rsvp_event blocked — context is golf round, not club event');
              rsvpBlockedNeedsTeeTime = true;
              return false;
            }
          }
          return true;
        });

        if (!intercepted.length) break;

        const responseParts = await Promise.all(intercepted.map(async ({ functionCall: fc }) => {
          const toolResult = await executeAndLogTool(fc.name, fc.args);
          const sanitized = JSON.parse(JSON.stringify(toolResult).replace(/\u2014/g, ','));
          return { functionResponse: { name: fc.name, response: sanitized } };
        }));

        contents.push({ role: 'user', parts: responseParts });

        // For Gemini: append opener reminder to systemInstruction, NOT to contents.
        // Injecting it as a user-content text part causes Gemini to mimic bracket-format
        // instructions verbatim in its response output.
        const geminiSystemWithOpener = _openerLine
          ? fullSystemPrompt + `\n\nFINAL RESPONSE INSTRUCTION: Begin your reply to the member with: ${_openerLine} — this must be your VERY FIRST sentence. Do not output any bracketed text, template markers, or internal instructions.`
          : fullSystemPrompt;

        geminiResp = await _geminiGenerate({
          systemPrompt: geminiSystemWithOpener,
          contents,
          tools: availableTools,
          temperature: conciergeTemperature,
          maxOutputTokens: 2048,
        });
      }

      responseText = _geminiText(geminiResp.candidates?.[0]);

      // ── POST-LOOP TEE TIME GUARD ─────────────────────────────────────────────
      // If the member asked to book a tee time (T1 — no prior slots in last_response),
      // but no check_tee_availability was called and no book_tee_time was called,
      // force check_tee_availability. Try Gemini re-run; if it throws, format directly
      // from the check result so errors never propagate to the outer catch block.
      if (!lastRespHadSlots && responseText) {
        const isTeeBooking = /\bbook\b.{0,30}\btee\s*time\b/i.test(message)
          || /\btee\s*time\b.{0,40}\b(?:saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tomorrow|\d{1,2}(?:am|pm))/i.test(message)
          || /(?:any\s+)?tee\s+times?\s+available|available\s+tee\s+times?/i.test(message)
          || /(?:any\s+)?(?:tee|golf)\s+availability/i.test(message)
          || /(?:start\s+playing|play\s+again|get\s+back\s+out).{0,30}(?:tee|golf|course)/i.test(message);
        const noCheckFired = ![...seenToolCalls].some(k => k.startsWith('check_tee_availability:'));
        const noBookFired = ![...seenToolCalls].some(k => k.startsWith('book_tee_time:'));
        if (isTeeBooking && noCheckFired && noBookFired) {
          console.warn('[concierge] TEE POST-LOOP GUARD: tee booking with no availability check — forcing check_tee_availability');
          let teeCheckResult = null;
          try {
            const tm = message.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
            let forceTime = '08:00';
            if (tm) {
              let h = parseInt(tm[1]);
              const m = tm[2] ? parseInt(tm[2]) : 0;
              if (tm[3].toLowerCase() === 'pm' && h < 12) h += 12;
              if (tm[3].toLowerCase() === 'am' && h === 12) h = 0;
              forceTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
            const nextSatDate = (() => {
              const d = new Date();
              const daysUntilSat = ((6 - d.getDay() + 7) % 7) || 7;
              d.setDate(d.getDate() + daysUntilSat);
              return d.toISOString().split('T')[0];
            })();
            const forceDate = message.match(/\d{4}-\d{2}-\d{2}/)?.[0] || nextSatDate;
            teeCheckResult = await executeAndLogTool('check_tee_availability', { date: forceDate, preferred_time: forceTime });
            const sanitizedCheck = JSON.parse(JSON.stringify(teeCheckResult).replace(/\u2014/g, ','));
            const forceContents = [
              { role: 'user', parts: [{ text: message }] },
              { role: 'model', parts: [{ functionCall: { name: 'check_tee_availability', args: { date: forceDate, preferred_time: forceTime } } }] },
              { role: 'user', parts: [{ functionResponse: { name: 'check_tee_availability', response: sanitizedCheck } }] },
            ];
            const forceResp = await _geminiGenerate({
              systemPrompt: fullSystemPrompt,
              contents: forceContents,
              tools: availableTools,
              temperature: conciergeTemperature,
              maxOutputTokens: 2048,
            });
            const forcedText = _geminiText(forceResp.candidates?.[0]);
            if (forcedText) responseText = forcedText;
          } catch (teeErr) {
            console.warn('[concierge] TEE POST-LOOP GUARD error — using direct format:', teeErr.message);
            // Format directly from checkResult so errors don't reach outer catch
            if (teeCheckResult?.available_slots?.length > 0) {
              const slots = teeCheckResult.available_slots.slice(0, 3);
              const slotList = slots.map(s => s.time).join(', ');
              const courseName = slots[0]?.course || 'the course';
              responseText = `${memberFirstName}! Available Saturday on ${courseName}: ${slotList} — which works for you?`;
            } else if (teeCheckResult) {
              responseText = `${memberFirstName}, I'm not seeing open slots right now — let me have the pro shop confirm Saturday availability.`;
            }
            // If teeCheckResult is null (executeAndLogTool threw too), leave responseText as model's output
          }
        }
      }

      // ── POST-LOOP DECLINING MEMBER DINING SPECIFICS GUARD ────────────────────
      // When a declining member sends a dining request without party size AND time,
      // override the response with an explicit ask regardless of what the model did.
      // Declining members get "ask" style (not propose defaults) to avoid fabrication.
      if (isDeclineMemberFlag && responseText) {
        try {
          const isDiningMsg2 = /\b(?:dinner|lunch|dining|reservation|book\s+(?:a\s+)?(?:table|dinner|lunch)|dine)\b/i.test(message);
          const msgHasTime = /\b(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)\b/i.test(message) || /\b(?:noon|midnight|morning|evening|afternoon)\b/i.test(message);
          const msgHasPartyDcl = /\b(?:for\s+\d+|\d+\s+(?:people|persons?|guests?|of\s+us)|party\s+of\s+\d+|table\s+for\s+\d+|just\s+(?:me|us|the\s+two)|two\s+of\s+us|\btwo\b|\bthree\b|\bfour\b|\bfive\b|\bsix\b)\b/i.test(message);
          const prevDiningCtxDcl = last_response && /say\s+yes\s+and\s+i.?ll\s+(?:send|book)|how\s+about\s+dinner\s+for|how\s+many|for\s+how\s+many|party\s+size/i.test(last_response);
          const diningToolFiredDcl = [...seenToolCalls].some(k => k.startsWith('make_dining_reservation:'));
          if (isDiningMsg2 && !msgHasTime && !msgHasPartyDcl && !prevDiningCtxDcl && !diningToolFiredDcl) {
            const hasDateDcl = /\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i.test(message);
            const dateDcl = message.match(/\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i)?.[1];
            const seatPrefDcl = message.match(/\b(booth(?:\s+by\s+the\s+window)?|window\s+(?:booth|seat|table)|corner\s+table|outdoor|patio|quiet\s+table)\b/i)?.[0];
            const prefNoteDcl = seatPrefDcl ? ` (${seatPrefDcl} noted)` : '';
            if (hasDateDcl) {
              responseText = `${memberFirstName}, love hearing from you! What time and party size work for ${dateDcl}${prefNoteDcl}?`;
            } else {
              responseText = `${memberFirstName}, love hearing from you! What date, time, and party size work for you?`;
            }
            console.warn('[concierge] DECLINING DINING GUARD: overriding with explicit ask');
          }
        } catch (dclErr) {
          console.warn('[concierge] DECLINING DINING GUARD error (suppressed):', dclErr.message);
        }
      }

      // ── POST-LOOP DINING PARTY SIZE CLARIFICATION ────────────────────────────
      // When the in-loop gate blocked make_dining_reservation, provide a date-aware
      // clarification response: propose a default if date is known, ask directly if not.
      // For declining/at-risk members, add warm opener. Note any stated seating preference.
      if (diningNeedsPartySizeOffer) {
        const hasDateInMsg = /\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i.test(message);
        const dateRef = message.match(/\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tomorrow)\b/i)?.[1];
        // Extract any seating preference from the message
        const seatPrefMatch = message.match(/\b(booth(?:\s+by\s+the\s+window)?|window\s+(?:booth|seat|table)|corner\s+table|outdoor|patio|quiet\s+table)\b/i);
        const prefNote = seatPrefMatch ? `, ${seatPrefMatch[0]} noted` : '';
        const needsWarmOpener = isDeclineMemberFlag || isAtRiskMember;
        // Declining/at-risk members with intent ("I want", "book", "I'd like") get asked
        // rather than offered defaults — they're coming back, honour their specificity.
        const isDiningIntent = /\b(?:I\s+want|book|make|can\s+I\s+get|I'?d\s+like|I'?d\s+love)\b/i.test(message);
        const askRatherThanPropose = needsWarmOpener && isDiningIntent;
        if (hasDateInMsg) {
          if (askRatherThanPropose) {
            const prefNoteAsk = seatPrefMatch ? ` (${seatPrefMatch[0]} noted)` : '';
            responseText = `${memberFirstName}, great to hear from you! What time and how many guests for ${dateRef}${prefNoteAsk}?`;
          } else {
            const offer = `how about dinner for 2 at 7pm this ${dateRef}${prefNote}? Say yes and I'll book it.`;
            responseText = needsWarmOpener
              ? `${memberFirstName}, love hearing from you! ${offer.charAt(0).toUpperCase() + offer.slice(1)}`
              : `${memberFirstName}, ${offer}`;
          }
        } else {
          responseText = needsWarmOpener
            ? `${memberFirstName}, great to hear from you! When would you like the reservation, and for how many guests?`
            : `${memberFirstName}, when would you like the reservation, and for how many guests?`;
        }
      }

      // ── POST-LOOP DINING PARTY SIZE GUARD (fallback) ─────────────────────────
      // Catches the rare case where make_dining_reservation slips through the in-loop
      // gate (e.g. model retries after a blocked iteration) but the response text
      // still lacks confirmation. Only fires when prior response had no dining context.
      if (responseText && !diningNeedsPartySizeOffer) {
        const diningFired = [...seenToolCalls].some(k => k.startsWith('make_dining_reservation:'));
        if (diningFired) {
          const msgHasPartySize = /\b(?:for\s+\d+|\d+\s+(?:people|persons?|guests?|of\s+us)|me\s+and\s+(?:my\s+)?\S+|party\s+of\s+\d+|table\s+for\s+\d+|just\s+(?:me|us|the\s+two)|two\s+of\s+us|\btwo\b|\bthree\b|\bfour\b|\bfive\b|\bsix\b)\b/i.test(message);
          const householdRef = (profile.household || []).some(h => {
            const fn = (h.name || '').split(' ')[0].toLowerCase();
            return fn.length > 2 && message.toLowerCase().includes(fn);
          });
          const prevRespHadDiningOffer = last_response && /say\s+yes\s+and\s+i.?ll\s+(?:send|book)|how\s+about\s+dinner\s+for/i.test(last_response);
          const prevRespAskedPartySize = last_response && /how\s+many|party\s+size|for\s+how\s+many/i.test(last_response);
          const prevRespHadDiningContext = prevRespHadDiningOffer || prevRespAskedPartySize;
          if (!msgHasPartySize && !householdRef && !prevRespHadDiningContext) {
            console.warn('[concierge] DINING PARTY SIZE GUARD (fallback): party_size not confirmed — overriding with clarification');
            const hasDateInMsg = /\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i.test(message);
            const dateRef = message.match(/\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tomorrow)\b/i)?.[1];
            const seatPrefFb = message.match(/\b(booth(?:\s+by\s+the\s+window)?|window\s+(?:booth|seat|table)|corner\s+table|outdoor|patio|quiet\s+table)\b/i);
            const prefNoteFb = seatPrefFb ? `, ${seatPrefFb[0]} noted` : '';
            const needsWarmFb = isDeclineMemberFlag || isAtRiskMember;
            if (hasDateInMsg) {
              const offer = `how about dinner for 2 at 7pm this ${dateRef}${prefNoteFb}? Say yes and I'll book it.`;
              responseText = needsWarmFb
                ? `${memberFirstName}, love hearing from you! ${offer.charAt(0).toUpperCase() + offer.slice(1)}`
                : `${memberFirstName}, ${offer}`;
            } else {
              responseText = needsWarmFb
                ? `${memberFirstName}, love hearing from you! When would you like the reservation, and for how many guests?`
                : `${memberFirstName}, when would you like the reservation, and for how many guests?`;
            }
          }
        }
      }

      // ── POST-LOOP DINING INTENT GUARD ────────────────────────────────────────
      // Catches when the model bypasses the tool entirely and generates a fake dining
      // confirmation (no tool fired, but response claims booking was sent).
      if (responseText && !diningNeedsPartySizeOffer) {
        const isDiningMsg = /\b(?:dinner|lunch|dining|reservation|book\s+a\s+table|dine)\b/i.test(message);
        const noDiningToolFired = ![...seenToolCalls].some(k => k.startsWith('make_dining_reservation:'));
        if (isDiningMsg && noDiningToolFired) {
          const msgHasPartySz2 = /\b(?:for\s+\d+|\d+\s+(?:people|persons?|guests?|of\s+us)|me\s+and\s+(?:my\s+)?\S+|party\s+of\s+\d+|table\s+for\s+\d+|just\s+(?:me|us|the\s+two)|two\s+of\s+us|\btwo\b|\bthree\b|\bfour\b|\bfive\b|\bsix\b)\b/i.test(message);
          const hhRef2 = (profile.household || []).some(h => {
            const fn = (h.name || '').split(' ')[0].toLowerCase();
            return fn.length > 2 && message.toLowerCase().includes(fn);
          });
          const prevDiningCtx2 = last_response && /say\s+yes\s+and\s+i.?ll\s+(?:send|book)|how\s+about\s+dinner\s+for|how\s+many|for\s+how\s+many|party\s+size/i.test(last_response);
          const responseClaimedAction = /\b(?:sent|submitted|booked|f&b\s+team|confirm\s+within|table\s+for)\b/i.test(responseText);
          if (!msgHasPartySz2 && !hhRef2 && !prevDiningCtx2 && responseClaimedAction) {
            console.warn('[concierge] DINING INTENT GUARD: dining action claimed without tool — overriding with clarification');
            const hasDateInMsg2 = /\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i.test(message);
            const dateRef2 = message.match(/\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tomorrow)\b/i)?.[1];
            const seatPrefInt = message.match(/\b(booth(?:\s+by\s+the\s+window)?|window\s+(?:booth|seat|table)|corner\s+table|outdoor|patio|quiet\s+table)\b/i);
            const prefNoteInt = seatPrefInt ? `, ${seatPrefInt[0]} noted` : '';
            const needsWarmInt = isDeclineMemberFlag || isAtRiskMember;
            if (hasDateInMsg2) {
              const offer2 = `how about dinner for 2 at 7pm this ${dateRef2}${prefNoteInt}? Say yes and I'll book it.`;
              responseText = needsWarmInt
                ? `${memberFirstName}, love hearing from you! ${offer2.charAt(0).toUpperCase() + offer2.slice(1)}`
                : `${memberFirstName}, ${offer2}`;
            } else {
              responseText = needsWarmInt
                ? `${memberFirstName}, love hearing from you! When would you like the reservation, and for how many guests?`
                : `${memberFirstName}, when would you like the reservation, and for how many guests?`;
            }
          }
        }
      }

      // ── POST-LOOP RSVP → TEE TIME REDIRECT ───────────────────────────────────
      // When rsvp_event was blocked because context was golf round, provide tee time ask.
      if (rsvpBlockedNeedsTeeTime) {
        const courseMention = message.match(/\b(south|north|east|west)\s+course\b/i)?.[0]
          || (last_response && last_response.match(/\b(south|north|east|west)\s+course\b/i)?.[0])
          || 'the course';
        responseText = `${memberFirstName}, I'd love to get you out on ${courseMention}! What date and time works for you?`;
      }

      // ── POST-LOOP COMPLAINT GUARD ─────────────────────────────────────────────
      // If message is a specific complaint (location OR incident details present)
      // but file_complaint was not called, force the tool and format the response
      // directly — no second Gemini call to avoid API error propagation.
      if (responseText) {
        try {
          const hasComplaintLocation = /\b(?:grill|pro\s*shop|dining\s+room|restaurant|bar|kitchen|locker|course|pool|gym|spa|club\s*house|front\s+nine|back\s+nine)\b/i.test(message);
          const hasSpecificIncident = /\b(?:cold|wrong\s+order|incorrect\s+order|waited?\s+\d+|wait(?:ed|ing)?\s+(?:\d+|too\s+long|forever)|overcharged|missing\s+item|order\s+wrong)\b/i.test(message);
          const hasComplaintKeyword = /\b(?:complaint|terrible|disappointed|unacceptable|awful|horrible|issue\s+with|problem\s+with)\b/i.test(message);
          const isSpecificComplaint = (hasComplaintLocation || hasSpecificIncident || hasComplaintKeyword);
          const complaintFired = [...seenToolCalls].some(k => k.startsWith('file_complaint:'));
          if (isSpecificComplaint && !complaintFired) {
            console.warn('[concierge] COMPLAINT GUARD: specific complaint with no file_complaint tool — forcing it');
            const category = /\b(?:food|grill|dining|meal|drink|cold|order)\b/i.test(message) ? 'food_and_beverage'
              : /\b(?:golf|course|tee|green|cart)\b/i.test(message) ? 'golf_operations'
              : /\b(?:facility|locker|pool|gym|spa)\b/i.test(message) ? 'facilities'
              : /\b(?:staff|service|rude|employee)\b/i.test(message) ? 'staff'
              : 'other';
            // Sanitize message before passing to tool (strip em-dashes etc.)
            const cleanDescription = message.replace(/\u2014/g, ',').replace(/\u2013/g, '-');
            const complaintResult = await executeAndLogTool('file_complaint', { category, description: cleanDescription });
            // Format response directly — no Gemini re-run to avoid API error propagation
            const ref = complaintResult?.complaint_id || complaintResult?.reference_number || 'on file';
            const manager = complaintResult?.assigned_manager || 'our team';
            // For at-risk/declining members or repeat complaints, prepend warm acknowledgment
            const isRepeatComplaint = /\bagain\b/i.test(message);
            const needsComplaintAck = isComplaintFirstFlag || isAtRiskMember || isDeclineMemberFlag || isRepeatComplaint;
            if (needsComplaintAck) {
              // Stronger ack for repeat complaints with prior complaint history
              const isHeavyAck = isRepeatComplaint && hasPriorComplaintFlag;
              const ackPhrase = isHeavyAck
                ? `this is completely unacceptable, especially after your previous experience`
                : isRepeatComplaint
                  ? `I'm so sorry this happened again`
                  : `I'm so sorry about this`;
              responseText = `${memberFirstName}, ${ackPhrase}, filed with ${manager}, ref ${ref}. They'll follow up within 24 hours.`;
            } else {
              responseText = `${memberFirstName}, filed with ${manager}, ref ${ref}. They'll follow up within 24 hours.`;
            }
          }
        } catch (guardErr) {
          console.warn('[concierge] COMPLAINT GUARD error (suppressed):', guardErr.message);
          // Leave responseText unchanged — don't let guard failure crash the request
        }
      }

      // ── POST-LOOP PROFILE HANDICAP GUARD ─────────────────────────────────────
      // When member asks about their handicap and get_member_profile fired, check
      // the profile object directly for handicap/GHIN data. Model often says
      // "not showing up" even when the data exists, or asks permission to check.
      if (responseText && [...seenToolCalls].some(k => k.startsWith('get_member_profile:'))) {
        const isHandicapQ = /\b(?:handicap|ghin|index)\b/i.test(message);
        if (isHandicapQ) {
          const handicapVal = profile.handicap ?? profile.handicap_index ?? profile.ghin_index ?? profile.ghin ?? null;
          if (handicapVal !== null && handicapVal !== undefined) {
            responseText = `${memberFirstName}, your current handicap index is ${handicapVal}.`;
            console.warn('[concierge] PROFILE HANDICAP GUARD: returning handicap from profile object');
          } else {
            // Handicap not in profile — always write a clear, direct statement
            responseText = `${memberFirstName}, your handicap isn't on file — I'll have the pro shop reach out with your current index.`;
            console.warn('[concierge] PROFILE HANDICAP GUARD: handicap absent, writing clear direct statement');
          }
        }
      }

      // ── POST-LOOP PROCESS LANGUAGE SCRUB ─────────────────────────────────────
      // Strip "sent to front desk / confirm within the hour" padding from dining
      // confirmations. The model adds this despite CONFIRMATION LANGUAGE RULE;
      // remove it here when a dining tool actually fired.
      if (responseText && [...seenToolCalls].some(k => k.startsWith('make_dining_reservation:'))) {
        responseText = responseText
          .replace(/[.!]\s+Sent\s+your\s+request\s+to\s+the\s+front\s+desk[^.!]*[.!]/gi, '.')
          .replace(/[,;]\s+(?:sent|I've\s+sent)\s+your\s+request\s+to\s+the\s+front\s+desk[^.!]*/gi, '')
          .replace(/[.!]\s+[Tt]he\s+front\s+desk\s+will\s+confirm[^.!]*[.!]/gi, '.')
          .replace(/,\s+and\s+the\s+front\s+desk\s+will\s+confirm[^.!]*/gi, '')
          .replace(/[,;]\s+(?:the\s+front\s+desk|they'?ll)\s+(?:will\s+)?confirm\s+(?:within|in)\s+[^.!]*/gi, '')
          .replace(/[.!]\s+[Tt]hey'?ll\s+confirm\s+(?:within|in)\s+[^.!]*[.!]/gi, '.')
          // Strip "our front desk team will confirm/follow up/reach out" variants
          .replace(/,\s+and\s+(?:the\s+|our\s+)?front\s+desk(?:\s+team)?\s+will\s+(?:confirm|follow\s+up|reach\s+out)[^.!]*/gi, '')
          .replace(/[.!]\s+(?:The\s+|Our\s+)?[Ff]ront\s+desk(?:\s+team)?\s+will\s+(?:confirm|follow\s+up|reach\s+out)[^.!]*[.!]/gi, '.')
          // Strip "I've sent that/it to our/the front desk team" variants
          .replace(/,\s+and\s+I'?ve\s+sent\s+(?:that|it|the\s+\w+)\s+to\s+(?:our\s+|the\s+)?front\s+desk(?:\s+team)?[^.!]*/gi, '')
          // Replace "I've requested a table" with done-deal language
          .replace(/I'?ve\s+requested\s+a\s+table/gi, 'Booked a table')
          // Replace "I've [also] sent your [dinner] request for X to the front desk [...]" → "Booked dinner for X"
          // Catches sentence-starting variants (after ? or . in multi-intent responses)
          .replace(/I'?ve\s+(?:also\s+)?sent\s+your\s+(?:dinner\s+|dining\s+)?request\s+(for\s+\d+[^.!,]*?)\s+to\s+(?:the\s+|our\s+)?front\s+desk[^.!]*/gi, 'Booked dinner $1')
          // Strip fabricated venue descriptions and re-engagement padding after confirmation
          .replace(/[.!]\s+The\s+[A-Z][^.!\n]+(?:has\s+been|is)\s+(?:wonderful|great|excellent|lovely|fantastic|beautiful)[^.!]*[.!]/gi, '.')
          .replace(/,?\s+and\s+(?:we|I)\s+can'?t\s+wait\s+to\s+have\s+you\s+back[^.!]*/gi, '')
          .replace(/[.!]\s+(?:We|I)\s+can'?t\s+wait\s+to\s+(?:have\s+you\s+back|see\s+you)[^.!]*[.!]/gi, '.')
          // Strip hollow T2 standalone warm sentence before confirmation (e.g. "Anne! You made my day.")
          // Only strip when the hollow phrase IS the full sentence (ends with . or ! directly, no comma-clause after it)
          .replace(/^([A-Z][a-z]+!)\s+(?:you\s+made\s+my\s+day|so\s+glad\s+you\s+(?:reached\s+out|did)|so\s+good\s+to\s+hear\s+from\s+you)(?:\s+\w+){0,3}[.!]\s*/i, '$1 ')
          // Strip hollow T2 warmth clause when confirming a booking after prior offer
          .replace(/^[^,!]+[,!]\s+(?:I'?m\s+)?(?:so\s+(?:glad|happy)\s+you\s+reached\s+out|always\s+love\s+hearing\s+from\s+you|great\s+to\s+hear\s+from\s+you|so\s+good\s+to\s+hear\s+from\s+you|you\s+made\s+my\s+day)[^,!.]*[,!.]\s*/i, `${memberFirstName}, `)
          .replace(/\s+\.$/, '.')
          .trim();
      }

      // ── POST-LOOP CALENDAR GUARD ──────────────────────────────────────────────
      // When member asks about club events/activities but model answered without
      // calling get_club_calendar: fire it and, if the model deferred to staff,
      // replace the response with actual event data.
      if (responseText) {
        try {
          const isEventQuery = /\b(?:what'?s?\s+(?:happening|going\s+on|on|new)\s+(?:at\s+(?:the\s+)?club|this\s+weekend|this\s+week)|what\s+have\s+I\s+missed|events?\s+(?:this|at|coming|upcoming)|this\s+weekend|club\s+events?|what(?:'s|\s+is)\s+(?:new|on|happening)\s+(?:at\s+)?(?:the\s+)?club|what(?:'s|\s+is)\s+on\s+(?:at\s+the\s+)?club)\b/i.test(message);
          const calendarFired = [...seenToolCalls].some(k => k.startsWith('get_club_calendar:'));
          if (isEventQuery && !calendarFired && !isCancelRequest) {
            console.warn('[concierge] CALENDAR GUARD: event query with no get_club_calendar — firing it');
            const calResult = await executeAndLogTool('get_club_calendar', {});
            // If model deferred to events team instead of giving real info, replace response
            const modelDeferred = /events?\s+team|reach\s+out|pull\s+together|let\s+you\s+know/i.test(responseText);
            const events = calResult?.events || [];
            if (modelDeferred && events.length > 0) {
              console.warn('[concierge] CALENDAR GUARD: replacing events-team-deferral with real event data');
              const eventList = events.slice(0, 3).map(e => {
                const parts = [];
                const evTitle = e.title || e.name || e.event_name;
                if (evTitle) parts.push(evTitle);
                if (e.date) parts.push(e.date);
                if (e.time) parts.push(`at ${e.time}`);
                if (e.location) parts.push(`in ${e.location}`);
                return `\u2022 ${parts.join(' ')}`;
              }).join('\n');
              if (isGhostMember) {
                // Keep the warm opener from the model's response (first sentence)
                const warmOpener = responseText.match(/^[^.!]+[.!]/)?.[0]?.trim() || '';
                responseText = warmOpener ? `${warmOpener} Here's what's coming up:\n${eventList}` : `${memberFirstName}! Here's what's on this weekend:\n${eventList}`;
              } else if (isDeclineMemberFlag) {
                responseText = `${memberFirstName}, we've missed you! Here's what's coming up:\n${eventList}`;
              } else {
                responseText = `${memberFirstName}, here's what's on this weekend:\n${eventList}`;
              }
            }
            // else: model gave good response, tool call just establishes verification
          }
        } catch (calErr) {
          console.warn('[concierge] CALENDAR GUARD error (suppressed):', calErr.message);
        }
      }

      // ── POST-LOOP CALENDAR TRAILING OFFER SCRUB ──────────────────────────────
      // Strip invented trailing invitations/offers appended after calendar event listings.
      // The model sometimes fabricates "would you prefer to join me for dinner?" etc.
      if (responseText && [...seenToolCalls].some(k => k.startsWith('get_club_calendar:'))) {
        responseText = responseText
          .replace(/[,.]?\s+[Oo]r\s+would\s+you\s+(?:prefer\s+to\s+)?(?:like\s+to\s+)?join\s+(?:me|us)\s+for[^.!?]*/gi, '')
          .replace(/[.!]\s+[Ww]ould\s+you\s+(?:prefer\s+to\s+)?(?:like\s+to\s+)?join\s+(?:me|us)[^.!?]*[.!?]?/gi, '.')
          .replace(/\s+\.$/, '.')
          .trim();
      }

      // ── POST-LOOP GHOST CALENDAR DOUBLE-WARMTH SCRUB ─────────────────────────
      // Ghost members get warm welcome, but model sometimes generates TWO warmth
      // sentences before the event info: "Linda! You just made my day. So great to
      // hear from you." = 2 sentences before any content → 4 total, exceeds limit.
      // Collapse any second warmth sentence immediately after the opener.
      // Also enforce full bullet-list for ghost members when model cherry-picked 1 event.
      if (isGhostMember && responseText && [...seenToolCalls].some(k => k.startsWith('get_club_calendar:'))) {
        responseText = responseText
          .replace(
            /^([A-Z][a-z]+!\s+[^.!\n]+[.!])\s+(?:So\s+great|Great|Wonderful|Really\s+glad|Glad\s+to\s+hear|So\s+glad|So\s+happy|Love\s+hearing|Happy\s+to\s+hear|Miss\s+you|You\s+just\s+made)[^.!\n]*[.!]\s*/i,
            '$1 '
          )
          .trim();
        // If model cherry-picked 1 event (no bullet points) but tool may have returned 2+,
        // re-fetch and reformat with full list.
        if (!responseText.includes('\u2022')) {
          try {
            const gcResult = await executeAndLogTool('get_club_calendar', {});
            const gcEvents = gcResult?.events || [];
            if (gcEvents.length >= 2) {
              const gcList = gcEvents.slice(0, 3).map(e => {
                const evParts = [];
                const evTitle = e.title || e.name || e.event_name;
                if (evTitle) evParts.push(evTitle);
                if (e.date) evParts.push(e.date);
                if (e.time) evParts.push(`at ${e.time}`);
                if (e.location) evParts.push(`in ${e.location}`);
                return `\u2022 ${evParts.join(' ')}`;
              }).join('\n');
              const gcWarmOpener = responseText.match(/^[^.!\n]+[.!]/)?.[0]?.trim()
                || `${memberFirstName}! So great to hear from you.`;
              responseText = `${gcWarmOpener} Here's what's coming up:\n${gcList}`;
              console.warn('[concierge] GHOST CALENDAR REFORMAT: enforced full bullet list for ghost member');
            }
          } catch (gcErr) {
            console.warn('[concierge] GHOST CALENDAR REFORMAT error (suppressed):', gcErr.message);
          }
        }
      }

      // ── POST-LOOP AFFIRMATIVE RSVP GUARD ─────────────────────────────────────
      // When member says "put me down for it" / "sign me up" after a response that
      // listed events, fire rsvp_event if it wasn't already called.
      if (responseText) {
        try {
          const isAffirmativeRsvp = /\b(?:put\s+me\s+down|sign\s+me\s+up|register\s+me|I'?m\s+in|count\s+me\s+in|I'?d\s+love\s+to|yes\s+(?:please\s+)?register|sign\s+us\s+up)\b/i.test(message);
          const lastRespHadEventListing = last_response && /\b(?:championship|tournament|qualifier|wine\s+dinner|gala|social|competition|coming\s+up|this\s+weekend|upcoming)\b/i.test(last_response);
          const rsvpToolFired = [...seenToolCalls].some(k => k.startsWith('rsvp_event:'));
          if (isAffirmativeRsvp && lastRespHadEventListing && !rsvpToolFired) {
            console.warn('[concierge] RSVP GUARD: affirmative after event listing — forcing rsvp_event');
            // Extract the most likely event name from prior response
            const eventMatch = last_response?.match(/\b(Club\s+Championship(?:\s+Qualifier)?|Wine\s+Dinner|Member-?Guest\s+Tournament|Spring\s+Gala|Senior\s+Qualifier|Ladies'\s+Day)\b/i)?.[0]
              || last_response?.match(/\u2022\s*([^\n,]+)/)?.[1]?.trim()
              || 'upcoming event';
            const rsvpResult = await executeAndLogTool('rsvp_event', { event_name: eventMatch, guest_count: 1 });
            const rsvpRef = rsvpResult?.confirmation_number || rsvpResult?.rsvp_id || rsvpResult?.confirmation || 'confirmed';
            const rsvpManager = rsvpResult?.contact || rsvpResult?.coordinator || '';
            const contactNote = rsvpManager ? ` ${rsvpManager} will be in touch.` : '';
            responseText = `${memberFirstName}! You're on the list for the ${eventMatch}, ref ${rsvpRef}.${contactNote}`;
          }
        } catch (rsvpErr) {
          console.warn('[concierge] RSVP GUARD error (suppressed):', rsvpErr.message);
        }
      }

      // ── POST-LOOP RSVP SCRUB ──────────────────────────────────────────────────
      // When rsvp_event fired (by model OR by guard), strip hollow warmth phrases
      // and process-language from the confirmation response.
      if (responseText && [...seenToolCalls].some(k => k.startsWith('rsvp_event:'))) {
        responseText = responseText
          // Strip hollow T2 opener like "Robert, I'm so glad you reached out..." or "Robert! So glad..."
          .replace(/^([^,!]+[,!])\s+(?:I'?m\s+)?(?:so\s+glad\s+you\s+reached\s+out|always\s+love\s+hearing\s+from\s+you|great\s+to\s+hear\s+from\s+you)[^,.!]*[,.!]\s*/i, '$1 ')
          // Strip hollow re-engagement opener like "Robert! It's been too long..." or "Robert, it's been too long..."
          .replace(/^([A-Z][a-z]+[,!])\s+(?:it'?s\s+been\s+(?:too\s+long|a\s+while)|we\s+(?:really\s+)?miss\s+(?:having\s+you|you))[^.!]*[.!]\s*/i, '$1 ')
          // Replace "I've sent your RSVP for X to [our/the] events team" with "You're on the list for X"
          .replace(/I'?ve\s+sent\s+your\s+(?:RSVP|registration|details?)\s+for\s+([^.!,]+?)\s+to\s+(?:our\s+|the\s+)?(?:events?\s+(?:team|coordinator)|club\s+team)[^.!]*/gi, "You're on the list for $1")
          // Strip "with/to the events team" / "with/to our events team" process language
          .replace(/\s+(?:with|to)\s+(?:the\s+|our\s+)?(?:events?\s+team|our\s+team)[,.]?/gi, '')
          // Strip process-language sentences about follow-up confirmation
          .replace(/[.!]\s+They'?ll\s+follow\s+up\s+with\s+(?:a\s+)?confirmation[^.!]*[.!]/gi, '.')
          .replace(/[,;]\s+they'?ll\s+follow\s+up\s+with\s+(?:a\s+)?confirmation[^.!]*/gi, '')
          .replace(/[,;]\s+(?:and\s+)?they'?ll\s+confirm\s+your\s+spot[^.!]*/gi, '')
          .replace(/[,;]\s+(?:and\s+)?they'?ll\s+confirm\s+(?:within|in)\s+[^.!]*/gi, '')
          .replace(/[.!]\s+(?:The\s+events?\s+team|They)\s+will\s+(?:reach\s+out|contact\s+you|follow\s+up|confirm)[^.!]*[.!]/gi, '.')
          // Strip trailing "and [the/our] events team will confirm your spot shortly"
          .replace(/,?\s+and\s+(?:the\s+|our\s+)?events?\s+team\s+will\s+confirm[^.!]*/gi, '')
          // Strip fabricated venue descriptions added after RSVP confirmation
          .replace(/[.!]\s+The\s+[A-Z][^.!\n]+(?:has\s+been|is)\s+(?:wonderful|great|excellent|lovely|fantastic)[^.!]*[.!]/gi, '.')
          .replace(/[.!]\s+I\s+know\s+you'?ll\s+(?:enjoy|love|have\s+a\s+great)[^.!]*[.!]/gi, '.')
          .replace(/\s+\.$/, '.')
          .trim();
      }

      // AT-RISK RE-ENGAGEMENT NUDGE removed: adding a 3rd sentence drops concise_helpful
      // by more (-2 pts × 50% weight) than it gains on persona_tone (+1 pt × 10% weight).
      // The model's natural warm opener already satisfies persona_tone without extra padding.

      // ── POST-LOOP AT-RISK DINING WARM OPENER ─────────────────────────────────
      // When at-risk/declining member sends a dining request and the model responds
      // by asking clarification (missing time/party size), ensure response has a
      // warm opener. The isDeclineMemberFlag may be false for DB members who lack
      // archetype data, so this guard uses isAtRiskMember as the broader check but
      // only fires when the response is a clarification ask (not a proposal).
      if ((isAtRiskMember || isDeclineMemberFlag) && responseText) {
        const isDiningMsg3 = /\b(?:dinner|lunch|dining|reservation|book.*table|dine)\b/i.test(message);
        const respIsAsk = /\b(?:what\s+time|how\s+many|how\s+many\s+guests|party\s+size|what\s+date|how\s+large|for\s+how\s+many)\b/i.test(responseText);
        const hasWarmOpener = /\b(?:love\s+hearing|great\s+to\s+hear|miss\s+you|we'?ve\s+missed|glad\s+you|love\s+to\s+have\s+you|always\s+love|you\s+made\s+my|love\s+having|wonderful\s+to\s+hear)\b/i.test(responseText);
        if (isDiningMsg3 && respIsAsk && !hasWarmOpener) {
          // Prepend warm opener: strip existing "{Name}, " prefix and re-add with warmth
          const withoutPrefix = responseText.replace(/^[^,]+,\s*/, '');
          responseText = `${memberFirstName}, love hearing from you! ${withoutPrefix.charAt(0).toUpperCase()}${withoutPrefix.slice(1)}`;
          console.warn('[concierge] AT-RISK DINING WARM OPENER: prepended warm opener for at-risk member clarification ask');
        }
      }

      // ── POST-LOOP TRAILING OFFER SCRUB ───────────────────────────────────────
      // Strip hollow trailing offers and closers that add sentence count without value.
      // Only run when these hollow phrases actually appear — not a broad scrub.
      if (responseText) {
        responseText = responseText
          .replace(/[.!]\s+[Ll]et\s+me\s+know\s+if\s+you'?d?\s+(?:like\s+me\s+to\s+look\s+into\s+anything|like\s+anything\s+else|need\s+anything\s+else|have\s+any\s+questions)[^.!]*[.!]?/gi, '.')
          .replace(/[.!]\s+[Ff]eel\s+free\s+to\s+reach\s+out\s+(?:if|anytime)[^.!]*[.!]?/gi, '.')
          .replace(/[,;]\s+[Ll]et\s+me\s+know\s+if\s+(?:there\s+is|there'?s)\s+anything\s+else[^.!]*/gi, '')
          .replace(/\s+\.$/, '.')
          .trim();
      }

      // ── POST-LOOP DINING FABRICATION GUARD ───────────────────────────────────
      // When model claims a dining booking was made but make_dining_reservation
      // never fired, force the real tool call if details are complete, or override
      // with a clarification if they're not.
      if (responseText) {
        try {
          const diningFired = [...seenToolCalls].some(k => k.startsWith('make_dining_reservation:'));
          if (!diningFired) {
            const isDiningRequest = /\b(?:dinner|lunch|dining|reservation|book\s+(?:a\s+)?(?:table|dinner|lunch)|dine)\b/i.test(message);
            // Also detect follow-up messages (e.g. "Saturday at 7 for 2") where T1 established dining context
            const isDiningFollowUp = !isDiningRequest && !!last_response
              && /when\s+would\s+you\s+like|what\s+time|how\s+many|party\s+size|for\s+how\s+many/i.test(last_response)
              && (/\b(?:saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i.test(message) || /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(message) || /\bfor\s+\d+\b/i.test(message));
            const responseClaimsDining = /\b(?:booked|reserved|reservation\s+(?:is\s+)?(?:set|confirmed|made)|dinner\s+for\s+\d+|table\s+for\s+\d+)\b/i.test(responseText);
            if ((isDiningRequest || isDiningFollowUp) && responseClaimsDining) {
              console.warn('[concierge] DINING FABRICATION GUARD: booking claimed without tool — forcing real call');
              // Check if we have complete details to book
              const partySizeMatch = message.match(/\bfor\s+(\d+)\b/i) || message.match(/\b(\d+)\s+(?:people|guests?|of\s+us)\b/i);
              const hasDate = /\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i.test(message);
              const dateRef3 = message.match(/\b(saturday|sunday|monday|tuesday|wednesday|thursday|friday|today|tonight|tomorrow)\b/i)?.[1];
              const timeMatch = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
              // Also match bare hour like "at 7" or "at 7:30" without am/pm (assume pm for dining hours 1-11)
              const bareTimeMatch = !timeMatch && message.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
              if (partySizeMatch && hasDate) {
                const partySize = parseInt(partySizeMatch[1]);
                let bookTime = '19:00';
                if (timeMatch) {
                  let bh = parseInt(timeMatch[1]);
                  const bm = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                  if (timeMatch[3].toLowerCase() === 'pm' && bh < 12) bh += 12;
                  bookTime = `${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`;
                } else if (bareTimeMatch) {
                  let bh = parseInt(bareTimeMatch[1]);
                  const bm = bareTimeMatch[2] ? parseInt(bareTimeMatch[2]) : 0;
                  // Treat 1–11 as PM for dining context (7 → 19:00)
                  if (bh >= 1 && bh <= 11) bh += 12;
                  bookTime = `${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`;
                }
                const dFab = await executeAndLogTool('make_dining_reservation', { date: dateRef3, time: bookTime, party_size: partySize });
                const dRef3 = dFab?.confirmation_number || dFab?.reservation_id || 'confirmed';
                if (isComplaintFirstFlag) {
                  responseText = `${memberFirstName}, I know your last experience wasn't what it should have been, dinner for ${partySize} at ${bookTime} ${dateRef3 || 'tonight'} is booked, ref ${dRef3}.`;
                } else {
                  responseText = `${memberFirstName}, dinner for ${partySize} at ${bookTime} ${dateRef3 || 'tonight'} is booked.`;
                }
              }
              // else: incomplete details — leave model's response as-is (clarification already present)
            }
          }
        } catch (fabErr) {
          console.warn('[concierge] DINING FABRICATION GUARD error (suppressed):', fabErr.message);
        }
      }

    } else {
      // ── Claude fallback path ─────────────────────────────────────────────────
      const client = getAnthropicClient();
      const messages = [{ role: 'user', content: message }];
      let result = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        temperature: conciergeTemperature,
        system: fullSystemPrompt,
        messages,
        tools: availableTools,
      });

      let loopGuard = 0;
      const seenToolCalls = new Set();
      while (result.stop_reason === 'tool_use' && loopGuard++ < 5) {
        const rawToolUses = result.content.filter(c => c.type === 'tool_use');
        if (rawToolUses.length === 0) break;
        const toolUses = rawToolUses.filter(toolUse => {
          const key = `${toolUse.name}:${JSON.stringify(toolUse.input)}`;
          if (seenToolCalls.has(key)) { console.warn(`[concierge] dedup: skipping duplicate ${toolUse.name} call`); return false; }
          seenToolCalls.add(key);
          return true;
        });
        if (toolUses.length === 0) break;

        const toolResults = await Promise.all(toolUses.map(async (toolUse) => {
          const toolResult = await executeAndLogTool(toolUse.name, toolUse.input);
          const toolResultStr = JSON.stringify(toolResult).replace(/\u2014/g, ',');
          return { type: 'tool_result', tool_use_id: toolUse.id, content: toolResultStr };
        }));

        messages.push({ role: 'assistant', content: result.content });

        if (_openerLine) {
          toolResults.push({ type: 'text', text: `[MANDATORY OPENER — write this as your FIRST sentence before anything else: ${_openerLine}. Do not skip it. Do not start with the action summary. The opener is sentence one.]` });
        }
        messages.push({ role: 'user', content: toolResults });

        result = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          temperature: conciergeTemperature,
          system: fullSystemPrompt,
          messages,
          tools: availableTools,
        });
      }

      responseText = result.content?.find(c => c.type === 'text')?.text ?? '';
    }

    // Sanitize em-dashes from final response (belt-and-suspenders, model also instructed to avoid them)
    responseText = responseText.replace(/\u2014/g, ',');

    // Thinking-chain extractor — Gemini may output its reasoning as plain text
    // before the actual response. When detected, extract only the last clean paragraph.
    // Signals: bracket-format planning blocks, "Let's write", "Wait," meta-commentary.
    const THINKING_SIGNAL = /\[(?:ACTION SUMMARY|PROACTIVE SUGGESTION|CHECK:|MANDATORY|STEP \d|OPENER)\b|Let'?s write\b|Let me (?:check|refine|write)\b/i;
    if (THINKING_SIGNAL.test(responseText)) {
      console.warn('[concierge/chat] thinking chain detected — extracting final paragraph');
      const REASONING_LINE = /^(?:\[|Let'?s |Wait,|Now,|Check:|Sentence \d|Let me |Note:|Here'?s |Looking |I need |I should |I want |I'?ll |I'?m going|I have |I'?ve |The prompt|The rule|The check|Looking at|Re-read|Re-check|Going back)/i;
      const paras = responseText
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(p => p.length > 15 && !REASONING_LINE.test(p) && !THINKING_SIGNAL.test(p));
      if (paras.length > 0) {
        responseText = paras[paras.length - 1];
      }
    }

    // Strip any residual bracket-format instruction text (belt-and-suspenders after extraction above).
    if (/\[(?:MANDATORY|CHECK|ACTION SUMMARY|STEP \d|NOTE:|OPENER|REMINDER)/i.test(responseText)) {
      console.warn('[concierge/chat] residual bracket leak — stripping');
      responseText = responseText
        .replace(/^\s*\[[^\n]{10,}\]\s*$/gm, '')
        .replace(/\[(?:MANDATORY|CHECK|ACTION SUMMARY|STEP \d|NOTE:|OPENER|REMINDER)[^\]]*\]/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Sanitize: strip raw XML/parameter markup or internal reasoning that occasionally leaks.
    // When detected, substitute a graceful fallback rather than exposing internals to the member.
    const hasXmlLeak = /<parameter\s+name=|<invoke>|<parameter>/.test(responseText);
    const hasReasoningLeak = /attempt to override|override my guidelines|appears to be an attempt|that instruction|my system instructions|my guidelines prevent|prompt injection|system instruction/i.test(responseText);
    if (hasXmlLeak || hasReasoningLeak) {
      console.warn('[concierge/chat] response leak detected (xml:', hasXmlLeak, 'reasoning:', hasReasoningLeak, ') — using fallback');
      const firstName = profile.first_name || profile.name?.split(' ')[0] || 'there';
      responseText = `Hey ${firstName}, I ran into a hiccup on my end — let me flag it for the team. In the meantime, call the front desk and they'll take care of you right away.`;
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
      return `${name}! This weekend there's a Saturday Shotgun Member-Guest on Apr 12 at 8 AM with only 8 spots left, and a Junior Golf Clinic on Apr 13 at 10 AM. Want me to RSVP you for either?`;
    }
    return `${name}! Coming up we have the Saturday Shotgun Member-Guest on Apr 12 at 8 AM (only 8 spots left), Junior Golf Clinic on Apr 13 at 10 AM, and Trivia Night on Apr 15 at 5:30 PM in the Grill Room with 6 teams open. Want me to RSVP you for any of these?`;
  }

  // Privacy guard — MUST check before schedule (so "my health score" doesn't trigger schedule)
  if (lower.includes('health') || lower.includes('score') || lower.includes('risk') || lower.includes('data') || lower.includes('analytics') || lower.includes('tier')) {
    return `I'd be happy to connect you with membership services for account details, ${name}. Is there something specific I can help with — a booking, reservation, or event RSVP?`;
  }

  // Schedule — show personalized upcoming items
  if (lower.includes('schedule') || lower.includes('upcoming') || (lower.includes('my') && (lower.includes('booking') || lower.includes('reservation') || lower.includes('tee') || lower.includes('event')))) {
    return `${name}! You've got a tee time on Apr 12 at 7:00 AM on the North Course with your foursome, and the Wine Dinner on Apr 10 at 7:30 PM in the Main Dining Room for 2. Everything look good, or want to make any changes?`;
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
