import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const systems = await sql`SELECT * FROM connected_systems ORDER BY vendor_name`;

    res.status(200).json({
      systems: systems.rows.map(s => ({
        id: s.system_id,
        name: s.vendor_name,
        category: s.category,
        status: s.status,
        lastSync: s.last_sync,
        dataPointsSynced: Number(s.data_points_synced ?? 0),
        config: s.config,
      })),
    });
  } catch (err) {
    console.error('/api/integrations error:', err);
    res.status(500).json({ error: err.message });
  }
}
