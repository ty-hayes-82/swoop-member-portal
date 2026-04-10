/**
 * POST /api/generate-batch-recommendations
 *
 * Generates AI recommendations for all at-risk members (health_score < 50).
 * Determines triggers from member data and calls Claude for each.
 * Designed to run after "Update Health Scores" or on a nightly cron.
 *
 * Auth: gm, admin, swoop_admin
 * Response: { generated: N, members: [...], errors: N }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { ARCHETYPE_PLAYBOOKS, TRIGGER_DEFINITIONS } from '../src/config/archetypePlaybooks.js';

function determineTriggers(member, healthHistory) {
  const triggers = [];

  // score_drop_10: check recent health score delta
  if (healthHistory.length >= 2) {
    const latest = Number(healthHistory[0]?.score) || 0;
    const previous = Number(healthHistory[1]?.score) || 0;
    if (previous - latest >= 10) triggers.push('score_drop_10');
  }

  // zero_activity_30d: no recent activity date
  if (!member.last_health_update || (Date.now() - new Date(member.last_health_update).getTime()) > 30 * 86400000) {
    triggers.push('zero_activity_30d');
  }

  // spend_decline_30pct: check if health score is in critical/at-risk territory
  const score = Number(member.health_score) || 0;
  if (score < 25) {
    triggers.push('spend_decline_30pct');
  }

  // new_member_no_habits: joined recently with low score
  if (member.archetype === 'New Member' && score < 45) {
    triggers.push('new_member_no_habits');
  }

  // Ghost-specific triggers
  if (member.archetype === 'Ghost') {
    triggers.push('zero_activity_30d');
    triggers.push('email_decay_50pct');
  }

  // Declining-specific triggers
  if (member.archetype === 'Declining') {
    triggers.push('spend_decline_30pct');
  }

  // Deduplicate
  return [...new Set(triggers)];
}

async function generateSingleRecommendation(member, trigger, clubId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const archetype = member.archetype || 'Balanced Active';
  const playbook = ARCHETYPE_PLAYBOOKS[archetype];
  if (!playbook) return null;

  const triggerDef = TRIGGER_DEFINITIONS[trigger];
  if (!triggerDef) return null;

  // Fetch minimal recent activity for context
  const activityResult = await sql`
    SELECT transaction_date, total_amount, location_name
    FROM transactions WHERE member_id = ${member.member_id} AND club_id = ${clubId}
    ORDER BY transaction_date DESC LIMIT 5
  `;

  const systemPrompt = `You are a private club membership advisor. Given this member's profile, archetype, and trigger event, select the best action from the playbook and personalize it.

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "recommended_action": "Brief description",
  "type": "action_type from playbook",
  "owner": "Role",
  "deadline": "Time-bound deadline",
  "channel": "Phone|Email|In-person|Text",
  "talking_points": ["Point 1", "Point 2", "Point 3"],
  "dollar_stake": "Revenue at risk estimate",
  "confidence": 0.0 to 1.0
}`;

  const userPrompt = `MEMBER: ${member.name || 'Unknown'} (${member.member_id})
Archetype: ${archetype} | Score: ${member.health_score ?? 'N/A'} | Tier: ${member.health_tier ?? 'N/A'}
Join Date: ${member.join_date ?? 'N/A'} | Type: ${member.membership_type ?? 'N/A'}

RECENT ACTIVITY: ${JSON.stringify(activityResult.rows.slice(0, 5))}

TRIGGER: ${trigger} — ${triggerDef.label}

PLAYBOOK (${archetype}): ${playbook.description}
ACTIONS: ${JSON.stringify(playbook.actions)}

Personalize the best action with specifics from the data.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 768,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? '';

  // Parse JSON from response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { raw, type: 'unknown', recommended_action: raw };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { raw, type: 'unknown', recommended_action: raw };
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const clubId = getReadClubId(req);

  try {
    // 1. Query all at-risk members (health_score < 50)
    const membersResult = await sql`
      SELECT member_id, name, archetype, health_score, health_tier,
             join_date, membership_type, last_health_update
      FROM members
      WHERE club_id = ${clubId}
        AND health_score IS NOT NULL
        AND health_score < 50
        AND (status = 'active' OR membership_status = 'active' OR status IS NULL)
      ORDER BY health_score ASC
    `;

    if (membersResult.rows.length === 0) {
      return res.status(200).json({ generated: 0, members: [], message: 'No at-risk members found' });
    }

    let generated = 0;
    let errors = 0;
    const results = [];

    // 2. Process each member
    for (const member of membersResult.rows) {
      try {
        // Get health history for trigger detection
        const healthHistory = await sql`
          SELECT score, score_delta, computed_at
          FROM health_scores WHERE member_id = ${member.member_id} AND club_id = ${clubId}
          ORDER BY computed_at DESC LIMIT 5
        `;

        // Determine triggers
        const triggers = determineTriggers(member, healthHistory.rows);
        if (triggers.length === 0) {
          triggers.push('score_drop_10'); // Default trigger for at-risk members
        }

        // Use the highest-priority trigger (first one)
        const primaryTrigger = triggers[0];

        // Generate recommendation
        const recommendation = await generateSingleRecommendation(member, primaryTrigger, clubId);
        if (!recommendation) {
          errors++;
          continue;
        }

        // Store in agent_actions
        const actionId = `rec_${member.member_id}_${Date.now()}`;
        await sql`
          INSERT INTO agent_actions (
            action_id, club_id, agent_id, action_type, priority, source,
            description, impact_metric, member_id, status, timestamp
          ) VALUES (
            ${actionId}, ${clubId}, 'ai_recommendation_engine',
            ${recommendation.type || 'personal_call'},
            ${(recommendation.confidence ?? 0) >= 0.8 ? 'urgent' : 'high'},
            ${`Batch AI recommendation: ${primaryTrigger}`},
            ${recommendation.recommended_action || 'AI-generated recommendation'},
            ${recommendation.dollar_stake || null},
            ${member.member_id}, 'pending', NOW()
          )
        `;

        results.push({
          memberId: member.member_id,
          name: member.name,
          archetype: member.archetype,
          healthScore: member.health_score,
          trigger: primaryTrigger,
          allTriggers: triggers,
          recommendation: {
            actionId,
            ...recommendation,
          },
        });

        generated++;
      } catch (err) {
        console.error(`Batch recommendation error for ${member.member_id}:`, err.message);
        errors++;
      }
    }

    return res.status(200).json({
      generated,
      errors,
      totalAtRisk: membersResult.rows.length,
      members: results,
      message: `Generated ${generated} recommendations for ${membersResult.rows.length} at-risk members.`,
    });
  } catch (err) {
    console.error('/api/generate-batch-recommendations error:', err);
    return res.status(500).json({ error: err.message });
  }
}, { roles: ['gm', 'admin', 'swoop_admin'] });
