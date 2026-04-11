/**
 * POST /api/demo/agent-reaction
 *
 * Conference demo: given a member message and concierge response,
 * determines which club agents activate and returns GM-facing output.
 */
import { generateText } from '../lib/aiClient.js';
import { sql } from '@vercel/postgres';

const STATIC_WHITFIELD_CONTEXT = {
  name: 'James Whitfield',
  memberId: 'mbr_t01',
  healthScore: 42,
  archetype: 'Balanced Active',
  duesAnnual: 18000,
  tenure: '6-year member',
  trend: 'declining',
  recentActivity: 'Golf rounds dropping (4 -> 3 -> 2 -> 1/month), complaint filed about slow lunch',
};

async function loadMemberContext(memberId, clubId) {
  try {
    const result = await sql`
      SELECT m.member_id::text, m.first_name, m.last_name, m.membership_type,
             m.join_date, m.health_score,
             COALESCE(m.annual_dues, 18000) as annual_dues
      FROM members m
      WHERE m.member_id = ${memberId} AND m.club_id = ${clubId}
    `;
    if (result.rows.length > 0) {
      const m = result.rows[0];
      return {
        name: `${m.first_name} ${m.last_name}`.trim(),
        memberId: m.member_id,
        healthScore: m.health_score || 42,
        archetype: 'Balanced Active',
        duesAnnual: m.annual_dues,
        tenure: `${Math.floor((Date.now() - new Date(m.join_date).getTime()) / (365.25 * 86400000))}-year member`,
        trend: m.health_score < 50 ? 'declining' : 'stable',
      };
    }
  } catch {
    // DB unavailable — fall through to static fallback
  }
  return STATIC_WHITFIELD_CONTEXT;
}

/**
 * Classify member message intent using Claude (with keyword fallback).
 * AI classification catches nuance that keywords miss:
 * "This place has gone downhill" → complaint
 * "Can you check if there's space Saturday?" → booking
 */
async function classifyMessage(message) {
  // Try AI classification first
  try {
    const raw = await generateText(
      `Classify this country club member message into exactly one category. Reply with ONLY the category name, nothing else.

Categories:
- complaint: The member is expressing dissatisfaction, frustration, reporting a problem, or threatening to leave
- booking: The member wants to book, reserve, or schedule something (tee time, dining, event)
- general: Anything else (questions, greetings, information requests)

Member message: "${message}"

Category:`
    );
    const category = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (['complaint', 'booking', 'general'].includes(category)) return category;
  } catch {}

  // Keyword fallback when AI is unavailable
  const lower = message.toLowerCase();
  const complaintSignals = ['slow', 'wait', 'ignored', 'terrible', 'awful', 'bad', 'disappoint', 'upset', 'rude', 'cold', 'wrong', 'complaint', 'unacceptable', 'worst', 'horrible', 'poor', 'forgot', 'minutes', 'apologize', 'took', 'no one', 'downhill', 'cancel membership', 'resign', 'quit', 'leaving'];
  const bookingSignals = ['book', 'reserve', 'tee time', 'reservation', 'table', 'party'];

  if (complaintSignals.some(w => lower.includes(w))) return 'complaint';
  if (bookingSignals.some(w => lower.includes(w))) return 'booking';
  return 'general';
}

const AGENT_PROMPTS = {
  complaint: {
    agents: ['service-recovery', 'member-risk', 'health-score'],
    prompts: {
      'service-recovery': (msg, response, ctx) => `You are the Service Recovery Intelligence agent for Pine Tree Country Club.

A member just sent a complaint through the concierge:
Member: "${msg}"
Concierge responded: "${response}"

Member context: ${ctx.name}, ${ctx.tenure}, $${(ctx.duesAnnual/1000)}K annual dues, health score ${ctx.healthScore} (${ctx.trend}), archetype: ${ctx.archetype}.

Determine the severity and recommended action. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentence analysis for the GM","action":"specific recommended next step with timeline","severity":"high|medium|low","escalation":"who should be alerted and by when"}`,

      'member-risk': (msg, _response, ctx) => `You are the Member Risk Intelligence agent for Pine Tree Country Club.

A ${ctx.tenure} member (${ctx.name}, $${(ctx.duesAnnual/1000)}K/yr, health score ${ctx.healthScore}) just complained:
"${msg}"

Their health score trend: ${ctx.trend}. Current health score: ${ctx.healthScore}.

Assess the resignation risk. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentence risk assessment","action":"recommended retention action","risk_level":"critical|high|medium","dues_at_risk":"$${ctx.duesAnnual.toLocaleString()}"}`,

      'health-score': (msg, _response, ctx) => `You are the Health Score Intelligence agent for Pine Tree Country Club.

Member ${ctx.name} (current score: ${ctx.healthScore}) just filed a complaint: "${msg}"

Project the health score impact. Return ONLY valid JSON:
{"title":"short title","detail":"1-2 sentences on score projection","projected_change":"-X points","new_projected_score":0}`,
    },
  },
  booking: {
    agents: ['staffing-demand', 'health-score'],
    prompts: {
      'staffing-demand': (msg, _response, ctx) => `You are the Staffing-Demand Intelligence agent for Pine Tree Country Club.

Member ${ctx.name} just made a booking request through concierge: "${msg}"

Determine if any staffing adjustment is needed. Return ONLY valid JSON:
{"title":"short title","detail":"1-2 sentences about staffing impact","adjustment":"what to adjust if anything"}`,

      'health-score': (msg, _response, ctx) => `You are the Health Score Intelligence agent for Pine Tree Country Club.

Member ${ctx.name} (current score: ${ctx.healthScore}, ${ctx.trend}) just made a booking: "${msg}"

This is a positive engagement signal for a ${ctx.trend} member. Project the impact. Return ONLY valid JSON:
{"title":"short title","detail":"1-2 sentences on score projection","projected_change":"+X points","new_projected_score":0}`,
    },
  },
  general: {
    agents: ['concierge'],
    prompts: {
      'concierge': (msg, _response, ctx) => `You are the Concierge Monitoring agent for Pine Tree Country Club.

Member ${ctx.name} (health score ${ctx.healthScore}, ${ctx.trend}) sent: "${msg}"

Briefly note any engagement signals for the GM. Return ONLY valid JSON:
{"title":"Concierge Interaction Logged","detail":"1 sentence noting the engagement","signal":"positive|neutral|negative"}`,
    },
  },
};

const AGENT_LABELS = {
  'service-recovery': 'Service Recovery',
  'member-risk': 'Member Risk',
  'health-score': 'Health Score Monitor',
  'staffing-demand': 'Staffing Demand',
  'concierge': 'Concierge Monitor',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { member_message, concierge_response, member_id, club_id } = req.body || {};
  if (!member_message) {
    return res.status(400).json({ error: 'member_message is required' });
  }

  const memberId = member_id || 'mbr_t01';
  const clubId = club_id || 'seed_pinetree';
  const memberCtx = await loadMemberContext(memberId, clubId);

  const category = await classifyMessage(member_message);
  const config = AGENT_PROMPTS[category];

  try {
    // Run all agents in parallel for faster GM-side response
    const events = await Promise.all(config.agents.map(async (agentKey) => {
      const promptFn = config.prompts[agentKey];
      const prompt = promptFn(member_message, concierge_response || '', memberCtx);

      let result;
      try {
        const raw = await generateText(prompt);
        const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        result = JSON.parse(cleaned);
      } catch {
        result = { title: AGENT_LABELS[agentKey], detail: 'Agent activated — processing...' };
      }

      return {
        agent: agentKey,
        agentLabel: AGENT_LABELS[agentKey],
        title: result.title || AGENT_LABELS[agentKey],
        detail: result.detail || '',
        action: result.action || result.adjustment || result.escalation || null,
        severity: result.severity || result.risk_level || null,
        projected_change: result.projected_change || null,
      };
    }));

    return res.status(200).json({
      category,
      member_id: memberCtx.memberId,
      events,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/demo/agent-reaction error:', err);
    return res.status(500).json({ error: err.message });
  }
}
