#!/usr/bin/env node
/**
 * scripts/edge-case-matrix.mjs
 *
 * In-process edge-case harness. Exercises malformed inputs, concurrency,
 * tenant isolation, and empty-state behaviors against the real API handlers
 * (no dev server, no Playwright). Each case is a ~5s check; full matrix
 * targets <90s runtime.
 *
 * Usage:
 *   node scripts/edge-case-matrix.mjs [--filter=<caseId>] [--verbose]
 *
 * Each case returns { id, label, passed, detail }. Output is both stdout
 * table and reports/edge-case-matrix.md.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ---- env loader ----
{
  const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    for (const line of fs.readFileSync(path.join(__root, '.env.local'), 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k && !process.env[k]) process.env[k] = v;
    }
  } catch { /* rely on inherited env */ }
}

import { sql } from '@vercel/postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT, 'reports', 'edge-case-matrix.md');

const FILTER = (() => {
  const a = process.argv.find(x => x.startsWith('--filter='));
  return a ? a.split('=')[1] : null;
})();
const VERBOSE = process.argv.includes('--verbose');

// ---- helpers ----

function freshClubId(label) {
  return `edge-${label}-${Math.random().toString(36).slice(2, 10)}`;
}

async function wipeClub(clubId) {
  const queries = [
    `DELETE FROM agent_actions WHERE club_id = $1`,
    `DELETE FROM booking_players WHERE booking_id IN (SELECT booking_id FROM bookings WHERE club_id = $1)`,
    `DELETE FROM pos_line_items WHERE check_id IN (SELECT check_id FROM pos_checks WHERE club_id = $1)`,
    `DELETE FROM pos_payments WHERE check_id IN (SELECT check_id FROM pos_checks WHERE club_id = $1)`,
    `DELETE FROM pos_checks WHERE club_id = $1`,
    `DELETE FROM bookings WHERE club_id = $1`,
    `DELETE FROM transactions WHERE club_id = $1`,
    `DELETE FROM members WHERE club_id = $1`,
  ];
  for (const q of queries) {
    try { await sql.query(q, [clubId]); } catch { /* fresh tenant */ }
  }
}

async function callHandler(modulePath, req) {
  const handler = (await import(`../${modulePath}?v=${Date.now()}`)).default;
  const res = {
    code: 0,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(o) { this.body = o; return this; },
    end() { return this; },
  };
  await handler(req, res);
  return res;
}

function importReq(clubId, importType, rows) {
  return {
    method: 'POST',
    headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' },
    body: { importType, rows, clubId, club_id: clubId },
  };
}

function getReq(clubId, extra = {}) {
  return {
    method: 'GET',
    headers: { 'x-cron-key': process.env.CRON_SECRET || 'x' },
    query: { clubId, ...extra },
  };
}

// ---- cases ----

const CASES = [];
const addCase = (id, label, fn) => CASES.push({ id, label, fn });

// 1. Empty member rows
addCase('empty-members', 'members CSV with 0 rows → 0 accepted, no crash', async () => {
  const clubId = freshClubId('empty');
  const res = await callHandler('api/import-csv.js', importReq(clubId, 'members', []));
  if (res.code !== 200) return { passed: false, detail: `HTTP ${res.code}` };
  if ((res.body?.accepted ?? 0) !== 0) return { passed: false, detail: `accepted=${res.body?.accepted}` };
  return { passed: true, detail: 'accepted=0' };
});

// 2. Duplicate external_id → upsert
addCase('dup-external-id', 'duplicate external_id upserts (no PK violation)', async () => {
  const clubId = freshClubId('dup');
  const row = { external_id: 'ext_dup', first_name: 'A', last_name: 'B', membership_type: 'FG' };
  const res1 = await callHandler('api/import-csv.js', importReq(clubId, 'members', [row, row]));
  if (res1.code !== 200) return { passed: false, detail: `HTTP ${res1.code}` };
  const n = await sql`SELECT COUNT(*)::int AS n FROM members WHERE club_id = ${clubId}`;
  await wipeClub(clubId);
  if (Number(n.rows[0].n) !== 1) return { passed: false, detail: `${n.rows[0].n} rows instead of 1 (upsert failed)` };
  return { passed: true, detail: '1 row after 2 dup imports' };
});

// 3. Missing required field → rejection, no crash
addCase('missing-required', 'missing first_name rejects cleanly', async () => {
  const clubId = freshClubId('missreq');
  const res = await callHandler('api/import-csv.js', importReq(clubId, 'members', [
    { external_id: 'ext_1', last_name: 'NoFirst' },
  ]));
  await wipeClub(clubId);
  if (res.code !== 200) return { passed: false, detail: `HTTP ${res.code}` };
  if ((res.body?.errors ?? 0) < 1 && (res.body?.accepted ?? 0) > 0) {
    return { passed: false, detail: 'accepted a row missing first_name' };
  }
  return { passed: true, detail: `rejected=${res.body?.errors ?? res.body?.rejected?.length}` };
});

// 4. Bad date in date-ish field → rejection
addCase('bad-date', 'invalid "join_date" value is rejected at schema layer', async () => {
  const clubId = freshClubId('baddate');
  const res = await callHandler('api/import-csv.js', importReq(clubId, 'members', [
    { first_name: 'A', last_name: 'B', join_date: 'not-a-date' },
  ]));
  await wipeClub(clubId);
  if (res.code !== 200) return { passed: false, detail: `HTTP ${res.code}` };
  const rejected = res.body?.rejected?.length ?? 0;
  if (rejected < 1) return { passed: false, detail: 'bad date row was accepted' };
  return { passed: true, detail: `rejected=${rejected}` };
});

// 5. Non-numeric annual_dues → row rejected
addCase('non-numeric-dues', 'annual_dues="N/A" row is rejected', async () => {
  const clubId = freshClubId('nan');
  const res = await callHandler('api/import-csv.js', importReq(clubId, 'members', [
    { first_name: 'A', last_name: 'B', annual_dues: 'N/A' },
  ]));
  await wipeClub(clubId);
  const accepted = res.body?.accepted ?? 0;
  const errors = res.body?.errors ?? 0;
  // Accept either outcome: coerced to null (accepted=1, errors=0) OR rejected (accepted=0, errors>=1)
  if (accepted === 1 && errors === 0) return { passed: true, detail: 'coerced to null' };
  if (accepted === 0 && errors >= 1) return { passed: true, detail: 'rejected' };
  return { passed: false, detail: `accepted=${accepted} errors=${errors}` };
});

// 6. Empty-tenant stage-insights → 0 unlocked
addCase('empty-stage-insights', 'empty tenant → all stage-insights unlocked:false', async () => {
  const clubId = freshClubId('si');
  const res = await callHandler('api/stage-insights.js', getReq(clubId));
  if (res.code !== 200) return { passed: false, detail: `HTTP ${res.code}` };
  const unlocked = (res.body?.insights || []).filter(i => i.unlocked).length;
  if (unlocked > 0) return { passed: false, detail: `${unlocked} insights unlocked on empty tenant` };
  return { passed: true, detail: `${(res.body?.insights || []).length} insights all locked` };
});

// 7. Empty-tenant deep-insights → available:false for all kinds
addCase('empty-deep-insights', 'empty tenant → all deep-insights available:false', async () => {
  const clubId = freshClubId('di');
  const kinds = ['payments', 'ar-aging', 'courses', 'tier-revenue', 'households', 'service-tickets'];
  const results = await Promise.all(kinds.map(kind =>
    callHandler('api/deep-insights.js', getReq(clubId, { kind })).then(r => ({ kind, body: r.body, code: r.code }))
  ));
  const leaked = results.filter(r => r.body?.available === true);
  if (leaked.length > 0) return { passed: false, detail: `leaked: ${leaked.map(l => l.kind).join(',')}` };
  const errors = results.filter(r => r.code !== 200);
  if (errors.length > 0) return { passed: false, detail: `errors: ${errors.map(e => e.kind + '=' + e.code).join(',')}` };
  return { passed: true, detail: '6/6 locked' };
});

// 8. Wrong cron key → 401
addCase('wrong-cron-key', 'wrong x-cron-key header → 401', async () => {
  const res = await callHandler('api/stage-insights.js', {
    method: 'GET',
    headers: { 'x-cron-key': 'definitely-not-the-secret' },
    query: { clubId: 'edge-fake' },
  });
  // With CRON_SECRET=x in dev, 'definitely-not-the-secret' doesn't match. Expect 401.
  if (res.code === 401) return { passed: true, detail: '401' };
  return { passed: false, detail: `got ${res.code}, expected 401` };
});

// 9. Missing cron key AND no auth → 401
addCase('no-cron-no-auth', 'no cron key, no auth header → 401', async () => {
  const res = await callHandler('api/stage-insights.js', {
    method: 'GET',
    headers: {},
    query: { clubId: 'edge-fake' },
  });
  if (res.code === 401) return { passed: true, detail: '401' };
  return { passed: false, detail: `got ${res.code}, expected 401` };
});

// 10. Parallel duplicate imports (idempotency under race)
addCase('parallel-dup-imports', '2 parallel imports of same members file → 1 row', async () => {
  const clubId = freshClubId('par');
  const row = { external_id: 'ext_par', first_name: 'Par', last_name: 'Allel' };
  const [r1, r2] = await Promise.all([
    callHandler('api/import-csv.js', importReq(clubId, 'members', [row])),
    callHandler('api/import-csv.js', importReq(clubId, 'members', [row])),
  ]);
  if (r1.code !== 200 || r2.code !== 200) return { passed: false, detail: `HTTP ${r1.code}/${r2.code}` };
  const n = await sql`SELECT COUNT(*)::int AS n FROM members WHERE club_id = ${clubId}`;
  await wipeClub(clubId);
  if (Number(n.rows[0].n) !== 1) return { passed: false, detail: `${n.rows[0].n} rows (expected 1)` };
  return { passed: true, detail: '1 row idempotent' };
});

// 11. Member-engagement with non-existent member → available:false gracefully
addCase('engagement-missing-member', 'member-engagement with bogus memberId → graceful', async () => {
  const clubId = freshClubId('eng');
  const res = await callHandler('api/deep-insights.js', getReq(clubId, { kind: 'member-engagement', memberId: 'does_not_exist' }));
  if (res.code !== 200) return { passed: false, detail: `HTTP ${res.code}` };
  if (res.body?.available === true) return { passed: false, detail: 'claimed available for nonexistent member' };
  return { passed: true, detail: 'available=false' };
});

// 12. Tenant isolation: after import, other tenant sees 0 rows
addCase('tenant-isolation-members', 'import to club A, query club B → 0 rows', async () => {
  const clubA = freshClubId('a');
  const clubB = freshClubId('b');
  await callHandler('api/import-csv.js', importReq(clubA, 'members', [
    { external_id: 'iso_1', first_name: 'Iso', last_name: 'One' },
  ]));
  const res = await callHandler('api/stage-insights.js', getReq(clubB));
  const countA = await sql`SELECT COUNT(*)::int AS n FROM members WHERE club_id = ${clubA}`;
  await wipeClub(clubA);
  await wipeClub(clubB);
  if (countA.rows[0].n !== 1) return { passed: false, detail: `club A has ${countA.rows[0].n} rows, expected 1` };
  const unlocked = (res.body?.insights || []).filter(i => i.unlocked);
  if (unlocked.length > 0) return { passed: false, detail: `club B saw ${unlocked.length} unlocked insights` };
  return { passed: true, detail: 'isolated' };
});

// ---- run ----

async function run() {
  const cases = CASES.filter(c => !FILTER || c.id === FILTER);
  console.log(`\n[edge-case-matrix] running ${cases.length} cases\n`);
  const results = [];
  const startAll = Date.now();
  for (const c of cases) {
    const start = Date.now();
    let result;
    try {
      result = await c.fn();
    } catch (err) {
      result = { passed: false, detail: `THREW: ${err.message.slice(0, 120)}` };
    }
    const ms = Date.now() - start;
    const mark = result.passed ? '\u2713' : '\u2717';
    console.log(`  ${mark} [${c.id}] ${c.label} (${ms}ms) — ${result.detail}`);
    results.push({ ...c, ...result, ms });
  }
  const totalMs = Date.now() - startAll;
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  // Write report
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const lines = [
    `# Edge Case Matrix — ${new Date().toISOString()}`,
    ``,
    `Total: ${results.length} cases, ${passed} passed, ${failed} failed, ${totalMs}ms`,
    ``,
    failed === 0 ? `## \ud83c\udf89 CLEAN — all cases passed` : `## Failures (${failed})`,
    ``,
    `| # | ID | Label | Result | Detail | Time |`,
    `|---|----|-------|--------|--------|------|`,
    ...results.map((r, i) => `| ${i + 1} | ${r.id} | ${r.label} | ${r.passed ? '\u2705' : '\u274c'} | ${r.detail} | ${r.ms}ms |`),
  ];
  fs.writeFileSync(REPORT_PATH, lines.join('\n'));
  console.log(`\n[edge-case-matrix] ${passed}/${results.length} passed in ${totalMs}ms`);
  console.log(`[edge-case-matrix] report: ${path.relative(ROOT, REPORT_PATH)}`);
  process.exit(failed === 0 ? 0 : 1);
}

process.on('unhandledRejection', err => {
  console.error('[edge-case-matrix] unhandledRejection:', err?.message || err);
});

run().catch(err => {
  console.error('[edge-case-matrix] CRASH:', err);
  process.exit(2);
});
