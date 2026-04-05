import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const clubId = getClubId(req);
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

export default withAuth(handler);
