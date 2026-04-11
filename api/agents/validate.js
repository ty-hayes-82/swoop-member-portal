/**
 * validate.js — Response validation engine for the Agent Config System.
 *
 * Sprint 5: Built-in validation rules that can be toggled per-agent via
 * the validation_rules[] array in agent_configs.prompt_overrides.
 *
 * @module api/agents/validate
 */

// ---------------------------------------------------------------------------
// Built-in rule implementations
// ---------------------------------------------------------------------------

/**
 * empathy_first — Response must start with the member's first name.
 * Designed for complaint / service-recovery agents.
 *
 * @param {string} text
 * @param {object} context — must include member.first_name
 * @returns {{ passed: boolean, detail: string }}
 */
function rule_empathy_first(text, context) {
  const firstName = context?.member?.first_name;
  if (!firstName) {
    return { passed: true, detail: 'Skipped: no member.first_name in context' };
  }
  const starts = text.toLowerCase().startsWith(firstName.toLowerCase());
  return {
    passed: starts,
    detail: starts
      ? `Response starts with "${firstName}"`
      : `Response must start with "${firstName}" but starts with "${text.split(/\s/)[0]}"`,
  };
}

/**
 * no_forbidden_words — Response must not contain any word from a configurable list.
 *
 * @param {string} text
 * @param {object} context — must include forbiddenWords[]
 * @returns {{ passed: boolean, detail: string }}
 */
function rule_no_forbidden_words(text, context) {
  const words = context?.forbiddenWords;
  if (!words?.length) {
    return { passed: true, detail: 'Skipped: no forbiddenWords in context' };
  }
  const lower = text.toLowerCase();
  const found = words.filter(w => lower.includes(w.toLowerCase()));
  return {
    passed: found.length === 0,
    detail: found.length === 0
      ? 'No forbidden words found'
      : `Forbidden words found: ${found.join(', ')}`,
  };
}

/**
 * no_markdown — Response must not contain **, ##, or lines starting with "- ".
 *
 * @param {string} text
 * @returns {{ passed: boolean, detail: string }}
 */
function rule_no_markdown(text) {
  const issues = [];
  if (text.includes('**')) issues.push('bold markers (**)');
  if (text.includes('##')) issues.push('heading markers (##)');
  if (text.split('\n').some(line => line.trimStart().startsWith('- '))) {
    issues.push('bullet points (- )');
  }
  return {
    passed: issues.length === 0,
    detail: issues.length === 0
      ? 'No markdown detected'
      : `Markdown detected: ${issues.join(', ')}`,
  };
}

/**
 * response_length — Response word count must be within min/max bounds.
 *
 * @param {string} text
 * @param {object} context — must include minWords and/or maxWords
 * @returns {{ passed: boolean, detail: string }}
 */
function rule_response_length(text, context) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const min = context?.minWords ?? 0;
  const max = context?.maxWords ?? Infinity;
  const passed = wordCount >= min && wordCount <= max;
  return {
    passed,
    detail: passed
      ? `Word count ${wordCount} within bounds [${min}, ${max === Infinity ? 'unlimited' : max}]`
      : `Word count ${wordCount} outside bounds [${min}, ${max === Infinity ? 'unlimited' : max}]`,
  };
}

/**
 * asks_before_suggesting — Response must contain a question mark before any
 * specific suggestion. Designed for corporate/dietary scenarios where the agent
 * should clarify before recommending.
 *
 * @param {string} text
 * @returns {{ passed: boolean, detail: string }}
 */
function rule_asks_before_suggesting(text) {
  const questionIndex = text.indexOf('?');
  // Suggestion indicators: phrases like "I recommend", "I suggest", "you should", "how about"
  const suggestionPatterns = [
    /\bi(?:'d)?\s+(?:recommend|suggest)\b/i,
    /\byou\s+(?:should|could|might)\b/i,
    /\bhow\s+about\b/i,
    /\bwhy\s+not\b/i,
    /\blet(?:'s| us)\b/i,
  ];

  let firstSuggestionIndex = text.length;
  for (const pattern of suggestionPatterns) {
    const match = pattern.exec(text);
    if (match && match.index < firstSuggestionIndex) {
      firstSuggestionIndex = match.index;
    }
  }

  // No suggestion found = pass (nothing to check against)
  if (firstSuggestionIndex === text.length) {
    return { passed: true, detail: 'No specific suggestion detected' };
  }

  const passed = questionIndex !== -1 && questionIndex < firstSuggestionIndex;
  return {
    passed,
    detail: passed
      ? 'Question asked before first suggestion'
      : 'Suggestion made before asking a clarifying question',
  };
}

// ---------------------------------------------------------------------------
// Rule registry
// ---------------------------------------------------------------------------

const RULES = {
  empathy_first: rule_empathy_first,
  no_forbidden_words: rule_no_forbidden_words,
  no_markdown: rule_no_markdown,
  response_length: rule_response_length,
  asks_before_suggesting: rule_asks_before_suggesting,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all enabled validation rules against a response.
 *
 * @param {string} text — The agent response text.
 * @param {string[]} rules — Array of rule names to run (e.g. ['empathy_first', 'no_markdown']).
 * @param {object} context — Contextual data needed by rules (member, forbiddenWords, etc.).
 * @returns {{ passed: boolean, failures: Array<{ rule: string, detail: string }> }}
 */
export function validateResponse(text, rules, context) {
  if (!rules?.length) {
    return { passed: true, failures: [] };
  }

  const failures = [];

  for (const ruleName of rules) {
    const ruleFn = RULES[ruleName];
    if (!ruleFn) continue; // skip unknown rules

    const result = ruleFn(text, context || {});
    if (!result.passed) {
      failures.push({ rule: ruleName, detail: result.detail });
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

/**
 * Validate a response and retry via the Anthropic API if validation fails.
 *
 * If the first validation fails and retries > 0, re-calls the API with the
 * original payload plus a correction note. Lowers temperature by 0.1 per retry.
 * Returns the best result (fewest failures).
 *
 * @param {object} client — Anthropic SDK client instance.
 * @param {object} payload — Original API payload { model, system, messages, temperature, max_tokens, ... }.
 * @param {string} text — The initial response text to validate.
 * @param {string[]} rules — Array of rule names to run.
 * @param {object} context — Context for rules.
 * @param {number} maxRetries — Max retry attempts (1-3).
 * @returns {Promise<{ finalText: string, retried: boolean, failures: Array<{ rule: string, detail: string }> }>}
 */
export async function validateAndRetry(client, payload, text, rules, context, maxRetries = 1) {
  const initial = validateResponse(text, rules, context);

  if (initial.passed) {
    return { finalText: text, retried: false, failures: [] };
  }

  // Track the best result (fewest failures)
  let bestText = text;
  let bestFailures = initial.failures;

  const clampedRetries = Math.min(Math.max(maxRetries, 0), 3);
  let didRetry = false;

  for (let attempt = 0; attempt < clampedRetries; attempt++) {
    didRetry = true;
    const failureSummary = bestFailures.map(f => `${f.rule}: ${f.detail}`).join('; ');
    const correctionNote = `[SYSTEM: Your previous response violated these rules: ${failureSummary}. Please fix these issues and try again.]`;

    const retryMessages = [
      ...(payload.messages || []),
      { role: 'assistant', content: bestText },
      { role: 'user', content: correctionNote },
    ];

    const retryTemp = Math.max(0, (payload.temperature ?? 0.3) - 0.1 * (attempt + 1));

    const retryResult = await client.messages.create({
      model: payload.model,
      system: payload.system,
      messages: retryMessages,
      temperature: retryTemp,
      max_tokens: payload.max_tokens,
    });

    const retryText = retryResult.content?.find(c => c.type === 'text')?.text ?? '';
    if (!retryText.trim()) continue;

    const retryValidation = validateResponse(retryText, rules, context);

    if (retryValidation.passed) {
      return { finalText: retryText, retried: didRetry, failures: [] };
    }

    // Keep the result with fewer failures
    if (retryValidation.failures.length < bestFailures.length) {
      bestText = retryText;
      bestFailures = retryValidation.failures;
    }
  }

  // Return best-effort result
  return { finalText: bestText, retried: didRetry, failures: bestFailures };
}
