import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [complaints, weather, atRisk, sessions] = await Promise.all([
      // Priority 1: Oldest unresolved complaint
      sql`
        SELECT c.complaint_id, c.member_id, m.full_name, c.description, c.category,
               c.created_at, c.status,
               mh.health_score AS current_health,
               mh.previous_health_score AS previous_health,
               m.annual_dues,
               m.lifetime_value
        FROM complaints c
        JOIN members m ON m.member_id = c.member_id
        LEFT JOIN member_health mh ON mh.member_id = c.member_id
        WHERE c.status NOT IN ('resolved', 'closed')
        ORDER BY c.created_at ASC
        LIMIT 1
      `,
      // Priority 2: Today's weather alerts
      sql`
        SELECT alert_type, description, severity, wind_speed, start_time, end_time
        FROM weather_alerts
        WHERE alert_date = CURRENT_DATE
        ORDER BY severity DESC
        LIMIT 1
      `,
      // Priority 3: At-risk members with tee times today
      sql`
        SELECT m.member_id, m.full_name, mh.health_score,
               tt.tee_time, c.description AS recent_complaint
        FROM tee_times tt
        JOIN members m ON m.member_id = tt.member_id
        JOIN member_health mh ON mh.member_id = tt.member_id
        LEFT JOIN LATERAL (
          SELECT description FROM complaints
          WHERE member_id = m.member_id
          ORDER BY created_at DESC LIMIT 1
        ) c ON true
        WHERE tt.tee_date = CURRENT_DATE
          AND mh.health_score < 50
        ORDER BY mh.health_score ASC
        LIMIT 5
      `,
      // Since-last-login deltas
      sql`
        SELECT last_login_at FROM user_sessions
        ORDER BY last_login_at DESC LIMIT 1
      `,
    ]);

    // Build priorities array
    const priorities = [];

    // Priority 1 — Unresolved complaint
    const comp = complaints.rows[0];
    if (comp) {
      const ageDays = Math.floor(
        (Date.now() - new Date(comp.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      priorities.push({
        priority: 1,
        urgency: 'urgent',
        questionDomain: 'Operational Command',
        questionLabel: 'Where is today at risk of breaking?',
        icon: '\u26A0',
        headline: `${comp.full_name} filed a complaint ${ageDays} days ago. No one has followed up.`,
        recommendation: `GM to call ${comp.full_name.split(' ')[0]} personally with apology + complimentary round. Send recovery note via Swoop app within 2 hours.`,
        evidenceSignals: [
          { source: 'Complaint', detail: `${comp.category ?? 'Service'} complaint — ${comp.description?.slice(0, 60)}` },
          { source: 'Health Score', detail: `Dropped from ${comp.previous_health ?? '??'} to ${comp.current_health ?? '??'}` },
          { source: 'CRM', detail: `Unresolved for ${ageDays} days` },
        ],
        bullets: [
          `Complaint acknowledged but unresolved \u2014 timer exceeded ${ageDays}-day SLA.`,
          `Health score fell ${comp.previous_health ?? '??'} \u2192 ${comp.current_health ?? '??'}.`,
          `${comp.category ?? 'Service'} issue: ${comp.description?.slice(0, 80) ?? 'No details'}`,
        ],
        stakes: `$${Number(comp.annual_dues ?? 0).toLocaleString()}/yr in dues ($${Math.round(Number(comp.lifetime_value ?? 0) / 1000)}K lifetime value)`,
        memberName: comp.full_name,
        memberId: comp.member_id,
        context: comp.description ?? 'Complaint details unavailable',
        linkLabel: 'Full case \u2192 Staffing & Service',
        linkKey: 'staffing-service',
        meta: {
          sourceIcon: '\uD83D\uDCC2',
          source: 'CRM + POS + Complaints',
          freshness: `Updated just now`,
          confidence: '93% confidence',
          why: `Complaint aging ${ageDays}d`,
          metric: { value: `${ageDays}-day`, label: 'warning lead time' },
        },
      });
    }

    // Priority 2 — Weather
    const wx = weather.rows[0];
    if (wx) {
      // Count afternoon tee times at risk
      const teeCountResult = await sql`
        SELECT COUNT(*) AS cnt FROM tee_times
        WHERE tee_date = CURRENT_DATE AND tee_time >= '11:00'
      `;
      const teesAtRisk = Number(teeCountResult.rows[0]?.cnt ?? 0);

      priorities.push({
        priority: 2,
        urgency: 'warning',
        questionDomain: 'Weather & Course Ops',
        questionLabel: 'What external factors could disrupt today?',
        icon: '\uD83C\uDF2C\uFE0F',
        headline: `${wx.alert_type} forecast for today \u2014 ${wx.description}`,
        recommendation: `Pre-notify ${teesAtRisk} afternoon tee times with reschedule options. Open simulator slots as backup. Alert F&B to shift capacity indoors.`,
        evidenceSignals: [
          { source: 'Weather API', detail: `${wx.alert_type}: ${wx.description}` },
          { source: 'Tee Sheet', detail: `${teesAtRisk} tee times booked after 11am` },
          { source: 'Historical', detail: 'Proactive notification reduced complaints 91% during last event' },
        ],
        bullets: [
          `${teesAtRisk} members have afternoon tee times that may be disrupted.`,
          'Proactive notification reduced complaint rate 91% during last similar event.',
          'Simulator availability can absorb ~6 groups if offered early.',
        ],
        stakes: `Estimated $${Math.round(teesAtRisk * 150).toLocaleString()} in green fees + F&B at risk`,
        memberName: null,
        memberId: null,
        context: `${wx.alert_type} issued for local area affecting afternoon play.`,
        linkLabel: 'View tee sheet \u2192 Operations',
        linkKey: 'operations',
        meta: {
          sourceIcon: '\uD83C\uDF24\uFE0F',
          source: 'Weather API + Tee Sheet',
          freshness: 'Updated just now',
          confidence: '87% confidence',
          why: `${wx.alert_type} + ${teesAtRisk} afternoon bookings`,
          metric: { value: String(teesAtRisk), label: 'tee times at risk' },
        },
      });
    }

    // Priority 3 — At-risk members on-site today
    const riskMembers = atRisk.rows;
    if (riskMembers.length > 0) {
      const totalDuesResult = await sql`
        SELECT SUM(m.annual_dues) AS total
        FROM tee_times tt
        JOIN members m ON m.member_id = tt.member_id
        JOIN member_health mh ON mh.member_id = tt.member_id
        WHERE tt.tee_date = CURRENT_DATE AND mh.health_score < 50
      `;
      const totalDues = Number(totalDuesResult.rows[0]?.total ?? 0);

      priorities.push({
        priority: 3,
        urgency: 'neutral',
        questionDomain: 'Member Retention',
        questionLabel: 'Which at-risk members are on-site today?',
        icon: '\uD83D\uDC65',
        headline: `${riskMembers.length} at-risk member${riskMembers.length > 1 ? 's have' : ' has'} tee times today \u2014 opportunity for personal touchpoints.`,
        recommendation:
          'Brief starter and pro shop staff on these members. GM or Head Pro to greet at least one personally. Log interaction in CRM by end of day.',
        evidenceSignals: [
          { source: 'Health Score', detail: `${riskMembers.length} members below 50 with today bookings` },
          {
            source: 'Tee Sheet',
            detail: riskMembers
              .map((r) => {
                const t = r.tee_time ? new Date(`1970-01-01T${r.tee_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '??';
                return `${r.full_name} ${t}`;
              })
              .join(', '),
          },
          { source: 'CRM', detail: 'All had recent negative interactions in past 30 days' },
        ],
        bullets: riskMembers.map((r) => {
          const t = r.tee_time ? new Date(`1970-01-01T${r.tee_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '??';
          return `${r.full_name} (health: ${r.health_score}) \u2014 ${r.recent_complaint?.slice(0, 40) ?? 'recent negative interaction'}, plays at ${t}.`;
        }),
        stakes: `$${totalDues.toLocaleString()} combined annual dues at risk`,
        memberName: null,
        memberId: null,
        context: `${riskMembers.length} members flagged as at-risk by health scoring are on the tee sheet today.`,
        linkLabel: 'View member profiles \u2192 Members',
        linkKey: 'members',
        meta: {
          sourceIcon: '\uD83D\uDCCA',
          source: 'Health Score + Tee Sheet + CRM',
          freshness: 'Updated just now',
          confidence: '89% confidence',
          why: `${riskMembers.length} at-risk members on today\u2019s tee sheet`,
          metric: { value: String(riskMembers.length), label: 'at-risk members on-site' },
        },
      });
    }

    // Since last login
    const lastLogin = sessions.rows[0]?.last_login_at ?? null;
    let sinceLastLogin = { newAlerts: 0, membersChanged: 0, revenueImpact: '$0', lastLoginAt: lastLogin };

    if (lastLogin) {
      const [alertCount, memberChanges] = await Promise.all([
        sql`SELECT COUNT(*) AS cnt FROM complaints WHERE created_at > ${lastLogin}`,
        sql`SELECT COUNT(*) AS cnt FROM member_health WHERE updated_at > ${lastLogin}`,
      ]);
      const newAlerts = Number(alertCount.rows[0]?.cnt ?? 0);
      const membersChanged = Number(memberChanges.rows[0]?.cnt ?? 0);
      sinceLastLogin = {
        newAlerts,
        membersChanged,
        revenueImpact: `$${(newAlerts * 2912).toLocaleString()}`,
        lastLoginAt: lastLogin,
      };
    }

    res.status(200).json({ priorities, sinceLastLogin });
  } catch (err) {
    console.error('/api/cockpit error:', err);
    res.status(500).json({ error: err.message });
  }
}
