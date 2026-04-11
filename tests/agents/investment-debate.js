#!/usr/bin/env node
/**
 * Investment Debate: Skeptical VC vs Swoop Platform
 *
 * Runs negotiation cycles between a skeptical Series A investor and
 * Swoop's CTO/founder. Each concern is debated until scored >= 4 or
 * flagged as a developer action item.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node tests/agents/investment-debate.js
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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

const client = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514';
const TIMEOUT_MS = 90_000;

// ---------------------------------------------------------------------------
// Real platform evidence (from seed data, test results, codebase)
// ---------------------------------------------------------------------------
const PLATFORM_EVIDENCE = `
## Swoop Platform Evidence Package (real data from codebase)

### Architecture
- 8 specialized AI agents: Member Risk Lifecycle, Service Recovery, Morning Game Plan, Staffing Demand, Chief of Staff, F&B/Board Report, Concierge, Agent Bridge
- 46 MCP tools shared across agents via single MCP server
- 118 automated tests (unit + integration + live Claude API tests)
- 10 conference demo scenarios tested and passing
- Live Claude API integration via Anthropic SDK

### Test Results (from agent-conversation-log.md)
- 10-cycle live conversation test: avg scores Natural=3.9, Helpful=4.3, Accurate=4.6, Impact=5.0
- 30 specific improvement items identified and logged per cycle
- All 20 import-path combinations scored 5/5 after seed data audit
- 441 FK alignments verified, zero orphans
- Full progressive import pipeline: 25/25 tests passing

### Financial Data (from boardReport.js + pace.js)
- ROI: 4.2x ($133K protected vs $32K annual subscription)
- 6 named member saves totaling $106,000 in protected dues:
  * James Whitfield: $18,500 (complaint recovery, health 34→71)
  * Catherine Morales: $14,200 (dining recovery)
  * Robert & Linda Chen: $31,000 (family re-engagement)
  * David Harrington: $16,800 (billing dispute)
  * Patricia Nguyen: $12,500 (tee time availability)
  * Michael Torres: $15,000 (guest policy recovery)
- Operational saves: weather advisory ($12,400 protected), Valentine overbook ($12,600 protected)
- Pace of play: 668 slow rounds/month, $5,177/mo F&B revenue leakage from slow pace
- Service quality: 87% (vs 82% industry avg)
- Avg complaint resolution: 4.2 hours (vs 48 hours industry avg)
- Staff utilization: 87% (vs 75% industry avg)
- Members retained: 14 this quarter (vs 8 avg club/quarter)

### Pricing Model
- $71/month per club ($852/year)
- Platform cost: Claude API ~$0.15-0.40 per agent cycle
- 8 agents × ~30 cycles/day = ~240 API calls/day
- Estimated API cost per club: $8-15/month
- Gross margin at scale: ~80-85%

### Market
- 30,000+ private golf clubs in the US
- Average club dues: $8,000-$35,000/member
- Average club has 300-500 members
- Member churn costs 5-10x acquisition cost
- No dominant vertical AI platform for private clubs

### Concierge Agent (live tested)
- Natural language tee time booking, dining reservations, event RSVP
- Member context-aware: knows preferences, household, history
- Proactive: suggests re-engagement for at-risk members
- Cross-agent coordination: booking triggers staffing demand analysis
- Privacy-safe: never reveals health scores or internal analytics to members

### Technical Moat
- Domain-specific prompt engineering across 8 agent archetypes
- Proprietary member health scoring algorithm (multi-signal: golf, dining, email, events, complaints)
- Progressive data import pipeline (works with any club's existing systems)
- Cross-agent orchestration via Agent Bridge (agents share context, not just data)
- 441 validated foreign key relationships in seed data schema
- Seed data audit framework: 5 GM auditor personas, 20 import paths tested
`;

// ---------------------------------------------------------------------------
// Agent prompts
// ---------------------------------------------------------------------------
const INVESTOR_SYSTEM = `You are a skeptical Series A VC partner evaluating a golf club AI platform called Swoop.
You manage a $50M fund focused on vertical SaaS + AI. You've invested in Toast (restaurants),
Mindbody (fitness), and ServiceTitan (home services). You know vertical AI well.

You are HARD but FAIR. You don't invest based on demos — you invest based on:
1. Defensible moat (not just "we use AI")
2. Unit economics that improve with scale
3. Evidence of product-market fit (not just founder enthusiasm)
4. A credible path to $10M ARR within 3 years
5. Technical architecture that doesn't have single points of failure

You start skeptical. You ask follow-up questions. You push back on hand-waving.
When you're satisfied on a concern, you say "OK, I'll accept that. Next concern."
When you're NOT satisfied, you say exactly what evidence would change your mind.
When ALL concerns are addressed, you say "I'm ready to write a check. Here's my term sheet."

IMPORTANT RULES:
- Score each response from 1-5 (1=hand-waving, 5=bulletproof evidence)
- Format your score clearly: "SCORE: X/5"
- If score < 4, ask a specific follow-up or state what evidence would change your mind
- If score >= 4, say "OK, I'll accept that. Next concern." and move to the next concern
- After all 10 concerns are addressed, give your final investment decision
- Be specific in your pushback. Don't just say "I'm not convinced" — say WHY.
- You have $500K to deploy. This is real money.`;

const PLATFORM_SYSTEM = `You are the CTO/founder of Swoop Golf, an AI-powered member retention platform for private golf clubs.
You are presenting to a skeptical Series A VC partner who manages a $50M vertical SaaS + AI fund.

You have built a working platform with real results. You are confident but not arrogant.
You let the data speak. You never hand-wave — every claim is backed by a specific metric,
test result, or architectural decision from your actual platform.

IMPORTANT RULES:
- Always cite specific numbers from the evidence package (member saves, ROI, test scores)
- Reference specific agents by name (Member Risk, Service Recovery, Concierge, etc.)
- When you can demonstrate something live, say so
- When something isn't built yet, be honest — say "that's on the roadmap" and explain why
- Never inflate numbers or make unsupported claims
- Be concise. VCs hate long pitches. Lead with the strongest evidence.
- If the investor asks about something you don't have evidence for, acknowledge the gap
  and explain what you'd need to build

You have access to the following real platform evidence:
${PLATFORM_EVIDENCE}`;

// ---------------------------------------------------------------------------
// Investor's 10 concerns
// ---------------------------------------------------------------------------
const CONCERNS = [
  "What's the moat? Any dev shop could build a dashboard with Claude.",
  "Show me the unit economics. $71/month sounds too cheap — where's the margin?",
  "How do you handle a club with 2,000 members, not 300? Does it scale?",
  "What happens when Claude hallucinates a booking that doesn't exist?",
  "Who's your competition and why would they not just copy this?",
  "Show me real retention data. One pilot club isn't proof.",
  "What's the go-to-market? You can't sell to 30,000 clubs one at a time.",
  "What if Anthropic raises prices 10x? Your entire margin evaporates.",
  "The concierge is cool but clubs are conservative. Will members actually text an AI?",
  "Give me three reasons this is a $100M company, not a $5M lifestyle business.",
];

// ---------------------------------------------------------------------------
// API call helper
// ---------------------------------------------------------------------------
async function callAgent(systemPrompt, messages, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await client.messages.create(
      { model: MODEL, max_tokens: 2000, system: systemPrompt, messages },
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
// Parse investor score from response
// ---------------------------------------------------------------------------
function parseScore(text) {
  const match = text.match(/SCORE:\s*(\d(?:\.\d)?)\s*\/\s*5/i);
  return match ? parseFloat(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Main debate loop
// ---------------------------------------------------------------------------
async function runDebate() {
  const startTime = Date.now();
  const log = [];
  const scores = [];
  const actionItems = [];
  let round = 0;

  console.log('='.repeat(80));
  console.log('  SWOOP GOLF — INVESTMENT DEBATE');
  console.log('  Skeptical VC vs Platform CTO/Founder');
  console.log('='.repeat(80));
  console.log();

  for (let ci = 0; ci < CONCERNS.length; ci++) {
    const concern = CONCERNS[ci];
    let concernResolved = false;
    let followUpCount = 0;
    const MAX_FOLLOWUPS = 2; // max follow-ups per concern before moving on

    // Initial investor question
    let investorQuestion = concern;

    while (!concernResolved && followUpCount <= MAX_FOLLOWUPS) {
      round++;
      const roundLabel = `Round ${round} (Concern ${ci + 1}${followUpCount > 0 ? `, Follow-up ${followUpCount}` : ''})`;

      console.log(`\n${'─'.repeat(70)}`);
      console.log(`${roundLabel}`);
      console.log(`${'─'.repeat(70)}`);

      // --- INVESTOR poses question ---
      let investorText;
      if (followUpCount === 0) {
        // First time: use the preset concern
        investorText = investorQuestion;
      } else {
        // Follow-up: investor already responded, investorText is set below
        investorText = investorQuestion;
      }

      console.log(`\nINVESTOR: ${investorText}\n`);
      log.push({ round, role: 'investor', text: investorText });

      // --- PLATFORM responds ---
      const platformMessages = [
        { role: 'user', content: `The investor says: "${investorText}"\n\nRespond with specific evidence from your platform. Be concise and data-driven.` },
      ];
      const platformResp = await callAgent(PLATFORM_SYSTEM, platformMessages, 'Platform');

      if (!platformResp.ok) {
        console.log(`PLATFORM: ${platformResp.text}`);
        log.push({ round, role: 'platform', text: platformResp.text });
        break;
      }

      console.log(`PLATFORM: ${platformResp.text}\n`);
      log.push({ round, role: 'platform', text: platformResp.text });

      // --- INVESTOR scores the response ---
      const investorMessages = [
        { role: 'user', content: `You asked the Swoop founder: "${investorText}"\n\nTheir response:\n${platformResp.text}\n\nScore this response (1-5) using "SCORE: X/5" format. If score < 4, ask a specific follow-up question or state what evidence would change your mind. If score >= 4, say "OK, I'll accept that. Next concern." If this is concern ${ci + 1} of 10 and you have remaining concerns, move to the next one when satisfied.` },
      ];
      const investorResp = await callAgent(INVESTOR_SYSTEM, investorMessages, 'Investor');

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

      // Check if investor accepted or wants follow-up
      const accepted = score !== null && score >= 4;
      const hasFollowUp = investorResp.text.toLowerCase().includes('follow-up') ||
                          investorResp.text.includes('?') && !accepted;

      if (accepted) {
        concernResolved = true;
      } else {
        // Check for developer action items (things to build)
        if (investorResp.text.match(/build|create|need to see|show me|would need|should have/i)) {
          const actionMatch = investorResp.text.match(/(?:build|create|need to see|show me|would need|should have)[^.!?]*[.!?]/gi);
          if (actionMatch) {
            for (const item of actionMatch) {
              actionItems.push({ concern: ci + 1, item: item.trim(), round });
            }
          }
        }

        followUpCount++;
        if (followUpCount > MAX_FOLLOWUPS) {
          console.log(`\n  >> Max follow-ups reached. Moving to next concern.`);
          // Log as conditional accept
          actionItems.push({
            concern: ci + 1,
            item: `Concern ${ci + 1} not fully resolved: "${concern}" — needs stronger evidence`,
            round,
          });
          concernResolved = true;
        } else {
          // Extract the follow-up question for next iteration
          const questions = investorResp.text.match(/[^.!?]*\?/g);
          investorQuestion = questions ? questions[questions.length - 1].trim() : `Tell me more about: ${concern}`;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Final investment decision
  // ---------------------------------------------------------------------------
  console.log(`\n${'='.repeat(80)}`);
  console.log('  FINAL DELIBERATION');
  console.log(`${'='.repeat(80)}\n`);

  const avgScore = scores.length > 0
    ? (scores.reduce((s, x) => s + x.score, 0) / scores.length).toFixed(1)
    : 'N/A';

  const scoresSummary = scores.map(s =>
    `Concern ${s.concern} (round ${s.round}): ${s.score}/5`
  ).join('\n');

  const finalMessages = [
    { role: 'user', content: `You've completed your evaluation of Swoop Golf's AI platform. Here are the scores you gave across all rounds:

${scoresSummary}

Average score: ${avgScore}/5

Developer action items identified: ${actionItems.length}
${actionItems.map(a => `- [Concern ${a.concern}] ${a.item}`).join('\n')}

Now give your FINAL investment decision:
1. Decision: Invest / Pass / Conditional
2. If investing: proposed valuation, check size ($500K available), key conditions
3. If conditional: what must be true before you write the check
4. Top 3 strengths of the platform
5. Top 3 risks
6. Your overall confidence level (1-10)

Format as a term sheet if investing. Be specific.` },
  ];

  const finalResp = await callAgent(INVESTOR_SYSTEM, finalMessages, 'Final Decision');
  console.log(`INVESTOR FINAL DECISION:\n\n${finalResp.text}`);
  log.push({ round: round + 1, role: 'final-decision', text: finalResp.text });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // ---------------------------------------------------------------------------
  // Write debate log to markdown
  // ---------------------------------------------------------------------------
  const mdLines = [
    '# Investment Debate Log',
    '',
    `**Date:** ${new Date().toISOString()}`,
    `**Model:** ${MODEL}`,
    `**Runtime:** ${elapsed}s`,
    `**Rounds:** ${round}`,
    `**Average Score:** ${avgScore}/5`,
    '',
    '---',
    '',
    '## Score Summary',
    '',
    '| Concern | Round | Score | Follow-up |',
    '|---------|-------|-------|-----------|',
    ...scores.map(s => `| ${s.concern} | ${s.round} | ${s.score}/5 | ${s.followUp > 0 ? `Yes (${s.followUp})` : 'No'} |`),
    '',
    '---',
    '',
    '## Developer Action Items',
    '',
    ...actionItems.map(a => `- **[Concern ${a.concern}]** ${a.item}`),
    '',
    '---',
    '',
    '## Full Debate Transcript',
    '',
  ];

  for (const entry of log) {
    if (entry.role === 'investor') {
      mdLines.push(`### Round ${entry.round} — Investor`);
      mdLines.push('');
      mdLines.push(entry.text);
      mdLines.push('');
    } else if (entry.role === 'platform') {
      mdLines.push(`### Round ${entry.round} — Platform`);
      mdLines.push('');
      mdLines.push(entry.text);
      mdLines.push('');
    } else if (entry.role === 'investor-score') {
      mdLines.push(`### Round ${entry.round} — Investor Score`);
      mdLines.push('');
      mdLines.push(entry.text);
      mdLines.push('');
      mdLines.push('---');
      mdLines.push('');
    } else if (entry.role === 'final-decision') {
      mdLines.push('## Final Investment Decision');
      mdLines.push('');
      mdLines.push(entry.text);
      mdLines.push('');
    }
  }

  const mdPath = resolve(ROOT, 'docs', 'operations', 'investment-debate-log.md');
  writeFileSync(mdPath, mdLines.join('\n'), 'utf-8');
  console.log(`\nDebate log written to: ${mdPath}`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n${'='.repeat(80)}`);
  console.log('  DEBATE SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Rounds: ${round}`);
  console.log(`Average Score: ${avgScore}/5`);
  console.log(`Scores: ${scores.map(s => `C${s.concern}=${s.score}`).join(', ')}`);
  console.log(`Action Items: ${actionItems.length}`);
  actionItems.forEach(a => console.log(`  - [C${a.concern}] ${a.item}`));
  console.log(`Runtime: ${elapsed}s`);
  console.log(`${'='.repeat(80)}`);
}

runDebate().catch(err => {
  console.error('Debate failed:', err);
  process.exit(1);
});
