// api/agents/draft.js — Phase C Step 16
// Generates a real personalized message draft for a given agent action
// Called when GM clicks "View Draft" on an AgentActionCard with DRAFT_NOTE type

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { memberContext, actionContext, tone } = req.body ?? {};

  if (!memberContext || !actionContext) {
    return res.status(400).json({ error: 'memberContext and actionContext required' });
  }

  const systemPrompt = `You are writing a personal outreach message on behalf of the General Manager of a private golf club.

Rules:
- Write in first person from the GM's perspective.
- Tone: ${tone ?? 'warm, personal, brief — the kind of note a trusted friend would send'}.
- Never mention data, scores, systems, or anything that sounds like it came from a database.
- The message should feel handwritten and sincere, not corporate.
- Maximum 3 short paragraphs. No subject line. No signature block.
- Focus on acknowledgment, care, and a specific next step.`;

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
        max_tokens: 500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Write a personal outreach message for this member situation:\n\nMember: ${JSON.stringify(memberContext)}\nSituation: ${JSON.stringify(actionContext)}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const data = await response.json();
    const draft = data.content?.[0]?.text ?? '';

    return res.status(200).json({ draft });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
