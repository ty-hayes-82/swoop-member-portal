/**
 * SMS pipeline exercise script
 *
 * Drives every template type through the full send engine (consent, quiet hours,
 * rate limits, template render, sms_log write) using dry-run mode.
 *
 * Run: node scripts/test-sms-pipeline.mjs
 * Live: SMS_DRY_RUN=false node scripts/test-sms-pipeline.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*?)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

import pg from 'pg';
const { Client } = pg;
const DB_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED;
const CLUB_ID = 'seed_pinetree';
const STAFF_CLUB_ID = 'club_001';
const DRY_RUN = process.env.SMS_DRY_RUN !== 'false';

// ── helpers ─────────────────────────────────────────────────────────────────

async function sendMemberSms(opts) {
  const { sendMemberSms: fn } = await import('../api/sms/send.js');
  return fn(opts);
}
async function sendStaffSms(opts) {
  const { sendStaffSms: fn } = await import('../api/sms/send.js');
  return fn(opts);
}

let pass = 0, fail = 0, skip = 0;
async function test(label, fn) {
  try {
    const result = await fn();
    if (result?.sent === false && result?.reason) {
      console.log(`  ⚠  ${label} — skipped (${result.reason})`);
      skip++;
    } else {
      console.log(`  ✓  ${label}${DRY_RUN ? ' [simulated]' : ''}`);
      pass++;
    }
  } catch (err) {
    console.error(`  ✗  ${label}`);
    console.error(`     ${err.message}`);
    fail++;
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

console.log(`\nSMS pipeline test  [dry_run=${DRY_RUN}]`);
console.log('='.repeat(55));

// Pick an opted-in member with a phone number
const { rows: [member] } = await client.query(`
  SELECT m.member_id, m.first_name, m.last_name, m.phone
  FROM members m
  JOIN member_comm_preferences p ON p.member_id = m.member_id AND p.club_id = m.club_id
  WHERE m.club_id = $1 AND p.sms_opted_in = TRUE AND m.phone IS NOT NULL
  LIMIT 1
`, [CLUB_ID]);

if (!member) {
  console.error('No opted-in member with phone found. Run bulk-consent first.');
  process.exit(1);
}
console.log(`\nTest member: ${member.first_name} ${member.last_name} (${member.member_id})`);

// Pick a staff user with phone
const { rows: [staff] } = await client.query(`
  SELECT user_id, name, phone FROM users
  WHERE club_id = $1 AND phone IS NOT NULL AND sms_alerts_enabled = TRUE
  LIMIT 1
`, [STAFF_CLUB_ID]);
if (staff) {
  console.log(`Test staff:  ${staff.name} (${staff.user_id})`);
} else {
  console.log('Test staff:  none found (staff SMS tests will be skipped)');
}

// ── Member templates ─────────────────────────────────────────────────────────

console.log('\n── Member templates ────────────────────────────────────');

await test('dining_nudge', () => sendMemberSms({
  clubId: CLUB_ID,
  memberId: member.member_id,
  templateId: 'dining_nudge',
  variables: {
    club_name: 'Pine Tree Golf Club',
    first_name: member.first_name,
    table_info: 'the dining room',
    special_text: 'Chef\'s special: grilled salmon',
  },
}));

await test('tee_time_reminder', () => sendMemberSms({
  clubId: CLUB_ID,
  memberId: member.member_id,
  templateId: 'tee_time_reminder',
  variables: {
    club_name: 'Pine Tree Golf Club',
    first_name: member.first_name,
    slot_time: '10:30 AM',
    course: 'Championship Course',
    weather_note: 'Sunny, 72°F — great day for golf',
  },
}));

await test('dues_reminder', () => sendMemberSms({
  clubId: CLUB_ID,
  memberId: member.member_id,
  templateId: 'dues_reminder',
  variables: {
    club_name: 'Pine Tree Golf Club',
    first_name: member.first_name,
    amount: '450',
    due_date: 'the 1st',
  },
}));

await test('event_invite', () => sendMemberSms({
  clubId: CLUB_ID,
  memberId: member.member_id,
  templateId: 'event_invite',
  variables: {
    club_name: 'Pine Tree Golf Club',
    first_name: member.first_name,
    event_name: 'Member-Guest Tournament',
    event_date: 'Saturday, April 19',
    rsvp_info: 'Reply YES to reserve your spot',
  },
}));

// ── Staff templates ──────────────────────────────────────────────────────────

console.log('\n── Staff templates ─────────────────────────────────────');

if (staff) {
  await test('staff_arrival_brief', () => sendStaffSms({
    clubId: STAFF_CLUB_ID,
    userId: staff.user_id,
    templateId: 'staff_arrival_brief',
    variables: {
      club_name: 'Pinetree Country Club',
      member_name: `${member.first_name} ${member.last_name}`,
      time: '10:30 AM',
      brief: 'Prefers cart on the right. Anniversary today — mention it.',
      link: '',
    },
  }));

  await test('staff_complaint', () => sendStaffSms({
    clubId: STAFF_CLUB_ID,
    userId: staff.user_id,
    templateId: 'staff_complaint',
    variables: {
      club_name: 'Pinetree Country Club',
      member_name: `${member.first_name} ${member.last_name}`,
      health_score: '32',
      dues: '18000',
      days: '5',
      action: 'Call before 10 AM',
      link: '',
    },
  }));
} else {
  console.log('  —  staff tests skipped (no staff with phone in club_001)');
}

// ── Verify sms_log was written ────────────────────────────────────────────────

console.log('\n── sms_log verification ────────────────────────────────');
const { rows: logRows } = await client.query(`
  SELECT l.template_id, l.status, l.body,
         COALESCE(NULLIF(TRIM(COALESCE(m.first_name,'') || ' ' || COALESCE(m.last_name,'')), ''), u.name) AS name
  FROM sms_log l
  LEFT JOIN members m ON m.member_id = l.member_id
  LEFT JOIN users u ON u.user_id = l.user_id
  WHERE l.club_id IN ($1, $2) AND l.sent_at > NOW() - INTERVAL '2 minutes'
  ORDER BY l.sent_at DESC
`, [CLUB_ID, STAFF_CLUB_ID]);

if (logRows.length === 0) {
  console.error('  ✗  No rows written to sms_log in last 2 minutes');
  fail++;
} else {
  for (const row of logRows) {
    console.log(`  ✓  ${row.template_id} → ${row.name || '—'} [${row.status}]`);
    console.log(`     "${row.body.slice(0, 80)}${row.body.length > 80 ? '…' : ''}"`);
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

await client.end();
console.log(`\n${'─'.repeat(55)}`);
console.log(`Results: ${pass} passed, ${skip} skipped (expected), ${fail} failed`);
if (!DRY_RUN) console.log('Live mode: check your phone for messages.');
else console.log('To send for real: SMS_DRY_RUN=false node scripts/test-sms-pipeline.mjs');
if (fail > 0) process.exit(1);
