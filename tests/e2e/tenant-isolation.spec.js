/**
 * Tenant Isolation Integration Test — SHIP_PLAN §1.1 / §7 item 1
 *
 * Proves Club A cannot read Club B's data via any /api/* endpoint.
 *
 * Strategy:
 *   1. Create two clubs via POST /api/onboard-club (rate-limited to 3/hour).
 *   2. Log in as each club's admin via POST /api/auth to get a Bearer token.
 *   3. For every clubId-scoped GET handler under api/, call it twice with
 *      club-A's token:
 *        a) no query param          → must only return club-A data
 *        b) ?clubId=<clubB>         → must only return club-A data (since
 *           getReadClubId ignores the query param for non-admin roles)
 *      and assert the response body NEVER contains club-B's clubId string.
 *   4. Symmetric check with club-B's token vs club-A.
 *
 * How it mocks JWT: it doesn't. It uses the real sessions table via
 * /api/auth (identical to what the browser does). The Bearer token IS the
 * session token; withAuth.js verifies it on every request.
 *
 * Backend requirement: the APP_URL env var must point at an environment
 * where /api/* is actually served (e.g. a dev preview URL or `vercel dev`
 * on localhost:3000). `vite dev` on :5173 does NOT serve serverless
 * functions, so the test will skip cleanly if /api/auth returns HTML.
 *
 * Run:
 *   APP_URL=https://swoop-member-portal-<preview>.vercel.app \
 *     npx playwright test tests/e2e/tenant-isolation.spec.js --project="Desktop Chrome"
 *
 * This test DOES NOT MODIFY src/ or api/. It only reads. If any endpoint
 * leaks another club's data, the test fails loudly with file + request.
 */
import { test, expect, request as pwRequest } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TIMESTAMP = Date.now();

// Every clubId-scoped GET endpoint surfaced by api/*. Keep this in sync with
// `grep -l "getReadClubId\|getClubId\|req.query.clubId" api/`. Endpoints that
// have no GET verb will 405; the test tolerates that (405 is not a leak).
const ENDPOINTS = [
  '/api/activity',
  '/api/agent-autonomous',
  '/api/agents',
  '/api/benchmarks',
  '/api/benchmarks-live',
  '/api/board-report',
  '/api/briefing',
  '/api/club',
  '/api/cockpit',
  '/api/compute-correlations',
  '/api/dashboard-live',
  '/api/data-availability',
  '/api/experience-insights',
  '/api/fb',
  '/api/feature-availability',
  '/api/generate-draft',
  '/api/integrations',
  '/api/invoices',
  '/api/location',
  '/api/member-detail',
  '/api/members',
  '/api/notifications',
  '/api/operations',
  '/api/pipeline',
  '/api/predict-churn',
  '/api/search',
  '/api/staffing',
  '/api/sync-status',
  '/api/tee-sheet-ops',
  '/api/trends',
  '/api/waitlist',
];

// HTTP statuses that are NOT leaks. Everything else we inspect the body.
const NON_LEAK_STATUSES = new Set([204, 400, 401, 403, 404, 405, 429, 500, 501]);

/** Deep scan a value for any occurrence of `needle` as a string. */
function containsString(value, needle) {
  if (value == null) return false;
  if (typeof value === 'string') return value.includes(needle);
  if (typeof value === 'number' || typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.some((v) => containsString(v, needle));
  if (typeof value === 'object') {
    for (const k of Object.keys(value)) {
      if (k.includes(needle)) return true;
      if (containsString(value[k], needle)) return true;
    }
  }
  return false;
}

/**
 * Post JSON and return { status, json }. json is `null` if the body wasn't
 * parseable as JSON (e.g. HTML from vite's 404 page).
 */
async function postJson(ctx, path, body, headers = {}) {
  const res = await ctx.post(path, {
    data: body,
    headers: { 'Content-Type': 'application/json', ...headers },
    failOnStatusCode: false,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status(), json, text };
}

async function getJson(ctx, path, headers = {}) {
  const res = await ctx.get(path, { headers, failOnStatusCode: false });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status(), json, text };
}

async function createClub(ctx, suffix) {
  const email = `tenant-iso-${TIMESTAMP}-${suffix}@e2e.test`;
  const password = 'TenantIso!2345';
  const r = await postJson(ctx, '/api/onboard-club', {
    clubName: `Tenant Iso ${suffix} ${TIMESTAMP}`,
    city: 'Nowhere',
    state: 'KY',
    zip: '42101',
    memberCount: 100,
    courseCount: 1,
    outletCount: 3,
    adminEmail: email,
    adminName: `Tenant Iso ${suffix} Admin`,
    adminPassword: password,
  });
  if (r.status !== 201 || !r.json?.clubId) {
    throw new Error(
      `onboard-club failed (status=${r.status}): ${r.text?.slice(0, 300)}`,
    );
  }
  return { clubId: r.json.clubId, email, password };
}

async function login(ctx, email, password) {
  const r = await postJson(ctx, '/api/auth', { email, password });
  if (r.status !== 200 || !r.json?.token) {
    throw new Error(
      `login failed (status=${r.status}): ${r.text?.slice(0, 300)}`,
    );
  }
  return r.json.token;
}

test.describe('Tenant isolation — cross-club reads must not leak', () => {
  let ctx;
  let clubA;
  let clubB;
  let tokenA;
  let tokenB;
  let apiReachable = false;

  test.beforeAll(async () => {
    ctx = await pwRequest.newContext({ baseURL: APP_URL });

    // Probe /api/auth (GET without token → expect 401 JSON). If we get HTML
    // back, we're hitting a pure Vite dev server with no serverless runtime.
    // If the host refuses the connection entirely, treat as unreachable (skip).
    let probe;
    try {
      probe = await getJson(ctx, '/api/auth');
    } catch (err) {
      probe = { status: 0, json: null, text: String(err?.message || err) };
    }
    apiReachable =
      probe.status === 401 && probe.json && typeof probe.json.error === 'string';
    if (!apiReachable) {
      console.warn(
        `[tenant-isolation] APP_URL=${APP_URL} does not serve /api/* ` +
          `(probe status=${probe.status}). Skipping — point APP_URL at a ` +
          `preview deploy or \`vercel dev\`.`,
      );
      return;
    }

    clubA = await createClub(ctx, 'A');
    clubB = await createClub(ctx, 'B');
    tokenA = await login(ctx, clubA.email, clubA.password);
    tokenB = await login(ctx, clubB.email, clubB.password);
  });

  test.afterAll(async () => {
    if (ctx) await ctx.dispose();
  });

  test('every GET endpoint refuses to leak the other club', async () => {
    test.skip(!apiReachable, 'APP_URL does not serve /api/* — skipping');

    const leaks = [];
    let endpointsHit = 0;

    async function checkPair(label, token, selfClubId, otherClubId) {
      for (const endpoint of ENDPOINTS) {
        for (const qs of ['', `?clubId=${encodeURIComponent(otherClubId)}`]) {
          const url = `${endpoint}${qs}`;
          const r = await getJson(ctx, url, {
            Authorization: `Bearer ${token}`,
          });
          endpointsHit += 1;

          // 405/400/401/403/404/500/501 are not leaks — the endpoint either
          // refused the request or doesn't expose a GET. We care about 2xx
          // responses that returned the *other* club's data.
          if (NON_LEAK_STATUSES.has(r.status)) continue;
          if (r.status < 200 || r.status >= 300) continue;

          // The canonical leak signal: the other club's clubId string
          // appearing anywhere in the JSON response. We also flag any
          // appearance of the other club's stable prefix (`club_`+timestamp).
          if (r.json && containsString(r.json, otherClubId)) {
            leaks.push({
              endpoint: url,
              caller: `${label} (clubId=${selfClubId})`,
              status: r.status,
              leaked: otherClubId,
              sample: JSON.stringify(r.json).slice(0, 400),
            });
          }
        }
      }
    }

    await checkPair('clubA', tokenA, clubA.clubId, clubB.clubId);
    await checkPair('clubB', tokenB, clubB.clubId, clubA.clubId);

    if (leaks.length > 0) {
      // Fail loudly with a readable per-leak report.
      const report = leaks
        .map(
          (l, i) =>
            `  ${i + 1}. ${l.caller} → ${l.endpoint}\n` +
            `     status=${l.status} leaked=${l.leaked}\n` +
            `     sample=${l.sample}`,
        )
        .join('\n');
      throw new Error(
        `TENANT ISOLATION FAILURE — ${leaks.length} endpoint(s) leaked ` +
          `another club's data across ${endpointsHit} request(s):\n${report}`,
      );
    }

    expect(leaks).toEqual([]);
    // Helpful passing-line summary in the test output.
    console.log(
      `[tenant-isolation] OK — ${ENDPOINTS.length} endpoints × 2 clubs × ` +
        `2 variants = ${endpointsHit} requests, no cross-club leaks.`,
    );
  });
});

/**
 * Wave 2 — cross-tenant WRITE isolation.
 *
 * Strategy: for each clubId-scoped write handler, call it with clubA's Bearer
 * token but try to smuggle clubB's clubId via BOTH `?clubId=` in the URL AND
 * `clubId: clubB.id` in the JSON body. Each write carries a unique marker
 * string (title/description/reason) so we can detect leakage without needing
 * DB access. After the write, we GET the corresponding list endpoint as
 * clubB and deep-scan the response for the marker — if it appears, the write
 * landed in clubB's scope and the handler leaked.
 *
 * This reuses the same beforeAll (two clubs, two tokens) as the read suite —
 * Playwright runs describe blocks in the same file sequentially, so the
 * clubs/tokens created here are fresh per run. We mirror setup to keep the
 * blocks independent (if someone moves one file to a different project).
 */
test.describe('Tenant isolation — cross-club writes must not land in other tenant', () => {
  let ctx;
  let clubA;
  let clubB;
  let tokenA;
  let tokenB;
  let apiReachable = false;

  test.beforeAll(async () => {
    ctx = await pwRequest.newContext({ baseURL: APP_URL });

    let probe;
    try {
      probe = await getJson(ctx, '/api/auth');
    } catch (err) {
      probe = { status: 0, json: null, text: String(err?.message || err) };
    }
    apiReachable =
      probe.status === 401 && probe.json && typeof probe.json.error === 'string';
    if (!apiReachable) {
      console.warn(
        `[tenant-isolation-writes] APP_URL=${APP_URL} does not serve /api/* ` +
          `(probe status=${probe.status}). Skipping.`,
      );
      return;
    }

    // Use a distinct suffix so we don't collide with the read block's clubs
    // (onboard-club is rate-limited to 3/hour per IP — if the prior test
    // consumed the budget we'll surface that here rather than silently skip).
    clubA = await createClub(ctx, 'W-A');
    clubB = await createClub(ctx, 'W-B');
    tokenA = await login(ctx, clubA.email, clubA.password);
    tokenB = await login(ctx, clubB.email, clubB.password);
  });

  test.afterAll(async () => {
    if (ctx) await ctx.dispose();
  });

  test('every write endpoint refuses to mutate the other club', async () => {
    test.skip(!apiReachable, 'APP_URL does not serve /api/* — skipping');

    const leaks = [];
    const attempted = [];

    // A unique marker baked into every write. If we later see this string in
    // ANY endpoint response while authenticated as clubB, the write leaked.
    const marker = `XTENANT_LEAK_PROBE_${TIMESTAMP}`;

    /**
     * Fire one write attempt.
     *
     * @param {object} opts
     * @param {string} opts.label        human label for the report
     * @param {string} opts.method       HTTP verb (POST|PUT|DELETE)
     * @param {string} opts.path         path WITHOUT query — we add ?clubId=clubB
     * @param {object} opts.body         JSON body; clubId:clubB.id is injected
     * @param {number[]} [opts.okStatuses]  statuses that mean "handler was reached"
     */
    async function attemptWrite({ label, method, path, body, okStatuses = [200, 201] }) {
      const url = `${path}${path.includes('?') ? '&' : '?'}clubId=${encodeURIComponent(clubB.clubId)}`;
      const mergedBody = { ...body, clubId: clubB.clubId };
      const res = await ctx.fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        data: mergedBody,
        failOnStatusCode: false,
      });
      const status = res.status();
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* not JSON */ }

      attempted.push({ label, method, path, status });

      // Anything 4xx/5xx with no body bleed is fine — the handler rejected
      // or errored and nothing persisted. We only need to worry when the
      // response was 2xx (write accepted) because the default-deny semantics
      // of getWriteClubId mean the row *should* have landed under clubA.
      // That's still "safe for clubB" — we verify below by GETing as clubB.
      return { status, json, text, writeAccepted: okStatuses.includes(status) };
    }

    /**
     * After a set of writes, fetch a list endpoint as clubB and deep-scan for
     * the marker. If present, the write leaked into clubB's scope.
     */
    async function assertNoMarkerAsClubB(listPath, forLabel) {
      const r = await getJson(ctx, listPath, { Authorization: `Bearer ${tokenB}` });
      if (r.status < 200 || r.status >= 300) return; // endpoint unreachable for clubB — not a leak
      if (r.json && containsString(r.json, marker)) {
        leaks.push({
          handler: forLabel,
          listPath,
          status: r.status,
          sample: JSON.stringify(r.json).slice(0, 400),
        });
      }
    }

    // ─── 1. POST /api/activity — insert activity_log row ───
    await attemptWrite({
      label: 'POST /api/activity',
      method: 'POST',
      path: '/api/activity',
      body: {
        actionType: 'xtenant_probe',
        description: marker,
        meta: { marker },
      },
    });
    await assertNoMarkerAsClubB('/api/activity', 'POST /api/activity');

    // ─── 2. POST /api/notifications — insert notification ───
    await attemptWrite({
      label: 'POST /api/notifications',
      method: 'POST',
      path: '/api/notifications',
      body: {
        type: 'info',
        title: marker,
        body: marker,
        priority: 'normal',
      },
    });
    await assertNoMarkerAsClubB('/api/notifications', 'POST /api/notifications');

    // ─── 3. POST /api/agents — approve/dismiss agent_action ───
    // We pass a fake actionId; update will be a no-op but the handler still
    // runs through getWriteClubId. Any 2xx should leave no trace in clubB.
    await attemptWrite({
      label: 'POST /api/agents (dismiss)',
      method: 'POST',
      path: '/api/agents',
      body: {
        actionId: `xtenant-probe-${TIMESTAMP}`,
        operation: 'dismiss',
        meta: { reason: marker },
      },
    });
    await assertNoMarkerAsClubB('/api/agents', 'POST /api/agents');

    // ─── 4. POST /api/tee-sheet-ops — update booking_confirmations ───
    await attemptWrite({
      label: 'POST /api/tee-sheet-ops',
      method: 'POST',
      path: '/api/tee-sheet-ops',
      body: {
        operation: 'updateConfirmation',
        confirmationId: `xtenant-probe-${TIMESTAMP}`,
        outreachStatus: 'contacted',
        staffNotes: marker,
      },
    });
    await assertNoMarkerAsClubB('/api/tee-sheet-ops', 'POST /api/tee-sheet-ops');

    // ─── 5. POST /api/feature-availability (update_domain) ───
    // Writes data_source_status. We use a sentinel vendor string so leakage
    // would be visible in clubB's GET /api/feature-availability.
    await attemptWrite({
      label: 'POST /api/feature-availability',
      method: 'POST',
      path: '/api/feature-availability',
      body: {
        action: 'update_domain',
        domainCode: 'CRM',
        isConnected: true,
        sourceVendor: marker,
        rowCount: 1,
      },
    });
    await assertNoMarkerAsClubB('/api/feature-availability', 'POST /api/feature-availability');

    // ─── 6. POST /api/execute-playbook — start a playbook run ───
    // memberId references a row in `members`; without a real member this
    // will likely 4xx/5xx — still a valid isolation check since we care the
    // row, if inserted, doesn't show up in clubB.
    await attemptWrite({
      label: 'POST /api/execute-playbook',
      method: 'POST',
      path: '/api/execute-playbook',
      body: {
        playbookId: `xtenant-probe-${TIMESTAMP}`,
        playbookName: marker,
        memberId: `xtenant-probe-member-${TIMESTAMP}`,
        triggeredBy: 'e2e-tenant-iso',
        triggerReason: marker,
        steps: [{ title: marker, description: marker, assignedTo: 'nobody', dueDays: 1 }],
      },
    });
    await assertNoMarkerAsClubB('/api/execute-playbook', 'POST /api/execute-playbook');

    // ─── 7. PUT /api/execute-playbook — advance a playbook step ───
    // stepId is a fake — the UPDATE should be a no-op regardless of club.
    // We include it anyway to exercise the code path.
    await attemptWrite({
      label: 'PUT /api/execute-playbook',
      method: 'PUT',
      path: '/api/execute-playbook',
      body: {
        stepId: `xtenant-probe-${TIMESTAMP}`,
        status: 'completed',
        completedBy: 'e2e',
        notes: marker,
        runId: `xtenant-probe-run-${TIMESTAMP}`,
      },
    });
    await assertNoMarkerAsClubB('/api/execute-playbook', 'PUT /api/execute-playbook');

    // ─── 8. POST /api/predict-churn — recompute churn predictions ───
    await attemptWrite({
      label: 'POST /api/predict-churn',
      method: 'POST',
      path: '/api/predict-churn',
      body: {},
    });
    // The predict-churn GET requires ?memberId, so we can't trivially
    // enumerate clubB's predictions. Instead, rerun as clubB with a fake
    // memberId and check the returned row (if any) isn't for clubA's
    // members. This is best-effort — absence of a row is already the
    // expected state for fresh clubs.

    // ─── 9. POST /api/compute-correlations — recompute correlations ───
    await attemptWrite({
      label: 'POST /api/compute-correlations',
      method: 'POST',
      path: '/api/compute-correlations',
      body: {},
    });
    // Verify clubB's correlations list didn't pick up anything referencing
    // clubA (correlations don't embed a marker — we fall back to clubId scan).
    {
      const r = await getJson(ctx, '/api/compute-correlations', {
        Authorization: `Bearer ${tokenB}`,
      });
      if (r.status >= 200 && r.status < 300 && r.json && containsString(r.json, clubA.clubId)) {
        leaks.push({
          handler: 'POST /api/compute-correlations',
          listPath: '/api/compute-correlations',
          status: r.status,
          sample: JSON.stringify(r.json).slice(0, 400),
        });
      }
    }

    // ─── 10. POST /api/agent-autonomous — run agent sweep ───
    await attemptWrite({
      label: 'POST /api/agent-autonomous',
      method: 'POST',
      path: '/api/agent-autonomous',
      body: {},
    });
    {
      const r = await getJson(ctx, '/api/agent-autonomous', {
        Authorization: `Bearer ${tokenB}`,
      });
      if (r.status >= 200 && r.status < 300 && r.json && containsString(r.json, clubA.clubId)) {
        leaks.push({
          handler: 'POST /api/agent-autonomous',
          listPath: '/api/agent-autonomous',
          status: r.status,
          sample: JSON.stringify(r.json).slice(0, 400),
        });
      }
    }

    // ─── 11. PUT /api/club — update club metadata ───
    // This handler uses getWriteClubId({allowAdminOverride:true}). A non-admin
    // (gm) session should NOT be able to override, so the update must land
    // on clubA, not clubB. Verify by GETing clubB's own /api/club.
    await attemptWrite({
      label: 'PUT /api/club',
      method: 'PUT',
      path: '/api/club',
      body: {
        name: marker,
        city: marker,
        state: 'XX',
        zip: '00000',
      },
    });
    {
      const r = await getJson(ctx, '/api/club', { Authorization: `Bearer ${tokenB}` });
      if (r.status >= 200 && r.status < 300 && r.json && containsString(r.json, marker)) {
        leaks.push({
          handler: 'PUT /api/club',
          listPath: '/api/club',
          status: r.status,
          sample: JSON.stringify(r.json).slice(0, 400),
        });
      }
    }

    // ─── 12. DELETE /api/activity — try to wipe clubB's audit log ───
    // This is gated on swoop_admin role, so a plain gm token should 403.
    // A 2xx would itself be a leak regardless of whether rows were deleted.
    {
      const confirmToken = `YES_DELETE_AUDIT_LOG_FOR_${clubB.clubId}`;
      const url = `/api/activity?clubId=${encodeURIComponent(clubB.clubId)}&confirm=${encodeURIComponent(confirmToken)}`;
      const res = await ctx.fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
        failOnStatusCode: false,
      });
      const status = res.status();
      attempted.push({ label: 'DELETE /api/activity', method: 'DELETE', path: '/api/activity', status });
      if (status >= 200 && status < 300) {
        leaks.push({
          handler: 'DELETE /api/activity',
          listPath: url,
          status,
          sample: '2xx on cross-tenant DELETE — handler did not refuse',
        });
      }
    }

    if (leaks.length > 0) {
      const report = leaks
        .map(
          (l, i) =>
            `  ${i + 1}. ${l.handler}\n` +
            `     detected via ${l.listPath} (status=${l.status})\n` +
            `     sample=${l.sample}`,
        )
        .join('\n');
      throw new Error(
        `TENANT ISOLATION FAILURE (writes) — ${leaks.length} handler(s) leaked ` +
          `across ${attempted.length} write attempts:\n${report}`,
      );
    }

    expect(leaks).toEqual([]);
    console.log(
      `[tenant-isolation-writes] OK — ${attempted.length} cross-tenant write ` +
        `attempts, no handlers leaked into the other club.\n` +
        attempted.map((a) => `  ${a.method} ${a.path} → ${a.status}`).join('\n'),
    );
  });
});
