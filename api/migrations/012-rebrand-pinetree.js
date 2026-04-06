/**
 * Migration 012 — Rebrand club_001 from Oakmont Hills to Pinetree Country Club
 * Updates the club record and any references in the database.
 *
 * Callable as API: GET /api/migrations/012-rebrand-pinetree
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Update club record
    const result = await sql`
      UPDATE club SET
        name = 'Pinetree Country Club',
        city = 'Kennesaw',
        state = 'GA',
        zip = '30144'
      WHERE club_id = 'club_001'
      RETURNING *
    `;

    // Update waitlist_config if it still uses 'oakmont' as PK
    try {
      await sql`UPDATE waitlist_config SET club_id = 'club_001' WHERE club_id = 'oakmont'`;
    } catch { /* may not exist or already updated */ }

    // Also update users table email domain if needed
    try {
      await sql`UPDATE users SET email = REPLACE(email, '@oakmonthills.com', '@pinetreecc.com') WHERE email LIKE '%@oakmonthills.com'`;
    } catch { /* may not exist */ }

    return res.status(200).json({
      success: true,
      message: 'club_001 rebranded to Pinetree Country Club, Kennesaw GA',
      club: result.rows[0] || null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
