/**
 * POST /api/demo/agent-reaction
 *
 * Conference demo: given a member message and concierge response,
 * determines which club agents activate and returns GM-facing output.
 */
import { generateText } from '../lib/aiClient.js';

const MEMBER_CONTEXT = {
  name: 'James Whitfield',
  memberId: 'mbr_t01',
  healthScore: 42,
  archetype: 'Balanced Active',
  duesAnnual: 18000,
  tenure: '6-year member',
  trend: 'declining',
  recentActivity: 'Golf rounds dropping (4 -> 3 -> 2 -> 1/month), complaint filed about slow lunch',
};

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
      'service-recovery': (msg, response) => `You are the Service Recovery Intelligence agent for Pine Tree Country Club.

A member just sent a complaint through the concierge:
Member: "${msg}"
Concierge responded: "${response}"

Member context: ${MEMBER_CONTEXT.name}, ${MEMBER_CONTEXT.tenure}, $${(MEMBER_CONTEXT.duesAnnual/1000)}K annual dues, health score ${MEMBER_CONTEXT.healthScore} (${MEMBER_CONTEXT.trend}), archetype: ${MEMBER_CONTEXT.archetype}.

Determine the severity and recommended action. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentence analysis for the GM","action":"specific recommended next step with timeline","severity":"high|medium|low","escalation":"who should be alerted and by when"}`,

      'member-risk': (msg) => `You are the Member Risk Intelligence agent for Pine Tree Country Club.

A ${MEMBER_CONTEXT.tenure} member (${MEMBER_CONTEXT.name}, $${(MEMBER_CONTEXT.duesAnnual/1000)}K/yr, health score ${MEMBER_CONTEXT.healthScore}) just complained:
"${msg}"

Their health score trend: declining from 78 to 42 over 7 months. Golf rounds dropping monthly.

Assess the resignation risk. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentence risk assessment","action":"recommended retention action","risk_level":"critical|high|medium","dues_at_risk":"$18,000"}`,

      'health-score': (msg) => `You are the Health Score Intelligence agent for Pine Tree Country Club.

Member ${MEMBER_CONTEXT.name} (current score: ${MEMBER_CONTEXT.healthScore}) just filed a complaint: "${msg}"

Project the health score impact. Return ONLY valid JSON:
{"title":"short title","detail":"1-2 sentences on score projection","projected_change":"-X points","new_projected_score":0}`,
    },
  },
  booking: {
    agents: ['staffing-demand', 'health-score'],
    prompts: {
      'staffing-demand': (msg) => `You are the Staffing-Demand Intelligence agent for Pine Tree Country Club.

Member ${MEMBER_CONTEXT.name} just made a booking request through concierge: "${msg}"

Determine if any staffing adjustment is needed. Return ONLY valid JSON:
{"title":"short title","detail":"1-2 sentences about staffing impact","adjustment":"what to adjust if anything"}`,

      'health-score': (msg) => `You are the Health Score Intelligence agent for Pine Tree Country Club.

Member ${MEMBER_CONTEXT.name} (current score: ${MEMBER_CONTEXT.healthScore}, declining) just made a booking: "${msg}"

This is a positive engagement signal for a declining member. Project the impact. Return ONLY valid JSON:
{"title":"short title","detail":"1-2 sentences on score projection","projected_change":"+X points","new_projected_score":0}`,
    },
  },
  general: {
    agents: ['concierge'],
    prompts: {
      'concierge': (msg) => `You are the Concierge Monitoring agent for Pine Tree Country Club.

Member ${MEMBER_CONTEXT.name} (health score ${MEMBER_CONTEXT.healthScore}, ${MEMBER_CONTEXT.trend}) sent: "${msg}"

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

  const { member_message, concierge_response, member_id } = req.body || {};
  if (!member_message) {
    return res.status(400).json({ error: 'member_message is required' });
  }

  const category = await classifyMessage(member_message);
  const config = AGENT_PROMPTS[category];

  try {
    // Run all agents in parallel for faster GM-side response
    const events = await Promise.all(config.agents.map(async (agentKey) => {
      const promptFn = config.prompts[agentKey];
      const prompt = promptFn(member_message, concierge_response || '');

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
      member_id: member_id || MEMBER_CONTEXT.memberId,
      events,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/demo/agent-reaction error:', err);
    return res.status(500).json({ error: err.message });
  }
}
