/**
 * GET  /api/demo/db-backup          — Export seed_pinetree data as JSON (backup)
 * POST /api/demo/db-backup?action=restore — Restore from a previous backup
 * POST /api/demo/db-backup?action=snapshot — Save current state as named snapshot in DB
 * GET  /api/demo/db-backup?action=list     — List available snapshots
 *
 * The backup captures all seed_pinetree rows across every seeded table.
 * Restore truncates seed_pinetree data and re-inserts from the backup JSON.
 */
import { db } from '@vercel/postgres';

const CLUB_ID = 'seed_pinetree';

// Tables to back up in FK-safe order (same as seed-from-csv.js)
const BACKUP_TABLES = [
  { table: 'club', where: `club_id = '${CLUB_ID}'` },
  { table: 'membership_types', where: `club_id = '${CLUB_ID}'` },
  { table: 'courses', where: `club_id = '${CLUB_ID}'` },
  { table: 'dining_outlets', where: `club_id = '${CLUB_ID}'` },
  { table: 'households', where: `club_id = '${CLUB_ID}'` },
  { table: 'members', where: `club_id = '${CLUB_ID}'` },
  { table: 'bookings', where: `club_id = '${CLUB_ID}'` },
  { table: 'booking_players', where: `booking_id IN (SELECT booking_id FROM bookings WHERE club_id = '${CLUB_ID}')` },
  { table: 'pos_checks', where: `outlet_id IN (SELECT outlet_id FROM dining_outlets WHERE club_id = '${CLUB_ID}')` },
  { table: 'pos_line_items', where: `check_id IN (SELECT check_id FROM pos_checks WHERE outlet_id IN (SELECT outlet_id FROM dining_outlets WHERE club_id = '${CLUB_ID}'))` },
  { table: 'pos_payments', where: `check_id IN (SELECT check_id FROM pos_checks WHERE outlet_id IN (SELECT outlet_id FROM dining_outlets WHERE club_id = '${CLUB_ID}'))` },
  { table: 'close_outs', where: `club_id = '${CLUB_ID}'` },
  { table: 'email_campaigns', where: `club_id = '${CLUB_ID}'` },
  { table: 'email_events', where: `campaign_id IN (SELECT campaign_id FROM email_campaigns WHERE club_id = '${CLUB_ID}')` },
  { table: 'event_definitions', where: `club_id = '${CLUB_ID}'` },
  { table: 'event_registrations', where: `event_id IN (SELECT event_id FROM event_definitions WHERE club_id = '${CLUB_ID}')` },
  { table: 'feedback', where: `club_id = '${CLUB_ID}'` },
  { table: 'service_requests', where: `club_id = '${CLUB_ID}'` },
  { table: 'member_invoices', where: `club_id = '${CLUB_ID}'` },
  { table: 'staff', where: `club_id = '${CLUB_ID}'` },
  { table: 'staff_shifts', where: `club_id = '${CLUB_ID}'` },
  { table: 'member_concierge_sessions', where: `club_id = '${CLUB_ID}'` },
];

// Reverse order for deletion (respect FK dependencies)
const DELETE_ORDER = [...BACKUP_TABLES].reverse();

export default async function handler(req, res) {
  const action = req.query?.action || (req.method === 'GET' ? 'backup' : 'restore');

  if (action === 'list') {
    return await listSnapshots(res);
  }
  if (action === 'backup' && req.method === 'GET') {
    return await createBackup(res);
  }
  if (action === 'snapshot' && req.method === 'POST') {
    return await saveSnapshot(req, res);
  }
  if (action === 'restore' && req.method === 'POST') {
    return await restoreBackup(req, res);
  }

  return res.status(400).json({ error: 'Use GET for backup, POST?action=restore with body, POST?action=snapshot, or GET?action=list' });
}

async function createBackup(res) {
  const startTime = Date.now();
  const client = await db.connect();
  const backup = {};
  const counts = {};

  try {
    for (const { table, where } of BACKUP_TABLES) {
      try {
        const result = await client.query(`SELECT * FROM ${table} WHERE ${where}`);
        backup[table] = result.rows;
        counts[table] = result.rows.length;
      } catch (e) {
        backup[table] = [];
        counts[table] = `ERROR: ${e.message}`;
      }
    }

    const totalRows = Object.values(counts).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return res.status(200).json({
      success: true,
      club_id: CLUB_ID,
      total_rows: totalRows,
      elapsed_seconds: Number(elapsed),
      counts,
      backup,
      created_at: new Date().toISOString(),
    });
  } finally {
    client.release();
  }
}

async function saveSnapshot(req, res) {
  const name = req.body?.name || `snapshot_${Date.now()}`;
  const client = await db.connect();

  try {
    // Ensure snapshot table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS db_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        club_id TEXT NOT NULL,
        data JSONB NOT NULL,
        row_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Collect data
    const backup = {};
    let totalRows = 0;
    for (const { table, where } of BACKUP_TABLES) {
      try {
        const result = await client.query(`SELECT * FROM ${table} WHERE ${where}`);
        backup[table] = result.rows;
        totalRows += result.rows.length;
      } catch {
        backup[table] = [];
      }
    }

    const snapshotId = `snap_${Date.now()}`;
    await client.query(
      `INSERT INTO db_snapshots (snapshot_id, name, club_id, data, row_count)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (snapshot_id) DO NOTHING`,
      [snapshotId, name, CLUB_ID, JSON.stringify(backup), totalRows]
    );

    return res.status(200).json({
      success: true,
      snapshot_id: snapshotId,
      name,
      total_rows: totalRows,
    });
  } finally {
    client.release();
  }
}

async function listSnapshots(res) {
  const client = await db.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS db_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        club_id TEXT NOT NULL,
        data JSONB NOT NULL,
        row_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const result = await client.query(
      `SELECT snapshot_id, name, club_id, row_count, created_at FROM db_snapshots ORDER BY created_at DESC LIMIT 20`
    );
    return res.status(200).json({ snapshots: result.rows });
  } finally {
    client.release();
  }
}

async function restoreBackup(req, res) {
  const startTime = Date.now();

  // Accept backup data from body or snapshot_id to restore from DB
  let backup;
  if (req.body?.snapshot_id) {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT data FROM db_snapshots WHERE snapshot_id = $1`,
        [req.body.snapshot_id]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: `Snapshot ${req.body.snapshot_id} not found` });
      }
      backup = result.rows[0].data;
    } finally {
      client.release();
    }
  } else if (req.body?.backup) {
    backup = req.body.backup;
  } else {
    return res.status(400).json({ error: 'Provide { snapshot_id: "..." } or { backup: {...} }' });
  }

  const client = await db.connect();
  const counts = {};
  const errors = [];

  try {
    await client.query('BEGIN');

    // Step 1: Delete existing seed_pinetree data in reverse FK order
    for (const { table, where } of DELETE_ORDER) {
      try {
        await client.query(`SAVEPOINT sp_del`);
        await client.query(`DELETE FROM ${table} WHERE ${where}`);
        await client.query(`RELEASE SAVEPOINT sp_del`);
      } catch {
        await client.query(`ROLLBACK TO SAVEPOINT sp_del`);
      }
    }

    // Step 2: Re-insert from backup in FK-safe order
    for (const { table } of BACKUP_TABLES) {
      const rows = backup[table];
      if (!rows || !rows.length) {
        counts[table] = 0;
        continue;
      }

      let inserted = 0;
      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(', ');

      // Batch insert in chunks of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const valueClauses = [];
        const params = [];
        let paramIdx = 1;

        for (const row of batch) {
          const placeholders = columns.map(() => `$${paramIdx++}`);
          valueClauses.push(`(${placeholders.join(',')})`);
          params.push(...columns.map(c => row[c] ?? null));
        }

        try {
          await client.query(`SAVEPOINT sp_ins`);
          await client.query(
            `INSERT INTO ${table} (${colNames}) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`,
            params
          );
          await client.query(`RELEASE SAVEPOINT sp_ins`);
          inserted += batch.length;
        } catch (e) {
          await client.query(`ROLLBACK TO SAVEPOINT sp_ins`);
          errors.push(`${table}: ${e.message}`);
        }
      }
      counts[table] = inserted;
    }

    await client.query('COMMIT');

    const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return res.status(200).json({
      success: true,
      club_id: CLUB_ID,
      total_rows: totalRows,
      elapsed_seconds: Number(elapsed),
      counts,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* */ }
    return res.status(500).json({ success: false, error: e.message, errors });
  } finally {
    client.release();
  }
}
