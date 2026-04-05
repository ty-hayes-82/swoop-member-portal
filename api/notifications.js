/**
 * Notifications & Alerts API — Sprint 7
 * POST /api/notifications — send notification
 * GET /api/notifications?clubId=xxx&userId=xxx — get user notifications
 * POST /api/notifications/digest — generate morning briefing digest
 * POST /api/notifications/escalate — check and escalate overdue actions
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);
  // Ensure notifications table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id TEXT NOT NULL,
        user_id TEXT,
        channel TEXT NOT NULL DEFAULT 'in_app',
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        priority TEXT DEFAULT 'normal',
        related_member_id TEXT,
        related_action_id TEXT,
        read_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(club_id, user_id, read_at)`;
  } catch {}

  // Ensure notification_preferences table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id TEXT PRIMARY KEY,
        club_id TEXT NOT NULL,
        morning_digest BOOLEAN DEFAULT TRUE,
        digest_time TEXT DEFAULT '07:00',
        digest_channel TEXT DEFAULT 'email',
        high_priority_alerts BOOLEAN DEFAULT TRUE,
        alert_channel TEXT DEFAULT 'email',
        escalation_alerts BOOLEAN DEFAULT TRUE,
        slack_webhook TEXT
      )
    `;
  } catch {}

  if (req.method === 'GET') {
    const { clubId, userId, unreadOnly } = req.query;
    if (!clubId) return res.status(400).json({ error: 'clubId required' });

    try {
      const query = unreadOnly === 'true'
        ? sql`SELECT * FROM notifications WHERE club_id = ${clubId} AND (user_id = ${userId} OR user_id IS NULL) AND read_at IS NULL ORDER BY created_at DESC LIMIT 50`
        : sql`SELECT * FROM notifications WHERE club_id = ${clubId} AND (user_id = ${userId} OR user_id IS NULL) ORDER BY created_at DESC LIMIT 50`;

      const result = await query;
      return res.status(200).json({ notifications: result.rows });
    } catch {
      // Table may not have any data yet for this club — return empty
      return res.status(200).json({ notifications: [] });
    }
  }

  if (req.method === 'POST') {
    const path = req.url.split('?')[0];

    // Mark as read
    if (req.body?.action === 'mark_read') {
      const { notificationId } = req.body;
      await sql`UPDATE notifications SET read_at = NOW() WHERE notification_id = ${notificationId}`;
      return res.status(200).json({ ok: true });
    }

    // Generate morning digest
    if (path.endsWith('/digest') || req.body?.action === 'generate_digest') {
      return await generateMorningDigest(req, res);
    }

    // Check escalations
    if (path.endsWith('/escalate') || req.body?.action === 'check_escalations') {
      return await checkEscalations(req, res);
    }

    // Send a notification
    const { clubId, userId, channel, type, title, body, priority, relatedMemberId, relatedActionId } = req.body;
    if (!clubId || !type || !title) {
      return res.status(400).json({ error: 'clubId, type, and title required' });
    }

    await sql`
      INSERT INTO notifications (club_id, user_id, channel, type, title, body, priority, related_member_id, related_action_id)
      VALUES (${clubId}, ${userId || null}, ${channel || 'in_app'}, ${type}, ${title}, ${body || null}, ${priority || 'normal'}, ${relatedMemberId || null}, ${relatedActionId || null})
    `;

    // Send via SendGrid if channel is email
    if ((channel === 'email') && process.env.SENDGRID_API_KEY && userId) {
      try {
        const userResult = await sql`SELECT email, name FROM users WHERE user_id = ${userId}`;
        const userEmail = userResult.rows[0]?.email;
        if (userEmail) {
          await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: userEmail }] }],
              from: { email: 'ty.hayes@swoopgolf.com', name: 'Swoop Golf' },
              subject: title,
              content: [{ type: 'text/plain', value: body || title }],
            }),
          });
        }
      } catch {}
    }
    // TODO: If channel is 'sms', send via Twilio
    // TODO: If channel is 'slack', send via webhook

    return res.status(200).json({ ok: true, message: `Notification created: ${title}` });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

async function generateMorningDigest(req, res) {
  const { clubId } = req.body;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  try {
    // Gather digest data
    const pendingActions = await sql`
      SELECT COUNT(*) as count FROM actions WHERE club_id = ${clubId} AND status = 'pending'
    `;
    const newCritical = await sql`
      SELECT m.member_id, m.first_name, m.last_name, m.health_score, m.annual_dues
      FROM members m
      JOIN health_scores hs ON m.member_id = hs.member_id AND m.club_id = hs.club_id
      WHERE m.club_id = ${clubId} AND m.health_tier = 'Critical'
        AND hs.computed_at >= NOW() - INTERVAL '24 hours'
        AND hs.score_delta < -5
      ORDER BY m.health_score ASC LIMIT 5
    `;
    const openComplaints = await sql`
      SELECT c.complaint_id, c.category, c.description, c.reported_at, c.sla_hours,
             m.first_name, m.last_name
      FROM complaints c
      LEFT JOIN members m ON c.member_id = m.member_id
      WHERE c.club_id = ${clubId} AND c.status = 'open'
      ORDER BY c.reported_at ASC LIMIT 5
    `;
    const recentSaves = await sql`
      SELECT COUNT(*) as count FROM interventions
      WHERE club_id = ${clubId} AND is_member_save = TRUE AND initiated_at >= NOW() - INTERVAL '7 days'
    `;

    // Build digest content
    const pending = Number(pendingActions.rows[0]?.count) || 0;
    const criticalMembers = newCritical.rows;
    const complaints = openComplaints.rows;
    const saves = Number(recentSaves.rows[0]?.count) || 0;

    const digestTitle = `Morning Briefing — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;

    let digestBody = `${pending} actions awaiting your review.`;
    if (criticalMembers.length > 0) {
      digestBody += `\n\nNew critical members: ${criticalMembers.map(m => `${m.first_name} ${m.last_name} (score: ${m.health_score})`).join(', ')}`;
    }
    if (complaints.length > 0) {
      const agingComplaints = complaints.filter(c => {
        const hours = (Date.now() - new Date(c.reported_at).getTime()) / 3600000;
        return hours > (c.sla_hours || 24);
      });
      if (agingComplaints.length > 0) {
        digestBody += `\n\n${agingComplaints.length} complaints past SLA — immediate attention needed.`;
      }
    }
    if (saves > 0) {
      digestBody += `\n\n${saves} member saves this week — the system is working.`;
    }

    // Store digest as notification
    await sql`
      INSERT INTO notifications (club_id, channel, type, title, body, priority)
      VALUES (${clubId}, 'email', 'morning_digest', ${digestTitle}, ${digestBody}, 'normal')
    `;

    // Build HTML digest email
    const appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://swoop-member-portal.vercel.app';
    const digestHtml = buildDigestHtml({ pending, criticalMembers, complaints, saves, appUrl });

    // Send digest via SendGrid to all GMs
    if (process.env.SENDGRID_API_KEY) {
      try {
        const gms = await sql`SELECT email, name FROM users WHERE club_id = ${clubId} AND role = 'gm' AND active = TRUE`;
        for (const gm of gms.rows) {
          if (gm.email) {
            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: gm.email, name: gm.name }] }],
                from: { email: 'ty.hayes@swoopgolf.com', name: 'Swoop Golf' },
                subject: digestTitle,
                content: [
                  { type: 'text/plain', value: digestBody },
                  { type: 'text/html', value: digestHtml },
                ],
              }),
            });
          }
        }
      } catch {}
    }

    res.status(200).json({
      digest: { title: digestTitle, body: digestBody },
      data: { pending, criticalMembers: criticalMembers.length, openComplaints: complaints.length, recentSaves: saves },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function buildDigestHtml({ pending, criticalMembers, complaints, saves, appUrl }) {
  const criticalRows = criticalMembers.map(m =>
    `<tr><td style="padding:8px 12px;font-weight:600">${m.first_name} ${m.last_name}</td><td style="padding:8px 12px;color:#b91c1c;font-weight:700">${m.health_score}</td><td style="padding:8px 12px;color:#6b7280">$${Math.round((m.annual_dues || 0) / 1000)}K/yr</td></tr>`
  ).join('');

  const complaintRows = complaints.slice(0, 3).map(c => {
    const hours = Math.round((Date.now() - new Date(c.reported_at).getTime()) / 3600000);
    const isOverdue = hours > (c.sla_hours || 24);
    return `<tr><td style="padding:8px 12px">${c.first_name || ''} ${c.last_name || ''}</td><td style="padding:8px 12px">${c.category}</td><td style="padding:8px 12px;color:${isOverdue ? '#dc2626' : '#6b7280'};font-weight:${isOverdue ? 700 : 400}">${hours}h${isOverdue ? ' (overdue)' : ''}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#E8740C,#c45a00);padding:24px 32px;color:#fff">
    <div style="font-size:12px;font-weight:700;letter-spacing:1.5px;opacity:0.8;margin-bottom:4px">SWOOP MORNING BRIEFING</div>
    <div style="font-size:20px;font-weight:700">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
  </div>
  <div style="padding:24px 32px">
    <div style="display:flex;margin-bottom:24px">
      <div style="text-align:center;flex:1;padding:12px;background:#f9fafb;border-radius:8px;margin-right:8px">
        <div style="font-size:28px;font-weight:800;color:#E8740C">${pending}</div>
        <div style="font-size:11px;color:#6b7280;font-weight:600">Actions Pending</div>
      </div>
      <div style="text-align:center;flex:1;padding:12px;background:#f9fafb;border-radius:8px;margin-right:8px">
        <div style="font-size:28px;font-weight:800;color:#b91c1c">${criticalMembers.length}</div>
        <div style="font-size:11px;color:#6b7280;font-weight:600">Critical Members</div>
      </div>
      <div style="text-align:center;flex:1;padding:12px;background:#f9fafb;border-radius:8px">
        <div style="font-size:28px;font-weight:800;color:#16a34a">${saves}</div>
        <div style="font-size:11px;color:#6b7280;font-weight:600">Saves This Week</div>
      </div>
    </div>
    ${criticalMembers.length > 0 ? `
    <div style="margin-bottom:24px">
      <div style="font-size:13px;font-weight:700;color:#b91c1c;margin-bottom:8px">NEW CRITICAL MEMBERS</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>${criticalRows}</tbody></table>
    </div>` : ''}
    ${complaints.length > 0 ? `
    <div style="margin-bottom:24px">
      <div style="font-size:13px;font-weight:700;color:#d97706;margin-bottom:8px">OPEN COMPLAINTS</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>${complaintRows}</tbody></table>
    </div>` : ''}
    <a href="${appUrl}/#/today" style="display:block;text-align:center;padding:14px 24px;background:#E8740C;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Open Today View</a>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">
    Swoop Golf — Club Intelligence | <a href="${appUrl}/#/admin" style="color:#9ca3af">Manage notifications</a>
  </div>
</div></body></html>`;
}

async function checkEscalations(req, res) {
  const { clubId } = req.body;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  try {
    // Find actions pending for >24 hours
    const overdue24 = await sql`
      SELECT action_id, description, priority, created_at
      FROM actions WHERE club_id = ${clubId} AND status = 'pending'
        AND created_at < NOW() - INTERVAL '24 hours'
        AND created_at >= NOW() - INTERVAL '48 hours'
    `;
    // Find actions pending for >48 hours
    const overdue48 = await sql`
      SELECT action_id, description, priority, created_at
      FROM actions WHERE club_id = ${clubId} AND status = 'pending'
        AND created_at < NOW() - INTERVAL '48 hours'
        AND created_at >= NOW() - INTERVAL '72 hours'
    `;
    // Find actions pending for >72 hours (critical escalation)
    const overdue72 = await sql`
      SELECT action_id, description, priority, created_at
      FROM actions WHERE club_id = ${clubId} AND status = 'pending'
        AND created_at < NOW() - INTERVAL '72 hours'
    `;

    // Find complaints approaching/past SLA
    const slaBreaches = await sql`
      SELECT complaint_id, category, description, reported_at, sla_hours,
             EXTRACT(EPOCH FROM (NOW() - reported_at)) / 3600 as hours_open
      FROM complaints
      WHERE club_id = ${clubId} AND status = 'open'
        AND EXTRACT(EPOCH FROM (NOW() - reported_at)) / 3600 > sla_hours * 0.8
      ORDER BY hours_open DESC
    `;

    const escalations = [];

    // Create escalation notifications
    for (const action of overdue24.rows) {
      escalations.push({ level: 'warning', actionId: action.action_id, description: action.description, hours: 24 });
      await sql`
        INSERT INTO notifications (club_id, type, title, body, priority, related_action_id)
        VALUES (${clubId}, 'escalation', ${'Action overdue: 24 hours'}, ${`"${action.description}" has been pending for over 24 hours.`}, 'high', ${action.action_id})
      `;
    }
    for (const action of overdue48.rows) {
      escalations.push({ level: 'urgent', actionId: action.action_id, description: action.description, hours: 48 });
      await sql`
        INSERT INTO notifications (club_id, type, title, body, priority, related_action_id)
        VALUES (${clubId}, 'escalation', ${'URGENT: Action overdue 48 hours'}, ${`"${action.description}" requires immediate attention — 48 hours without review.`}, 'urgent', ${action.action_id})
      `;
    }
    for (const action of overdue72.rows) {
      escalations.push({ level: 'critical', actionId: action.action_id, description: action.description, hours: 72 });
      await sql`
        INSERT INTO notifications (club_id, type, title, body, priority, related_action_id)
        VALUES (${clubId}, 'escalation', ${'CRITICAL: Action abandoned — 72+ hours'}, ${`"${action.description}" has been ignored for over 72 hours. This action may have expired or the member situation may have worsened.`}, 'urgent', ${action.action_id})
      `;
    }
    for (const complaint of slaBreaches.rows) {
      escalations.push({ level: 'sla_breach', complaintId: complaint.complaint_id, category: complaint.category, hoursOpen: Math.round(complaint.hours_open) });
      await sql`
        INSERT INTO notifications (club_id, type, title, body, priority, related_member_id)
        VALUES (${clubId}, 'sla_breach', ${'Complaint approaching SLA breach'}, ${`${complaint.category}: "${complaint.description}" — open for ${Math.round(complaint.hours_open)} hours (SLA: ${complaint.sla_hours}h)`}, 'high', ${null})
      `;
    }

    res.status(200).json({
      escalations: escalations.length,
      details: escalations,
      overdue: { '24h': overdue24.rows.length, '48h': overdue48.rows.length, '72h': overdue72.rows.length },
      slaBreaches: slaBreaches.rows.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
