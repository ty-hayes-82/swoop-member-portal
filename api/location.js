import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [membersResult, staffResult, alertsResult] = await Promise.all([
      sql`SELECT mlc.*, m.first_name, m.last_name FROM member_location_current mlc JOIN members m ON mlc.member_id = m.member_id`,
      sql`SELECT * FROM staff_location_current`,
      sql`SELECT * FROM service_recovery_alerts WHERE resolved_at IS NULL ORDER BY created_at DESC`,
    ]);

    const members = membersResult.rows.map((r) => ({
      memberId: r.member_id,
      name: `${r.first_name} ${r.last_name}`,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      zone: r.zone,
      zoneId: r.zone_id,
      status: r.status,
      healthScore: r.health_score,
      timeInZone: r.time_in_zone,
      needsAttention: r.needs_attention,
      recommendedAction: r.recommended_action,
    }));

    const staff = staffResult.rows.map((r) => ({
      id: r.staff_id,
      name: r.name,
      role: r.role,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      zone: r.zone,
      status: r.status,
      etaText: r.eta_text,
    }));

    const alerts = alertsResult.rows.map((r) => ({
      id: r.alert_id,
      timestamp: r.created_at,
      severity: r.severity,
      title: r.title,
      detail: r.detail,
      memberId: r.member_id,
    }));

    res.status(200).json({ members, staff, alerts });
  } catch (err) {
    console.error('/api/location error:', err);
    res.status(500).json({ error: err.message });
  }
}
