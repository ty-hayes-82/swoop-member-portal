import { sql } from '@vercel/postgres';
import { archiveDormantSessions } from '../../swoop-agent-platform/sessions/lifecycle/dormancy.ts';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { rows } = await sql`SELECT club_id FROM club WHERE active = TRUE`;
  const results = [];

  for (const { club_id } of rows) {
    try {
      const { archived } = await archiveDormantSessions(club_id);
      results.push({ club_id, archived });
    } catch (e) {
      results.push({ club_id, status: 'error', message: e.message });
    }
  }

  return res.status(200).json({ ok: true, results });
}
