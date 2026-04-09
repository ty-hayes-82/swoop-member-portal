import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/fix-resigned-scores', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  try {
    const latestWeekResult = await sql`SELECT MAX(week_number) AS lw FROM member_engagement_weekly`;
    const latestWeek = Number(latestWeekResult.rows[0]?.lw ?? 12);

    // Resigned members should show declining engagement over time
    // Set their latest week scores to Critical range (5-25)
    const r1 = await sql`
      UPDATE member_engagement_weekly mew
      SET engagement_score = 5 + (ABS(hashtext(mew.member_id::text)) % 20),
          rounds_played = 0,
          dining_visits = 0,
          dining_spend = 0,
          events_attended = 0,
          email_open_rate = 0.02 + ((ABS(hashtext(mew.member_id::text || 'o')) % 8) / 100.0)
      FROM members m
      WHERE m.member_id = mew.member_id
        AND m.membership_status = 'resigned'
        AND mew.week_number = ${latestWeek}`;

    // Create declining trajectory: each earlier week is slightly higher
    for (let w = latestWeek - 1; w >= Math.max(1, latestWeek - 8); w--) {
      const weeksBack = latestWeek - w;
      await sql.query(`
        UPDATE member_engagement_weekly mew
        SET engagement_score = LEAST(85, 5 + (ABS(hashtext(mew.member_id::text)) % 20) + (${weeksBack} * 7)),
            email_open_rate = LEAST(0.55, 0.02 + ((ABS(hashtext(mew.member_id::text || 'o')) % 8) / 100.0) + (${weeksBack} * 0.06)),
            rounds_played = CASE WHEN ${weeksBack} >= 4 THEN 1 + (ABS(hashtext(mew.member_id::text || 'r')) % 3) ELSE 0 END,
            dining_visits = CASE WHEN ${weeksBack} >= 3 THEN 1 ELSE 0 END,
            dining_spend = CASE WHEN ${weeksBack} >= 3 THEN 40 + (ABS(hashtext(mew.member_id::text || 's')) % 80) ELSE 0 END
        FROM members m
        WHERE m.member_id = mew.member_id
          AND m.membership_status = 'resigned'
          AND mew.week_number = ${w}
      `);
    }

    // Also fix: suspended members should be in At Risk range
    await sql`
      UPDATE member_engagement_weekly mew
      SET engagement_score = 25 + (ABS(hashtext(mew.member_id::text)) % 20)
      FROM members m
      WHERE m.member_id = mew.member_id
        AND m.membership_status = 'suspended'
        AND mew.week_number = ${latestWeek}`;

    // Verify
    const check = await sql`
      SELECT m.membership_status, ROUND(AVG(mew.engagement_score)::numeric, 1) AS avg_score,
             MIN(mew.engagement_score) AS min_score, MAX(mew.engagement_score) AS max_score
      FROM members m
      JOIN member_engagement_weekly mew ON m.member_id = mew.member_id AND mew.week_number = ${latestWeek}
      GROUP BY m.membership_status`;

    res.status(200).json({ ok: true, resignedUpdated: r1.rowCount, scoresByStatus: check.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
