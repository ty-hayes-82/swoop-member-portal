/**
 * POST /api/generate-recommendation
 *
 * Generates a personalized AI recommendation for a specific member + trigger.
 * Uses Claude to select and personalize the best action from the archetype playbook.
 *
 * Body: { memberId: 'mbr_t01', trigger: 'complaint_unresolved' }
 * Auth: gm, admin, swoop_admin
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { ARCHETYPE_PLAYBOOKS, TRIGGER_DEFINITIONS } from '../src/config/archetypePlaybooks.js';

async function fetchMemberProfile(memberId, clubId) {
  const [memberResult, activityResult, complaintsResult, healthResult] = await Promise.all([
    sql`SELECT * FROM members WHERE member_id = ${memberId} AND club_id = ${clubId} LIMIT 1`,
    sql`SELECT * FROM transactions WHERE member_id = ${memberId} AND club_id = ${clubId} ORDER BY transaction_date DESC LIMIT 20`,
    sql`SELECT * FROM complaints WHERE member_id = ${memberId} AND club_id = ${clubId} ORDER BY created_at DESC LIMIT 5`.catch(() => ({ rows: [] })),
    sql`SELECT * FROM health_scores WHERE member_id = ${memberId} AND club_id = ${clubId} ORDER BY computed_at DESC LIMIT 5`,
  ]);

  if (memberResult.rows.length === 0) return null;

  return {
    member: memberResult.rows[0],
    recentActivity: activityResult.rows,
    complaints: complaintsResult.rows,
    healthHistory: healthResult.rows,
  };
}

async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

function parseRecommendation(raw) {
  // Try to extract JSON from the response (Claude may wrap it in markdown)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { raw, parseError: 'No JSON found in response' };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { raw, parseError: 'Failed to parse JSON from response' };
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { memberId, trigger } = req.body ?? {};
  if (!memberId || !trigger) {
    return res.status(400).json({ error: 'memberId and trigger are required' });
  }

  const clubId = getReadClubId(req);

  try {
    // 1. Fetch member profile
    const profile = await fetchMemberProfile(memberId, clubId);
    if (!profile) {
      return res.status(404).json({ error: `Member ${memberId} not found` });
    }

    const { member } = profile;
    const archetype = member.archetype || 'Balanced Active';
    const playbook = ARCHETYPE_PLAYBOOKS[archetype];

    if (!playbook) {
      return res.status(400).json({ error: `Unknown archetype: ${archetype}` });
    }

    const triggerDef = TRIGGER_DEFINITIONS[trigger];
    if (!triggerDef) {
      return res.status(400).json({ error: `Unknown trigger: ${trigger}` });
    }

    // 2. Build prompts
    const systemPrompt = `You are a private club membership advisor. Given this member's profile, archetype, and trigger event, select the best action from the playbook and personalize it with specific details from their history.

Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "recommended_action": "Brief description of what to do",
  "type": "action_type from playbook",
  "owner": "Role - Person Name if known",
  "deadline": "Specific time-bound deadline based on the trigger urgency",
  "channel": "Phone|Email|In-person|Text",
  "talking_points": ["Point 1 with specific member details", "Point 2", "Point 3"],
  "dollar_stake": "Revenue at risk from this member/household",
  "confidence": 0.0 to 1.0
}`;

    const userPrompt = `MEMBER PROFILE:
Name: ${member.name || 'Unknown'}
Member ID: ${memberId}
Archetype: ${archetype}
Health Score: ${member.health_score ?? 'N/A'}
Health Tier: ${member.health_tier ?? 'N/A'}
Join Date: ${member.join_date ?? 'N/A'}
Membership Type: ${member.membership_type ?? 'N/A'}

RECENT ACTIVITY (last 20 transactions):
${JSON.stringify(profile.recentActivity.map(t => ({
  date: t.transaction_date,
  amount: t.total_amount,
  location: t.location_name || t.department,
})), null, 2)}

COMPLAINTS:
${profile.complaints.length > 0
  ? JSON.stringify(profile.complaints.map(c => ({
      date: c.created_at,
      subject: c.subject || c.description,
      status: c.status,
      severity: c.severity,
    })), null, 2)
  : 'None on record'}

HEALTH SCORE HISTORY (recent):
${JSON.stringify(profile.healthHistory.map(h => ({
  score: h.score,
  tier: h.tier,
  delta: h.score_delta,
  date: h.computed_at,
})), null, 2)}

TRIGGER: ${trigger} — ${triggerDef.label}

ARCHETYPE PLAYBOOK (${archetype}):
${playbook.description}

AVAILABLE ACTIONS:
${JSON.stringify(playbook.actions, null, 2)}

Select the best action for this situation and personalize it with specific details from the member's history. Be concrete — reference actual dates, amounts, and patterns from the data.`;

    // 3. Call Claude
    const raw = await callClaude(systemPrompt, userPrompt);
    const recommendation = parseRecommendation(raw);

    // 4. Store in agent_actions
    const actionId = `rec_${memberId}_${Date.now()}`;
    await sql`
      INSERT INTO agent_actions (
        action_id, club_id, agent_id, action_type, priority, source,
        description, impact_metric, member_id, status, timestamp
      ) VALUES (
        ${actionId}, ${clubId}, 'ai_recommendation_engine',
        ${recommendation.type || 'personal_call'},
        ${recommendation.confidence >= 0.8 ? 'urgent' : 'high'},
        ${`AI recommendation: ${trigger}`},
        ${recommendation.recommended_action || raw},
        ${recommendation.dollar_stake || null},
        ${memberId}, 'pending', NOW()
      )
    `;

    // 5. Return
    return res.status(200).json({
      action: {
        actionId,
        ...recommendation,
        memberId,
        archetype,
        trigger,
        triggerLabel: triggerDef.label,
      },
      generated: true,
    });
  } catch (err) {
    console.error('/api/generate-recommendation error:', err);
    return res.status(500).json({ error: err.message });
  }
}, { roles: ['gm', 'admin', 'swoop_admin'] });
