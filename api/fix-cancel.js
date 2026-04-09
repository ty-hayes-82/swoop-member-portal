import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/fix-cancel', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  try {
    // Set bookings tied to cancellation_risk back to 'confirmed'
    const r1 = await sql`
      UPDATE bookings SET status = 'confirmed'
      WHERE booking_id IN (SELECT booking_id FROM cancellation_risk)`;

    // Also create ~20 upcoming confirmed bookings for realism
    // Update their dates to be in the near future
    const r2 = await sql`
      UPDATE bookings SET
        booking_date = TO_CHAR((CURRENT_DATE + (ABS(hashtext(booking_id)) % 14 + 1) * INTERVAL '1 day')::date, 'YYYY-MM-DD'),
        check_in_time = NULL,
        round_start = NULL,
        round_end = NULL,
        duration_minutes = NULL
      WHERE booking_id IN (SELECT booking_id FROM cancellation_risk)`;

    // Verify
    const check = await sql`
      SELECT COUNT(*) AS confirmed FROM bookings WHERE status = 'confirmed'`;
    const crCheck = await sql`
      SELECT COUNT(*) AS c FROM cancellation_risk cr
      JOIN bookings b ON cr.booking_id = b.booking_id
      WHERE b.status = 'confirmed'`;

    res.status(200).json({
      ok: true,
      bookingsSetConfirmed: r1.rowCount,
      bookingsDatesUpdated: r2.rowCount,
      totalConfirmed: Number(check.rows[0].confirmed),
      cancellationRiskWithConfirmed: Number(crCheck.rows[0].c),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
