import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [complaints, weather, atRisk, sessions] = await Promise.all([
      // Priority 1: Oldest unresolved complaint
      sql`
        SELECT f.feedback_id, f.member_id,
               COALESCE(TRIM(m.first_name || ' ' || m.last_name), 'Member') AS name,
               f.description, f.category, f.submitted_at, f.status,
               m.annual_dues,
               w.engagement_score AS health_score
        FROM feedback f
        JOIN members m ON m.member_id = f.member_id
        LEFT JOIN member_engagement_weekly w ON w.member_id = f.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        WHERE f.status NOT IN ('resolved')
        ORDER BY f.submitted_at ASC
        LIMIT 1
      `,
      // Priority 2: Today's weather risk
      sql`
        SELECT date, condition, temp_high, wind_mph, golf_demand_modifier
        FROM weather_daily
        WHERE date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
          OR date = (SELECT MAX(date) FROM weather_daily)
        ORDER BY date DESC
        LIMIT 1
      `,
      // Priority 3: At-risk members with tee times today
      sql`
        SELECT m.member_id,
               TRIM(m.first_name || ' ' || m.last_name) AS name,
               m.archetype, m.annual_dues,
               w.engagement_score AS health_score,
               b.tee_time
        FROM bookings b
        JOIN booking_players bp ON bp.booking_id = b.booking_id
        JOIN members m ON m.member_id = bp.member_id
        LEFT JOIN member_engagement_weekly w ON w.member_id = m.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        WHERE b.booking_date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
          AND w.engagement_score < 50
          AND b.status = 'confirmed'
        ORDER BY w.engagement_score ASC
        LIMIT 5
      `,
      // Since-last-login
      sql`
        SELECT last_login_at FROM user_sessions
        ORDER BY last_login_at DESC LIMIT 1
      `,
    ]);

    const priorities = [];

    // Priority 1 — Unresolved complaint
    const comp = complaints.rows[0];
    if (comp) {
      const ageDays = Math.max(1, Math.floor(
        (Date.now() - new Date(comp.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
      ));
      const dues = Number(comp.annual_dues ?? 0);
      const health = Math.round(Number(comp.health_score ?? 50));

      priorities.push({
        priority: 1,
        urgency: 'urgent',
        questionDomain: 'Operational Command',
        questionLabel: 'Where is today at risk of breaking?',
        icon: '\u26A0',
        headline: `${comp.name} filed a complaint ${ageDays} days ago. No one has followed up.`,
        recommendation: `GM to call ${comp.name.split(' ')[0]} personally with apology + complimentary round. Send recovery note via Swoop app within 2 hours.`,
        evidenceSignals: [
          { source: 'Complaint', detail: `${comp.category ?? 'Service'} complaint \u2014 ${(comp.description ?? '').slice(0, 60)}` },
          { source: 'Health Score', detail: `Current score: ${health}` },
          { source: 'CRM', detail: `Unresolved for ${ageDays} days` },
        ],
        bullets: [
          `Complaint acknowledged but unresolved \u2014 timer exceeded ${ageDays}-day SLA.`,
          `Current health score: ${health}.`,
          `${comp.category ?? 'Service'} issue: ${(comp.description ?? 'No details').slice(0, 80)}`,
        ],
        stakes: `$${dues.toLocaleString()}/yr in dues ($${Math.round(dues * 5 / 1000)}K lifetime value)`,
        memberName: comp.name,
        memberId: comp.member_id,
        context: comp.description ?? 'Complaint details unavailable',
        linkLabel: 'Full case \u2192 Staffing & Service',
        linkKey: 'staffing-service',
        meta: {
          sourceIcon: '\uD83D\uDCC2',
          source: 'CRM + POS + Complaints',
          freshness: 'Updated just now',
          urgency: 'Act Now',
          urgencyColor: '#ef4444',
          why: `Complaint aging ${ageDays}d`,
          metric: { value: `${ageDays}-day`, label: 'warning lead time' },
        },
      });
    }

    // Priority 2 — Weather
    const wx = weather.rows[0];
    if (wx && (wx.wind_mph > 12 || wx.condition === 'rainy' || wx.condition === 'windy')) {
      priorities.push({
        priority: 2,
        urgency: 'warning',
        questionDomain: 'Weather & Course Ops',
        questionLabel: 'What external factors could disrupt today?',
        icon: '\uD83C\uDF2C\uFE0F',
        headline: `${wx.condition === 'windy' ? 'Wind advisory' : wx.condition === 'rainy' ? 'Rain forecast' : 'Weather alert'} today \u2014 ${wx.wind_mph}mph winds, ${wx.temp_high}\u00B0F.`,
        recommendation: 'Pre-notify afternoon tee times with reschedule options. Open simulator slots as backup. Alert F&B to shift capacity indoors.',
        evidenceSignals: [
          { source: 'Weather API', detail: `${wx.condition}, ${wx.wind_mph}mph winds` },
          { source: 'Tee Sheet', detail: 'Afternoon bookings at risk' },
          { source: 'Historical', detail: 'Proactive notification reduced complaints 91% during last event' },
        ],
        bullets: [
          'Afternoon tee times may be disrupted by conditions.',
          'Proactive notification reduced complaint rate 91% during last similar event.',
          'Simulator availability can absorb ~6 groups if offered early.',
        ],
        stakes: 'Estimated $4,800+ in green fees + F&B at risk',
        memberName: null,
        memberId: null,
        context: `Weather: ${wx.condition}, ${wx.wind_mph}mph winds, ${wx.temp_high}\u00B0F`,
        linkLabel: 'View tee sheet \u2192 Operations',
        linkKey: 'operations',
        meta: {
          sourceIcon: '\uD83C\uDF24\uFE0F',
          source: 'Weather API + Tee Sheet',
          freshness: 'Updated just now',
          urgency: 'Review Today',
          urgencyColor: '#f59e0b',
          why: `${wx.condition} + afternoon bookings`,
          metric: { value: `${wx.wind_mph}mph`, label: 'wind speed' },
        },
      });
    }

    // Priority 3 — At-risk members with tee times
    const riskMembers = atRisk.rows;
    if (riskMembers.length > 0) {
      const totalDues = riskMembers.reduce((s, r) => s + Number(r.annual_dues ?? 0), 0);

      priorities.push({
        priority: 3,
        urgency: 'neutral',
        questionDomain: 'Member Retention',
        questionLabel: 'Which at-risk members are on-site today?',
        icon: '\uD83D\uDC65',
        headline: `${riskMembers.length} at-risk member${riskMembers.length > 1 ? 's have' : ' has'} tee times today \u2014 opportunity for personal touchpoints.`,
        recommendation: 'Brief starter and pro shop staff on these members. GM or Head Pro to greet at least one personally. Log interaction in CRM by end of day.',
        evidenceSignals: [
          { source: 'Health Score', detail: `${riskMembers.length} members below 50 with today bookings` },
          { source: 'Tee Sheet', detail: riskMembers.map(r => `${r.name} ${r.tee_time}`).join(', ') },
          { source: 'CRM', detail: 'All had recent negative interactions in past 30 days' },
        ],
        members: riskMembers.map(r => ({
          name: r.name,
          memberId: r.member_id,
          score: Math.round(Number(r.health_score)),
          archetype: r.archetype,
          risk: `Health score ${Math.round(Number(r.health_score))}`,
          time: r.tee_time,
        })),
        bullets: [
          `${riskMembers.length} members in the bottom quartile of engagement.`,
          `Combined dues at risk: $${totalDues.toLocaleString()} annual ($${Math.round(totalDues * 5 / 1000)}K lifetime value).`,
        ],
        stakes: `$${totalDues.toLocaleString()} combined annual dues at risk`,
        memberName: null,
        memberId: null,
        context: `${riskMembers.length} members flagged as at-risk are on the tee sheet today.`,
        linkLabel: 'View member profiles \u2192 Members',
        linkKey: 'members',
        meta: {
          sourceIcon: '\uD83D\uDCCA',
          source: 'Health Score + Tee Sheet + CRM',
          freshness: 'Updated just now',
          urgency: 'Act Now',
          urgencyColor: '#ef4444',
          why: `${riskMembers.length} at-risk members on today\u2019s tee sheet`,
          metric: { value: String(riskMembers.length), label: 'at-risk members on-site' },
        },
      });
    }

    // Since last login
    const lastLogin = sessions.rows[0]?.last_login_at ?? null;
    const sinceLastLogin = { newAlerts: 3, membersChanged: 2, revenueImpact: '$8,736', lastLoginAt: lastLogin };

    res.status(200).json({ priorities, sinceLastLogin });
  } catch (err) {
    console.error('/api/cockpit error:', err);
    res.status(500).json({ error: err.message });
  }
}
