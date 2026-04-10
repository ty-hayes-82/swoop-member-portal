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
  return result.rows.length > 0 ? result.rows[0] : null;
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
  if (result.rows.length === 0) return null;

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
  const smsInstruction = '\n\nYou are responding via SMS text message. Keep responses under 300 characters. No formatting, no markdown, no asterisks, no bullet points. Be warm and conversational like texting a friend who happens to work at the club.';

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

  // Call Claude
  let responseText = '';
  try {
    const client = getAnthropicClient();
    const result = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });
    responseText = result.content?.[0]?.text ?? '';
  } catch (err) {
    console.error('[twilio-inbound] Claude error:', err.message);
    responseText = `Hi ${profile.first_name}! I'm having a brief technical issue. Text me again in a moment and I'll be right with you.`;
  }

  // Strip any markdown that slipped through
  responseText = responseText
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

  // Reply via TwiML
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(responseText)}</Message></Response>`
  );
}
