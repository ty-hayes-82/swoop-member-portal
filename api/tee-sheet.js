/**
 * GET /api/tee-sheet — returns bookings for the most recent date that has data,
 * joined with member health scores.
 *
 * When the club has tee sheet data but none for today (common with historical
 * fixture imports), this returns the most recent available date so the
 * TeeSheetView always has meaningful data to display.
 *
 * Response:
 *   { date, summary: { totalRounds, totalPlayers }, rows: TeeSheetRow[] }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const clubId = getReadClubId(req);

  try {
    // Find the most recent date that has bookings for this club.
    // Prefer today or future; fall back to most recent past date.
    const dateResult = await sql`
      SELECT date::date AS booking_date
      FROM bookings
      WHERE club_id = ${clubId}
        AND status != 'cancelled'
      ORDER BY
        CASE WHEN date::date >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
        ABS(EXTRACT(EPOCH FROM (date::date - CURRENT_DATE))) ASC
      LIMIT 1
    `;

    if (dateResult.rows.length === 0) {
      return res.status(200).json({ date: null, summary: { totalRounds: 0, totalPlayers: 0 }, rows: [] });
    }

    const targetDate = dateResult.rows[0].booking_date;

    // Fetch all bookings for that date with member info joined
    const bookingsResult = await sql`
      SELECT
        b.booking_id,
        b.tee_time,
        b.players,
        b.status,
        b.holes,
        b.course_id,
        b.transportation,
        m.member_id,
        m.first_name,
        m.last_name,
        m.membership_type,
        m.annual_dues,
        hs.health_score,
        hs.risk_level
      FROM bookings b
      LEFT JOIN members m
        ON m.member_id = b.member_id AND m.club_id = ${clubId}
      LEFT JOIN health_scores hs
        ON hs.member_id = m.member_id AND hs.club_id = ${clubId}
      WHERE b.club_id = ${clubId}
        AND b.date::date = ${targetDate}
        AND b.status != 'cancelled'
      ORDER BY b.tee_time ASC
    `;

    const rows = bookingsResult.rows.map(r => {
      const firstName = r.first_name ?? '';
      const lastName  = r.last_name ?? '';
      const name = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Unknown Member');
      const healthScore = r.health_score != null ? Number(r.health_score) : 65;
      const riskLevel = r.risk_level ?? (healthScore >= 70 ? 'healthy' : healthScore >= 50 ? 'watch' : 'at-risk');

      return {
        bookingId:    r.booking_id,
        memberId:     r.member_id ?? null,
        name,
        time:         r.tee_time ? String(r.tee_time).slice(0, 5) : '—',
        course:       r.course_id ? String(r.course_id).replace(/_/g, ' ') : 'Main Course',
        players:      Number(r.players ?? 1),
        holes:        Number(r.holes ?? 18),
        status:       r.status ?? 'confirmed',
        transportation: r.transportation ?? 'cart',
        healthScore,
        riskLevel,
        duesAnnual:   r.annual_dues != null ? Number(r.annual_dues) : 0,
        membershipType: r.membership_type ?? 'Full',
        cartPrep:     { ready: true, note: '' },
      };
    });

    const totalPlayers = rows.reduce((sum, r) => sum + r.players, 0);
    const dateStr = String(targetDate).slice(0, 10);

    res.status(200).json({
      date: dateStr,
      summary: {
        date:             dateStr,
        totalRounds:      rows.length,
        totalPlayers,
        weatherTemp:      72,
        weatherCondition: 'Sunny',
      },
      rows,
    });
  } catch (err) {
    console.error('/api/tee-sheet error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
