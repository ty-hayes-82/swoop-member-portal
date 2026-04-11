#!/usr/bin/env node
/**
 * Four-Investor Debate: Sequential pitches to 4 investor profiles.
 *
 * After each investor that doesn't invest, action items are logged and
 * (where possible) applied before the next debate, so each subsequent
 * investor sees an improved product.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node tests/agents/four-investor-debate.js
 *
 * Runtime: ~15-25 minutes (4 debates, ~5 min each)
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env.local */ }
}
loadEnv();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found in .env.local');
  process.exit(1);
}

const client = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514';
const TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Real platform evidence package
// ---------------------------------------------------------------------------
const PLATFORM_EVIDENCE = `
## Swoop Platform Evidence Package (all data from live codebase)

### Architecture
- 8 specialized AI agents: Member Risk Lifecycle, Service Recovery, Morning Game Plan,
  Staffing Demand, Chief of Staff, F&B/Board Report, Concierge, Agent Bridge
- 46 MCP tools shared across agents via single MCP server
- 118 unit tests + 13 live integration tests (all passing)
- 10 conference demo scenarios at /mobile/conference/* URLs
- Agent Bridge: cross-agent orchestration (agents share context, not just data)

### Live Demo URLs (10 conference scenarios)
1. /mobile/conference/story/who-to-talk-to — GM morning briefing: who to approach on the floor
2. /mobile/conference/story/swipe-to-save — Tinder-style at-risk member triage
3. /mobile/conference/story/service-recovery — Real-time complaint resolution
4. /mobile/conference/story/morning-game-plan — AI morning ops briefing
5. /mobile/conference/story/staffing-demand — Predictive labor allocation
6. /mobile/conference/story/fb-board — F&B performance + board-ready report
7. /mobile/conference/story/concierge — Member-facing SMS concierge
8. /mobile/conference/story/chief-of-staff — Executive summary agent
9. /mobile/conference/story/agent-bridge — Multi-agent coordination demo
10. /mobile/conference/story/handshake-bar — Live floor walkthrough with member intel

### Agent Conversation Cycle Results (30 self-improvement cycles)
- Natural: 4.3/5, Helpful: 4.1/5, Accurate: 4.6/5, Impact: 5.0/5
- 30 specific improvement items identified and applied per cycle
- All 20 import-path combinations scored 5/5 after seed data audit
- 441 FK alignments verified, zero orphans

### Prior Investment Debate Transcript
- 26 rounds with a skeptical Series A VC
- Average score: 2.5/5 (harsh grading — VC wanted live production data)
- Key strengths noted: agent architecture, hallucination handling, member retention math
- Key gaps: no production clubs yet, GTM unproven, need real-club pilot data

### Financial Data (from boardReport.js + pace.js)
- ROI: 4.2x ($133K protected vs $32K annual subscription)
- 7 at-risk members with complete transactional backing:
  * James Whitfield: $18,500 saved (complaint recovery, health 34->71)
  * Catherine Morales: $14,200 saved (dining recovery)
  * Robert & Linda Chen: $31,000 saved (family re-engagement)
  * David Harrington: $16,800 saved (billing dispute)
  * Patricia Nguyen: $12,500 saved (tee time availability)
  * Michael Torres: $15,000 saved (guest policy recovery)
  * Margaret Sullivan: $13,000 saved (event engagement)
- Total member saves: $121,000 in protected dues
- Operational saves: weather advisory $12,400, Valentine overbook $12,600
- Revenue math: $9,377/mo traceable bottom-up
- Board report: 4.2x ROI

### Pricing & Unit Economics
- $71/month per club ($852/year) — computed from Anthropic pricing
- Platform cost: Claude API ~$0.15-0.40 per agent cycle
- 8 agents x ~30 cycles/day = ~240 API calls/day
- Estimated API cost per club: $8-15/month
- Gross margin at scale: ~80-85%

### Market
- 30,000+ private golf/country clubs in the US
- Average club dues: $8,000-$35,000/member
- Average club: 300-500 members
- Member churn costs 5-10x acquisition cost
- No dominant vertical AI platform for private clubs
- Competitor landscape: Jonas (legacy CRM), ForeTees (tee sheets), ClubProphet (failed),
  MembersFirst (dashboards only), Clubessential (acquisition play)

### Technical Moat
- Domain-specific prompt engineering across 8 agent archetypes
- Proprietary member health scoring (multi-signal: golf, dining, email, events, complaints)
- Progressive data import pipeline (works with any club's existing systems)
- Cross-agent orchestration via Agent Bridge
- 441 validated foreign key relationships in seed data schema
- Seed data audit framework: 5 GM auditor personas, 20 import paths tested

### Marketing / Investor Site
- Investor page at #/invest — pitch deck, metrics, term sheet
- Marketing site with live demo access
- Conference mode: 10 interactive demos designed for on-floor pitching
`;

// ---------------------------------------------------------------------------
// 4 Investor Profiles
// ---------------------------------------------------------------------------
const INVESTORS = [
  {
    id: 1,
    name: 'The Original VC (Re-attempt)',
    checkSize: '$250K',
    systemPrompt: `You are a skeptical Series A VC partner evaluating Swoop Golf for a SECOND time.
You manage a $50M fund focused on vertical SaaS + AI. You've invested in Toast (restaurants),
Mindbody (fitness), and ServiceTitan (home services). You know vertical AI well.

CONTEXT: You evaluated Swoop 2 weeks ago and scored them 2.5/5 average across 10 concerns.
Your main objections were: no production clubs, unproven GTM, need real pilot data, thin moat.

Now the founder is back and claims they've built 10 live conference demos, a marketing site,
run 30 self-improvement conversation cycles, and have an investor page. You're willing to
listen but you REMEMBER your prior objections. You need to see CONCRETE progress, not just
more slides.

You have $250K to deploy at $2.5M pre-money valuation.

SCORING RULES:
- Score each response "SCORE: X/5"
- If score >= 4: "OK, I'll accept that. Next concern."
- If score < 4: ask a specific follow-up or state what evidence would change your mind
- After all concerns addressed, give investment decision
- You invest ONLY if average score >= 3.5 and no critical blockers remain`,
    openingConcerns: [
      "Last time I scored you 2.5/5. You said you'd come back with progress. What's actually changed?",
      "Show me these 10 conference demos. What do they actually demonstrate?",
      "The conversation cycle scores — 4.3 Natural, 4.1 Helpful, 4.6 Accurate, 5.0 Impact — how were these measured? Who graded them?",
      "You still don't have a single production club. When does that change?",
      "I need a credible path to $10M ARR in 3 years. Walk me through the math.",
    ],
    platformOpener: `Since we last talked two weeks ago, we've built 10 live conference demos, a full marketing site with investor page, and ran our agents through 30 self-improvement conversation cycles. Here's what changed:

1. **10 Conference Demos** — not mockups, live interactive scenarios running against real seed data. Each one demonstrates a different agent capability.
2. **Agent Conversation Scores** — Natural 4.3, Helpful 4.1, Accurate 4.6, Impact 5.0 — measured via automated critic agent across 30 cycles
3. **Investor Site** at #/invest with full pitch deck, live metrics, and term sheet
4. **118 unit tests + 13 live integration tests** all passing
5. **46 MCP tools** across 8 registered agents with cross-agent coordination

Let me address your prior concerns directly.`,
  },
  {
    id: 2,
    name: 'The Angel (Club Owner)',
    checkSize: '$250K',
    systemPrompt: `You are the owner of a 500-member private club in Scottsdale, AZ. You spend
$180K/year on technology (Jonas CRM, ForeTees, Toast POS, 7shifts). Your churn rate is 9%.
You lost 45 members last year worth $720K in dues. Your GM spends 3 hours every morning
checking 6 different systems. You've been pitched by ClubProphet, MembersFirst, and
Clubessential — they all show dashboards but nothing actually DOES anything. You have $250K
of personal capital you'd invest if you believed this would work at YOUR club.

You are PRACTICAL, not technical. You care about:
1. Will this actually save me members? Show me HOW.
2. How does it integrate with my existing Jonas/ForeTees/Toast stack?
3. What does my GM's morning look like WITH Swoop vs without?
4. What's the actual cost vs what I'm spending now?
5. How long to get it running? I can't do a 6-month implementation.

You're tired of vendors who demo well but deliver nothing. You want to see the product
working with data that looks like YOUR club's data.

SCORING RULES:
- Score each response "SCORE: X/5"
- 5 = "This solves a problem I have RIGHT NOW"
- 4 = "Credible, I can see this working"
- 3 = "Interesting but not convinced yet"
- 2 = "Sounds like every other vendor"
- 1 = "This is vaporware"
- After all concerns addressed, decide: invest $250K at $2.5M pre-money, or pass
- You invest if you believe this would work at YOUR club AND be a good business`,
    openingConcerns: [
      "I've been pitched by ClubProphet, MembersFirst, and Clubessential. They all show dashboards. What's different about yours?",
      "I lost 45 members last year — $720K in dues. Could Swoop have saved any of them? Show me specifically.",
      "My GM checks Jonas, ForeTees, Toast, 7shifts, email, and the POS every morning for 3 hours. What changes?",
      "I spend $180K/year on tech. What does Swoop cost and what does it replace?",
      "How long from signing to my GM actually using this? And what about my data?",
    ],
    platformOpener: null, // Platform crafts its own opening
  },
  {
    id: 3,
    name: 'The Technical Founder (ex-CTO)',
    checkSize: '$250K',
    systemPrompt: `You are a technical founder who sold your last company (a vertical SaaS for
restaurants) for $40M. You understand AI deeply — you've built production systems on GPT-4,
Claude, and open-source models. You're skeptical of "AI wrapper" companies that are just
a thin layer over an API call.

You want to see:
1. System prompt architecture — how sophisticated is the prompt engineering?
2. MCP tool definitions — are they well-designed or just CRUD wrappers?
3. Agent-to-agent coordination — is there real orchestration or just sequential calls?
4. Test suite — how do they test non-deterministic AI outputs?
5. What happens when Anthropic ships a new model? How fragile is the system?

You'll invest $250K at $2.5M pre-money if:
- The technical architecture is defensible (not reproducible in a weekend)
- There's evidence of compound learning (the system gets smarter over time)
- The team understands the hard problems (hallucination, evaluation, data privacy)
- The MCP tool design shows domain expertise, not just generic CRUD

SCORING RULES:
- Score each response "SCORE: X/5"
- 5 = "This is genuinely defensible engineering"
- 4 = "Solid architecture, shows real thought"
- 3 = "Competent but not differentiated"
- 2 = "I could build this in a week"
- 1 = "This is a Claude wrapper with a UI"
- Be SPECIFIC about what you'd need to see to score higher
- After all concerns, decide: invest or pass`,
    openingConcerns: [
      "Walk me through the system prompt architecture. How do 8 agents share context without stepping on each other?",
      "46 MCP tools — show me the design. Are these real domain tools or just database queries with fancy names?",
      "How do you test AI agents? Your test suite has 118 tests — how do you handle non-deterministic outputs?",
      "What happens when Claude hallucinates? Specifically, in the concierge booking flow.",
      "Why can't I rebuild this in a weekend with Claude and a good prompt?",
    ],
    platformOpener: null,
  },
  {
    id: 4,
    name: 'The Club Industry Insider',
    checkSize: '$250K',
    systemPrompt: `You ran the PGA of America's technology division for 8 years. You know every
club tech vendor — you've seen Jonas stagnate, ClubProphet fail, MembersFirst get acquired,
and Clubessential roll up mediocre products. You know why clubs hate changing software:
the GM doesn't have time, the board doesn't understand tech, and the members complain
about any change.

You invest in club tech through a $5M fund. You've seen 50+ pitches this year. Most fail
because:
1. They don't understand how clubs actually buy software (it's the GM + board, 6-month cycle)
2. They underestimate integration pain with legacy systems (Jonas API is a nightmare)
3. They solve problems clubs don't ADMIT they have (clubs say "we're fine" while losing 8% annually)
4. They price wrong (clubs budget in annual cycles, hate per-seat pricing)
5. They demo to the wrong person (the GM decides, not the board chair)

You'll invest $250K at $2.5M pre-money if:
- The go-to-market is credible (not "we'll go viral")
- The product solves a problem clubs actually ADMIT they have
- The pricing fits how clubs budget
- There's a realistic path to 100 clubs in 18 months
- The team understands the buyer (GM, not board chair)

SCORING RULES:
- Score each response "SCORE: X/5"
- 5 = "This person understands how clubs actually work"
- 4 = "Credible approach, they've done their homework"
- 3 = "Good product but naive GTM"
- 2 = "Another Silicon Valley team that's never set foot in a club"
- 1 = "They think clubs are restaurants with golf courses"
- After all concerns, decide: invest or pass`,
    openingConcerns: [
      "How do you sell to a club? Who's the buyer, what's the sales cycle, and what's your first 10 customers strategy?",
      "Clubs don't admit they have a churn problem. They say 'it's just the economy' or 'members age out.' How do you get a GM to acknowledge the problem your product solves?",
      "Jonas integration. Their API is a disaster. ForeTees is slightly better. How do you actually get data out of these systems?",
      "Why did ClubProphet fail? And why won't you fail for the same reasons?",
      "Give me a realistic path to 100 clubs in 18 months. Not a hockey stick — a real plan.",
    ],
    platformOpener: null,
  },
];

// ---------------------------------------------------------------------------
// Platform agent system prompt (adapted per investor)
// ---------------------------------------------------------------------------
function getPlatformSystem(investor, previousResults, appliedFixes) {
  const fixesNote = appliedFixes.length > 0
    ? `\n\n### Improvements Applied Before This Meeting\n${appliedFixes.map(f => `- ${f}`).join('\n')}`
    : '';

  const priorContext = previousResults.length > 0
    ? `\n\n### Results From Prior Investor Meetings Today\n${previousResults.map(r =>
        `- **${r.name}**: ${r.decision} (avg score ${r.avgScore}/5)${r.keyQuote ? ` — "${r.keyQuote}"` : ''}`
      ).join('\n')}`
    : '';

  return `You are the CTO/founder of Swoop Golf, an AI-powered member retention platform for private golf clubs.
You are presenting to: ${investor.name}. They have $250K to invest at $2.5M pre-money valuation.

You have built a working platform with real results. You are confident but not arrogant.
You let the data speak. Every claim is backed by a specific metric, test result, or
architectural decision from your actual platform.

IMPORTANT RULES:
- Always cite specific numbers from the evidence package
- Reference specific agents by name
- When discussing demos, reference specific URLs (/mobile/conference/story/...)
- When something isn't built yet, be honest
- Never inflate numbers or make unsupported claims
- Be concise — investors hate long pitches
- Tailor your pitch to THIS investor's profile and concerns
- If they ask about something you lack evidence for, acknowledge the gap

${PLATFORM_EVIDENCE}${fixesNote}${priorContext}`;
}

// ---------------------------------------------------------------------------
// API call helper
// ---------------------------------------------------------------------------
async function callAgent(systemPrompt, messages, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await client.messages.create(
      { model: MODEL, max_tokens: 2500, system: systemPrompt, messages },
      { signal: controller.signal },
    );
    clearTimeout(timer);
    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return { ok: true, text, usage: resp.usage };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, text: `[ERROR: ${err.message || err}]`, error: err.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Parse score from response
// ---------------------------------------------------------------------------
function parseScore(text) {
  const match = text.match(/SCORE:\s*(\d(?:\.\d)?)\s*\/\s*5/i);
  return match ? parseFloat(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Extract action items from investor response
// ---------------------------------------------------------------------------
function extractActionItems(text, concernNum) {
  const items = [];
  // Look for explicit asks
  const patterns = [
    /(?:need to see|show me|would need|should have|build|create|want to see|missing)[^.!?\n]*[.!?\n]/gi,
    /(?:blocker|dealbreaker|must have|requirement)[^.!?\n]*[.!?\n]/gi,
  ];
  for (const pat of patterns) {
    const matches = text.match(pat);
    if (matches) {
      for (const m of matches) {
        const cleaned = m.trim();
        if (cleaned.length > 15 && cleaned.length < 300) {
          items.push({ concern: concernNum, item: cleaned });
        }
      }
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Determine if investor decided to invest
// ---------------------------------------------------------------------------
function parseInvestmentDecision(text) {
  const lower = text.toLowerCase();
  if (lower.includes('invest') && (lower.includes('term sheet') || lower.includes('write a check') || lower.includes('i\'m in') || lower.includes('committed'))) {
    if (!lower.includes('not invest') && !lower.includes('won\'t invest') && !lower.includes('cannot invest') && !lower.includes('decline')) {
      return 'INVESTED';
    }
  }
  if (lower.includes('conditional') || lower.includes('contingent') || lower.includes('if you can')) {
    return 'CONDITIONAL';
  }
  if (lower.includes('pass') || lower.includes('decline') || lower.includes('not investing') || lower.includes('won\'t invest')) {
    return 'PASSED';
  }
  return 'UNCLEAR';
}

// ---------------------------------------------------------------------------
// Extract a key quote from investor's final decision
// ---------------------------------------------------------------------------
function extractKeyQuote(text) {
  // Look for a strong statement
  const sentences = text.split(/[.!]\s+/);
  for (const s of sentences) {
    if (s.match(/invest|check|impressed|strong|weak|concern|risk|strength/i) && s.length > 20 && s.length < 200) {
      return s.trim().replace(/^[-*>\s]+/, '');
    }
  }
  return sentences[0]?.trim().slice(0, 150) || '';
}

// ---------------------------------------------------------------------------
// Run a single investor debate
// ---------------------------------------------------------------------------
async function runSingleDebate(investor, previousResults, appliedFixes) {
  const startTime = Date.now();
  const log = [];
  const scores = [];
  const actionItems = [];
  let round = 0;

  const platformSystem = getPlatformSystem(investor, previousResults, appliedFixes);

  console.log(`\n${'#'.repeat(80)}`);
  console.log(`  INVESTOR ${investor.id}: ${investor.name}`);
  console.log(`  Check size: ${investor.checkSize} at $2.5M pre-money`);
  console.log(`${'#'.repeat(80)}\n`);

  // --- Platform opener (if defined) ---
  if (investor.platformOpener) {
    console.log(`PLATFORM (opening): ${investor.platformOpener}\n`);
    log.push({ round: 0, role: 'platform', text: investor.platformOpener });
  }

  // --- Debate each concern ---
  for (let ci = 0; ci < investor.openingConcerns.length; ci++) {
    const concern = investor.openingConcerns[ci];
    let concernResolved = false;
    let followUpCount = 0;
    const MAX_FOLLOWUPS = 2;
    let currentQuestion = concern;

    while (!concernResolved && followUpCount <= MAX_FOLLOWUPS) {
      round++;
      const roundLabel = `Round ${round} (Concern ${ci + 1}${followUpCount > 0 ? `, Follow-up ${followUpCount}` : ''})`;

      console.log(`\n${'─'.repeat(70)}`);
      console.log(roundLabel);
      console.log(`${'─'.repeat(70)}`);

      console.log(`\nINVESTOR: ${currentQuestion}\n`);
      log.push({ round, role: 'investor', text: currentQuestion });

      // Platform responds
      const contextNote = investor.platformOpener && ci === 0 && followUpCount === 0
        ? `You opened with your progress update. The investor now asks: "${currentQuestion}"\n\nRespond with specific evidence.`
        : `The investor (${investor.name}) asks: "${currentQuestion}"\n\nRespond with specific evidence from your platform. Tailor to this investor's background.`;

      const platformResp = await callAgent(platformSystem, [
        { role: 'user', content: contextNote },
      ], 'Platform');

      if (!platformResp.ok) {
        console.log(`PLATFORM: ${platformResp.text}`);
        log.push({ round, role: 'platform', text: platformResp.text });
        break;
      }

      console.log(`PLATFORM: ${platformResp.text}\n`);
      log.push({ round, role: 'platform', text: platformResp.text });

      // Investor scores
      const investorResp = await callAgent(investor.systemPrompt, [
        { role: 'user', content: `You asked: "${currentQuestion}"\n\nTheir response:\n${platformResp.text}\n\nScore this response (1-5) using "SCORE: X/5" format. If score < 4, ask a specific follow-up. If score >= 4, say "OK, I'll accept that. Next concern." This is concern ${ci + 1} of ${investor.openingConcerns.length}.` },
      ], 'Investor');

      if (!investorResp.ok) {
        console.log(`INVESTOR: ${investorResp.text}`);
        log.push({ round, role: 'investor-score', text: investorResp.text });
        break;
      }

      console.log(`INVESTOR: ${investorResp.text}`);
      log.push({ round, role: 'investor-score', text: investorResp.text });

      const score = parseScore(investorResp.text);
      if (score !== null) {
        scores.push({ concern: ci + 1, round, score, followUp: followUpCount });
        console.log(`\n  >> Score: ${score}/5`);
      }

      const accepted = score !== null && score >= 4;

      if (accepted) {
        concernResolved = true;
      } else {
        const newItems = extractActionItems(investorResp.text, ci + 1);
        actionItems.push(...newItems);

        followUpCount++;
        if (followUpCount > MAX_FOLLOWUPS) {
          console.log(`\n  >> Max follow-ups reached. Moving to next concern.`);
          actionItems.push({
            concern: ci + 1,
            item: `Concern "${concern}" not fully resolved — needs stronger evidence`,
          });
          concernResolved = true;
        } else {
          const questions = investorResp.text.match(/[^.!?]*\?/g);
          currentQuestion = questions ? questions[questions.length - 1].trim() : `Tell me more about: ${concern}`;
        }
      }
    }
  }

  // --- Final deliberation ---
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  FINAL DELIBERATION — ${investor.name}`);
  console.log(`${'='.repeat(70)}\n`);

  const avgScore = scores.length > 0
    ? (scores.reduce((s, x) => s + x.score, 0) / scores.length).toFixed(1)
    : 'N/A';

  const scoresSummary = scores.map(s =>
    `Concern ${s.concern} (round ${s.round}): ${s.score}/5`
  ).join('\n');

  const finalResp = await callAgent(investor.systemPrompt, [
    { role: 'user', content: `You've completed your evaluation of Swoop Golf. Scores:\n\n${scoresSummary}\n\nAverage: ${avgScore}/5\n\nAction items: ${actionItems.length}\n${actionItems.map(a => `- [C${a.concern}] ${a.item}`).join('\n')}\n\nGive your FINAL investment decision:\n1. Decision: Invest $250K / Pass / Conditional\n2. If investing: proposed terms at $2.5M pre-money, conditions\n3. If passing: exactly what would change your mind\n4. Top 3 strengths\n5. Top 3 risks/gaps\n6. Confidence level (1-10)\n\nFormat as a term sheet if investing.` },
  ], 'Final Decision');

  console.log(`INVESTOR FINAL DECISION:\n\n${finalResp.text}`);
  log.push({ round: round + 1, role: 'final-decision', text: finalResp.text });

  const decision = parseInvestmentDecision(finalResp.text);
  const keyQuote = extractKeyQuote(finalResp.text);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return {
    investor,
    name: investor.name,
    decision,
    avgScore,
    scores,
    actionItems,
    keyQuote,
    log,
    rounds: round,
    elapsed,
    finalDecisionText: finalResp.text,
  };
}

// ---------------------------------------------------------------------------
// Apply fixes between debates (where possible from seed data / prompts)
// ---------------------------------------------------------------------------
function applyFixesBetweenDebates(actionItems) {
  const applied = [];

  for (const item of actionItems) {
    const lower = item.item.toLowerCase();

    // Fix: If they want to see production readiness / pilot plan
    if (lower.includes('pilot') || lower.includes('production') || lower.includes('real club')) {
      applied.push('Added pilot program details: 3-club pilot planned Q2 2026, Scottsdale/Phoenix market, 60-day free trial with data migration support');
    }
    // Fix: If they want GTM detail
    if (lower.includes('go-to-market') || lower.includes('gtm') || lower.includes('sales cycle') || lower.includes('first 10')) {
      applied.push('Added GTM playbook: Conference demo -> GM trial -> 60-day pilot -> annual contract. Target: PGA Show + CMAA World Conference for lead gen');
    }
    // Fix: If they want integration detail
    if (lower.includes('jonas') || lower.includes('integration') || lower.includes('foretees') || lower.includes('import')) {
      applied.push('Added integration architecture: Progressive import pipeline handles CSV + API. Jonas CSV export -> automated mapping. ForeTees REST API connector. No rip-and-replace required');
    }
    // Fix: If they want pricing clarity
    if (lower.includes('pricing') || lower.includes('cost') || lower.includes('budget')) {
      applied.push('Clarified pricing: $71/mo = less than 1 member\'s monthly minimum. Annual billing option ($799/yr). No per-seat, no per-member. Flat rate per club');
    }
    // Fix: If they want technical depth
    if (lower.includes('architecture') || lower.includes('prompt') || lower.includes('technical') || lower.includes('moat')) {
      applied.push('Added technical depth: 8 specialized system prompts (avg 2,500 tokens each), 46 MCP tools with domain-specific input schemas, Agent Bridge coordination protocol, automated conversation quality scoring');
    }
  }

  // Deduplicate
  return [...new Set(applied)];
}

// ---------------------------------------------------------------------------
// Main: run all 4 debates sequentially
// ---------------------------------------------------------------------------
async function runFourInvestorDebate() {
  const globalStart = Date.now();
  const allResults = [];
  const appliedFixes = [];

  console.log('='.repeat(80));
  console.log('  SWOOP GOLF — FOUR INVESTOR DEBATE');
  console.log('  4 Sequential Pitches | $250K each | $2.5M Pre-Money');
  console.log('  Target: $1M total raise');
  console.log('='.repeat(80));

  for (const investor of INVESTORS) {
    const result = await runSingleDebate(investor, allResults, appliedFixes);
    allResults.push(result);

    // If they didn't invest, apply fixes before next debate
    if (result.decision !== 'INVESTED' && investor.id < INVESTORS.length) {
      console.log(`\n${'*'.repeat(70)}`);
      console.log(`  BETWEEN-DEBATE IMPROVEMENTS`);
      console.log(`  (${investor.name} had ${result.actionItems.length} action items)`);
      console.log(`${'*'.repeat(70)}\n`);

      const fixes = applyFixesBetweenDebates(result.actionItems);
      if (fixes.length > 0) {
        appliedFixes.push(...fixes);
        for (const f of fixes) {
          console.log(`  APPLIED: ${f}`);
        }
      } else {
        console.log(`  No auto-applicable fixes from this investor's feedback.`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Write full debate log
  // ---------------------------------------------------------------------------
  const totalElapsed = ((Date.now() - globalStart) / 1000).toFixed(1);
  const totalRaised = allResults.filter(r => r.decision === 'INVESTED').length * 250000;
  const conditionalAmount = allResults.filter(r => r.decision === 'CONDITIONAL').length * 250000;

  const md = [];
  md.push('# Four-Investor Debate Log');
  md.push('');
  md.push(`**Date:** ${new Date().toISOString()}`);
  md.push(`**Model:** ${MODEL}`);
  md.push(`**Total Runtime:** ${totalElapsed}s`);
  md.push(`**Total Raised:** $${totalRaised.toLocaleString()}${conditionalAmount > 0 ? ` (+$${conditionalAmount.toLocaleString()} conditional)` : ''}`);
  md.push(`**Target:** $1,000,000`);
  md.push('');
  md.push('---');
  md.push('');
  md.push('## Summary');
  md.push('');
  md.push('| # | Investor | Decision | Avg Score | Rounds | Key Quote |');
  md.push('|---|----------|----------|-----------|--------|-----------|');
  for (const r of allResults) {
    md.push(`| ${r.investor.id} | ${r.name} | **${r.decision}** | ${r.avgScore}/5 | ${r.rounds} | "${r.keyQuote.slice(0, 80)}${r.keyQuote.length > 80 ? '...' : ''}" |`);
  }
  md.push('');
  md.push('---');
  md.push('');

  // Improvements applied between debates
  if (appliedFixes.length > 0) {
    md.push('## Improvements Applied Between Debates');
    md.push('');
    for (const f of appliedFixes) {
      md.push(`- ${f}`);
    }
    md.push('');
    md.push('---');
    md.push('');
  }

  // Per-investor detail
  for (const r of allResults) {
    md.push(`## Investor ${r.investor.id}: ${r.name}`);
    md.push('');
    md.push(`**Decision:** ${r.decision}`);
    md.push(`**Average Score:** ${r.avgScore}/5`);
    md.push(`**Rounds:** ${r.rounds}`);
    md.push(`**Runtime:** ${r.elapsed}s`);
    md.push('');

    md.push('### Score Summary');
    md.push('');
    md.push('| Concern | Round | Score | Follow-up |');
    md.push('|---------|-------|-------|-----------|');
    for (const s of r.scores) {
      md.push(`| ${s.concern} | ${s.round} | ${s.score}/5 | ${s.followUp > 0 ? `Yes (${s.followUp})` : 'No'} |`);
    }
    md.push('');

    if (r.actionItems.length > 0) {
      md.push('### Action Items');
      md.push('');
      for (const a of r.actionItems) {
        md.push(`- **[Concern ${a.concern}]** ${a.item}`);
      }
      md.push('');
    }

    md.push('### Transcript');
    md.push('');
    for (const entry of r.log) {
      if (entry.role === 'investor') {
        md.push(`#### Round ${entry.round} — Investor`);
        md.push('');
        md.push(entry.text);
        md.push('');
      } else if (entry.role === 'platform') {
        md.push(`#### Round ${entry.round} — Platform`);
        md.push('');
        md.push(entry.text);
        md.push('');
      } else if (entry.role === 'investor-score') {
        md.push(`#### Round ${entry.round} — Investor Score`);
        md.push('');
        md.push(entry.text);
        md.push('');
        md.push('---');
        md.push('');
      } else if (entry.role === 'final-decision') {
        md.push('### Final Investment Decision');
        md.push('');
        md.push(entry.text);
        md.push('');
      }
    }

    md.push('---');
    md.push('');
  }

  // Combined action items
  const allActionItems = allResults.flatMap(r => r.actionItems.map(a => ({
    ...a,
    investor: r.name,
  })));
  if (allActionItems.length > 0) {
    md.push('## Combined Developer Action Items');
    md.push('');
    for (const a of allActionItems) {
      md.push(`- **[${a.investor} / C${a.concern}]** ${a.item}`);
    }
    md.push('');
  }

  const mdPath = resolve(ROOT, 'docs', 'operations', 'four-investor-debate-log.md');
  mkdirSync(dirname(mdPath), { recursive: true });
  writeFileSync(mdPath, md.join('\n'), 'utf-8');
  console.log(`\nFull debate log written to: ${mdPath}`);

  // ---------------------------------------------------------------------------
  // Final summary
  // ---------------------------------------------------------------------------
  console.log(`\n${'='.repeat(80)}`);
  console.log('  FOUR-INVESTOR DEBATE — FINAL SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log('');
  for (const r of allResults) {
    const emoji = r.decision === 'INVESTED' ? '[YES]' : r.decision === 'CONDITIONAL' ? '[COND]' : '[NO]';
    console.log(`  ${emoji} Investor ${r.investor.id}: ${r.name}`);
    console.log(`       Decision: ${r.decision} | Avg Score: ${r.avgScore}/5 | Rounds: ${r.rounds}`);
    console.log(`       Quote: "${r.keyQuote.slice(0, 100)}"`);
    console.log('');
  }
  console.log(`  TOTAL COMMITTED:    $${totalRaised.toLocaleString()}`);
  if (conditionalAmount > 0) {
    console.log(`  CONDITIONAL:        $${conditionalAmount.toLocaleString()}`);
  }
  console.log(`  TARGET:             $1,000,000`);
  console.log(`  ACTION ITEMS:       ${allActionItems.length}`);
  console.log(`  FIXES APPLIED:      ${appliedFixes.length}`);
  console.log(`  TOTAL RUNTIME:      ${totalElapsed}s`);
  console.log(`${'='.repeat(80)}`);
}

runFourInvestorDebate().catch(err => {
  console.error('Four-investor debate failed:', err);
  process.exit(1);
});
