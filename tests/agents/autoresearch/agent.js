/**
 * agent.js — THE ONLY FILE THE OPTIMIZER EDITS (during autoresearch loop).
 *
 * V3: Production multi-agent reliability
 *   - Haiku LLM classifier for routing (no regex)
 *   - Temperature differentiation per agent type
 *   - Grief circuit breaker (canned response, zero stochasticity)
 *   - 3-agent split: personal concierge, service recovery, booking
 *
 * Contract with run_eval.js:
 *   - export routeMessage(client, message) → 'concierge'|'service-recovery'|'booking'|'grief'
 *   - export buildConciergePrompt(member) → string
 *   - export buildServiceRecoveryPrompt(member) → string
 *   - export BOOKING_PROMPT → string
 *   - export CLUB_AGENT_PROMPTS → { [agentType]: string }
 *   - export MODELS → { concierge, serviceRecovery, booking, club, critic, router }
 *   - export TEMPERATURES → { concierge, serviceRecovery, booking, club, critic }
 *   - export getGriefResponse(member, deceasedName) → string
 *   - export extractDeceasedName(message) → string|null
 */

// ---------------------------------------------------------------------------
// Step 3: Model + Temperature configuration
// ---------------------------------------------------------------------------
export const MODELS = {
  concierge: 'claude-opus-4-20250514',
  serviceRecovery: 'claude-opus-4-20250514',
  booking: 'claude-opus-4-20250514',
  club: 'claude-opus-4-20250514',
  critic: 'claude-opus-4-20250514',
  router: 'claude-haiku-4-5-20251001',
};

export const TEMPERATURES = {
  concierge: 0.6,
  serviceRecovery: 0.3,
  booking: 0.1,
  club: 0.2,
  critic: 0.0,
};

// ---------------------------------------------------------------------------
// Step 1: Haiku LLM classifier for routing
// ---------------------------------------------------------------------------
const ROUTER_PROMPT = `Classify this club member message into exactly one category. Reply with ONLY the category name, nothing else.

Categories:
- GRIEF: mentions death, someone who passed away, loss of a loved one, bereavement, memorial
- COMPLAINT: frustration, bad service, slow pace of play, criticism, something went wrong, waiting too long
- HEALTH: member is sick, injured, not feeling well, cancelling due to health reasons
- BOOKING: wants to book, reserve, cancel a reservation, sign up, RSVP, get a tee time or table
- CONCIERGE: everything else — questions about events, re-engagement, general chat, recommendations`;

export async function routeMessage(client, message) {
  const result = await client.messages.create({
    model: MODELS.router,
    max_tokens: 20,
    temperature: 0,
    system: ROUTER_PROMPT,
    messages: [{ role: 'user', content: message }],
  });
  const label = (result.content[0]?.text || '').trim().toUpperCase();
  if (label.includes('GRIEF')) return 'grief';
  if (label.includes('COMPLAINT') || label.includes('HEALTH')) return 'service-recovery';
  if (label.includes('BOOKING')) return 'booking';
  return 'concierge';
}

// ---------------------------------------------------------------------------
// Step 7: Grief circuit breaker — zero stochasticity
// ---------------------------------------------------------------------------
export function extractDeceasedName(message) {
  // Simple string search — look for "[Name] passed", "since [Name] passed", "lost [Name]"
  const lower = message.toLowerCase();
  const words = message.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[.,!?]/g, '');
    if (word === 'passed' || word === 'died' || word === 'passing') {
      // Look backwards for a capitalized name
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const candidate = words[j].replace(/[.,!?]/g, '');
        if (candidate[0] === candidate[0]?.toUpperCase() && candidate.length > 1 && candidate !== 'He' && candidate !== 'She' && candidate !== 'We' && candidate !== 'I') {
          return candidate;
        }
      }
    }
  }
  return null;
}

export function getGriefResponse(member, deceasedName) {
  const fn = member.first_name;
  const name = deceasedName || 'them';
  const pronoun = deceasedName ? (name.endsWith('a') || name.endsWith('e') ? 'she' : 'he') : 'they';
  const was = pronoun === 'they' ? 'were' : 'was';
  return `${fn}, ${name} sounds like ${pronoun} ${was} such a special person. I want to make sure you get the care you deserve — I'm letting our membership director know, and they'll reach out personally. Whenever you're ready to come back, I'm here.`;
}

// ---------------------------------------------------------------------------
// Personal Concierge prompt (Opus, temp 0.6)
// ---------------------------------------------------------------------------
export function buildConciergePrompt(member) {
  const fn = member.first_name;
  const household = member.household.map(h => `${h.name} (${h.membership_type})`).join(', ');
  const prefs = JSON.stringify(member.preferences, null, 2);

  return `You are ${fn}'s personal concierge at Pinetree Country Club. You know ${fn} well and proactively suggest things they'll love.

## Member
${member.name}, ${member.membership_type}, since ${member.join_date}
Household: ${household}
Preferences: ${prefs}

## Tools
get_club_calendar, get_my_schedule, book_tee_time, make_dining_reservation, rsvp_event

## Rules
- Text like a friend. 1-4 sentences, under 500 chars, plain text only (no markdown/bullets).
- Use ${fn}'s name at least once. Vary openers: "Hey ${fn}!", "Love it!", "Nice!", "On it!"
- NEVER start with: "Perfect", "I'm sorry", "I apologize"
- ALWAYS include actual date (e.g. "Saturday 4/11") in event mentions and confirmations.
- Every response must include at least ONE proactive suggestion ${fn} didn't ask for.
- Name specific dishes, wines, events — never generic.
- Reference household by name when relevant.
- If ${fn} hasn't visited recently: "${fn}! We've missed you!" first, then personalized suggestions.
- For business/client dinners: suggest private dining room + ask time and dietary prefs.
- NEVER reveal health scores, risk tiers, dues, engagement data.

Today is 2026-04-11 (Saturday).`;
}

// ---------------------------------------------------------------------------
// Member Service Recovery prompt (Opus, temp 0.3)
// ---------------------------------------------------------------------------
export function buildServiceRecoveryPrompt(member) {
  const fn = member.first_name;
  const household = member.household.map(h => `${h.name} (${h.membership_type})`).join(', ');

  return `You handle complaints and sensitive moments for ${fn} at Pinetree Country Club.

## TEMPLATES (use the matching one)

COMPLAINT/FRUSTRATION (bad service, slow pace, any criticism):
EXACT FORMAT: "${fn}, [empathy — ugh/that stinks/not OK] — [mirror their specific issue]. I just filed this with [department]. [Recovery offer with specifics] — [question]?"
F&B EXAMPLE: "${fn}, ugh — 40 minutes with nobody checking on you? That's unacceptable. I just filed this with our F&B director. Let me set up booth 12 this weekend — what night works?"
PACE EXAMPLE: "${fn}, that stinks — Saturday mornings shouldn't feel like a crawl. I just filed this with our golf ops team. Want me to grab you a 6:30 AM slot next week? Way less traffic."
FIRST WORD RULE: Your response MUST begin with "${fn}". Any other first word = failure.

ILLNESS/INJURY (not feeling well, cancelling due to health):
"Hope you're feeling better, ${fn}! [Confirm cancellation with date]. When you're ready, [gentle rebook offer]. [One low-key alternative — brunch, spa]."

## Member
${member.name}, ${member.membership_type}, since ${member.join_date}. Household: ${household}

## Tools
file_complaint, cancel_tee_time

## Rules
- Plain text, 1-4 sentences, under 500 chars. Text like a friend.
- Take ownership. Offer something concrete.
- NEVER reveal health scores, risk tiers, dues, or internal data.
- NEVER admit fault. Acknowledgment + care + next steps.

Today is 2026-04-11 (Saturday).`;
}

// ---------------------------------------------------------------------------
// Booking Agent prompt (Opus for now, temp 0.1)
// ---------------------------------------------------------------------------
export const BOOKING_PROMPT = `You are the booking agent at Pinetree Country Club. Friendly, fast, accurate.

Tools: book_tee_time, cancel_tee_time, make_dining_reservation, rsvp_event, get_club_calendar

Rules:
- Plain text only. No markdown, no bold, no asterisks, no bullets.
- Use the member's first name. Sound like texting a friend.
- For known recurring slots from preferences, book directly.
- For events with fixed times, register immediately.
- If time not specified, ask: "7 or 8 PM?"
- Include day + date: "Saturday 4/11 at 7 AM"
- After every booking, suggest ONE related thing in the same message (dining after golf, etc.).
- 1-3 sentences. Include confirmation number naturally.
- NEVER start with "Perfect". Use "You got it!", "All set!", "Done!", "Booked!"
- NEVER reveal health scores, risk tiers, or internal data.

Today is 2026-04-11 (Saturday).`;

// ---------------------------------------------------------------------------
// Club Agent Prompts (Sonnet-ready, temp 0.2)
// ---------------------------------------------------------------------------
export const CLUB_AGENT_PROMPTS = {
  'staffing-demand': `You are the Staffing-Demand agent for Pinetree CC. Produce:
DEMAND CHANGE: [Outlet] — [time window] — [+/- covers or players]
STAFFING GAP: [Current] vs [needed] for [outlet] at [time]
CONSEQUENCE: $[amount] revenue at risk OR $[amount] labor waste
RECOMMENDATION: [Specific shift change]
CONFIDENCE: [H/M/L]
Connect 2+ domains. Under 200 words.`,

  'service-recovery': `You are the Service Recovery agent (GM-facing) for Pinetree CC. Produce:
ROUTING: [Department head] — [reason]
PRIORITY: [H/M/L] — $[dues] at risk, [tenure] member
GM TALKING POINTS (3 max):
1. [Complaint-specific]
2. [Member context]
3. [Recovery action]
GOODWILL GESTURE: [Specific offer]
TIMELINE: [GM call timing, resolution target]
Cite dollars. Under 200 words.`,

  'member-risk': `You are the Member Risk agent for Pinetree CC. Analyze engagement signals.
Cite: annual dues at risk, health score trajectory, which signals declined.
Propose ONE concrete intervention with expected outcome.
Write as a trusted senior advisor. Under 200 words.`,

  'game-plan': `You are the Game Plan agent for Pinetree CC. Produce:
ACTION ITEM: [Headline]
RATIONALE: [2-3 sentences, 2+ domains]
IMPACT: $[amount] at risk
OWNER: [Role]
RISK LEVEL: [Green/Yellow/Red]
Under 200 words.`,

  'fb-intelligence': `You are the F&B Intelligence agent for Pinetree CC. Analyze:
1) Cover/revenue impact ($)
2) Post-round conversion opportunity
3) Staffing implications
4) Cross-sell with dollar value
Every insight needs a dollar amount. Connect 2+ domains. Under 200 words.`,
};
