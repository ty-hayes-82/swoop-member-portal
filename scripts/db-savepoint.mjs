// Tenant-scoped database save points for E2E iteration.
//
// Usage:
//   node scripts/db-savepoint.mjs create <name> <clubId>   — snapshot all tenant rows
//   node scripts/db-savepoint.mjs restore <name> <clubId>  — wipe + restore from snapshot
//   node scripts/db-savepoint.mjs list                     — list existing save points
//   node scripts/db-savepoint.mjs drop <name>              — delete a save point
//
// The point: after you've done the slow work of signup + CSV import for one
// data type (members), snapshot. If the next data type (tee sheet) breaks
// mid-iteration, you restore in seconds instead of re-running signup +
// members import from scratch.
//
// Save points are stored as tables named `snap__<name>__<table>` in the
// public schema. They hold exactly the rows belonging to the given clubId.

import { readFileSync } from 'fs';
import { createPool } from '@vercel/postgres';

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

// Tables that carry tenant data in FK order. Parent → child at the top,
// leaves at the bottom. Matches seed/reset-pinetree.sql order but
// parameterised by club_id instead of hardcoded to 'seed_pinetree'.
const TENANT_TABLES = [
  'club',
  'courses', 'membership_types', 'dining_outlets', 'households',
  'members',
  'bookings', 'booking_players',
  'transactions', 'feedback', 'complaints', 'service_requests',
  'email_campaigns', 'email_events',
  'event_definitions', 'event_registrations',
  'staff', 'staff_shifts',
  'member_invoices',
  'data_source_status',
];

function snapName(name, table) {
  return `snap__${name.replace(/[^a-z0-9_]/gi, '_')}__${table}`;
}

async function withPool(fn) {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });
  try { return await fn(pool); } finally { await pool.end(); }
}

async function tableExists(pool, name) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name],
  );
  return rows.length > 0;
}

async function cmdCreate(name, clubId) {
  if (!name || !clubId) throw new Error('create requires <name> <clubId>');
  await withPool(async (pool) => {
    for (const table of TENANT_TABLES) {
      if (!(await tableExists(pool, table))) continue;
      const snap = snapName(name, table);
      await pool.query(`DROP TABLE IF EXISTS "${snap}"`);
      // Column name depends on the table. Most carry club_id; `club` uses its PK.
      const idCol = table === 'club' ? 'club_id' : 'club_id';
      const whereClause = `"${idCol}" = $1`;
      try {
        const res = await pool.query(
          `CREATE TABLE "${snap}" AS SELECT * FROM "${table}" WHERE ${whereClause}`,
          [clubId],
        );
        console.log(`  + ${table.padEnd(28)} → ${snap} (${res.rowCount ?? '?'} rows)`);
      } catch (err) {
        // Some tables may not have club_id (e.g. linked via parent). Skip.
        if (/column .* does not exist/i.test(err.message)) {
          console.log(`  ~ ${table}: no club_id column, skipped`);
          await pool.query(`DROP TABLE IF EXISTS "${snap}"`);
        } else {
          throw err;
        }
      }
    }
    console.log(`Save point "${name}" created for club ${clubId}.`);
  });
}

async function cmdRestore(name, clubId) {
  if (!name || !clubId) throw new Error('restore requires <name> <clubId>');
  await withPool(async (pool) => {
    // Wipe current tenant rows in reverse FK order
    for (const table of [...TENANT_TABLES].reverse()) {
      if (!(await tableExists(pool, table))) continue;
      try {
        await pool.query(`DELETE FROM "${table}" WHERE club_id = $1`, [clubId]);
      } catch (err) {
        if (!/column .* does not exist/i.test(err.message)) throw err;
      }
    }
    // Re-insert from snapshot in forward FK order
    for (const table of TENANT_TABLES) {
      const snap = snapName(name, table);
      if (!(await tableExists(pool, snap))) continue;
      const res = await pool.query(`INSERT INTO "${table}" SELECT * FROM "${snap}"`);
      console.log(`  ← ${table.padEnd(28)} (${res.rowCount ?? '?'} rows restored)`);
    }
    console.log(`Save point "${name}" restored for club ${clubId}.`);
  });
}

async function cmdList() {
  await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_name LIKE 'snap__%'
       ORDER BY table_name`,
    );
    if (rows.length === 0) { console.log('No save points.'); return; }
    const byName = new Map();
    for (const r of rows) {
      const m = r.table_name.match(/^snap__(.+?)__(.+)$/);
      if (!m) continue;
      if (!byName.has(m[1])) byName.set(m[1], []);
      byName.get(m[1]).push(m[2]);
    }
    for (const [name, tables] of byName) {
      console.log(`  ${name}: ${tables.length} tables (${tables.slice(0, 5).join(', ')}${tables.length > 5 ? '…' : ''})`);
    }
  });
}

async function cmdDrop(name) {
  if (!name) throw new Error('drop requires <name>');
  await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_name LIKE $1`,
      [`snap__${name}__%`],
    );
    for (const r of rows) await pool.query(`DROP TABLE IF EXISTS "${r.table_name}"`);
    console.log(`Dropped ${rows.length} snapshot tables for "${name}".`);
  });
}

// Persist the active session (token + user) alongside the save point so a
// dining-only rerun can inject it into localStorage and skip signup.
//
// IMPORTANT: session JSON lives OUTSIDE the project root (in the user home
// dir). If it lived under tests/fixtures/, Vite's dev-server file watcher
// would broadcast an HMR reload when we wrote it, destroying the Playwright
// page context mid-test. That happened in run 27.
async function cmdCreateWithSession(name, clubId) {
  const { writeFileSync, mkdirSync } = await import('fs');
  const { homedir } = await import('os');
  const { join } = await import('path');
  await cmdCreate(name, clubId);
  await withPool(async (pool) => {
    // Pull the most recent active session for this club from the `sessions` table
    const { rows } = await pool.query(
      `SELECT s.token, s.user_id, s.role, u.email, u.name, c.name AS club_name
       FROM sessions s
       LEFT JOIN users u ON u.user_id = s.user_id
       LEFT JOIN club c ON c.club_id = s.club_id
       WHERE s.club_id = $1 AND s.expires_at > NOW()
       ORDER BY s.expires_at DESC
       LIMIT 1`,
      [clubId],
    );
    if (rows.length === 0) {
      console.log('  ! no active session — dining-only rerun will need to re-sign-in');
      return;
    }
    const s = rows[0];
    const savepointDir = join(homedir(), '.swoop-savepoints');
    mkdirSync(savepointDir, { recursive: true });
    const sessionFile = join(savepointDir, `${name.replace(/[^a-z0-9_]/gi, '_')}.json`);
    writeFileSync(sessionFile, JSON.stringify({
      savepoint: name,
      clubId,
      token: s.token,
      userId: s.user_id,
      userName: s.name,
      userEmail: s.email,
      clubName: s.club_name,
      role: s.role || 'gm',
    }, null, 2));
    console.log(`  wrote ${sessionFile}`);
  });
}

const [, , cmd, ...args] = process.argv;
const handlers = { create: cmdCreateWithSession, restore: cmdRestore, list: cmdList, drop: cmdDrop };
const handler = handlers[cmd];
if (!handler) {
  console.error(`Usage: node scripts/db-savepoint.mjs <create|restore|list|drop> [args...]`);
  process.exit(1);
}
handler(...args).catch(e => { console.error(e.message); process.exit(1); });
