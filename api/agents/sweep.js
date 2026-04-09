// api/agents/sweep.js — Phase C Step 15
// Triggers a full agent sweep using the Anthropic API
// Returns proposed actions in the same shape as Phase A mock data
// agentService.js calls this when Phase C flag is enabled

import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

async function getClubName(clubId) {
  if (!clubId) return 'your club';
  try {
    const result = await sql`SELECT name FROM club WHERE club_id = ${clubId}`;
    return result.rows[0]?.name || 'your club';
  } catch {
    return 'your club';
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { agentId, context } = req.body ?? {};
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  // Always resolve club from authenticated session — never trust req.body.clubId.
  const clubName = await getClubName(req.auth.clubId);

  const SYSTEM_PROMPTS = {
    'chief-of-staff': `You are the Morning Chief of Staff for ${clubName}.
Your job is to review the operational briefing and propose a prioritized action plan for GM approval.

Rules:
- You never take action yourself. You propose actions for GM approval only.
- Every proposed action must cite specific data signals from the briefing.
- Prioritize by: dues at risk × time sensitivity × probability of impact.
- Write in the voice of a trusted senior advisor — direct, confident, brief.
- Maximum 3 proposed actions per sweep. Quality over quantity.
- Return JSON only. No preamble, no markdown.

Return format: JSON array of objects with these fields exactly:
[{
  "headline": "string — one sentence, action-oriented",
  "rationale": "string — 2-3 sentences explaining the causal chain and why now",
  "proposedAction": { "type": "DRAFT_NOTE|ALERT_STAFF|SCHEDULE_CALL|SEND_INVITE", "recipient": "string", "message": "string" },
  "estimatedImpact": "string — dollar amount or outcome metric",
  "sourceSignals": ["signal:id", ...]
}]`,

    'retention-sentinel': `You are the Retention Sentinel for ${clubName}.
You monitor all members for disengagement signals and flag those at risk of resignation.

Rules:
- Focus on behavioral patterns, not just single signals.
- Prioritize members with high dues AND declining engagement.
- Propose tee time invites, personal outreach, or complimentary experiences.
- Maximum 3 proposed actions per sweep.
- Return JSON only. No preamble, no markdown.

Return format: same JSON array format as chief-of-staff.`,

    'service-recovery': `You are the Service Recovery Agent for ${clubName}.
You monitor unresolved member complaints and propose follow-up interventions.

Rules:
- Flag complaints older than 48 hours with no resolution.
- Prioritize by member dues × complaint severity × time elapsed.
- Propose staff assignments, GM outreach, or comp offers.
- Maximum 2 proposed actions per sweep.
- Return JSON only. No preamble, no markdown.

Return format: same JSON array format as chief-of-staff.`,
  };

  const systemPrompt = SYSTEM_PROMPTS[agentId];
  if (!systemPrompt) {
    return res.status(400).json({ error: `No system prompt configured for agent: ${agentId}` });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Run your morning sweep. Here is today's operational context:\n\n${JSON.stringify(context ?? {}, null, 2)}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '[]';

    let actions;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      const raw = JSON.parse(clean);
      // Stamp with agent metadata so shape matches Phase A mock data
      actions = raw.map((a, i) => ({
        id: `live_${agentId}_${Date.now()}_${i}`,
        agentId,
        createdAt: new Date().toISOString(),
        status: 'pending',
        priority: i === 0 ? 'high' : 'medium',
        ...a,
      }));
    } catch {
      return res.status(500).json({ error: 'Failed to parse agent response', raw: text });
    }

    return res.status(200).json({ actions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
})
