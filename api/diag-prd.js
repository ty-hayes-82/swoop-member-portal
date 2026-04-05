import { sql } from '@vercel/postgres';
import { withAuth } from './lib/withAuth.js';
export default withAuth(async function handler(req, res) {
  try {
    const [linkedCount, completedBookings, bpCount, prdChecks, sampleLinked, sampleBooking, sampleBP] = await Promise.all([
      sql`SELECT COUNT(*) AS c FROM pos_checks WHERE linked_booking_id IS NOT NULL`,
      sql`SELECT COUNT(*) AS c FROM bookings WHERE status = 'completed'`,
      sql`SELECT COUNT(*) AS c FROM booking_players WHERE is_guest = 0`,
      sql`SELECT COUNT(*) AS c FROM pos_checks WHERE post_round_dining = 1`,
      sql`SELECT check_id, member_id, linked_booking_id, opened_at FROM pos_checks WHERE linked_booking_id IS NOT NULL LIMIT 5`,
      sql`SELECT booking_id, course_id, booking_date, status FROM bookings WHERE status = 'completed' LIMIT 5`,
      sql`SELECT player_id, booking_id, member_id FROM booking_players WHERE is_guest = 0 LIMIT 5`,
    ]);
    // Test the actual join
    const joinTest = await sql`
      SELECT COUNT(DISTINCT b.booking_id) AS completed_rounds,
             COUNT(DISTINCT pc.check_id) FILTER (WHERE pc.post_round_dining = 1) AS prd_diners
      FROM bookings b
      JOIN booking_players bp ON b.booking_id = bp.booking_id AND bp.is_guest = 0
      JOIN members m ON bp.member_id = m.member_id
      LEFT JOIN pos_checks pc ON pc.linked_booking_id = b.booking_id
      WHERE b.status = 'completed'`;

    res.status(200).json({
      pos_checks_with_linked_booking: Number(linkedCount.rows[0].c),
      completed_bookings: Number(completedBookings.rows[0].c),
      booking_players_non_guest: Number(bpCount.rows[0].c),
      prd_checks: Number(prdChecks.rows[0].c),
      sampleLinked: sampleLinked.rows,
      sampleBooking: sampleBooking.rows,
      sampleBP: sampleBP.rows,
      joinTest: joinTest.rows[0],
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
}, { roles: ['swoop_admin'] });
