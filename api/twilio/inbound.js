/**
 * Twilio Inbound SMS Webhook
 * POST /api/twilio/inbound
 *
 * Receives inbound SMS from Twilio. If the sender phone matches a known
 * member, routes the message through the Member Concierge agent and replies
 * via TwiML. Unknown numbers get a polite fallback.
 */
import { sql } from '@vercel/postgres';
import { verifyTwilioSignature } from '../lib/twilioVerify.js';
import { logWarn, logInfo } from '../lib/logger.js';
import { buildConciergePrompt } from '../../src/config/conciergePrompt.js';
import { getOrCreateSession, updateSessionSummary } from '../agents/concierge-session.js';
import { getAnthropicClient } from '../agents/managed-config.js';
import { routeEvent } from '../agents/agent-events.js';

// ---------------------------------------------------------------------------
// SMS tool definitions (Anthropic tool_use format)
// ---------------------------------------------------------------------------
const SMS_TOOLS = [
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
 * Execute an SMS tool call and return seed data.
 */
async function executeSmsTool(toolName, input, member, clubId) {
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
        member_name: member.first_name + ' ' + member.last_name,
      };
    }
    case 'make_dining_reservation': {
      const party = input.party_size || 2;
      const time = input.time || '7:00 PM';
      return {
        confirmation: `Dining reservation confirmed: ${input.date} at ${time} at ${input.outlet} for ${party} guests.`,
        confirmation_number: `DR-${Date.now().toString(36).toUpperCase()}`,
        preferences_noted: input.preferences || 'Booth 12 (preferred)',
        member_name: member.first_name + ' ' + member.last_name,
      };
    }
    case 'get_my_schedule': {
      return {
        upcoming: [
          { type: 'tee_time', date: '2026-04-12', time: '7:00 AM', course: 'North Course', players: 4, group: ['James Whitfield', 'Tom Gallagher', 'Mark Patterson', 'Greg Holloway'] },
          { type: 'dining', date: '2026-04-10', time: '7:30 PM', outlet: 'Main Dining Room', party_size: 2, notes: 'Wine Dinner — Spring Pairing' },
        ],
      };
    }
    case 'rsvp_event': {
      const eventTitle = input.event_title || 'Event';
      const who = input.member_name || (member.first_name + ' ' + member.last_name);
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
      const complaintResult = {
        complaint_id: `FB-${Date.now().toString(36).toUpperCase()}`,
        category: input.category,
        status: 'filed',
        message: 'Your feedback has been filed and routed to the appropriate manager.',
      };
      try {
        await routeEvent(clubId, 'complaint_filed_by_concierge', {
          member_id: member.member_id,
          member_name: member.name || `${member.first_name} ${member.last_name}`.trim(),
          category: input.category,
          description: input.description,
          complaint_id: complaintResult.complaint_id,
        });
      } catch (e) { console.warn('[sms] complaint event routing error:', e.message); }
      return complaintResult;
    }
    case 'get_member_profile': {
      return {
        name: member.name || `${member.first_name} ${member.last_name}`.trim(),
        membership_type: member.membership_type || 'Full Golf',
        member_since: member.join_date,
        household: member.household || [],
        preferences: member.preferences || {},
      };
    }
    case 'send_request_to_club': {
      return {
        request_id: `RQ-${Date.now().toString(36).toUpperCase()}`,
        department: input.department,
        status: 'submitted',
        message: `Request sent to ${input.department.replace('_', ' ')} team. They'll follow up shortly.`,
      };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// In-memory conversation cache keyed by E.164 phone number.
// Each entry: { messages: [{role, content}], lastActive: number }
const conversationCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY = 10; // keep last N exchanges

/**
 * Normalize any US phone string to E.164 (+1XXXXXXXXXX).
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

/**
 * Look up a member by phone number. Returns {member_id, first_name, last_name, club_id} or null.
 */
async function lookupMemberByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  // Strip the +1 to get the 10-digit number, then build common formats
  const digits10 = normalized.replace(/^\+1/, '');
  const formatted = `(${digits10.slice(0, 3)}) ${digits10.slice(3, 6)}-${digits10.slice(6)}`;

  const result = await sql`
    SELECT member_id::text AS member_id, first_name, last_name, club_id, phone,
           membership_type, join_date, membership_status, household_id
    FROM members
    WHERE (phone = ${normalized} OR phone = ${formatted} OR phone = ${digits10})
    LIMIT 1
  `;
  if (result.rows.length > 0) return result.rows[0];

  // Fallback: hardcoded demo mapping for seed data testing
  // (DB may not have the updated phone if seed hasn't been re-run)
  const DEMO_PHONE_MAP = {
    '+14802259702': { member_id: 'mbr_t01', first_name: 'James', last_name: 'Whitfield', club_id: 'seed_pinetree', phone: '(480) 225-9702', membership_type: 'FG', join_date: '2019-04-12', membership_status: 'active', household_id: 'hh_t01' },
  };
  return DEMO_PHONE_MAP[normalized] || null;
}

/**
 * Load full member profile for concierge prompt (mirrors concierge/chat.js).
 */
async function loadMemberProfile(clubId, memberId) {
  const result = await sql`
    SELECT member_id::text AS member_id, first_name, last_name, email, phone,
      membership_type, join_date, membership_status, household_id,
      preferred_channel
    FROM members
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  if (result.rows.length === 0) {
    // Fallback: static Whitfield profile for demo testing
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

  const household = m.household_id ? await sql`
    SELECT member_id::text AS member_id, first_name, last_name, membership_type
    FROM members
    WHERE household_id = ${m.household_id} AND club_id = ${clubId} AND member_id != ${memberId}
  ` : { rows: [] };

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

/**
 * Escape XML special characters for TwiML.
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Get or initialize conversation history for a phone number.
 */
function getConversation(phone) {
  const now = Date.now();
  const entry = conversationCache.get(phone);
  if (entry && (now - entry.lastActive) < CACHE_TTL_MS) {
    entry.lastActive = now;
    return entry.messages;
  }
  const messages = [];
  conversationCache.set(phone, { messages, lastActive: now });
  return messages;
}

/**
 * Append a user+assistant exchange to conversation history.
 */
function appendConversation(phone, userMsg, assistantMsg) {
  const messages = getConversation(phone);
  messages.push({ role: 'user', content: userMsg });
  messages.push({ role: 'assistant', content: assistantMsg });
  // Trim to last MAX_HISTORY exchanges (MAX_HISTORY * 2 messages)
  while (messages.length > MAX_HISTORY * 2) {
    messages.shift();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = verifyTwilioSignature(req);
  if (!sig.valid) {
    logWarn('/api/twilio/inbound', 'rejected webhook', {
      reason: sig.reason,
      ip: req.headers['x-forwarded-for'],
    });
    return res.status(403).json({ error: 'Invalid signature' });
  }
  if (sig.devBypass) {
    logInfo('/api/twilio/inbound', 'dev bypass: TWILIO_AUTH_TOKEN not set, skipping verification');
  }

  const { From, To, Body, MessageSid } = req.body || {};

  console.log('[twilio-inbound]', {
    from: From, to: To, body: Body,
    messageSid: MessageSid, receivedAt: new Date().toISOString(),
  });

  // Log to database
  try {
    await sql`
      INSERT INTO notifications (club_id, channel, type, title, body, priority)
      VALUES ('system', 'sms_inbound', 'sms_reply', ${`SMS reply from ${From}`}, ${Body || ''}, 'normal')
    `;
  } catch (e) {
    console.error('[twilio-inbound] db log error:', e.message);
  }

  // --- Concierge routing ---
  const member = await lookupMemberByPhone(From).catch(err => {
    console.error('[twilio-inbound] member lookup error:', err.message);
    return null;
  });

  if (!member) {
    // Unknown number
    const fallback = 'Welcome to Pinetree CC concierge. We don\'t recognize this number. Please contact the front desk for assistance.';
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(fallback)}</Message></Response>`
    );
  }

  // Load full profile for prompt
  const profile = await loadMemberProfile(member.club_id, member.member_id).catch(err => {
    console.error('[twilio-inbound] profile load error:', err.message);
    return null;
  });

  if (!profile) {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, we're having trouble looking up your account. Please try again shortly.</Message></Response>`
    );
  }

  // Get club name
  let clubName = 'Pinetree CC';
  try {
    const clubResult = await sql`SELECT name FROM club WHERE club_id = ${member.club_id}`;
    clubName = clubResult.rows[0]?.name || clubName;
  } catch (_) { /* use default */ }

  // Build system prompt with SMS instruction
  const basePrompt = buildConciergePrompt(profile, clubName);
  const smsInstruction = `\n\nCRITICAL SMS RULES:
- You are responding via SMS text message. Your response will be sent directly as a text.
- Keep responses concise — 2-3 sentences max (under 400 characters).
- No formatting, no markdown, no asterisks, no bullet points, no XML, no code blocks.
- Be warm and conversational like texting a friend who works at the club.
- Use their first name.
- Use the provided tools to look up schedules, book tee times, make dining reservations, and check the club calendar. Do not guess — call the tool.`;

  // Get session summary for context
  let conversationContext = '';
  try {
    const session = await getOrCreateSession(member.club_id, member.member_id);
    if (session.conversation_summary) {
      conversationContext = `\n\nPrevious conversation context: ${session.conversation_summary}`;
    }
  } catch (e) {
    console.error('[twilio-inbound] session error:', e.message);
  }

  const systemPrompt = basePrompt + smsInstruction + conversationContext;

  // Build messages array with conversation history
  const history = getConversation(From);
  const messages = [...history, { role: 'user', content: Body || '' }];

  // Call Claude with tool use loop
  let responseText = '';
  try {
    const client = getAnthropicClient();
    let result = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
      tools: SMS_TOOLS,
    });

    // Tool use loop — execute tool calls and feed results back to Claude
    while (result.stop_reason === 'tool_use') {
      const toolUse = result.content.find(c => c.type === 'tool_use');
      if (!toolUse) break;

      console.log('[twilio-inbound] tool call:', toolUse.name, JSON.stringify(toolUse.input));
      const toolResult = await executeSmsTool(toolUse.name, toolUse.input, member, clubId);

      messages.push({ role: 'assistant', content: result.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }],
      });

      result = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages,
        tools: SMS_TOOLS,
      });
    }

    responseText = result.content.find(c => c.type === 'text')?.text ?? '';
  } catch (err) {
    console.error('[twilio-inbound] Claude error:', err.message);
    responseText = `Hi ${profile.first_name}! I'm having a brief technical issue. Text me again in a moment and I'll be right with you.`;
  }

  // Strip any markdown, XML, or tool calls that slipped through
  responseText = responseText
    .replace(/<function_calls>[\s\S]*$/m, '') // remove any tool call XML from end
    .replace(/<[^>]+>/g, '')                  // remove ALL XML/HTML tags
    .replace(/\*\*/g, '')
    .replace(/##\s*/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();

  // Cache the conversation
  appendConversation(From, Body || '', responseText);

  // Update session summary in DB
  try {
    const summary = `[SMS] Member: "${(Body || '').slice(0, 150)}" → Agent: "${responseText.slice(0, 150)}"`;
    await updateSessionSummary(member.club_id, member.member_id, summary);
  } catch (e) {
    console.error('[twilio-inbound] summary update error:', e.message);
  }

  console.log('[twilio-inbound] responding to', From, ':', responseText.slice(0, 80));

  // Reply via TwiML (clean, no trial prefix on upgraded account)
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(responseText)}</Message></Response>`
  );
}
