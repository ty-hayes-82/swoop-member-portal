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
];

/**
 * Execute a concierge tool call (mirrors executeSmsTool from twilio/inbound.js).
 */
async function executeConciergeTool(toolName, input, profile) {
  switch (toolName) {
    case 'get_club_calendar': {
      return {
        events: [
          { date: '2026-04-10', time: '6:00 PM', title: 'Wine Dinner — Spring Pairing Menu', location: 'Main Dining Room', capacity: '48 seats, 12 remaining' },
          { date: '2026-04-12', time: '8:00 AM', title: 'Saturday Morning Shotgun — Member-Guest', location: 'North Course', capacity: '72 players, 8 spots left' },
          { date: '2026-04-13', time: '10:00 AM', title: 'Junior Golf Clinic', location: 'Practice Range', capacity: 'Open enrollment' },
          { date: '2026-04-15', time: '5:30 PM', title: 'Trivia Night', location: 'Grill Room', capacity: '20 teams max, 6 remaining' },
          { date: '2026-04-18', time: '7:00 AM', title: 'Club Championship Qualifier — Round 1', location: 'South Course', capacity: 'Registration open' },
        ],
      };
    }
    case 'book_tee_time': {
      const course = input.course || 'North Course';
      const players = input.players || 4;
      return {
        confirmation: `Tee time booked: ${input.date} at ${input.time} on the ${course} for ${players} players.`,
        confirmation_number: `TT-${Date.now().toString(36).toUpperCase()}`,
        member_name: profile.name,
      };
    }
    case 'make_dining_reservation': {
      const party = input.party_size || 2;
      const time = input.time || '7:00 PM';
      return {
        confirmation: `Dining reservation confirmed: ${input.date} at ${time} at ${input.outlet} for ${party} guests.`,
        confirmation_number: `DR-${Date.now().toString(36).toUpperCase()}`,
        preferences_noted: input.preferences || 'None specified',
        member_name: profile.name,
      };
    }
    case 'get_my_schedule': {
      return {
        upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4 },
          { type: 'dining', date: '2026-04-10', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2, notes: 'Wine Dinner — Spring Pairing' },
        ],
      };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

const SIMULATION_MODE = !MANAGED_AGENT_ID || !MANAGED_ENV_ID;

async function loadMemberProfile(clubId, memberId) {
  const result = await sql`
    SELECT member_id::text AS member_id, first_name, last_name, email, phone,
      membership_type, join_date, membership_status, household_id,
      preferred_channel
    FROM members
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  if (result.rows.length === 0) return null;

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

  // Get or create concierge session
  const session = await getOrCreateSession(clubId, member_id);

  // Get club name
  const clubResult = await sql`SELECT name FROM club WHERE club_id = ${clubId}`;
  const clubName = clubResult.rows[0]?.name || 'the club';

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

      const toolResult = await executeConciergeTool(toolUse.name, toolUse.input, profile);

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
    const summary = `Member asked: "${message.slice(0, 200)}". Agent responded: "${responseText.slice(0, 200)}"`;
    await updateSessionSummary(clubId, member_id, summary);

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
  const lower = message.toLowerCase();

  if (lower.includes('tee time') || lower.includes('book') || lower.includes('golf')) {
    return `Hi ${name}! I'd love to help you book a tee time. What date and time works best for you? I can check availability right away.`;
  }
  if (lower.includes('dinner') || lower.includes('reserv') || lower.includes('dining') || lower.includes('restaurant')) {
    return `Of course, ${name}! I can make a dining reservation for you. Which restaurant and when were you thinking?`;
  }
  if (lower.includes('event') || lower.includes('rsvp') || lower.includes('tournament')) {
    return `Great question, ${name}! Let me check the upcoming events calendar for you. Would you like to see what's coming up this week?`;
  }
  if (lower.includes('schedule') || lower.includes('upcoming')) {
    return `Here's what I have on your schedule, ${name}. Let me pull up your upcoming bookings and events.`;
  }
  if (lower.includes('health') || lower.includes('score') || lower.includes('risk')) {
    return `I don't have that information, ${name}. I'd be happy to connect you with membership services if you have questions about your account.`;
  }

  return `Hi ${name}! How can I help you today? I can book tee times, make dining reservations, RSVP to events, or answer questions about the club.`;
}

export default withAuth(chatHandler, { allowDemo: true });
