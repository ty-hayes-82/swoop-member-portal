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
  switch (toolName) {
    case 'get_club_calendar': {
      const memberType = profile.membership_type || 'Full Golf';
      return {
        events: [
          { date: '2026-04-10', time: '6:00 PM', title: 'Wine Dinner — Spring Pairing Menu', location: 'Main Dining Room', capacity: '48 seats, 12 remaining', note: 'Popular with Social and Full Golf members — filling fast', dress_code: 'Smart casual' },
          { date: '2026-04-12', time: '8:00 AM', title: 'Saturday Morning Shotgun — Member-Guest', location: 'North Course', capacity: '72 players, only 8 spots left', note: memberType.includes('Golf') ? 'Your membership includes entry — invite a guest for $45' : 'Open to all members, guest fee $85', weather_forecast: '72°F, partly cloudy — ideal conditions' },
          { date: '2026-04-13', time: '10:00 AM', title: 'Junior Golf Clinic', location: 'Practice Range', capacity: 'Open enrollment', note: profile.household?.some(h => h.membership_type === 'Junior') ? 'Great fit for your Junior member — Coach Davis leading this session' : 'Ages 8-16, led by Coach Davis' },
          { date: '2026-04-15', time: '5:30 PM', title: 'Trivia Night', location: 'Grill Room', capacity: '20 teams max, only 6 remaining', note: 'Last month sold out — grab a spot early', food_included: 'Appetizer spread + 2 drink tickets per person' },
          { date: '2026-04-18', time: '7:00 AM', title: 'Club Championship Qualifier — Round 1', location: 'South Course', capacity: 'Registration open — 54 of 72 spots filled', note: 'Defending champion: Tom Gallagher. Registration closes Apr 16.' },
        ],
      };
    }
    case 'book_tee_time': {
      const course = input.course || 'North Course';
      const players = input.players || 4;
      const prefs = profile.preferences || {};
      const beverage = prefs.dining?.includes('Arnold Palmer') ? 'Arnold Palmer' : 'cold water and towels';
      return {
        confirmation: `Tee time booked: ${input.date} at ${input.time} on the ${course} for ${players} players.`,
        confirmation_number: `TT-${Date.now().toString(36).toUpperCase()}`,
        member_name: profile.name,
        cart_note: `Cart will be staged with ${beverage} at the bag drop 15 min before your time.`,
        weather: '75°F, light breeze from the south — perfect golf weather.',
        starter_note: course === 'North Course' ? 'Starter: Mike will have you set at the tee.' : 'Starter: Danny will get your group rolling.',
        pace_note: `Current pace on ${course}: 4 hrs 10 min.`,
      };
    }
    case 'make_dining_reservation': {
      const party = input.party_size || 2;
      const time = input.time || '7:00 PM';
      const prefs = profile.preferences || {};
      const favDining = prefs.dining || '';
      const seatingNote = favDining.includes('booth 12') ? 'Booth 12 reserved — your usual spot.' : 'Window table reserved.';
      const isSpecialDinner = (input.outlet || '').toLowerCase().includes('dining') || (input.preferences || '').toLowerCase().includes('anniversary') || (input.preferences || '').toLowerCase().includes('birthday');
      return {
        confirmation: `Dining reservation confirmed: ${input.date} at ${time} at ${input.outlet} for ${party} guests.`,
        confirmation_number: `DR-${Date.now().toString(36).toUpperCase()}`,
        seating: seatingNote,
        server: 'Maria will take care of you — she knows your preferences.',
        preferences_noted: input.preferences || (favDining ? `On file: ${favDining}` : 'None specified'),
        member_name: profile.name,
        wine_suggestion: isSpecialDinner ? 'Chef recommends the 2021 Willamette Valley Pinot Noir with tonight\'s special — shall we have a bottle ready?' : undefined,
        kitchen_note: favDining.includes('Arnold Palmer') ? 'Kitchen flagged: Arnold Palmer ready on arrival.' : undefined,
      };
    }
    case 'get_my_schedule': {
      return {
        upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4, group: ['James Whitfield', 'Tom Gallagher', 'Mark Patterson', 'Greg Holloway'], weather: '72°F, partly cloudy' },
          { type: 'dining', date: '2026-04-10', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2, notes: 'Wine Dinner — Spring Pairing', seating: 'Table 14 confirmed', dress_code: 'Smart casual' },
          { type: 'event', date: '2026-04-15', time: '5:30 PM', title: 'Trivia Night', location: 'Grill Room', status: 'RSVP confirmed — Team of 4' },
        ],
        pending_actions: [
          { type: 'open_feedback', filed_date: '2026-01-16', category: 'food_and_beverage', status: 'in_progress', note: 'Our F&B manager Sarah will follow up with you this week.' },
        ],
        household_upcoming: profile.household?.length > 0 ? [
          { member: 'Logan Whitfield', type: 'event', date: '2026-04-13', time: '10:00 AM', title: 'Junior Golf Clinic' },
        ] : [],
      };
    }
    case 'rsvp_event': {
      const eventTitle = input.event_title || 'Event';
      const who = input.member_name || profile.name;
      return {
        registration_id: `ER-${Date.now().toString(36).toUpperCase()}`,
        event: eventTitle,
        registered_for: who,
        guest_count: input.guest_count || 0,
        status: 'registered',
      };
    }
    case 'cancel_tee_time': {
      return {
        status: 'cancelled',
        booking_date: input.booking_date,
        tee_time: input.tee_time || '7:00 AM',
        message: `Tee time on ${input.booking_date} has been cancelled. Your group has been notified.`,
      };
    }
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
      const complaintResult = {
        complaint_id: `FB-${Date.now().toString(36).toUpperCase()}`,
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
    case 'send_request_to_club': {
      return {
        request_id: `RQ-${Date.now().toString(36).toUpperCase()}`,
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
    // Fallback: static Whitfield profile for demo/conference testing
    if (memberId === 'mbr_t01') {
      return {
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
      };
    }
    return null;
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
      tools: CONCIERGE_TOOLS,
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
        tools: CONCIERGE_TOOLS,
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
  const complaintSignals = ['slow', 'wait', 'terrible', 'awful', 'disappoint', 'complaint', 'cold', 'ignored', 'upset', 'rude', 'wrong', 'horrible', 'unacceptable', 'minutes', 'apologize', 'apologized', 'took', 'no one', 'never', 'worst', 'poor', 'forgot'];
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

  // Events — show real upcoming events
  if (lower.includes('event') || lower.includes('rsvp') || lower.includes('tournament') || lower.includes('happening') || lower.includes('weekend') || lower.includes('wine')) {
    return `Great timing, ${name}! Here's what's coming up:\n\n` +
      `• Saturday Shotgun — Member-Guest (Apr 12, 8 AM — only 8 spots left)\n` +
      `• Junior Golf Clinic (Apr 13, 10 AM — open enrollment)\n` +
      `• Trivia Night (Apr 15, 5:30 PM, Grill Room — 6 teams open)\n\n` +
      `Want me to RSVP you for any of these?`;
  }

  // Schedule — show personalized upcoming items
  if (lower.includes('schedule') || lower.includes('upcoming') || lower.includes('my')) {
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

  // Privacy guard — never reveal scores, risk, or internal data
  if (lower.includes('health') || lower.includes('score') || lower.includes('risk') || lower.includes('data')) {
    return `I'd be happy to connect you with membership services for account details, ${name}. Is there something specific I can help with — a booking, reservation, or event RSVP?`;
  }

  // Default — warm, capability-focused
  return `Hi ${name}! Great to hear from you. I can book tee times, make dining reservations, RSVP to events, check your schedule, or help with anything club-related. What would you like to do?`;
}

export default withAuth(chatHandler, { allowDemo: true });
