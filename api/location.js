import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  const clubId = getReadClubId(req);
  try {
    const [membersResult, staffResult, alertsResult] = await Promise.all([
      sql`SELECT mlc.member_id, mlc.zone, mlc.sub_location, mlc.check_in_time,
                 mlc.health_status, mlc.activity_type,
                 m.first_name, m.last_name, m.archetype,
                 w.engagement_score AS health_score
          FROM member_location_current mlc
          JOIN members m ON mlc.member_id = m.member_id AND m.club_id = ${clubId}
          LEFT JOIN member_engagement_weekly w ON w.member_id = mlc.member_id
            AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly WHERE club_id = ${clubId})
          WHERE mlc.club_id = ${clubId}`,
      sql`SELECT staff_id, name, zone, status, eta_minutes, department FROM staff_location_current WHERE club_id = ${clubId}`,
      sql`SELECT alert_id, member_id, member_name, severity, zone, detail, recommended_action, created_at
          FROM service_recovery_alerts WHERE club_id = ${clubId} AND resolved_at IS NULL ORDER BY created_at DESC`,
    ]);

    const members = membersResult.rows.map((r) => ({
      memberId: r.member_id,
      name: `${r.first_name} ${r.last_name}`.trim(),
      zone: r.zone,
      zoneId: r.activity_type ?? 'clubhouse',
      status: r.health_status ?? 'watch',
      healthScore: Math.round(Number(r.health_score ?? 60)),
      timeInZone: r.check_in_time ? formatTimeInZone(r.check_in_time) : 'Unknown',
      needsAttention: r.health_status === 'at-risk' || r.health_status === 'critical',
      recommendedAction: r.health_status === 'at-risk' ? 'Staff check-in recommended.' : 'No action needed.',
    }));

    const staff = staffResult.rows.map((r) => ({
      id: r.staff_id,
      name: r.name,
      role: r.department,
      zone: r.zone,
      status: r.status,
      etaText: r.eta_minutes ? `ETA ${r.eta_minutes} min` : 'Available',
    }));

    const alerts = alertsResult.rows.map((r) => ({
      id: r.alert_id,
      timestamp: r.created_at,
      severity: r.severity,
      title: r.member_name ? `${r.member_name} in ${r.zone}` : `Alert in ${r.zone}`,
      detail: r.detail,
      memberId: r.member_id,
    }));

    res.status(200).json({ members, staff, alerts });
  } catch (err) {
    console.error('/api/location error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });

function formatTimeInZone(checkInTime) {
  const diff = Date.now() - new Date(checkInTime).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}
