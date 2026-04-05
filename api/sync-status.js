/**
 * Data Sync Status API — Sprint 1
 * GET /api/sync-status?clubId=xxx
 *
 * Returns the status of all data syncs for a club,
 * including last successful sync per source type.
 */
import { sql } from '@vercel/postgres';
import { withAuth } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { clubId } = req.query;
  if (!clubId) {
    return res.status(400).json({ error: 'clubId is required' });
  }

  try {
    // Get latest sync per source type
    const latestSyncs = await sql`
      SELECT DISTINCT ON (source_type)
        source_type, status, records_processed, records_failed,
        error_message, started_at, completed_at
      FROM data_syncs
      WHERE club_id = ${clubId}
      ORDER BY source_type, started_at DESC
    `;

    // Get member count
    const memberCount = await sql`
      SELECT COUNT(*) as count FROM members WHERE club_id = ${clubId}
    `;

    // Get recent import history
    const recentImports = await sql`
      SELECT import_id, import_type, status, total_rows, success_rows, error_rows, started_at, completed_at
      FROM csv_imports
      WHERE club_id = ${clubId}
      ORDER BY started_at DESC
      LIMIT 10
    `;

    res.status(200).json({
      clubId,
      memberCount: memberCount.rows[0]?.count || 0,
      syncs: latestSyncs.rows,
      recentImports: recentImports.rows,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}, { roles: ['swoop_admin'] });
