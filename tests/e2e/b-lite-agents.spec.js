/**
 * B-lite Agents — GM-persona deep test of the orchestration agents.
 *
 * Restores the `stage-dining` save point (members + tee sheet + dining
 * all loaded) and exercises every agent trigger endpoint as a real GM
 * would. Captures findings into qa-outputs/agent-deep-test-<date>.md.
 *
 * Run (requires stage-dining save point + ~/.swoop-savepoints/stage_dining.json):
 *   APP_URL=http://localhost:3001 npx playwright test tests/e2e/b-lite-agents.spec.js --project="Desktop Chrome" --reporter=list
 *
 * If the save point doesn't exist yet, run tests/e2e/b-lite-journey.spec.js
 * first with no STAGE env var — it auto-snapshots at each stage.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const REPO = path.resolve(__dirname, '../..');
const SHOT_DIR = path.resolve(REPO, 'tmp', 'agent-screenshots');
const FINDINGS_PATH = path.join(homedir(), 'qa-outputs', `agent-deep-test-${new Date().toISOString().slice(0, 10)}.md`);
mkdirSync(path.dirname(FINDINGS_PATH), { recursive: true });

const SAVEPOINT_NAME = 'stage-dining';

function loadSession() {
  const p = path.join(homedir(), '.swoop-savepoints', 'stage_dining.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function restoreSavepoint(name, clubId) {
  execSync(`node scripts/db-savepoint.mjs restore ${name} ${clubId}`, {
    cwd: REPO,
    stdio: 'inherit',
    timeout: 60000,
  });
}

// Findings accumulator. Each finding is one markdown section.
const findings = [];
function finding(section, { agent, endpoint, severity, expected, actual, fix }) {
  findings.push({ section, agent, endpoint, severity, expected, actual, fix, time: new Date().toISOString() });
}

function flushFindings() {
  const header = `# AI Agent Deep Test — ${new Date().toISOString()}\n\n`;
  const body = findings.map(f => {
    return [
      `## ${f.section}`,
      `- **Agent:** ${f.agent || '—'}`,
      `- **Endpoint:** \`${f.endpoint || '—'}\``,
      `- **Severity:** ${f.severity}`,
      `- **Expected:** ${f.expected}`,
      `- **Actual:** ${f.actual}`,
      `- **Fix class:** ${f.fix}`,
      `- **Captured:** ${f.time}`,
      '',
    ].join('\n');
  }).join('\n');
  writeFileSync(FINDINGS_PATH, header + (findings.length ? body : '_No findings — everything passed clean._\n'));
  console.log(`\n[findings] wrote ${findings.length} items → ${FINDINGS_PATH}`);
}

test.describe('B-lite Agents — GM persona deep test', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(300000);

  let page;
  let session;
  let aRiskMemberId;
  let pendingActionIds = [];

  test.beforeAll(async ({ browser }) => {
    session = loadSession();
    if (!session) {
      throw new Error(
        `No stage_dining save point found at ~/.swoop-savepoints/stage_dining.json. ` +
        `Run b-lite-journey.spec.js first to generate it.`
      );
    }
    console.log(`[agent-test] restoring "${SAVEPOINT_NAME}" for club ${session.clubId}`);
    restoreSavepoint(SAVEPOINT_NAME, session.clubId);

    const ctx = await browser.newContext();
    await ctx.addInitScript(({ token, user, clubId, clubName }) => {
      localStorage.setItem('swoop_auth_token', token);
      localStorage.setItem('swoop_auth_user', JSON.stringify(user));
      localStorage.setItem('swoop_club_id', clubId);
      localStorage.setItem('swoop_club_name', clubName);
    }, {
      token: session.token,
      user: {
        userId: session.userId,
        clubId: session.clubId,
        name: session.userName,
        email: session.userEmail,
        role: session.role || 'gm',
        title: 'General Manager',
        clubName: session.clubName,
      },
      clubId: session.clubId,
      clubName: session.clubName,
    });
    page = await ctx.newPage();
  });

  test.afterAll(async () => {
    flushFindings();
  });

  const shot = async (name) => {
    mkdirSync(SHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
  };

  // ── 1. Pick a real at-risk member to use across tests ────────────────────
  test('1 — Pick a real at-risk member from imported roster', async () => {
    await page.goto(`${APP_URL}/#/members`);
    await page.waitForFunction(
      () => /All Members|At-Risk|Archetype/i.test(document.body.innerText)
        && !/^\s*Loading\.\.\.\s*$/m.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(1500);

    // Query the DB directly for a member with low health score or age signal
    const res = await page.request.post(`${APP_URL}/api/members?clubId=${session.clubId}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    }).catch(() => null);

    if (!res || !res.ok()) {
      finding('Cannot fetch member roster for agent triggers', {
        severity: 'blocking',
        expected: '/api/members returns roster with real imported members',
        actual: `${res?.status() || 'no response'}`,
        endpoint: '/api/members',
        fix: 'api handler / auth',
      });
      test.skip(true, 'members API broken — cannot proceed with agent tests');
      return;
    }

    const data = await res.json().catch(() => ({}));
    const roster = data.memberRoster || [];
    if (roster.length === 0) {
      finding('Empty member roster after stage-dining restore', {
        severity: 'blocking',
        expected: '100 members imported and visible via /api/members',
        actual: '0 members in roster',
        endpoint: '/api/members',
        fix: 'save-point restore / data provider',
      });
      test.skip(true, 'no members — cannot proceed');
      return;
    }

    // Pick the first member (any member works for a trigger test)
    aRiskMemberId = roster[0].memberId;
    console.log(`[agent-test] using member ${aRiskMemberId} for triggers`);
    expect.soft(aRiskMemberId, 'picked a real member id').toBeTruthy();
  });

  // ── 2. Fire every agent trigger endpoint ─────────────────────────────────
  // Realistic payloads matching each handler's required fields, as a GM
  // would POST them if they triggered manually from the Inbox UI.
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7);
  const TRIGGERS = [
    { name: 'Member Pulse — risk-trigger', endpoint: '/api/agents/risk-trigger', body: () => ({ member_id: aRiskMemberId, club_id: session.clubId }) },
    { name: 'Service Recovery — complaint-trigger', endpoint: '/api/agents/complaint-trigger', body: () => ({ member_id: aRiskMemberId, club_id: session.clubId, priority: 'high', complaint_id: 'test_complaint', category: 'service' }) },
    { name: 'F&B — fb-trigger', endpoint: '/api/agents/fb-trigger', body: () => ({ club_id: session.clubId, target_date: today }) },
    { name: 'Chief of Staff — cos-trigger', endpoint: '/api/agents/cos-trigger', body: () => ({ club_id: session.clubId }) },
    { name: 'Gameplan — gameplan-trigger', endpoint: '/api/agents/gameplan-trigger', body: () => ({ club_id: session.clubId, plan_date: today }) },
    { name: 'Labor Optimizer — staffing-trigger', endpoint: '/api/agents/staffing-trigger', body: () => ({ club_id: session.clubId, target_date: today }) },
    { name: 'Arrival — arrival-trigger', endpoint: '/api/agents/arrival-trigger', body: () => ({ member_id: aRiskMemberId, club_id: session.clubId, tee_time: '09:00' }) },
    { name: 'Service Save — service-save-trigger', endpoint: '/api/agents/service-save-trigger', body: () => ({ complaint_id: 'test_complaint', member_id: aRiskMemberId, club_id: session.clubId }) },
    { name: 'Board Report — board-report-trigger', endpoint: '/api/agents/board-report-trigger', body: () => ({ club_id: session.clubId, month }) },
  ];

  for (const trigger of TRIGGERS) {
    test(`2 — Fire ${trigger.name}`, async () => {
      if (!aRiskMemberId && trigger.body().member_id) {
        test.skip(true, 'no member id available');
        return;
      }

      const res = await page.request.post(`${APP_URL}${trigger.endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        data: trigger.body(),
        timeout: 30000,
      }).catch(err => ({ ok: () => false, status: () => 0, text: async () => err.message }));

      const status = res.status?.() ?? 0;
      const bodyText = await (res.text?.() || Promise.resolve('(no body)'));
      let bodyJson = null;
      try { bodyJson = JSON.parse(bodyText); } catch { /* not JSON */ }

      console.log(`[trigger] ${trigger.endpoint} → ${status}`);

      if (status >= 500 || status === 0) {
        finding(`${trigger.name} crashes`, {
          agent: trigger.name,
          endpoint: trigger.endpoint,
          severity: 'blocking',
          expected: '200 with {triggered: true|false, ...} shape',
          actual: `${status} — ${bodyText.slice(0, 200)}`,
          fix: 'server handler',
        });
        return;
      }

      if (status === 404) {
        finding(`${trigger.name} not reachable`, {
          agent: trigger.name,
          endpoint: trigger.endpoint,
          severity: 'blocking',
          expected: 'endpoint exists and accepts POST',
          actual: `404 Not Found`,
          fix: 'routing / vercel.json / .vercelignore',
        });
        return;
      }

      if (status === 401 || status === 403) {
        finding(`${trigger.name} auth rejected`, {
          agent: trigger.name,
          endpoint: trigger.endpoint,
          severity: 'blocking',
          expected: 'accepts real session Bearer token from stage-dining',
          actual: `${status} — ${bodyText.slice(0, 200)}`,
          fix: 'withAuth / session validation',
        });
        return;
      }

      if (bodyJson && bodyJson.triggered === false) {
        // Not a bug per se — the trigger chose not to fire. Document the reason.
        finding(`${trigger.name} did NOT fire (not a bug, just flagged)`, {
          agent: trigger.name,
          endpoint: trigger.endpoint,
          severity: 'cosmetic',
          expected: 'evaluate criteria and either fire or explain why not',
          actual: `triggered=false, reason="${bodyJson.reason || 'none'}"`,
          fix: 'possibly agent criteria are too strict for fresh clubs',
        });
        return;
      }

      if (bodyJson && bodyJson.triggered === true) {
        console.log(`  ✓ triggered: ${bodyJson.action_id || bodyJson.session_id || '(no id)'}`);
        if (bodyJson.action_id) pendingActionIds.push(bodyJson.action_id);
        return;
      }

      // Unknown shape — log as finding
      finding(`${trigger.name} response shape unexpected`, {
        agent: trigger.name,
        endpoint: trigger.endpoint,
        severity: 'weakens product',
        expected: '{triggered: true|false, action_id?, ...}',
        actual: `${status}: ${bodyText.slice(0, 200)}`,
        fix: 'handler response contract',
      });
    });
  }

  // ── 3. Verify agent_actions has rows for this club ───────────────────────
  test('3 — agent_actions table has pending rows for this club', async () => {
    // Use the /api/agents endpoint which returns agents+actions for the session's club
    const res = await page.request.get(`${APP_URL}/api/agents`, {
      headers: { Authorization: `Bearer ${session.token}` },
    }).catch(() => null);

    if (!res || !res.ok()) {
      finding('Cannot fetch /api/agents after triggering', {
        severity: 'blocking',
        expected: 'GET /api/agents returns {agents, actions} for this club',
        actual: `${res?.status() || 'no response'}`,
        endpoint: '/api/agents',
        fix: 'handler / auth',
      });
      return;
    }
    const data = await res.json().catch(() => ({}));
    const agentCount = Array.isArray(data.agents) ? data.agents.length : 0;
    const actionCount = Array.isArray(data.actions) ? data.actions.length : 0;
    console.log(`[agents] ${agentCount} agents, ${actionCount} actions`);

    if (agentCount === 0) {
      finding('Zero agents registered after restore', {
        severity: 'blocking',
        expected: '6 agents (Member Pulse, Demand Optimizer, Service Recovery, Revenue Analyst, Engagement Autopilot, Labor Optimizer)',
        actual: '0 agents',
        endpoint: '/api/agents',
        fix: 'onboard-club agent seeding / save-point restore of agent_definitions',
      });
    }

    if (actionCount === 0) {
      finding('Zero pending actions despite firing all triggers', {
        severity: 'blocking',
        expected: 'At least one pending action per fired trigger (2-8 actions total)',
        actual: '0 pending actions',
        endpoint: '/api/agents',
        fix: 'trigger handlers either skipped all eligibility checks or failed to insert into agent_actions. Need per-trigger investigation.',
      });
    }
  });

  // ── 4. GM walkthrough: Today view should surface real agent recs ─────────
  test('4 — Today view surfaces agent recommendations with real member context', async () => {
    await page.goto(`${APP_URL}/#/today`);
    await page.waitForFunction(
      () => /briefing|alert|priority|member|risk/i.test(document.body.innerText)
        && !/^\s*Loading\.\.\.\s*$/m.test(document.body.innerText),
      null,
      { timeout: 20000 },
    ).catch(() => {});
    await page.waitForTimeout(2000);
    await shot('today-with-agents.png');

    const bodyText = (await page.locator('body').textContent()) || '';
    const hasRealData = bodyText.includes(session.clubName);
    expect.soft(hasRealData, 'club name should appear (tenant isolation)').toBe(true);

    // Heuristic check: real agent recs should reference a specific member,
    // a specific action, and a "because" — not generic DEMO strings.
    const hasActionableRec = /approve|call|schedule|reach out|follow up|send email/i.test(bodyText);
    if (!hasActionableRec) {
      finding('Today view has no actionable recommendation surface', {
        severity: 'weakens product',
        expected: 'Today view shows at least one "Approve and X" button for a real member',
        actual: 'No actionable-rec language found in body text',
        fix: 'MemberAlerts / action queue wiring, or agents not producing visible output',
      });
    }

    // Check for demo leaks
    if (/Oakmont|Pinetree|James Whitfield|Kevin Hurst/i.test(bodyText)) {
      finding('Demo-data leak on Today view for real club', {
        severity: 'blocking',
        expected: 'Only members from stage-dining CSV should appear',
        actual: `Demo names detected in body: ${bodyText.match(/Oakmont|Pinetree|James Whitfield|Kevin Hurst/gi)?.join(', ')}`,
        fix: 'find the component still reading from src/data/members.js',
      });
    }
  });

  // ── 5. GM walkthrough: Actions / Inbox page ──────────────────────────────
  test('5 — Actions page / Inbox shows pending agent actions', async () => {
    // Try both /automations and /actions routes
    for (const route of ['#/automations', '#/actions']) {
      await page.goto(`${APP_URL}/${route}`);
      await page.waitForTimeout(2500);
      const body = (await page.locator('body').textContent()) || '';
      if (/pending|inbox|action|approve/i.test(body) && !/^\s*Loading\.\.\.\s*$/m.test(body)) {
        await shot(`actions-${route.replace(/[#/]/g, '')}.png`);
        return;
      }
    }

    finding('No reachable Actions/Inbox surface', {
      severity: 'weakens product',
      expected: 'A dedicated screen for the GM to see and approve pending agent actions',
      actual: 'Neither /automations nor /actions renders an Inbox-like view',
      fix: 'route wiring / feature availability',
    });
  });

  // ── 6. Concierge chat — GM asks realistic questions ──────────────────────
  test('6 — Concierge chat responds with real member context', async () => {
    // Hit the concierge API directly (UI path may not exist in this build)
    const questions = [
      'What should I worry about today?',
      'Which members are at highest risk?',
      'Where are we losing revenue?',
    ];

    for (const q of questions) {
      const res = await page.request.post(`${APP_URL}/api/concierge/chat`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        data: { message: q, club_id: session.clubId },
        timeout: 60000,
      }).catch(err => ({ ok: () => false, status: () => 0, text: async () => err.message }));

      const status = res.status?.() ?? 0;
      if (status === 404) {
        finding('/api/concierge/chat not reachable', {
          agent: 'Concierge',
          endpoint: '/api/concierge/chat',
          severity: 'weakens product',
          expected: 'GM can ask natural questions of the concierge',
          actual: '404 — endpoint missing (excluded from .vercelignore?)',
          fix: 'remove api/concierge from .vercelignore if present, or wire a different concierge path',
        });
        return;
      }
      if (status >= 500 || status === 0) {
        const bodyText = await (res.text?.() || Promise.resolve(''));
        finding('Concierge chat crashes', {
          agent: 'Concierge',
          endpoint: '/api/concierge/chat',
          severity: 'blocking',
          expected: '200 with natural-language answer referencing real members',
          actual: `${status}: ${bodyText.slice(0, 200)}`,
          fix: 'server handler',
        });
        return;
      }

      const body = await res.json().catch(() => ({}));
      const answer = body.response || body.answer || body.message || '';
      console.log(`[concierge] Q: ${q}\n  A: ${answer.slice(0, 200)}`);
      if (!answer || answer.length < 30) {
        finding(`Concierge gave an empty/short answer`, {
          agent: 'Concierge',
          endpoint: '/api/concierge/chat',
          severity: 'weakens product',
          expected: 'a multi-sentence answer referencing imported members',
          actual: `"${answer}"`,
          fix: 'prompt or tool wiring',
        });
      }
    }
  });
});
