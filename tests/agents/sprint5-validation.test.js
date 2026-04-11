/**
 * Sprint 5 — Validation Engine Tests
 *
 * Tests S5-06 through S5-10 from the Agent Config System roadmap.
 * Covers validateResponse and validateAndRetry from api/agents/validate.js.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateResponse, validateAndRetry } from '../../api/agents/validate.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock Anthropic client that returns pre-configured responses. */
function mockClient(responses) {
  const queue = [...responses];
  return {
    messages: {
      create: vi.fn(async () => {
        const next = queue.shift();
        if (!next) return { content: [{ type: 'text', text: '' }] };
        return { content: [{ type: 'text', text: next }] };
      }),
    },
  };
}

const basePayload = {
  model: 'claude-sonnet-4-20250514',
  system: 'You are a concierge.',
  messages: [{ role: 'user', content: 'Help me please' }],
  temperature: 0.5,
  max_tokens: 600,
};

// ---------------------------------------------------------------------------
// S5-06: empathy_first passes when response starts with name
// ---------------------------------------------------------------------------
describe('S5-06: empathy_first passes when response starts with name', () => {
  it('should pass when response begins with the member first name', () => {
    const text = 'James, I completely understand your frustration and I want to help.';
    const result = validateResponse(text, ['empathy_first'], {
      member: { first_name: 'James' },
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('should pass case-insensitively', () => {
    const text = 'james, so sorry about that experience.';
    const result = validateResponse(text, ['empathy_first'], {
      member: { first_name: 'James' },
    });

    expect(result.passed).toBe(true);
  });

  it('should skip if no member.first_name in context', () => {
    const text = 'Hello there, how can I help?';
    const result = validateResponse(text, ['empathy_first'], {});

    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// S5-07: empathy_first fails + retry triggered
// ---------------------------------------------------------------------------
describe('S5-07: empathy_first fails + retry triggered', () => {
  it('should fail when response does not start with name', () => {
    const text = 'Hello! I understand your frustration.';
    const result = validateResponse(text, ['empathy_first'], {
      member: { first_name: 'James' },
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].rule).toBe('empathy_first');
    expect(result.failures[0].detail).toContain('Hello!');
  });

  it('should retry and succeed when second attempt starts with name', async () => {
    const client = mockClient([
      'James, I am so sorry about that. Let me fix this right away.',
    ]);

    const { finalText, retried, failures } = await validateAndRetry(
      client,
      basePayload,
      'Hello! I understand your frustration.',
      ['empathy_first'],
      { member: { first_name: 'James' } },
      1,
    );

    expect(retried).toBe(true);
    expect(failures).toHaveLength(0);
    expect(finalText).toMatch(/^James/);
    expect(client.messages.create).toHaveBeenCalledTimes(1);
  });

  it('should lower temperature by 0.1 on retry', async () => {
    const client = mockClient([
      'James, let me look into this for you.',
    ]);

    await validateAndRetry(
      client,
      { ...basePayload, temperature: 0.5 },
      'Sorry about that!',
      ['empathy_first'],
      { member: { first_name: 'James' } },
      1,
    );

    const call = client.messages.create.mock.calls[0][0];
    expect(call.temperature).toBe(0.4);
  });
});

// ---------------------------------------------------------------------------
// S5-08: no_forbidden_words passes clean response
// ---------------------------------------------------------------------------
describe('S5-08: no_forbidden_words passes clean response', () => {
  it('should pass when response contains no forbidden words', () => {
    const text = 'We have a lovely spring menu with seasonal dishes available this week.';
    const result = validateResponse(text, ['no_forbidden_words'], {
      forbiddenWords: ['wine dinner', 'couples event', 'Richard'],
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('should pass when forbiddenWords list is empty', () => {
    const text = 'Anything goes here.';
    const result = validateResponse(text, ['no_forbidden_words'], {
      forbiddenWords: [],
    });

    expect(result.passed).toBe(true);
  });

  it('should skip when no forbiddenWords in context', () => {
    const text = 'Wine dinner is great!';
    const result = validateResponse(text, ['no_forbidden_words'], {});

    expect(result.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// S5-09: no_forbidden_words catches "wine dinner" in grief context
// ---------------------------------------------------------------------------
describe('S5-09: no_forbidden_words catches "wine dinner" in grief', () => {
  it('should fail when response mentions a forbidden word', () => {
    const text = 'Sandra, we have a wonderful wine dinner coming up next Monday that you and Richard would love.';
    const result = validateResponse(text, ['no_forbidden_words'], {
      forbiddenWords: ['wine dinner', 'couples event', 'Richard'],
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].rule).toBe('no_forbidden_words');
    expect(result.failures[0].detail).toContain('wine dinner');
    expect(result.failures[0].detail).toContain('Richard');
  });

  it('should detect forbidden words case-insensitively', () => {
    const text = 'How about the WINE DINNER on Saturday?';
    const result = validateResponse(text, ['no_forbidden_words'], {
      forbiddenWords: ['wine dinner'],
    });

    expect(result.passed).toBe(false);
    expect(result.failures[0].detail).toContain('wine dinner');
  });
});

// ---------------------------------------------------------------------------
// S5-10: Retry max respected (1 retry, both fail, returns best-effort)
// ---------------------------------------------------------------------------
describe('S5-10: Retry max respected — returns best-effort after exhausting retries', () => {
  it('should stop after maxRetries and return best-effort text', async () => {
    // Both the original and the retry response fail empathy_first
    const client = mockClient([
      'Hi there! Let me help you with that.',  // retry 1: still fails
    ]);

    const { finalText, retried, failures } = await validateAndRetry(
      client,
      basePayload,
      'Hey! What can I do for you?',  // original: fails empathy_first
      ['empathy_first'],
      { member: { first_name: 'James' } },
      1,  // only 1 retry allowed
    );

    expect(retried).toBe(true);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0].rule).toBe('empathy_first');
    // Should have called the API exactly once (1 retry)
    expect(client.messages.create).toHaveBeenCalledTimes(1);
    // Should return something (best effort)
    expect(finalText).toBeTruthy();
  });

  it('should not retry when maxRetries is 0', async () => {
    const client = mockClient([]);

    const { finalText, retried, failures } = await validateAndRetry(
      client,
      basePayload,
      'Hey! What can I do for you?',
      ['empathy_first'],
      { member: { first_name: 'James' } },
      0,
    );

    expect(retried).toBe(false);
    expect(failures.length).toBeGreaterThan(0);
    expect(client.messages.create).not.toHaveBeenCalled();
    expect(finalText).toBe('Hey! What can I do for you?');
  });

  it('should cap retries at 3 even if higher value is passed', async () => {
    // All retries fail
    const client = mockClient([
      'Sorry about that!',  // retry 1
      'Apologies for the trouble!',  // retry 2
      'Let me look into this.',  // retry 3
    ]);

    await validateAndRetry(
      client,
      basePayload,
      'Hey! What can I do for you?',
      ['empathy_first'],
      { member: { first_name: 'James' } },
      10,  // request 10 retries — should be clamped to 3
    );

    expect(client.messages.create).toHaveBeenCalledTimes(3);
  });

  it('should return the result with fewer failures as best effort', async () => {
    // Original fails 2 rules, retry fails 1 rule — retry is better
    const client = mockClient([
      'James, check out our **Spring Menu** for great options!',  // starts with name (empathy passes) but has markdown (fails no_markdown)
    ]);

    const { finalText, failures } = await validateAndRetry(
      client,
      basePayload,
      'Hey! Check out our **Spring Menu** for great options!',  // fails empathy_first AND no_markdown
      ['empathy_first', 'no_markdown'],
      { member: { first_name: 'James' } },
      1,
    );

    // Retry text has 1 failure vs original's 2 — should pick retry
    expect(finalText).toMatch(/^James/);
    expect(failures).toHaveLength(1);
    expect(failures[0].rule).toBe('no_markdown');
  });
});

// ---------------------------------------------------------------------------
// Additional rule coverage
// ---------------------------------------------------------------------------
describe('no_markdown rule', () => {
  it('should fail on bold markdown', () => {
    const result = validateResponse('Here is the **important** info.', ['no_markdown'], {});
    expect(result.passed).toBe(false);
  });

  it('should fail on heading markdown', () => {
    const result = validateResponse('## Summary\nHere is the info.', ['no_markdown'], {});
    expect(result.passed).toBe(false);
  });

  it('should fail on bullet points', () => {
    const result = validateResponse('Options:\n- Golf\n- Tennis', ['no_markdown'], {});
    expect(result.passed).toBe(false);
  });

  it('should pass clean text', () => {
    const result = validateResponse('Here is the info for you.', ['no_markdown'], {});
    expect(result.passed).toBe(true);
  });
});

describe('response_length rule', () => {
  it('should pass within bounds', () => {
    const result = validateResponse('One two three four five', ['response_length'], {
      minWords: 3, maxWords: 10,
    });
    expect(result.passed).toBe(true);
  });

  it('should fail below minimum', () => {
    const result = validateResponse('Hi', ['response_length'], {
      minWords: 5, maxWords: 100,
    });
    expect(result.passed).toBe(false);
  });

  it('should fail above maximum', () => {
    const result = validateResponse('word '.repeat(50).trim(), ['response_length'], {
      minWords: 1, maxWords: 10,
    });
    expect(result.passed).toBe(false);
  });
});

describe('asks_before_suggesting rule', () => {
  it('should pass when question comes before suggestion', () => {
    const text = 'What kind of cuisine are you in the mood for? I recommend the Spring Menu.';
    const result = validateResponse(text, ['asks_before_suggesting'], {});
    expect(result.passed).toBe(true);
  });

  it('should fail when suggestion comes before question', () => {
    const text = 'I recommend the Spring Menu. What do you think?';
    const result = validateResponse(text, ['asks_before_suggesting'], {});
    expect(result.passed).toBe(false);
  });

  it('should pass when no suggestion is present', () => {
    const text = 'Let me check on that and get back to you.';
    const result = validateResponse(text, ['asks_before_suggesting'], {});
    expect(result.passed).toBe(true);
  });
});

describe('multiple rules at once', () => {
  it('should aggregate failures from all rules', () => {
    const text = '**Hello!** Here is your info:\n- Option A\n- Option B';
    const result = validateResponse(
      text,
      ['empathy_first', 'no_markdown'],
      { member: { first_name: 'Sandra' } },
    );

    expect(result.passed).toBe(false);
    expect(result.failures).toHaveLength(2);
    const ruleNames = result.failures.map(f => f.rule);
    expect(ruleNames).toContain('empathy_first');
    expect(ruleNames).toContain('no_markdown');
  });

  it('should return passed when no rules are provided', () => {
    const result = validateResponse('anything', [], {});
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });
});
