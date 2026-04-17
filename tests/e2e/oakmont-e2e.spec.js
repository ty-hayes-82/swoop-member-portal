/**
 * oakmont-e2e.spec.js
 *
 * Full interactive E2E test suite for Oakmont Country Club (Los Angeles, CA).
 * Credentials are hardcoded — no setup script needed.
 *
 * Run:
 *   APP_URL=https://swoop-member-portal-dev.vercel.app npx playwright test tests/e2e/oakmont-e2e.spec.js --reporter=html
 */
import { test, expect, request as pwRequest } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = process.env.APP_URL || 'https://swoop-member-portal-dev.vercel.app';
const RUN_DATE = new Date().toISOString().slice(0, 10);
const SCREENSHOT_DIR = path.join(__dirname, `screenshots/oakmont-${RUN_DATE}`);

if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Hardcoded Oakmont credentials (GM account seeded with password "demo")
const CLUB_ID = 'oakmont_cc';
const EMAIL    = 'catherine.hayward@oakmont-cc.com';
const PASSWORD = 'demo';

// ─── Issue log ────────────────────────────────────────────────────────────────

const issues = [];
let issueCounter = 0;

function addIssue({ severity = 'medium', suite, description, screenshot = null, expected, actual }) {
  issueCounter++;
  const id = `OAK-${String(issueCounter).padStart(3, '0')}`;
  issues.push({ id, severity, suite, description, screenshot, expected, actual });
  console.warn(`[${id}] ${severity.toUpperCase()} — ${description}`);
}

async function shot(page, name) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  try { await page.screenshot({ path: file, fullPage: true }); return file; }
  catch { return null; }
}

function writeReport() {
  const report = {
    run_date: RUN_DATE, club_id: CLUB_ID, issues,
    summary: {
      total_issues: issues.length,
      high:   issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low:    issues.filter(i => i.severity === 'low').length,
    },
  };
  const reportPath = path.join(__dirname, 'reports/oakmont-report.json');
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n[report] ${reportPath}`);
  console.log(`[report] ${report.summary.total_issues} issues (${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low)`);
  return report;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function postJson(ctx, url, body, headers = {}) {
  const res = await ctx.post(url, {
    data: body,
    headers: { 'Content-Type': 'application/json', ...headers },
    failOnStatusCode: false,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status(), json, text };
}

async function patchJson(ctx, url, body, headers = {}) {
  const res = await ctx.patch(url, {
    data: body,
    headers: { 'Content-Type': 'application/json', ...headers },
    failOnStatusCode: false,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status(), json, text };
}

async function getJson(ctx, url, headers = {}) {
  const res = await ctx.get(url, { headers, failOnStatusCode: false });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status(), json, text };
}

async function injectAuth(page, token, user, clubId) {
  await page.addInitScript(({ token, user, clubId }) => {
    localStorage.setItem('swoop_auth_token', token);
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_club_id', clubId);
    localStorage.removeItem('swoop_gates');
  }, { token, user, clubId });
  try {
    await page.evaluate(({ token, user, clubId }) => {
      localStorage.setItem('swoop_auth_token', token);
      localStorage.setItem('swoop_auth_user', JSON.stringify(user));
      localStorage.setItem('swoop_club_id', clubId);
    }, { token, user, clubId });
  } catch {}
}

async function poll(fn, { timeout = 30000, interval = 2000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  return null;
}

// ─── Shared state ─────────────────────────────────────────────────────────────

let ctx;
let auth;        // { token, user }
let authHeaders;
let apiReachable = false;

// ═══════════════════════════════════════════════════════════════════════════
test.describe('Oakmont Country Club E2E', () => {
  test.describe.configure({ mode: 'serial' });

// ═══════════════════════════════════════════════════════════════════════════
// Suite 1 — Bootstrap
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 1 — Bootstrap', () => {
  test.beforeAll(async () => {
    ctx = await pwRequest.newContext({ baseURL: APP_URL });
    let probe;
    try { probe = await getJson(ctx, '/api/auth'); }
    catch (err) { probe = { status: 0, json: null }; }
    apiReachable = probe.status === 401 && probe.json && typeof probe.json.error === 'string';
    if (!apiReachable) {
      console.warn(`[oakmont] APP_URL=${APP_URL} does not serve /api/* — set APP_URL to a Vercel preview URL`);
    }
  });

  test('1.1 — API is reachable', async () => {
    test.skip(!apiReachable, 'APP_URL does not serve /api/*');
    expect(apiReachable).toBe(true);
  });

  test('1.2 — Login as Oakmont GM and get fresh token', async () => {
    test.skip(!apiReachable, 'API not reachable');

    const r = await postJson(ctx, '/api/auth', { email: EMAIL, password: PASSWORD });
    if (r.status !== 200 || !r.json?.token) {
      throw new Error(`Login failed (${r.status}): ${r.text?.slice(0, 200)}`);
    }
    auth = { token: r.json.token, user: r.json.user };
    authHeaders = { Authorization: `Bearer ${auth.token}` };

    console.log(`[bootstrap] club: ${CLUB_ID}, user: ${auth.user?.email}`);
    expect(auth.token).toBeTruthy();
    // club_id may not be returned in the user payload; token is sufficient
    console.log(`[bootstrap] user fields: ${Object.keys(auth.user ?? {}).join(', ')}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 2 — Gate Check & Data Validation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 2 — Full Gate Check', () => {
  test('2.1 — All data gates are open', async () => {
    test.skip(!apiReachable || !auth, 'Skipping');

    const r = await getJson(ctx, '/api/gates', authHeaders);
    expect(r.status).toBe(200);

    const gates = r.json ?? {};
    console.log('[gates]', JSON.stringify(gates));

    for (const gate of ['members', 'tee-sheet', 'fb']) {
      if (!gates[gate]) {
        addIssue({
          severity: 'high', suite: 'Suite 2',
          description: `Gate "${gate}" is not open after Oakmont seed`,
          expected: 'true', actual: String(gates[gate]),
        });
      }
    }
    expect(gates.members).toBe(true);
  });

  test('2.2 — Member roster has at least 100 members', async () => {
    test.skip(!apiReachable || !auth, 'Skipping');

    const r = await getJson(ctx, '/api/members', authHeaders);
    const count = r.json?.memberRoster?.length ?? r.json?.members?.length ?? r.json?.total ?? 0;
    console.log(`[members] count=${count}`);
    if (count < 100) {
      addIssue({ severity: 'high', suite: 'Suite 2', description: `Only ${count} members (expected 100+)`, expected: '100+', actual: String(count) });
    }
    expect(count).toBeGreaterThan(0);
  });

  test('2.3 — Club capabilities endpoint returns all capabilities', async () => {
    test.skip(!apiReachable || !auth, 'Skipping');

    const r = await getJson(ctx, '/api/club/capabilities', authHeaders);
    expect(r.status).toBe(200);

    const caps = r.json?.capabilities ?? [];
    console.log(`[capabilities] ${caps.length} capabilities`);

    const expected = ['tee_time_booking', 'dining_reservations', 'event_rsvp', 'membership_services', 'service_recovery', 'pro_shop_operations', 'financial_services'];
    for (const cap of expected) {
      const found = caps.find(c => c.capability === cap);
      if (!found) {
        addIssue({ severity: 'medium', suite: 'Suite 2', description: `Capability "${cap}" missing from /api/club/capabilities`, expected: 'present', actual: 'missing' });
      } else {
        console.log(`  ${cap}: enabled=${found.enabled}`);
      }
    }
    expect(caps.length).toBeGreaterThan(0);
  });

  test('2.4 — Members page shows health tier labels', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/members`);
    await page.waitForTimeout(4000);

    const s = await shot(page, '2-4-members');
    const text = await page.evaluate(() => document.body.innerText);
    const hasHealthData = /HEALTHY|AT RISK|WATCH|CRITICAL|Health Score|health/i.test(text);
    if (!hasHealthData) {
      addIssue({ severity: 'medium', suite: 'Suite 2', description: 'Members page has no health tier data', screenshot: s, expected: 'Health tiers visible', actual: text.slice(0, 300) });
    }
  });

  test('2.5 — Today view is populated', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/today`);
    await page.waitForTimeout(4000);

    const s = await shot(page, '2-5-today');
    const text = await page.evaluate(() => document.body.innerText);
    if (text.length < 500) {
      addIssue({ severity: 'medium', suite: 'Suite 2', description: 'Today view appears empty', screenshot: s, expected: '> 500 chars', actual: `${text.length} chars` });
    }
  });

  test('2.6 — Revenue page shows F&B data', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/revenue`);
    await page.waitForTimeout(4000);

    const s = await shot(page, '2-6-revenue');
    const text = await page.evaluate(() => document.body.innerText);
    const isGated = /connect your|no data imported|not yet available/i.test(text);
    if (isGated) {
      addIssue({ severity: 'medium', suite: 'Suite 2', description: 'Revenue page still gated after POS import', screenshot: s, expected: 'Revenue data visible', actual: text.slice(0, 200) });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 3 — Agent Inbox Populated
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 3 — Agent Inbox', () => {
  test('3.1 — Agent sweep produces pending actions', async () => {
    test.skip(!apiReachable || !auth, 'Skipping');

    let r = await getJson(ctx, `/api/agents?club_id=${CLUB_ID}`, authHeaders);
    let pending = (r.json?.actions || []).filter(a => a.status === 'pending');
    console.log(`[agents] ${pending.length} pending actions on first check`);

    if (pending.length === 0) {
      console.log('[agents] Inbox empty — re-triggering sweep...');
      await postJson(ctx, `/api/agent-autonomous?clubId=${CLUB_ID}`, {}, authHeaders);

      const result = await poll(async () => {
        const r2 = await getJson(ctx, `/api/agents?club_id=${CLUB_ID}`, authHeaders);
        const p = (r2.json?.actions || []).filter(a => a.status === 'pending');
        return p.length > 0 ? p : null;
      }, { timeout: 30000, interval: 3000 });

      pending = result || [];
    }

    if (pending.length === 0) {
      addIssue({ severity: 'medium', suite: 'Suite 3', description: 'No pending agent actions after sweep', expected: '≥ 1 pending action', actual: '0' });
    } else {
      console.log(`[agents] ${pending.length} pending action(s) in inbox`);
    }
  });

  test('3.2 — Automations inbox tab shows action cards', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/automations`);
    await page.waitForTimeout(3500);

    const s = await shot(page, '3-2-automations-inbox');
    const text = await page.evaluate(() => document.body.innerText);
    const hasInboxContent = /approve|dismiss|pending|autopilot|No pending/i.test(text);
    if (!hasInboxContent) {
      addIssue({ severity: 'medium', suite: 'Suite 3', description: 'Automations inbox has no content', screenshot: s, expected: 'Pending action cards or empty state', actual: text.slice(0, 300) });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 4 — SMS Concierge Interaction Loop
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 4 — SMS Concierge Tool Calls', () => {
  const CONVERSATIONS = [
    { msg: 'Book my usual Saturday 7 AM tee time with 3 friends',        label: 'book_tee_time' },
    { msg: "What's on the club calendar this weekend?",                   label: 'get_club_calendar' },
    { msg: 'Show me my upcoming schedule and reservations',               label: 'get_my_schedule' },
    { msg: 'Book dinner for Saturday at 7pm for 2 people',                label: 'make_dining_reservation' },
    { msg: 'RSVP me for the spring wine dinner',                          label: 'rsvp_event' },
    { msg: 'My lunch yesterday took 45 minutes and no one checked on us', label: 'file_complaint' },
    { msg: 'Cancel my upcoming tee time please',                          label: 'cancel_tee_time' },
    { msg: 'Can you let the pro shop know I need rental clubs Sunday',    label: 'send_request_to_club' },
  ];

  for (const { msg, label } of CONVERSATIONS) {
    test(`4 — [${label}] "${msg.slice(0, 50)}..."`, async ({ page }) => {
      test.skip(!apiReachable || !auth, 'Skipping');

      await injectAuth(page, auth.token, auth.user, CLUB_ID);
      // SMS Chat Simulator is at #/sms-simulator, not #/operations
      await page.goto(`${APP_URL}/#/sms-simulator`);
      await page.waitForTimeout(3500); // wait for dynamic member fetch

      // Select first available persona (Oakmont members loaded dynamically)
      const firstPersona = page.locator('[data-testid="persona-btn"]').first();
      if (await firstPersona.isVisible({ timeout: 4000 })) {
        await firstPersona.click();
        await page.waitForTimeout(500);
      }

      const input = page.locator('[data-testid="sms-message-input"], textarea[placeholder*="message" i], input[placeholder*="message" i]').first();
      if (!await input.isVisible({ timeout: 8000 })) {
        const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
        addIssue({ severity: 'high', suite: 'Suite 4', description: `SMS message input not found for: ${label}`, expected: 'Input visible', actual: bodyText.slice(0, 200) });
        return;
      }

      await input.fill(msg);
      const sendBtn = page.locator('button[type="submit"], button:has-text("Send")').last();
      if (await sendBtn.isVisible({ timeout: 1000 })) {
        await sendBtn.click();
      } else {
        await input.press('Enter');
      }

      // Wait for agent response bubble to appear
      const responded = await page.waitForFunction(() => {
        const bubbles = document.querySelectorAll('[class*="rounded-2xl"]');
        return bubbles.length >= 2;
      }, { timeout: 30000 }).then(() => true).catch(() => false);

      await page.waitForTimeout(1500);

      // Check Tool Calls tab for any calls made
      const toolsTab = page.locator('button:has-text("Tool Calls")').first();
      let toolCallsText = '';
      if (await toolsTab.isVisible({ timeout: 3000 })) {
        await toolsTab.click();
        await page.waitForTimeout(800);
        toolCallsText = await page.evaluate(() => {
          const panels = document.querySelectorAll('[class*="tool"], [class*="Tool"]');
          return Array.from(panels).map(p => p.innerText).join(' ');
        });
      }

      const s = await shot(page, `4-${label}`);
      const pageText = await page.evaluate(() => document.body.innerText);

      if (!responded) {
        addIssue({
          severity: 'medium', suite: 'Suite 4',
          description: `No agent response for "${label}" scenario`,
          screenshot: s,
          expected: 'Agent text response visible',
          actual: pageText.slice(0, 200),
        });
      } else {
        // Log what tools were actually used (informational)
        const toolNames = toolCallsText.match(/route_to_role_agent|escalate_to_role|observe_preference|recall_member_context|request_human_confirmation/g) || [];
        console.log(`[suite4] ${label} — responded OK${toolNames.length ? `, tools: ${[...new Set(toolNames)].join(', ')}` : ''}`);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 5 — Operations Center Navigation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 5 — Operations Center', () => {
  test('5.1 — Activity tab renders log items', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/operations`);
    await page.waitForTimeout(3000);

    const s = await shot(page, '5-1-operations-activity');
    const text = await page.evaluate(() => document.body.innerText);
    const hasActivity = /agent action|member alert|concierge|court|f&b|checkin|booking/i.test(text);
    if (!hasActivity) {
      addIssue({ severity: 'medium', suite: 'Suite 5', description: 'Operations Activity tab shows no log items', screenshot: s, expected: 'Activity items visible', actual: text.slice(0, 300) });
    }
  });

  test('5.2 — F&B Orders tab renders', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/operations`);
    await page.waitForTimeout(2500);

    const fbTab = page.locator('button:has-text("F&B Orders"), button:has-text("F&B")').first();
    if (await fbTab.isVisible({ timeout: 4000 })) {
      await fbTab.click();
      await page.waitForTimeout(2000);
    }
    const s = await shot(page, '5-2-operations-fb');
    const text = await page.evaluate(() => document.body.innerText);
    const hasFB = /order|pickup|preparing|ready|new|picked up/i.test(text);
    if (!hasFB) {
      addIssue({ severity: 'medium', suite: 'Suite 5', description: 'F&B Orders tab has no content', screenshot: s, expected: 'Order queue items visible', actual: text.slice(0, 200) });
    }
  });

  test('5.3 — Voice tab renders', async ({ page }) => {
    test.skip(!apiReachable || !auth, 'Skipping');

    await injectAuth(page, auth.token, auth.user, CLUB_ID);
    await page.goto(`${APP_URL}/#/operations`);
    await page.waitForTimeout(2500);

    const voiceTab = page.locator('button:has-text("Voice")').first();
    if (await voiceTab.isVisible({ timeout: 4000 })) {
      await voiceTab.click();
      await page.waitForTimeout(2000);
    }
    const s = await shot(page, '5-3-operations-voice');
    const text = await page.evaluate(() => document.body.innerText);
    const hasVoiceUI = /voice concierge|tap to start|gemini|api key|mic/i.test(text);
    if (!hasVoiceUI) {
      addIssue({ severity: 'medium', suite: 'Suite 5', description: 'Voice tab has no voice UI', screenshot: s, expected: 'Mic button or API key warning', actual: text.slice(0, 200) });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 6 — Capability Toggle (GM-only)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 6 — Capability Toggle', () => {
  test('6.1 — GM can disable and re-enable a capability', async () => {
    test.skip(!apiReachable || !auth, 'Skipping');

    // Disable tee_time_booking
    const disable = await patchJson(ctx, '/api/club/capabilities', { capability: 'tee_time_booking', enabled: false }, authHeaders);
    if (disable.status !== 200) {
      addIssue({ severity: 'high', suite: 'Suite 6', description: `PATCH /api/club/capabilities returned ${disable.status}`, expected: '200', actual: String(disable.status) });
      return;
    }
    expect(disable.json?.enabled).toBe(false);
    console.log('[suite6] tee_time_booking disabled');

    // Verify it reads back as disabled
    const check = await getJson(ctx, '/api/club/capabilities', authHeaders);
    const cap = (check.json?.capabilities ?? []).find(c => c.capability === 'tee_time_booking');
    expect(cap?.enabled).toBe(false);

    // Re-enable
    const enable = await patchJson(ctx, '/api/club/capabilities', { capability: 'tee_time_booking', enabled: true }, authHeaders);
    expect(enable.json?.enabled).toBe(true);
    console.log('[suite6] tee_time_booking re-enabled');
  });

  test('6.2 — Concierge chat respects capability gate', async () => {
    test.skip(!apiReachable || !auth, 'Skipping');

    // Disable dining_reservations
    await patchJson(ctx, '/api/club/capabilities', { capability: 'dining_reservations', enabled: false }, authHeaders);

    // Use first real member from the roster
    const rosterR = await getJson(ctx, '/api/members?limit=1', authHeaders);
    const firstMember = rosterR.json?.memberRoster?.[0] ?? rosterR.json?.members?.[0];
    const testMemberId = firstMember?.member_id ?? 'mbr_oak_001';

    // Send a dining request through the concierge
    const r = await postJson(
      ctx,
      '/api/concierge/chat',
      { message: 'Book a table for 2 at 7pm Saturday', member_id: testMemberId },
      authHeaders,
    );

    // Re-enable first (regardless of result)
    await patchJson(ctx, '/api/club/capabilities', { capability: 'dining_reservations', enabled: true }, authHeaders);

    console.log(`[suite6] concierge response (status ${r.status}): ${r.text?.slice(0, 200)}`);

    if (r.status === 200) {
      const responseText = (r.json?.text ?? r.json?.message ?? r.text ?? '').toLowerCase();
      const mentionsUnavailable = /unavailable|not available|disabled|unable|cannot/i.test(responseText);
      if (!mentionsUnavailable) {
        addIssue({
          severity: 'medium', suite: 'Suite 6',
          description: 'Concierge did not mention capability disabled when dining_reservations=false',
          expected: 'Response mentions feature unavailable',
          actual: responseText.slice(0, 200),
        });
      } else {
        console.log('[suite6] capability gate confirmed in concierge response');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 7 — UX Screenshot Audit
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Suite 7 — UX Screenshot Audit', () => {
  const PAGES = [
    { route: 'today',        name: '7-today' },
    { route: 'members',      name: '7-members' },
    { route: 'revenue',      name: '7-revenue' },
    { route: 'tee-sheet',    name: '7-tee-sheet' },
    { route: 'automations',  name: '7-automations' },
    { route: 'operations',   name: '7-operations' },
    { route: 'board-report', name: '7-board-report' },
    { route: 'service',      name: '7-service' },
  ];

  for (const { route, name } of PAGES) {
    test(`7 — #/${route}`, async ({ page }) => {
      test.skip(!apiReachable || !auth, 'Skipping');

      await injectAuth(page, auth.token, auth.user, CLUB_ID);
      await page.goto(`${APP_URL}/#/${route}`);
      await page.waitForTimeout(3500);

      const s = await shot(page, name);
      const text = await page.evaluate(() => document.body.innerText);
      const hasErrors = /something went wrong|uncaught|error boundary|failed to fetch/i.test(text);

      if (hasErrors) {
        addIssue({ severity: 'high', suite: 'Suite 7', description: `Error state on #/${route}`, screenshot: s, expected: 'No errors', actual: text.slice(0, 200) });
      }
      if (text.length < 200) {
        addIssue({ severity: 'medium', suite: 'Suite 7', description: `#/${route} appears blank (${text.length} chars)`, screenshot: s, expected: '> 200 chars', actual: `${text.length} chars` });
      }

      console.log(`[audit] #/${route}: ${text.length} chars, errors=${hasErrors}`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════

test.afterAll(async () => {
  if (ctx) await ctx.dispose();
  writeReport();
});

}); // end outer describe 'Oakmont Country Club E2E'
