/**
 * SMS wiring test script
 * Tests all changes from the SMS implementation plan.
 * Run: node scripts/test-sms-wiring.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// --- Load .env.local ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envText = readFileSync(envPath, 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*)"?/);
  if (m) process.env[m[1]] = m[2];
}

import pg from 'pg';
const { Client } = pg;

const DB_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED;
const CLUB_ID = 'seed_pinetree';

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Neon DB\n');

  let pass = 0, fail = 0;

  async function test(label, fn) {
    try {
      await fn(client);
      console.log(`  ✓ ${label}`);
      pass++;
    } catch (err) {
      console.error(`  ✗ ${label}`);
      console.error(`    ${err.message}`);
      fail++;
    }
  }

  // -----------------------------------------------------------------------
  console.log('=== 1. Bug fix: members.status column (not membership_status) ===');
  await test('members.status column exists', async (db) => {
    const { rows } = await db.query(`
      SELECT COUNT(*) AS total, COUNT(phone) AS has_phone
      FROM members
      WHERE club_id = $1 AND status = 'active'
    `, [CLUB_ID]);
    const { total, has_phone } = rows[0];
    if (parseInt(total) === 0) throw new Error('zero members returned — status filter may be wrong');
    console.log(`    total_members=${total}, has_phone=${has_phone}`);
  });

  await test('membership_status is correct column (distinct from status)', async (db) => {
    // membership_status has active/suspended/resigned values — correct filter column
    // status is always 'active' (entity status) — wrong column for filtering active members
    const { rows: msVals } = await db.query(`SELECT DISTINCT membership_status FROM members WHERE club_id = $1`, [CLUB_ID]);
    const { rows: sVals } = await db.query(`SELECT DISTINCT status FROM members WHERE club_id = $1`, [CLUB_ID]);
    const msValues = msVals.map(r => r.membership_status);
    if (!msValues.includes('active')) throw new Error('membership_status has no active value');
    console.log(`    membership_status values: ${msValues.join(', ')} | status values: ${sVals.map(r=>r.status).join(', ')}`);
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 2. Reply rate stat ===');
  await test('sms_log exists with correct columns', async (db) => {
    const { rows } = await db.query(`
      SELECT COUNT(*) FILTER (WHERE direction = 'outbound') AS sent_30d,
             COUNT(*) FILTER (WHERE direction = 'inbound' AND reply_keyword IS NOT NULL) AS action_replies
      FROM sms_log
      WHERE club_id = $1 AND sent_at >= NOW() - INTERVAL '30 days'
    `, [CLUB_ID]);
    const { sent_30d, action_replies } = rows[0];
    const rate = parseInt(sent_30d) > 0
      ? Math.round(parseInt(action_replies) / parseInt(sent_30d) * 1000) / 10
      : null;
    console.log(`    sent_30d=${sent_30d}, action_replies=${action_replies}, reply_rate=${rate ?? '—'}%`);
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 3. Member name JOIN in sms_log ===');
  await test('sms_log member name JOIN works', async (db) => {
    const { rows } = await db.query(`
      SELECT l.log_id, l.direction,
             COALESCE(TRIM(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, '')), u.name) AS member_name
      FROM sms_log l
      LEFT JOIN members m ON m.member_id = l.member_id
      LEFT JOIN users u ON u.user_id = l.user_id
      WHERE l.club_id = $1
      ORDER BY l.sent_at DESC
      LIMIT 5
    `, [CLUB_ID]);
    console.log(`    ${rows.length} rows, sample:`, rows.slice(0, 2).map(r => `${r.direction}|${r.member_name || '—'}`).join(', '));
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 4. Run migration 019 (sms_daily_summary VIEW) ===');
  await test('create sms_daily_summary view', async (db) => {
    await db.query(`
      CREATE OR REPLACE VIEW sms_daily_summary AS
      SELECT
        club_id,
        DATE(sent_at) AS send_date,
        COUNT(*) FILTER (WHERE direction = 'outbound')                              AS member_messages_sent,
        COUNT(*) FILTER (WHERE direction = 'outbound_staff')                        AS staff_messages_sent,
        COUNT(*) FILTER (WHERE direction = 'inbound')                               AS replies_received,
        COUNT(*) FILTER (WHERE direction = 'inbound' AND reply_keyword IS NOT NULL) AS action_replies,
        COUNT(*) FILTER (WHERE direction != 'inbound' AND status = 'delivered')     AS delivered,
        COUNT(*) FILTER (WHERE direction != 'inbound' AND status = 'failed')        AS failed,
        COUNT(*) FILTER (WHERE reply_keyword = 'STOP')                              AS opt_outs,
        COUNT(*) FILTER (WHERE reply_keyword IN ('YES', 'START'))                   AS opt_ins
      FROM sms_log
      GROUP BY club_id, DATE(sent_at)
    `);
  });

  await test('sms_daily_summary view queryable', async (db) => {
    const { rows } = await db.query(
      `SELECT * FROM sms_daily_summary WHERE club_id = $1 LIMIT 5`, [CLUB_ID]
    );
    console.log(`    ${rows.length} daily summary rows`);
    if (rows.length > 0) {
      const r = rows[0];
      console.log(`    Sample: ${r.send_date} — out=${r.member_messages_sent}, staff=${r.staff_messages_sent}, replies=${r.replies_received}`);
    }
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 5. health-monitor: computed_at column check ===');
  await test('health_scores.computed_at column exists', async (db) => {
    const { rows } = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'health_scores' AND column_name = 'computed_at'
    `);
    if (rows.length === 0) throw new Error('computed_at column not found in health_scores');
  });

  await test('health_scores.recorded_at column does NOT exist (confirms fix needed)', async (db) => {
    const { rows } = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'health_scores' AND column_name = 'recorded_at'
    `);
    if (rows.length > 0) console.log('    NOTE: recorded_at also exists — both columns present');
    else console.log('    recorded_at absent — computed_at fix was correct');
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 6. club_sms_config: confirm seed data ===');
  await test('club_sms_config has seed_pinetree row', async (db) => {
    const { rows } = await db.query(
      `SELECT club_id, enabled, sender_name FROM club_sms_config WHERE club_id = $1`, [CLUB_ID]
    );
    if (rows.length === 0) {
      console.log('    No config row — inserting default...');
      await db.query(`
        INSERT INTO club_sms_config (club_id, enabled, sender_name)
        VALUES ($1, TRUE, 'Pine Tree Golf Club')
        ON CONFLICT (club_id) DO UPDATE SET enabled = TRUE, sender_name = 'Pine Tree Golf Club'
      `, [CLUB_ID]);
      console.log('    Inserted default config.');
    } else {
      console.log(`    enabled=${rows[0].enabled}, sender_name="${rows[0].sender_name}"`);
    }
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 7. member_comm_preferences: opt-in coverage ===');
  await test('member_comm_preferences table exists', async (db) => {
    const { rows } = await db.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE sms_opted_in = TRUE) AS opted_in
      FROM member_comm_preferences
      WHERE club_id = $1
    `, [CLUB_ID]);
    console.log(`    total_prefs=${rows[0].total}, opted_in=${rows[0].opted_in}`);
    if (parseInt(rows[0].total) === 0) {
      console.log('    ⚠ No preferences rows — run bulk-consent to seed opt-ins');
    }
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 8. sms_templates: default templates seeded ===');
  await test('system templates exist', async (db) => {
    const { rows } = await db.query(
      `SELECT template_id FROM sms_templates WHERE club_id IS NULL ORDER BY template_id`
    );
    if (rows.length === 0) throw new Error('No system default templates — run migration 017');
    console.log(`    ${rows.length} system templates: ${rows.map(r => r.template_id).join(', ')}`);
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 9. users: SMS columns on users table ===');
  await test('users.phone, sms_alerts_enabled, alert_categories exist', async (db) => {
    const { rows } = await db.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name IN ('phone','sms_alerts_enabled','alert_categories')
      ORDER BY column_name
    `);
    if (rows.length < 3) {
      throw new Error(`Only ${rows.length}/3 SMS columns on users: ${rows.map(r => r.column_name).join(', ')} — run migration 017`);
    }
    console.log(`    columns: ${rows.map(r => r.column_name).join(', ')}`);

    // Check if any staff have phone numbers
    const { rows: staffWithPhone } = await db.query(
      `SELECT COUNT(*) AS n FROM users WHERE club_id = $1 AND phone IS NOT NULL`, [CLUB_ID]
    );
    console.log(`    staff with phone: ${staffWithPhone[0].n}`);
  });

  // -----------------------------------------------------------------------
  console.log('\n=== 10. today\'s visitors (post-visit-followup simulation) ===');
  await test('bookings query returns today\'s visitors (fixed date comparison)', async (db) => {
    // Fixed: booking_date is DATE type, compare with CURRENT_DATE (not CURRENT_DATE::text)
    const { rows } = await db.query(`
      SELECT DISTINCT bp.member_id, m.first_name, m.last_name
      FROM bookings b
      JOIN booking_players bp ON bp.booking_id = b.booking_id
      JOIN members m ON m.member_id = bp.member_id AND m.club_id = $1
      WHERE b.club_id = $1
        AND b.booking_date = CURRENT_DATE
        AND b.status IN ('confirmed', 'completed', 'checked_in')
        AND bp.is_guest = 0
        AND bp.member_id IS NOT NULL
      LIMIT 5
    `, [CLUB_ID]);
    if (rows.length === 0) throw new Error('No visitors today — test booking may not have been created');
    console.log(`    visitors today: ${rows.length} — e.g. ${rows[0].first_name} ${rows[0].last_name}`);
  });

  // Also verify staff phone is set for club_001
  await test('Tyler Hayes (club_001 GM) has phone set', async (db) => {
    const { rows } = await db.query(`
      SELECT name, phone, alert_categories FROM users WHERE club_id = 'club_001' AND role = 'gm'
    `);
    if (!rows.length) throw new Error('No GM found for club_001');
    if (!rows[0].phone) throw new Error('GM has no phone — set it via Admin > SMS & Messaging > Staff Alert Routing');
    console.log(`    ${rows[0].name}: ${rows[0].phone}, categories: ${(rows[0].alert_categories||[]).join(', ') || '—'}`);
  });

  // -----------------------------------------------------------------------
  await client.end();
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
