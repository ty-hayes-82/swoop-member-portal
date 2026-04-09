import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/seed-benchmarks', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    // Create table if not exists
    await sql`CREATE TABLE IF NOT EXISTS industry_benchmarks (
      metric_key VARCHAR(50) PRIMARY KEY,
      club_value NUMERIC(12,2),
      industry_value NUMERIC(12,2),
      unit VARCHAR(10),
      label VARCHAR(100),
      comparison_text VARCHAR(50),
      direction VARCHAR(20)
    )`;

    await sql`
      INSERT INTO industry_benchmarks (metric_key, club_value, industry_value, unit, label, comparison_text, direction) VALUES
        ('member_retention', 94.2, 88.5, '%', 'Member Retention Rate', '5.7 pts above average', 'up'),
        ('avg_health_score', 68.4, 62.0, 'pts', 'Avg Member Health Score', '6.4 pts above average', 'up'),
        ('complaint_resolution', 89.0, 71.0, '%', 'Complaint Resolution (24h)', '18 pts above average', 'up'),
        ('fb_revenue_per_member', 4200, 3100, '$', 'F&B Revenue Per Member', '35% above average', 'up'),
        ('rounds_per_member', 42, 36, '', 'Rounds Per Member/Year', '17% above average', 'up'),
        ('response_time', 4.2, 48.0, 'hrs', 'Avg Response Time', '91% faster', 'down'),
        ('event_attendance', 68, 45, '%', 'Event Participation Rate', '23 pts above average', 'up'),
        ('email_open_rate', 42, 28, '%', 'Email Open Rate', '50% above average', 'up')
      ON CONFLICT (metric_key) DO NOTHING
    `;

    res.status(200).json({ success: true, message: 'Seeded industry_benchmarks (8 rows, ON CONFLICT DO NOTHING)' });
  } catch (err) {
    console.error('/api/seed-benchmarks error:', err);
    res.status(500).json({ error: err.message });
  }
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
