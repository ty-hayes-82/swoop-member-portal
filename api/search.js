import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // clubId comes from the authenticated session (swoop_admin can override via
  // ?clubId=... handled in getReadClubId). Never trust raw req.query.clubId.
  let clubId = getReadClubId(req);
  if (!clubId) return res.status(200).json({ results: [] });
  // Demo mode uses seeded club_001 data
  if (clubId === 'demo') clubId = 'club_001';

  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.status(200).json({ results: [] });

  const searchTerm = `%${q}%`;

  try {
    const { rows: members } = await sql`
      SELECT member_id, first_name, last_name, email, health_score, health_tier, archetype, annual_dues, membership_type
      FROM members
      WHERE club_id = ${clubId}
        AND (LOWER(first_name || ' ' || last_name) LIKE LOWER(${searchTerm})
             OR LOWER(email) LIKE LOWER(${searchTerm})
             OR LOWER(COALESCE(external_id, '')) LIKE LOWER(${searchTerm}))
      ORDER BY
        CASE WHEN LOWER(first_name) LIKE LOWER(${searchTerm}) THEN 0 ELSE 1 END,
        last_name, first_name
      LIMIT 20
    `;

    return res.status(200).json({
      results: members.map(m => ({
        type: 'member',
        id: m.member_id,
        memberId: m.member_id,
        name: `${m.first_name} ${m.last_name}`,
        email: m.email,
        healthScore: m.health_score,
        tier: m.health_tier,
        archetype: m.archetype,
        annualDues: m.annual_dues,
        membershipType: m.membership_type,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
