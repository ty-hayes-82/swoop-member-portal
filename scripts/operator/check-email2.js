import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/check-email2', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  const results = {};
  try {
    // Direct test of the heatmap query
    const test = await sql`
      SELECT
        ec.subject,
        m.archetype,
        COUNT(*) FILTER (WHERE ee.event_type = 'sent') AS sends,
        COUNT(*) FILTER (WHERE ee.event_type = 'opened') AS opens
      FROM email_campaigns ec
      JOIN email_events ee ON ec.campaign_id = ee.campaign_id
      JOIN members m ON ee.member_id::text = m.member_id::text
      GROUP BY ec.campaign_id, ec.subject, m.archetype
      ORDER BY sends DESC
      LIMIT 5
    `;
    results.heatmap_test = test.rows;
  } catch(e) { results.heatmap_test_error = e.message; }

  try {
    // Check campaign_id types
    const campType = await sql`SELECT campaign_id, pg_typeof(campaign_id) AS t FROM email_campaigns LIMIT 1`;
    const evtType = await sql`SELECT campaign_id, pg_typeof(campaign_id) AS t FROM email_events LIMIT 1`;
    results.campaign_id_types = {
      campaigns: campType.rows[0],
      events: evtType.rows[0],
    };
  } catch(e) { results.type_error = e.message; }

  try {
    // Simple count test
    const joinTest = await sql`
      SELECT COUNT(*) AS n
      FROM email_events ee
      WHERE ee.campaign_id IN (SELECT campaign_id FROM email_campaigns)
    `;
    results.matching_events = parseInt(joinTest.rows[0].n);
  } catch(e) { results.match_error = e.message; }

  try {
    // Check member join
    const memberJoin = await sql`
      SELECT COUNT(*) AS n
      FROM email_events ee
      JOIN members m ON ee.member_id::text = m.member_id::text
    `;
    results.member_join_count = parseInt(memberJoin.rows[0].n);
  } catch(e) { results.member_join_error = e.message; }

  res.status(200).json(results);
}

// CLI entry point — run directly via `ALLOW_DEBUG=true node scripts/operator/<file>`
import { fileURLToPath as __cliFileURLToPath } from 'node:url';
import { readFileSync as __cliReadFileSync, existsSync as __cliExistsSync } from 'node:fs';
import { dirname as __cliDirname, join as __cliJoin, resolve as __cliResolve } from 'node:path';
if (process.argv[1] === __cliFileURLToPath(import.meta.url)) {
  // Load .env.local if POSTGRES_URL not already set
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    const __cliRepoRoot = __cliResolve(__cliDirname(__cliFileURLToPath(import.meta.url)), '..', '..');
    const __cliEnvFile = __cliJoin(__cliRepoRoot, '.env.local');
    if (__cliExistsSync(__cliEnvFile)) {
      const __cliRaw = __cliReadFileSync(__cliEnvFile, 'utf8');
      for (const __cliLine of __cliRaw.split(/\r?\n/)) {
        const __cliM = __cliLine.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!__cliM) continue;
        let __cliVal = __cliM[2];
        if ((__cliVal.startsWith('"') && __cliVal.endsWith('"')) ||
            (__cliVal.startsWith("'") && __cliVal.endsWith("'"))) {
          __cliVal = __cliVal.slice(1, -1);
        }
        if (!process.env[__cliM[1]]) process.env[__cliM[1]] = __cliVal;
      }
    }
  }
  const __cliMockReq = { method: 'POST', query: {}, body: {}, headers: {} };
  const __cliMockRes = {
    statusCode: 200,
    _body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this._body = b; console.log(JSON.stringify(b, null, 2)); return this; },
    send(b) { this._body = b; return this; },
    setHeader() { return this; },
    end() { return this; },
  };
  handler(__cliMockReq, __cliMockRes).then(() => {
    const ok = __cliMockRes.statusCode >= 200 && __cliMockRes.statusCode < 300;
    if (ok) console.log('OK');
    else console.error(`FAILED: HTTP ${__cliMockRes.statusCode}`);
    process.exit(ok ? 0 : 1);
  }).catch((err) => {
    console.error('FAILED:', err && err.message ? err.message : err);
    process.exit(1);
  });
}
