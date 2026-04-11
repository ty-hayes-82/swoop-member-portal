import { sql } from '@vercel/postgres';
import { cors } from '../../api/lib/cors.js';
import { logWarn } from '../../api/lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/seed-tee-sheet-ops', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    // Create tables if not exists
    await sql`CREATE TABLE IF NOT EXISTS booking_confirmations (
      confirmation_id VARCHAR(50) PRIMARY KEY,
      booking_id VARCHAR(50),
      member_id VARCHAR(20),
      member_name VARCHAR(100),
      tee_time VARCHAR(100),
      cancel_probability NUMERIC(3,2),
      outreach_status VARCHAR(20) DEFAULT 'pending',
      outreach_channel VARCHAR(20),
      staff_notes TEXT,
      contacted_at TIMESTAMPTZ,
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS slot_reassignments (
      reassignment_id VARCHAR(50) PRIMARY KEY,
      source_booking_id VARCHAR(50),
      source_slot VARCHAR(100),
      source_member_id VARCHAR(20),
      source_member_name VARCHAR(100),
      recommended_fill_member_id VARCHAR(20),
      recommended_fill_member_name VARCHAR(100),
      status VARCHAR(20) DEFAULT 'pending',
      staff_decision TEXT,
      revenue_recovered NUMERIC(8,2),
      health_before INT,
      health_after INT,
      decided_at TIMESTAMPTZ,
      audit_trail JSONB DEFAULT '[]'
    )`;
    await sql`CREATE TABLE IF NOT EXISTS waitlist_config (
      club_id VARCHAR(20) PRIMARY KEY DEFAULT 'club_001',
      hold_time_minutes INT DEFAULT 30,
      auto_offer_threshold NUMERIC(3,2) DEFAULT 0.80,
      max_offers INT DEFAULT 3,
      notification_limit INT DEFAULT 2
    )`;

    // Seed booking_confirmations
    await sql`INSERT INTO booking_confirmations (confirmation_id, member_id, member_name, booking_id, tee_time, cancel_probability, outreach_status, outreach_channel, staff_notes, created_at)
      VALUES
        ('conf_001', 'mbr_t01', 'James Whitfield', 'bkg_sat_0920', 'Sat 9:20 AM', 0.42, 'pending', NULL, NULL, NOW()),
        ('conf_002', 'mbr_t04', 'Anne Jordan', 'bkg_sat_0700', 'Sat 7:00 AM', 0.28, 'contacted', 'sms', NULL, NOW()),
        ('conf_003', 'mbr_t05', 'Robert Callahan', 'bkg_sat_1040', 'Sat 10:40 AM', 0.35, 'pending', NULL, NULL, NOW()),
        ('conf_004', 'mbr_t06', 'David Chen', 'bkg_sat_0800', 'Sat 8:00 AM', 0.15, 'confirmed', NULL, NULL, NOW())
      ON CONFLICT (confirmation_id) DO NOTHING`;

    // Seed slot_reassignments
    await sql`INSERT INTO slot_reassignments (reassignment_id, source_booking_id, source_slot, source_member_id, source_member_name, recommended_fill_member_id, recommended_fill_member_name, status, revenue_recovered, health_before, health_after)
      VALUES
        ('rea_001', 'bkg_sat_0700', 'Sat 7:00 AM', 'mbr_t04', 'Anne Jordan', 'mbr_012', 'George Whitaker', 'pending', 312, 28, 42),
        ('rea_002', 'bkg_sat_1400', 'Sat 2:00 PM (cancelled)', 'mbr_xxx', 'Cancelled Member', 'mbr_t04', 'Anne Jordan', 'pending', 312, 71, 74)
      ON CONFLICT (reassignment_id) DO NOTHING`;

    // Seed waitlist_config
    await sql`INSERT INTO waitlist_config (club_id, hold_time_minutes, auto_offer_threshold, max_offers, notification_limit)
      VALUES
        ('club_001', 30, 0.80, 3, 2)
      ON CONFLICT (club_id) DO NOTHING`;

    res.status(200).json({ ok: true, message: 'Tee sheet ops seed data inserted.' });
  } catch (err) {
    console.error('/api/seed-tee-sheet-ops error:', err);
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
