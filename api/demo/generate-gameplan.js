/**
 * POST /api/demo/generate-gameplan
 *
 * Conference demo endpoint: generates a game plan using Claude with
 * hardcoded Pine Tree Saturday morning seed data. No DB required.
 */
import { generateText } from '../lib/aiClient.js';

const SEED_DATA = {
  club: 'Pine Tree Country Club',
  date: 'Saturday',
  tee_sheet: {
    total_rounds: 220,
    morning_rounds: 142,
    afternoon_rounds: 78,
    notable_members: [
      { name: 'Robert Harrington', health_score: 28, annual_dues: 24000, tee_time: '8:12 AM' },
      { name: 'Patricia Welling', health_score: 35, annual_dues: 18000, tee_time: '9:48 AM' },
      { name: 'James Nakamura', health_score: 41, annual_dues: 22000, tee_time: '10:24 AM' },
    ],
  },
  weather: {
    condition: 'Sunny with wind advisory',
    temp_high: 82,
    temp_low: 68,
    wind_mph: 28,
    gusts_mph: 35,
    precipitation_in: 0,
  },
  staffing: {
    shifts: [
      { outlet: 'Pro Shop', shift: 'AM', staff_count: 3 },
      { outlet: 'Pro Shop', shift: 'PM', staff_count: 2 },
      { outlet: 'Grill Room', shift: 'Lunch', staff_count: 4 },
      { outlet: 'Grill Room', shift: 'Dinner', staff_count: 3 },
      { outlet: 'Course Maintenance', shift: 'AM', staff_count: 5 },
    ],
    total_staff: 17,
    notes: 'Grill Room understaffed for projected covers. 2 servers called out.',
  },
  fb_reservations: {
    total_covers: 156,
    reservations: [
      { outlet: 'Grill Room', meal_period: 'Lunch', total_covers: 88, reservation_count: 22 },
      { outlet: 'Grill Room', meal_period: 'Dinner', total_covers: 68, reservation_count: 17 },
    ],
  },
  open_complaints: {
    count: 2,
    complaints: [
      { member: 'Robert Harrington', category: 'pace_of_play', description: 'Waited 25 minutes on hole 7 last Saturday' },
      { member: 'Lisa Chen', category: 'food_quality', description: 'Cold soup served at Grill Room lunch' },
    ],
  },
};

const PROMPT = `You are the Chief of Staff AI agent for a private country club. Generate today's game plan.

## Context
Club: ${SEED_DATA.club}
Day: ${SEED_DATA.date}
Rounds booked: ${SEED_DATA.tee_sheet.total_rounds} (${SEED_DATA.tee_sheet.morning_rounds} AM / ${SEED_DATA.tee_sheet.afternoon_rounds} PM)
Weather: ${SEED_DATA.weather.condition}, High ${SEED_DATA.weather.temp_high}F, Wind ${SEED_DATA.weather.wind_mph} mph gusting to ${SEED_DATA.weather.gusts_mph} mph
Staffing: ${SEED_DATA.staffing.total_staff} total. ${SEED_DATA.staffing.notes}
F&B Covers: ${SEED_DATA.fb_reservations.total_covers} projected (Lunch: ${SEED_DATA.fb_reservations.reservations[0].total_covers}, Dinner: ${SEED_DATA.fb_reservations.reservations[1].total_covers})
Open Complaints: ${SEED_DATA.open_complaints.count}
At-Risk Members on Sheet: ${SEED_DATA.tee_sheet.notable_members.map(m => `${m.name} (health: ${m.health_score}, $${(m.annual_dues/1000).toFixed(0)}K dues, ${m.tee_time})`).join('; ')}
Complaints: ${SEED_DATA.open_complaints.complaints.map(c => `${c.member}: ${c.description}`).join('; ')}

## Instructions
Generate exactly 5 action items. Each must be a cross-domain insight (connecting 2+ data sources).
Return ONLY valid JSON, no markdown fences. Format:
{
  "summary": "one-sentence overview of the day",
  "risk_level": "elevated",
  "actions": [
    {
      "headline": "short action title",
      "rationale": "why this matters, citing specific data",
      "impact": "dollar or operational impact",
      "owner": "role responsible",
      "domains": ["domain1", "domain2"],
      "priority": "high|medium"
    }
  ]
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = await generateText(PROMPT);

    // Parse JSON from response — strip markdown fences if present
    let plan;
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      plan = JSON.parse(cleaned);
    } catch {
      // Fallback: return the raw text as summary with no actions
      plan = {
        summary: raw.slice(0, 200),
        risk_level: 'elevated',
        actions: [],
      };
    }

    return res.status(200).json({
      plan,
      seed_data: SEED_DATA,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/demo/generate-gameplan error:', err);
    return res.status(500).json({ error: err.message });
  }
}
