import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/fix-cancel', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  try {
    // Set bookings tied to cancellation_risk back to 'confirmed'
    const r1 = await sql`
      UPDATE bookings SET status = 'confirmed'
      WHERE booking_id IN (SELECT booking_id FROM cancellation_risk)`;

    // Also create ~20 upcoming confirmed bookings for realism
    // Update their dates to be in the near future
    const r2 = await sql`
      UPDATE bookings SET
        booking_date = TO_CHAR((CURRENT_DATE + (ABS(hashtext(booking_id)) % 14 + 1) * INTERVAL '1 day')::date, 'YYYY-MM-DD'),
        check_in_time = NULL,
        round_start = NULL,
        round_end = NULL,
        duration_minutes = NULL
      WHERE booking_id IN (SELECT booking_id FROM cancellation_risk)`;

    // Verify
    const check = await sql`
      SELECT COUNT(*) AS confirmed FROM bookings WHERE status = 'confirmed'`;
    const crCheck = await sql`
      SELECT COUNT(*) AS c FROM cancellation_risk cr
      JOIN bookings b ON cr.booking_id = b.booking_id
      WHERE b.status = 'confirmed'`;

    res.status(200).json({
      ok: true,
      bookingsSetConfirmed: r1.rowCount,
      bookingsDatesUpdated: r2.rowCount,
      totalConfirmed: Number(check.rows[0].confirmed),
      cancellationRiskWithConfirmed: Number(crCheck.rows[0].c),
    });
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
