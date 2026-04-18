import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const memberId = req.query['id'] as string;
  const clubId   = (req.query['club_id'] as string) || 'bowling-green-cc';

  const [memberRes, complaintsRes, bookingsRes, billingRes] = await Promise.all([
    sql`
      SELECT member_id, first_name, last_name, email, phone, health_score, annual_dues,
             health_tier AS engagement_tier, archetype, join_date,
             EXTRACT(YEAR FROM AGE(date_of_birth::date))::int AS age,
             ghin_number AS handicap_index, membership_type
      FROM members
      WHERE member_id = ${memberId} AND club_id = ${clubId}
      LIMIT 1
    `,
    sql`
      SELECT complaint_id, category, description, status, priority, reported_at, sla_hours
      FROM complaints
      WHERE member_id = ${memberId} AND club_id = ${clubId}
      ORDER BY reported_at DESC
      LIMIT 3
    `,
    sql`
      SELECT b.booking_id, b.booking_date, b.tee_time, b.round_type, b.status
      FROM bookings b
      JOIN booking_players bp ON bp.booking_id = b.booking_id
      WHERE bp.member_id = ${memberId} AND b.club_id = ${clubId}
      ORDER BY b.booking_date DESC
      LIMIT 3
    `,
    sql`
      SELECT type AS charge_type, SUM(amount) as total, COUNT(*) as count
      FROM member_invoices
      WHERE member_id = ${memberId}
      GROUP BY type
      ORDER BY total DESC
      LIMIT 5
    `,
  ]);

  if (memberRes.rows.length === 0) return res.status(404).json({ error: 'Member not found' });

  const m = memberRes.rows[0];

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    id: m.member_id,
    name: `${m.first_name} ${m.last_name}`,
    email: m.email ?? null,
    phone: m.phone ?? null,
    health_score: Number(m.health_score),
    annual_dues: Number(m.annual_dues),
    tier: m.engagement_tier,
    archetype: m.archetype,
    join_date: m.join_date,
    age: m.age ?? null,
    handicap_index: m.handicap_index ?? null,
    last_activity_date: null,
    visit_count_12m: 0,
    activity_streak_days: 0,
    membership_type: m.membership_type ?? null,
    health_score_components: null,
    signals: {
      last_complaint: complaintsRes.rows[0] ?? null,
      recent_complaints_count: complaintsRes.rows.length,
      last_booking: bookingsRes.rows[0] ?? null,
      billing_summary: billingRes.rows.map(b => ({
        charge_type: b.charge_type,
        total: Number(b.total),
        count: Number(b.count),
      })),
    },
  });
}
