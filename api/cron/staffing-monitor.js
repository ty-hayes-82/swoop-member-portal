// SUPERSEDED: cron-labor now handles this via labor_optimizer session. Remove after 7-day parallel-run validation.
/**
 * Staffing-Demand Monitor Cron
 * Schedule: Every 6 hours (0 0,6,12,18 * * *)
 *
 * Triggers the staffing-demand agent for each active club.
 * Evaluates tomorrow's date for proactive staffing adjustments.
 */
import { sql } from '@vercel/postgres';
import { logWarn, logInfo } from '../lib/logger.js';

export default async function handler(req, res) {
  // Auth: CRON_SECRET in Authorization header
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/staffing-monitor', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logInfo('/api/cron/staffing-monitor', 'cron tick start');

  try {
    // Get all active clubs
    const { rows: clubs } = await sql`SELECT club_id FROM club`;

    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split('T')[0];

    const results = [];
    for (const club of clubs) {
      try {
        const { default: triggerHandler } = await import('../agents/staffing-trigger.js');
        const mockReq = {
          method: 'POST',
          headers: { 'x-cron-key': process.env.CRON_SECRET },
          body: { club_id: club.club_id, target_date: targetDate, trigger_type: '6h_cycle' },
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

    logInfo('/api/cron/staffing-monitor', `completed for ${clubs.length} clubs`, { targetDate });
    return res.status(200).json({ ok: true, target_date: targetDate, results });
  } catch (err) {
    logWarn('/api/cron/staffing-monitor', 'cron error', { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
