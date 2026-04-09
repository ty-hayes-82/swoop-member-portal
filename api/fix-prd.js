import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/fix-prd', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  const log = [];
  try {
    // 1. Mark past bookings as 'completed' (anything before today)
    const updated = await sql`
      UPDATE bookings SET status = 'completed'
      WHERE booking_date::date < CURRENT_DATE AND status = 'confirmed'`;
    log.push(`Bookings marked completed: ${updated.rowCount}`);

    // Keep ~15 future bookings as 'confirmed' for cancellation risk
    const kept = await sql`
      UPDATE bookings SET status = 'confirmed'
      WHERE booking_date::date >= CURRENT_DATE AND status = 'completed'`;
    log.push(`Future bookings kept confirmed: ${kept.rowCount}`);

    // 2. Link pos_checks to completed bookings via member_id + same-day match
    const linked = await sql`
      WITH matches AS (
        SELECT DISTINCT ON (pc.check_id)
          pc.check_id,
          b.booking_id
        FROM pos_checks pc
        JOIN booking_players bp ON bp.member_id = pc.member_id AND bp.is_guest = 0
        JOIN bookings b ON b.booking_id = bp.booking_id
          AND b.status = 'completed'
          AND b.booking_date::date = pc.opened_at::date
        WHERE pc.post_round_dining = 1
        ORDER BY pc.check_id, b.booking_id
      )
      UPDATE pos_checks pc
      SET linked_booking_id = m.booking_id
      FROM matches m
      WHERE pc.check_id = m.check_id`;
    log.push(`PRD checks linked to bookings: ${linked.rowCount}`);

    // 3. Also link non-PRD checks that happen on the same day as a booking (for revenue attribution)
    const linked2 = await sql`
      WITH matches AS (
        SELECT DISTINCT ON (pc.check_id)
          pc.check_id,
          b.booking_id
        FROM pos_checks pc
        JOIN booking_players bp ON bp.member_id = pc.member_id AND bp.is_guest = 0
        JOIN bookings b ON b.booking_id = bp.booking_id
          AND b.status = 'completed'
          AND b.booking_date::date = pc.opened_at::date
        WHERE pc.linked_booking_id IS NULL
          AND pc.post_round_dining = 0
        ORDER BY pc.check_id, b.booking_id
      )
      UPDATE pos_checks pc
      SET linked_booking_id = m.booking_id
      FROM matches m
      WHERE pc.check_id = m.check_id`;
    log.push(`Non-PRD checks linked: ${linked2.rowCount}`);

    // 4. Verify the PRD conversion query now works
    const prdTest = await sql`
      SELECT
        m.archetype,
        COUNT(DISTINCT b.booking_id) AS completed_rounds,
        COUNT(DISTINCT pc.check_id) FILTER (WHERE pc.post_round_dining = 1) AS post_round_diners,
        ROUND(
          COUNT(DISTINCT pc.check_id) FILTER (WHERE pc.post_round_dining = 1)::numeric /
          NULLIF(COUNT(DISTINCT b.booking_id), 0), 3
        ) AS conversion_rate
      FROM bookings b
      JOIN booking_players bp ON b.booking_id = bp.booking_id AND bp.is_guest = 0
      JOIN members m ON bp.member_id = m.member_id
      LEFT JOIN pos_checks pc ON pc.linked_booking_id = b.booking_id
      WHERE b.status = 'completed'
      GROUP BY m.archetype
      ORDER BY conversion_rate DESC NULLS LAST`;

    // 5. Also fix waitlist — add some NORMAL priority entries
    await sql`
      UPDATE member_waitlist
      SET retention_priority = 'NORMAL'
      WHERE waitlist_id IN (
        SELECT waitlist_id FROM member_waitlist
        ORDER BY days_waiting ASC
        LIMIT 10
      )`;
    log.push('Waitlist: 10 entries set to NORMAL priority');

    res.status(200).json({
      ok: true,
      steps: log,
      postRoundConversion: prdTest.rows.map(r => ({
        archetype: r.archetype,
        completedRounds: Number(r.completed_rounds),
        diners: Number(r.post_round_diners),
        rate: Number(r.conversion_rate),
      })),
    });
  } catch(e) {
    res.status(500).json({ error: e.message, steps: log });
  }
}
