import { sql } from '@vercel/postgres';
import { handleObservePreference } from '../../tools/handlers/memory.ts';

export async function seedMemberContext(clubId: string, memberId: string): Promise<{ seeded: boolean; events: number }> {
  const alreadySeeded = await sql`
    SELECT 1 FROM agent_session_events ase
    JOIN agent_sessions s ON ase.session_id = s.managed_session_id
    WHERE s.entity_type = 'member' AND s.entity_id = ${memberId} AND s.club_id = ${clubId}
      AND ase.event_type = 'preference.observed'
      AND ase.payload->>'source' = 'jonas_bootstrap'
    LIMIT 1
  `;
  if (alreadySeeded.rows.length > 0) return { seeded: false, events: 0 };

  const observations: Array<{ preference_type: string; value: unknown; confidence: number; source: string }> = [];
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const { rows: [member] } = await sql`
    SELECT first_name, last_name, join_date, membership_type, archetype, household_id
    FROM members WHERE member_id = ${memberId} AND club_id = ${clubId} LIMIT 1
  `;
  if (member) {
    observations.push({
      preference_type: 'member_profile',
      value: { first_name: member.first_name, last_name: member.last_name, join_date: member.join_date, membership_type: member.membership_type, archetype: member.archetype, member_id: memberId },
      confidence: 1.0,
      source: 'jonas_bootstrap',
    });
  }

  const { rows: teePatterns } = await sql`
    SELECT EXTRACT(DOW FROM b.booking_date) AS dow, EXTRACT(HOUR FROM b.tee_time::time) AS hour, COUNT(*) AS freq
    FROM bookings b
    JOIN booking_players bp ON b.booking_id = bp.booking_id
    WHERE bp.member_id = ${memberId} AND b.club_id = ${clubId}
      AND b.booking_date >= ${since}::date AND b.status = 'confirmed'
    GROUP BY 1, 2 ORDER BY freq DESC LIMIT 3
  `;
  if (teePatterns.length > 0) {
    const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    observations.push({
      preference_type: 'tee_time_pattern',
      value: teePatterns.map(r => ({ preferred_day: DOW[Number(r.dow)], preferred_hour: Number(r.hour), frequency: Number(r.freq) })),
      confidence: Math.min(0.95, 0.5 + (teePatterns[0]?.freq as number ?? 0) * 0.05),
      source: 'jonas_bootstrap',
    });
  }

  const { rows: partners } = await sql`
    SELECT bp2.member_id, m.first_name, m.last_name, COUNT(*) AS rounds_together
    FROM booking_players bp1
    JOIN booking_players bp2 ON bp1.booking_id = bp2.booking_id AND bp2.member_id != ${memberId}
    JOIN members m ON bp2.member_id = m.member_id
    JOIN bookings b ON bp1.booking_id = b.booking_id
    WHERE bp1.member_id = ${memberId} AND b.club_id = ${clubId} AND b.booking_date >= ${since}::date
    GROUP BY bp2.member_id, m.first_name, m.last_name ORDER BY rounds_together DESC LIMIT 5
  `;
  if (partners.length > 0) {
    observations.push({
      preference_type: 'playing_partners',
      value: partners.map(p => ({ member_id: p.member_id, name: `${p.first_name} ${p.last_name}`, rounds_together: Number(p.rounds_together) })),
      confidence: 0.9,
      source: 'jonas_bootstrap',
    });
  }

  if (member?.household_id) {
    const { rows: household } = await sql`
      SELECT member_id, first_name, last_name, membership_type FROM members
      WHERE household_id = ${member.household_id} AND club_id = ${clubId} AND member_id != ${memberId}
    `;
    if (household.length > 0) {
      observations.push({
        preference_type: 'household',
        value: household.map(h => ({ member_id: h.member_id, name: `${h.first_name} ${h.last_name}`, membership_type: h.membership_type })),
        confidence: 1.0,
        source: 'jonas_bootstrap',
      });
    }
  }

  const { rows: topItems } = await sql`
    SELECT li.item_name, li.category, COUNT(*) AS order_count, ROUND(AVG(li.line_total)::numeric, 2) AS avg_price
    FROM pos_line_items li JOIN pos_checks pc ON li.check_id = pc.check_id
    WHERE pc.member_id = ${memberId} AND pc.opened_at >= ${since}::timestamptz
    GROUP BY li.item_name, li.category ORDER BY order_count DESC LIMIT 5
  `;
  if (topItems.length > 0) {
    observations.push({
      preference_type: 'dining_preferences',
      value: topItems.map(i => ({ item_name: i.item_name, category: i.category, order_count: Number(i.order_count), avg_price: Number(i.avg_price) })),
      confidence: 0.85,
      source: 'jonas_bootstrap',
    });
  }

  const { rows: complaints } = await sql`
    SELECT complaint_id, category, description, priority, reported_at, status FROM complaints
    WHERE member_id = ${memberId} AND club_id = ${clubId}
      AND (status != 'resolved' OR reported_at >= ${since}::timestamptz)
    ORDER BY reported_at DESC LIMIT 5
  `;
  if (complaints.length > 0) {
    observations.push({
      preference_type: 'service_history',
      value: complaints.map(c => ({ complaint_id: c.complaint_id, category: c.category, description: c.description, priority: c.priority, reported_at: c.reported_at, status: c.status })),
      confidence: 1.0,
      source: 'jonas_bootstrap',
    });
  }

  for (const obs of observations) {
    await handleObservePreference({ member_id: memberId, ...obs });
  }

  return { seeded: true, events: observations.length };
}
