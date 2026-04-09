import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/debug-db', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const [membersByStatus, healthTiers, scoreStats, distinctMembers, weeklyCounts, sampleMembers, atRiskSample] = await Promise.all([
      sql`SELECT COUNT(*) AS total, membership_status FROM members GROUP BY membership_status`,
      sql`
        SELECT
          COUNT(*) AS cnt,
          CASE
            WHEN e.engagement_score >= 70 THEN 'Healthy'
            WHEN e.engagement_score >= 50 THEN 'Watch'
            WHEN e.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END AS tier
        FROM member_engagement_weekly e
        WHERE e.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        GROUP BY tier
      `,
      sql`
        SELECT
          AVG(engagement_score) AS avg_score,
          MIN(engagement_score) AS min_score,
          MAX(engagement_score) AS max_score,
          COUNT(*)
        FROM member_engagement_weekly
        WHERE week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
      `,
      sql`SELECT COUNT(DISTINCT member_id) AS distinct_members FROM member_engagement_weekly`,
      sql`SELECT week_number, COUNT(*) FROM member_engagement_weekly GROUP BY week_number ORDER BY week_number`,
      sql`SELECT member_id, first_name, last_name, annual_dues, archetype FROM members WHERE membership_status = 'active' LIMIT 10`,
      sql`
        SELECT
          m.member_id,
          m.first_name,
          m.last_name,
          m.annual_dues,
          w.engagement_score
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
          AND w.engagement_score < 50
          AND m.membership_status = 'active'
        ORDER BY w.engagement_score
        LIMIT 10
      `,
    ]);

    res.status(200).json({
      membersByStatus: membersByStatus.rows,
      engagementTiers: healthTiers.rows,
      latestWeekScoreStats: scoreStats.rows[0] ?? null,
      distinctMemberCount: distinctMembers.rows[0]?.distinct_members ?? 0,
      weeklyObservationCounts: weeklyCounts.rows,
      sampleMembers: sampleMembers.rows,
      atRiskSample: atRiskSample.rows,
    });
  } catch (error) {
    console.error('debug-db error', error);
    res.status(500).json({ error: error.message });
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
