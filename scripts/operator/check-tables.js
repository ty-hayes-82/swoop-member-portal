import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/check-tables', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  const results = {};

  try {
    const c = await sql`SELECT COUNT(*) AS n FROM email_campaigns`;
    results.email_campaigns = parseInt(c.rows[0].n);
  } catch(e) { results.email_campaigns = 'MISSING: ' + e.message.slice(0,100); }

  try {
    const e = await sql`SELECT COUNT(*) AS n FROM email_events`;
    results.email_events = parseInt(e.rows[0].n);
  } catch(e) { results.email_events = 'MISSING: ' + e.message.slice(0,100); }

  try {
    const m = await sql`SELECT COUNT(*) AS n FROM members WHERE membership_status = 'resigned'`;
    results.resigned_members = parseInt(m.rows[0].n);
  } catch(e) { results.resigned_members = 'ERROR: ' + e.message.slice(0,100); }

  try {
    const t = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'resigned_on'`;
    results.has_resigned_on = t.rows.length > 0;
  } catch(e) { results.has_resigned_on = 'ERROR: ' + e.message.slice(0,100); }

  try {
    const s = await sql`SELECT * FROM members WHERE membership_status = 'resigned' LIMIT 3`;
    results.sample_resigned = s.rows.map(r => ({ id: r.member_id, name: r.first_name + ' ' + r.last_name, status: r.membership_status }));
  } catch(e) { results.sample_resigned = e.message.slice(0,100); }

  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    results.all_tables = tables.rows.map(r => r.table_name);
  } catch(e) { results.all_tables = e.message.slice(0,100); }

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
