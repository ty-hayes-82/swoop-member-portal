/**
 * POST /api/demo/weather-cascade
 *
 * Conference demo endpoint: given an agent name and weather context,
 * calls Claude to produce that agent's response to a wind gust event.
 * No DB required.
 */
import { generateText } from '../lib/aiClient.js';

const WEATHER_CONTEXT = {
  before: { temp: 82, condition: 'Sunny', wind_mph: 8 },
  after: { temp: 82, condition: 'Sunny with wind gusts', wind_mph: 35, gusts_mph: 42 },
  club: 'Pine Tree Country Club',
  day: 'Saturday',
  rounds_booked: 220,
  morning_rounds: 142,
  afternoon_rounds: 78,
  fb_covers: 156,
  at_risk_members: [
    { name: 'Robert Harrington', health_score: 28, tee_time: '8:12 AM', dues: 24000 },
    { name: 'Patricia Welling', health_score: 35, tee_time: '9:48 AM', dues: 18000 },
    { name: 'James Nakamura', health_score: 41, tee_time: '10:24 AM', dues: 22000 },
  ],
  staffing: { grill_lunch: 4, grill_dinner: 3, pro_shop: 5, maintenance: 5 },
};

const AGENT_PROMPTS = {
  'staffing-demand': `You are the Staffing-Demand Intelligence agent for ${WEATHER_CONTEXT.club}.

Wind has shifted from ${WEATHER_CONTEXT.before.wind_mph} mph to ${WEATHER_CONTEXT.after.wind_mph} mph (gusts to ${WEATHER_CONTEXT.after.gusts_mph} mph) on ${WEATHER_CONTEXT.day}.
${WEATHER_CONTEXT.rounds_booked} rounds booked (${WEATHER_CONTEXT.morning_rounds} AM, ${WEATHER_CONTEXT.afternoon_rounds} PM).
Current Grill Room staff: ${WEATHER_CONTEXT.staffing.grill_lunch} lunch / ${WEATHER_CONTEXT.staffing.grill_dinner} dinner.

Predict the staffing adjustment needed. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentences explaining the adjustment with specific numbers","adjustments":[{"area":"area name","change":"what to change","reason":"why"}]}`,

  'fb-intelligence': `You are the F&B Intelligence agent for ${WEATHER_CONTEXT.club}.

Wind has shifted from ${WEATHER_CONTEXT.before.wind_mph} mph to ${WEATHER_CONTEXT.after.wind_mph} mph (gusts ${WEATHER_CONTEXT.after.gusts_mph} mph).
Current projected covers: ${WEATHER_CONTEXT.fb_covers} (Lunch 88, Dinner 68).
${WEATHER_CONTEXT.rounds_booked} rounds booked. High wind will compress afternoon play into earlier return.

Predict F&B cover adjustments. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentences about cover reforecast with numbers","revised_covers":{"lunch":0,"dinner":0},"net_change":"description of net impact"}`,

  'member-risk': `You are the Member Risk Intelligence agent for ${WEATHER_CONTEXT.club}.

Wind has shifted to ${WEATHER_CONTEXT.after.wind_mph} mph gusts on ${WEATHER_CONTEXT.day}.
At-risk members playing in the wind window:
${WEATHER_CONTEXT.at_risk_members.map(m => `- ${m.name}: health ${m.health_score}, ${m.tee_time}, $${(m.dues/1000).toFixed(0)}K/yr`).join('\n')}

Flag which members need proactive outreach and why. Return ONLY valid JSON:
{"title":"short title","detail":"2-3 sentences about the risk","flagged_members":[{"name":"name","action":"what to do","reason":"why"}]}`,

  'chief-of-staff': `You are the Chief of Staff agent for ${WEATHER_CONTEXT.club}.

A wind event (${WEATHER_CONTEXT.after.wind_mph} mph gusts) triggered 3 sub-agents:
1. Staffing-Demand recommended shifting afternoon pro shop staff to Grill Room
2. F&B Intelligence revised lunch covers up from 88 to 104, dinner down from 68 to 52
3. Member Risk flagged 3 at-risk members needing proactive outreach

Consolidate these 9+ individual recommendations into exactly 4 prioritized actions for the GM.
Return ONLY valid JSON:
{"title":"Chief of Staff: Consolidated Actions","detail":"one sentence overview","actions":[{"headline":"action title","owner":"role","priority":"high|medium","rationale":"why, citing which agents"}]}`,
};

export default async function handler(req, res) {
  // Block in production — demo endpoints are dev/staging only
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent } = req.body || {};
  if (!agent || !AGENT_PROMPTS[agent]) {
    return res.status(400).json({
      error: `Invalid agent. Use one of: ${Object.keys(AGENT_PROMPTS).join(', ')}`,
    });
  }

  try {
    const raw = await generateText(AGENT_PROMPTS[agent]);

    let result;
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { title: agent, detail: raw.slice(0, 300) };
    }

    return res.status(200).json({
      agent,
      result,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`/api/demo/weather-cascade [${agent}] error:`, err);
    return res.status(500).json({ error: err.message });
  }
}
