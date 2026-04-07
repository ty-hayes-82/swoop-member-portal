/**
 * AI Client — supports Claude (Anthropic) and Gemini (Google) for draft generation.
 * Provider controlled by AI_DRAFT_PROVIDER env var (default: 'claude').
 */

const PROVIDERS = {
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (prompt) => ({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
    extractText: (data) => data?.content?.[0]?.text || '',
  },
  gemini: {
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GOOGLE_AI_API_KEY,
    }),
    buildBody: (prompt) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
    extractText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
  },
};

/**
 * Generate text using the configured AI provider.
 * @param {string} prompt - The full prompt to send
 * @returns {Promise<string>} The generated text
 */
export async function generateText(prompt) {
  const providerName = (process.env.AI_DRAFT_PROVIDER || 'claude').toLowerCase();
  const provider = PROVIDERS[providerName];

  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerName}. Use 'claude' or 'gemini'.`);
  }

  const apiKey = providerName === 'claude' ? process.env.ANTHROPIC_API_KEY : process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(`Missing API key for provider '${providerName}'. Set ${providerName === 'claude' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_AI_API_KEY'}.`);
  }

  const res = await fetch(provider.url, {
    method: 'POST',
    headers: provider.getHeaders(),
    body: JSON.stringify(provider.buildBody(prompt)),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`AI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return provider.extractText(data);
}
