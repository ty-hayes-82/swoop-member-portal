import { sql } from '@vercel/postgres';
import { createAnalystSession } from '../../swoop-agent-platform/sessions/bootstrap/create_analyst_session.ts';
import { sendMessage } from '../../swoop-agent-platform/harness/events.ts';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { rows } = await sql`SELECT club_id FROM club WHERE active = TRUE`;
  const results = [];

  for (const { club_id } of rows) {
    try {
      const { managedSessionId } = await createAnalystSession(club_id, 'member_pulse_analyst');
      await sendMessage(managedSessionId, `Run member pulse scan. ${new Date().toISOString()}. Identify at-risk members.`);
      results.push({ club_id, status: 'triggered' });
    } catch (e) {
      results.push({ club_id, status: 'error', message: e.message });
    }
  }

  return res.status(200).json({ ok: true, results });
}
