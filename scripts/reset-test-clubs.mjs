// Wipes QA test clubs from Neon — scoped by club name prefix.
// Run between B-lite iterations:  node scripts/reset-test-clubs.mjs
//
// Deletes every club whose name starts with "QA Sonoran Pines" or "QA Test Club"
// and every child row reachable via club_id. Order mirrors reset-pinetree.sql.

import { readFileSync } from 'fs';
import { createPool } from '@vercel/postgres';

// Minimal .env.local loader — avoids adding dotenv as a dep.
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const NAME_PREFIXES = ['QA Sonoran Pines', 'QA Test Club'];

const CHILD_TABLES_BY_CLUB_ID = [
  'staff_shifts', 'staff', 'member_invoices',
  'email_events', 'email_campaigns',
  'event_registrations', 'event_definitions',
  'feedback', 'complaints', 'service_requests',
  'close_outs', 'booking_players', 'bookings',
  'transactions', 'members', 'households',
  'dining_outlets', 'courses', 'membership_types',
  'data_source_status',
];

async function main() {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });

  const patterns = NAME_PREFIXES.map(p => `${p}%`);
  const { rows } = await pool.query(
    `SELECT club_id, name FROM club WHERE name LIKE ANY($1::text[])`,
    [patterns],
  );

  if (rows.length === 0) {
    console.log('No QA test clubs to reset.');
    await pool.end();
    return;
  }

  console.log(`Resetting ${rows.length} test club(s):`);
  for (const row of rows) console.log(`  - ${row.club_id} (${row.name})`);

  for (const { club_id } of rows) {
    for (const table of CHILD_TABLES_BY_CLUB_ID) {
      try {
        await pool.query(`DELETE FROM ${table} WHERE club_id = $1`, [club_id]);
      } catch (err) {
        if (!/does not exist/.test(err.message)) throw err;
      }
    }
    await pool.query('DELETE FROM users WHERE club_id = $1', [club_id]).catch(() => {});
    await pool.query('DELETE FROM club WHERE club_id = $1', [club_id]);
  }

  console.log('Reset complete.');
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
