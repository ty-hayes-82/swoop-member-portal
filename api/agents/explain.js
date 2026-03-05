// api/agents/explain.js — Phase C Step 16
// Returns natural language rationale for any proposed action
// Used when GM taps "Why is this recommended?" on a complex action

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, clubContext } = req.body ?? {};
  if (!action) return res.status(400).json({ error: 'action required' });

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
        max_tokens: 400,
        system: `You are a trusted analytics advisor for a private golf club GM.
Explain AI-recommended actions in plain English — no jargon, no data science language.
Use "I" to describe your reasoning. Focus on what the GM needs to understand to make a confident decision.
Keep it to 3–5 sentences.`,
        messages: [{
          role: 'user',
          content: `Explain why you're recommending this action:\n\nAction: ${action.headline}\nRationale: ${action.rationale}\nContext: ${JSON.stringify(clubContext ?? {})}`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const data = await response.json();
    const explanation = data.content?.[0]?.text ?? '';

    return res.status(200).json({ explanation });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
