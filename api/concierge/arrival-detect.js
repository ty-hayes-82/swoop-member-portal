/**
 * POST /api/concierge/arrival-detect
 *
 * Arrival detection + staff prep brief.
 * Receives member GPS coordinates, checks geofence proximity to club,
 * loads member context, and generates a staff preparation brief.
 *
 * Body: { club_id, member_id, lat, lng }
 * Returns: { detected, distance_m, staff_brief }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

// Default club coordinates (Pinetree CC, Kennesaw GA)
const DEFAULT_CLUB_LAT = 34.0415;
const DEFAULT_CLUB_LNG = -84.5985;
const DEFAULT_GEOFENCE_RADIUS_M = 500;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default withAuth(
  async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clubId = getReadClubId(req);
    const { member_id, lat, lng } = req.body || {};

    if (!member_id || lat == null || lng == null) {
      return res.status(400).json({ error: 'member_id, lat, and lng are required' });
    }

    try {
      // --- Resolve club location (fall back to defaults) ---
      let clubLat = DEFAULT_CLUB_LAT;
      let clubLng = DEFAULT_CLUB_LNG;
      let geofenceRadius = DEFAULT_GEOFENCE_RADIUS_M;

      try {
        const clubRes = await sql`
          SELECT latitude, longitude, geofence_radius_m
          FROM club WHERE club_id = ${clubId}
        `;
        if (clubRes.rows.length && clubRes.rows[0].latitude) {
          clubLat = Number(clubRes.rows[0].latitude);
          clubLng = Number(clubRes.rows[0].longitude);
          if (clubRes.rows[0].geofence_radius_m) {
            geofenceRadius = Number(clubRes.rows[0].geofence_radius_m);
          }
        }
      } catch {
        // club table may lack lat/lng columns — use defaults
      }

      const distanceM = haversineMeters(lat, lng, clubLat, clubLng);
      const detected = distanceM <= geofenceRadius;

      if (!detected) {
        return res.status(200).json({
          detected: false,
          distance_m: Math.round(distanceM),
          staff_brief: null,
        });
      }

      // --- Load member profile ---
      const memberRes = await sql`
        SELECT
          m.member_id, m.first_name, m.last_name, m.membership_type,
          m.archetype, m.membership_status, m.household_id,
          m.preferred_dining_spot, m.tee_time_preference, m.dining_preference,
          m.member_notes, m.family_members, m.account_balance,
          h.primary_member_id, h.member_count AS household_size
        FROM members m
        LEFT JOIN households h ON m.household_id = h.household_id
        WHERE m.member_id = ${member_id} AND m.club_id = ${clubId}
      `;

      if (!memberRes.rows.length) {
        return res.status(404).json({ error: 'Member not found' });
      }

      const member = memberRes.rows[0];

      // --- Load open complaints ---
      let openComplaints = [];
      try {
        const fbRes = await sql`
          SELECT feedback_id, category, description, submitted_at, status
          FROM feedback
          WHERE member_id = ${member_id} AND club_id = ${clubId}
            AND status IN ('acknowledged', 'in_progress', 'escalated')
          ORDER BY submitted_at DESC
          LIMIT 5
        `;
        openComplaints = fbRes.rows;
      } catch {
        // feedback table may not exist
      }

      // --- Load health score ---
      let healthScore = null;
      try {
        const engRes = await sql`
          SELECT engagement_score
          FROM member_engagement_weekly
          WHERE member_id = ${member_id}
          ORDER BY week_start DESC
          LIMIT 1
        `;
        if (engRes.rows.length) {
          healthScore = Number(engRes.rows[0].engagement_score);
        }
      } catch {
        // table may not exist
      }

      // --- Load household members ---
      let householdMembers = [];
      if (member.household_id) {
        try {
          const hhRes = await sql`
            SELECT member_id, first_name, last_name, membership_type
            FROM members
            WHERE household_id = ${member.household_id}
              AND club_id = ${clubId}
              AND member_id != ${member_id}
          `;
          householdMembers = hhRes.rows;
        } catch {
          // ignore
        }
      }

      // --- Build staff prep brief ---
      const cartPref = member.tee_time_preference || 'standard cart';
      const cartPrep = `Stage ${cartPref} — ${member.first_name} ${member.last_name} (${member.membership_type})`;

      const diningHold = member.preferred_dining_spot
        ? `Preferred spot: ${member.preferred_dining_spot}. ${member.dining_preference || ''}`
        : member.dining_preference || 'No dining preference on file';

      const isAtRisk = healthScore != null && healthScore < 50;
      const hasOpenComplaint = openComplaints.length > 0;
      const gmGreet = isAtRisk || hasOpenComplaint;

      const talkingPoints = [];
      if (hasOpenComplaint) {
        talkingPoints.push(
          `Open complaint (${openComplaints[0].category}): "${openComplaints[0].description?.slice(0, 80)}..."`
        );
      }
      if (isAtRisk) {
        talkingPoints.push(`Health score ${healthScore} — at-risk. Personal touch matters.`);
      }
      if (member.member_notes) {
        talkingPoints.push(`Notes: ${member.member_notes}`);
      }
      if (householdMembers.length) {
        const names = householdMembers.map((h) => h.first_name).join(', ');
        talkingPoints.push(`Household: ${names}`);
      }
      if (member.family_members) {
        talkingPoints.push(`Family: ${member.family_members}`);
      }

      const staffBrief = {
        cart_prep: cartPrep,
        dining_hold: diningHold.trim(),
        gm_greet: gmGreet,
        talking_points: talkingPoints,
        health_score: healthScore,
        open_complaints: openComplaints.length,
        household_members: householdMembers.map((h) => ({
          member_id: h.member_id,
          name: `${h.first_name} ${h.last_name}`,
          type: h.membership_type,
        })),
      };

      // --- Log arrival to activity_log ---
      try {
        await sql`
          INSERT INTO activity_log
            (action_type, action_subtype, actor, member_id, member_name, description, meta, club_id)
          VALUES (
            'member_arrival', 'geofence',
            'concierge_system',
            ${member_id},
            ${member.first_name + ' ' + member.last_name},
            ${`${member.first_name} ${member.last_name} arrived at club (${Math.round(distanceM)}m)`},
            ${JSON.stringify({ distance_m: Math.round(distanceM), gm_greet: gmGreet, health_score: healthScore })}::jsonb,
            ${clubId}
          )
        `;
      } catch {
        // activity_log insert is best-effort
      }

      return res.status(200).json({
        detected: true,
        distance_m: Math.round(distanceM),
        staff_brief: staffBrief,
      });
    } catch (err) {
      console.error('arrival-detect error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  { allowDemo: true }
);
