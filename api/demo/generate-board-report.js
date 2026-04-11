/**
 * POST /api/demo/generate-board-report
 *
 * Conference demo endpoint: generates a monthly board report narrative
 * using Claude with hardcoded Pine Tree January seed data. No DB required.
 */
import { generateText } from '../lib/aiClient.js';

const SEED_DATA = {
  club: 'Pine Tree Country Club',
  month: 'January 2026',
  member_saves: { count: 3, dues_protected: 54000 },
  complaints: { resolved: 7, avg_resolution_hours: 2.1 },
  concierge: { active_members: 142, messages_handled: 1840, satisfaction_rate: 94 },
  revenue: { incremental_fb: 8200, tee_time_utilization: 87 },
  gm_hours_saved: 14,
  agents_running: 7,
};

const PROMPT = `You are a board-report ghostwriter for a private country club GM.
Write a concise 2-paragraph executive narrative summarizing the month.

## Data
Club: ${SEED_DATA.club}
Month: ${SEED_DATA.month}
Member Saves: ${SEED_DATA.member_saves.count} at-risk members retained, protecting $${(SEED_DATA.member_saves.dues_protected / 1000).toFixed(0)}K in annual dues
Complaints: ${SEED_DATA.complaints.resolved} resolved, avg ${SEED_DATA.complaints.avg_resolution_hours}hr response time
Concierge: ${SEED_DATA.concierge.active_members} active members, ${SEED_DATA.concierge.messages_handled} messages, ${SEED_DATA.concierge.satisfaction_rate}% satisfaction
Revenue: $${(SEED_DATA.revenue.incremental_fb / 1000).toFixed(0)}K incremental F&B, ${SEED_DATA.revenue.tee_time_utilization}% tee time utilization
GM Time Saved: ${SEED_DATA.gm_hours_saved} hours

## Instructions
Write in first person as the GM. Professional but warm tone suitable for a board meeting packet.
Paragraph 1: Operational highlights — member retention wins, complaint resolution, concierge adoption.
Paragraph 2: Financial impact — revenue growth, efficiency gains, forward outlook.
Do NOT use markdown. Plain text paragraphs only.`;

export default async function handler(req, res) {
  // Block in production — demo endpoints are dev/staging only
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const narrative = await generateText(PROMPT);

    return res.status(200).json({
      narrative: narrative.trim(),
      kpis: SEED_DATA,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/demo/generate-board-report error:', err);
    return res.status(500).json({ error: err.message });
  }
}
