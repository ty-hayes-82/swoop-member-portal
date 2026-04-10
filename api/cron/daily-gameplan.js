/**
 * Daily Game Plan Cron
 * Schedule: 5 AM UTC daily (0 5 * * *)
 *
 * Triggers the game plan agent for each active club.
 * Calculates tomorrow's date and fires the gameplan-trigger endpoint.
 */
import { sql } from '@vercel/postgres';
import { logWarn, logInfo } from '../lib/logger.js';

export default async function handler(req, res) {
  // Auth: CRON_SECRET in Authorization header
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/daily-gameplan', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logInfo('/api/cron/daily-gameplan', 'cron tick start');

  try {
    // Get all active clubs
    const { rows: clubs } = await sql`SELECT club_id FROM club`;

    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const planDate = tomorrow.toISOString().split('T')[0];

    const results = [];
    for (const club of clubs) {
      try {
        // Call the gameplan trigger internally
        const { default: triggerHandler } = await import('../agents/gameplan-trigger.js');
        const mockReq = {
          method: 'POST',
          headers: { 'x-cron-key': process.env.CRON_SECRET },
          body: { club_id: club.club_id, plan_date: planDate },
          auth: { clubId: club.club_id, role: 'system' },
          query: {},
        };
        const mockRes = {
          _status: null, _json: null,
          status(code) { mockRes._status = code; return mockRes; },
          json(data) { mockRes._json = data; return mockRes; },
          setHeader() { return mockRes; },
          end() { return mockRes; },
        };
        await triggerHandler(mockReq, mockRes);
        results.push({ club_id: club.club_id, status: mockRes._status, result: mockRes._json });
      } catch (err) {
        results.push({ club_id: club.club_id, error: err.message });
      }
    }

    logInfo('/api/cron/daily-gameplan', `completed for ${clubs.length} clubs`, { planDate });
    return res.status(200).json({ ok: true, plan_date: planDate, results });
  } catch (err) {
    logWarn('/api/cron/daily-gameplan', 'cron error', { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
