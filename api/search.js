import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // Accept clubId from auth session or query param
  let clubId = req.query.clubId;

  // Try to get clubId from auth token if available
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const result = await sql`
        SELECT s.club_id FROM sessions s WHERE s.token = ${token} AND s.expires_at > NOW()
      `;
      if (result.rows.length > 0) clubId = result.rows[0].club_id;
    } catch { /* use query param fallback */ }
  }

  if (!clubId) return res.status(200).json({ results: [] });
  // Demo mode uses seeded club_001 data
  if (clubId === 'demo') clubId = 'club_001';

  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.status(200).json({ results: [] });

  const searchTerm = `%${q}%`;

  try {
    const { rows: members } = await sql`
      SELECT member_id, first_name, last_name, email, health_score, archetype
      FROM members
      WHERE club_id = ${clubId}
        AND (LOWER(first_name || ' ' || last_name) LIKE LOWER(${searchTerm})
             OR LOWER(email) LIKE LOWER(${searchTerm}))
      LIMIT 10
    `;

    return res.status(200).json({
      results: members.map(m => ({
        type: 'member',
        id: m.member_id,
        name: `${m.first_name} ${m.last_name}`,
        email: m.email,
        healthScore: m.health_score,
        archetype: m.archetype,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
