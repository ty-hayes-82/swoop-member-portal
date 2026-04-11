/**
 * Arrival Scan Cron Job
 * Schedule: every 15 minutes (*/15 * * * *)
 *
 * Scans for tee times in the 80-100 minute window (targeting ~90 min
 * before arrival) and generates staff briefs for each upcoming member.
 *
 * Idempotent: skips members who already have a brief for that tee time.
 */
import { sql } from '@vercel/postgres';
import { logError, logWarn, logInfo } from '../lib/logger.js';

const MAX_BRIEFS_PER_RUN = 50;

export default async function handler(req, res) {
  // Auth: same pattern as health-monitor.js
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/arrival-scan', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  logInfo('/api/cron/arrival-scan', 'cron tick start');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS staff_briefs (
        brief_id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id       TEXT NOT NULL,
        member_id     TEXT NOT NULL,
        tee_time      TEXT NOT NULL,
        role          TEXT NOT NULL,
        brief_text    TEXT NOT NULL,
        priority      TEXT DEFAULT 'normal',
        generated_at  TIMESTAMPTZ DEFAULT NOW(),
        read_at       TIMESTAMPTZ
      )
    `;

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const windowStart = new Date(now.getTime() + 80 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 100 * 60 * 1000);

    const startTime = `${String(windowStart.getHours()).padStart(2, '0')}:${String(windowStart.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(windowEnd.getHours()).padStart(2, '0')}:${String(windowEnd.getMinutes()).padStart(2, '0')}`;

    logInfo('/api/cron/arrival-scan', `scanning tee times ${startTime} - ${endTime} on ${today}`);

    const { rows: upcoming } = await sql`
      SELECT DISTINCT bp.member_id, b.tee_time, b.club_id,
             c.name AS course_name
      FROM bookings b
      JOIN booking_players bp ON b.booking_id = bp.booking_id
      JOIN courses c ON b.course_id = c.course_id
      WHERE b.booking_date = ${today}
        AND b.tee_time >= ${startTime}
        AND b.tee_time <= ${endTime}
        AND b.status = 'confirmed'
        AND bp.member_id IS NOT NULL
        AND bp.is_guest = 0
      ORDER BY b.tee_time
      LIMIT ${MAX_BRIEFS_PER_RUN}
    `;

    logInfo('/api/cron/arrival-scan', `found ${upcoming.length} member tee times in window`);

    let briefsGenerated = 0;
    let alreadyExists = 0;
    const results = [];

    for (const row of upcoming) {
      try {
        const { rows: existing } = await sql`
          SELECT brief_id FROM staff_briefs
          WHERE member_id = ${row.member_id}
            AND tee_time = ${row.tee_time}
            AND club_id = ${row.club_id}
            AND generated_at::date = ${today}
          LIMIT 1
        `;

        if (existing.length > 0) {
          alreadyExists++;
          results.push({ member_id: row.member_id, tee_time: row.tee_time, status: 'exists' });
          continue;
        }

        const rawUrl = process.env.VERCEL_URL || process.env.APP_URL;
        if (!rawUrl && process.env.NODE_ENV === 'production') {
          throw new Error('Neither VERCEL_URL nor APP_URL is set in production');
        }
        const baseUrl = rawUrl
          ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
          : 'http://localhost:3000';

        const triggerRes = await fetch(`${baseUrl}/api/agents/arrival-trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-key': process.env.CRON_SECRET,
          },
          body: JSON.stringify({
            member_id: row.member_id,
            tee_time: row.tee_time,
            course: row.course_name,
            club_id: row.club_id,
          }),
        });

        const contentType = triggerRes.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const body = await triggerRes.text();
          logWarn('/api/cron/arrival-scan', `non-JSON response for ${row.member_id}`, {
            status: triggerRes.status,
            contentType,
            body: body.slice(0, 200),
          });
          results.push({
            member_id: row.member_id,
            tee_time: row.tee_time,
            status: 'error',
            error: `Non-JSON response (${contentType})`,
          });
          continue;
        }

        const triggerData = await triggerRes.json();

        if (triggerRes.ok) {
          briefsGenerated++;
          results.push({
            member_id: row.member_id,
            tee_time: row.tee_time,
            status: 'generated',
            briefs_count: triggerData.briefs?.length || 0,
          });
        } else {
          results.push({
            member_id: row.member_id,
            tee_time: row.tee_time,
            status: 'error',
            error: triggerData.error,
          });
        }

        logInfo('/api/cron/arrival-scan', `processed ${row.member_id} @ ${row.tee_time}`, {
          status: triggerRes.ok ? 'generated' : 'error',
        });
      } catch (err) {
        logWarn('/api/cron/arrival-scan', `error processing ${row.member_id}`, { error: err.message });
        results.push({
          member_id: row.member_id,
          tee_time: row.tee_time,
          status: 'error',
          error: err.message,
        });
      }
    }

    logInfo('/api/cron/arrival-scan', 'cron tick complete', {
      scanned: upcoming.length,
      briefs_generated: briefsGenerated,
      already_exists: alreadyExists,
    });

    return res.json({
      scanned: upcoming.length,
      briefs_generated: briefsGenerated,
      already_exists: alreadyExists,
      results,
    });
  } catch (err) {
    logError('/api/cron/arrival-scan', err);
    return res.status(500).json({ error: err.message });
  }
}
