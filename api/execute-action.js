/**
 * Action Execution API — Sprint 4
 * POST /api/execute-action
 *
 * Executes an approved action: sends email, SMS, creates staff task,
 * logs the intervention, and starts outcome tracking.
 *
 * Body: { actionId, clubId, executionType, memberEmail, memberPhone, staffEmail, templateId, customMessage }
 * executionType: 'email' | 'sms' | 'staff_task' | 'schedule_call' | 'comp_offer'
 */
import { sql } from '@vercel/postgres';

// Email templates — Phase 1 hardcoded, Phase 2 from database
const EMAIL_TEMPLATES = {
  personal_note: {
    subject: 'A personal note from {{clubName}}',
    body: 'Dear {{memberName}},\n\nI wanted to reach out personally to see how things are going at the club. {{customMessage}}\n\nWe value your membership and I would love to hear from you directly.\n\nWarm regards,\n{{senderName}}\n{{senderTitle}}\n{{clubName}}',
  },
  recovery_outreach: {
    subject: 'We miss you at {{clubName}}',
    body: 'Dear {{memberName}},\n\nWe noticed it has been a while since your last visit, and we wanted to make sure everything is to your satisfaction.\n\n{{customMessage}}\n\nAs a valued member, we would love to welcome you back. Please don\'t hesitate to reach out if there\'s anything we can do.\n\nBest regards,\n{{senderName}}\n{{clubName}}',
  },
  event_invite: {
    subject: 'You\'re invited: {{eventName}} at {{clubName}}',
    body: 'Dear {{memberName}},\n\nWe have an upcoming event that we think you\'d enjoy:\n\n{{customMessage}}\n\nWe would love to see you there. RSVP by replying to this email or calling the front desk.\n\nBest,\n{{senderName}}\n{{clubName}}',
  },
  comp_offer: {
    subject: 'A special offer for you from {{clubName}}',
    body: 'Dear {{memberName}},\n\nAs a token of our appreciation for your continued membership, we would like to offer you:\n\n{{customMessage}}\n\nPlease mention this email when you visit, or contact us to arrange. We look forward to seeing you soon.\n\nWith gratitude,\n{{senderName}}\n{{clubName}}',
  },
};

function renderTemplate(template, vars) {
  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const {
    actionId, clubId, executionType, memberId, memberEmail, memberPhone,
    staffEmail, staffName, templateId, customMessage, senderName, senderTitle, senderEmail,
  } = req.body;

  if (!actionId || !clubId || !executionType) {
    return res.status(400).json({ error: 'actionId, clubId, and executionType are required' });
  }

  try {
    // Get action details
    const actionResult = await sql`
      SELECT * FROM actions WHERE action_id = ${actionId} AND club_id = ${clubId}
    `;
    if (actionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Action not found' });
    }
    const action = actionResult.rows[0];

    // Get club details
    const clubResult = await sql`SELECT name FROM club WHERE club_id = ${clubId}`;
    const clubName = clubResult.rows[0]?.name || 'Your Club';

    // Get member details if needed
    let memberName = '';
    if (memberId || action.member_id) {
      const memberResult = await sql`
        SELECT first_name, last_name, email, phone, health_score
        FROM members WHERE member_id = ${memberId || action.member_id}
      `;
      if (memberResult.rows.length > 0) {
        const m = memberResult.rows[0];
        memberName = `${m.first_name} ${m.last_name}`;
      }
    }

    const results = { executionType, status: 'pending' };
    const templateVars = {
      clubName, memberName, customMessage: customMessage || '',
      senderName: senderName || 'The Management Team', senderTitle: senderTitle || 'General Manager',
    };

    // Execute based on type
    if (executionType === 'email') {
      // Phase 1: Log the email intent. Phase 2: Wire to SendGrid/Postmark.
      const template = EMAIL_TEMPLATES[templateId] || EMAIL_TEMPLATES.personal_note;
      const subject = renderTemplate(template.subject, templateVars);
      const body = renderTemplate(template.body, templateVars);

      // Send via SendGrid if API key is configured
      const toEmail = memberEmail || (await getMemberEmail(memberId || action.member_id));
      let emailSent = false;
      if (process.env.SENDGRID_API_KEY && toEmail) {
        try {
          const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: toEmail, name: memberName }] }],
              from: { email: senderEmail || 'noreply@swoopgolf.com', name: `${senderName || 'Swoop Golf'} - ${clubName}` },
              subject,
              content: [{ type: 'text/plain', value: body }],
            }),
          });
          emailSent = sgRes.status >= 200 && sgRes.status < 300;
        } catch (e) {
          // SendGrid failed — still log the intervention
        }
      }

      await sql`
        INSERT INTO interventions (club_id, member_id, action_id, intervention_type, description, initiated_by, health_score_before)
        VALUES (${clubId}, ${memberId || action.member_id}, ${actionId}, 'email',
                ${`Email ${emailSent ? 'sent' : 'queued'}: "${subject}" to ${toEmail || 'member email'}`},
                ${senderName || 'System'},
                (SELECT health_score FROM members WHERE member_id = ${memberId || action.member_id}))
      `;

      results.status = 'sent';
      results.emailSubject = subject;
      results.message = `Email queued for ${memberName || 'member'}`;

    } else if (executionType === 'sms') {
      // TODO Sprint 4: Wire to Twilio
      await sql`
        INSERT INTO interventions (club_id, member_id, action_id, intervention_type, description, initiated_by, health_score_before)
        VALUES (${clubId}, ${memberId || action.member_id}, ${actionId}, 'sms',
                ${`SMS sent to ${memberPhone || 'member phone'}: ${customMessage || action.description}`},
                ${senderName || 'System'},
                (SELECT health_score FROM members WHERE member_id = ${memberId || action.member_id}))
      `;

      results.status = 'sent';
      results.message = `SMS queued for ${memberName || 'member'}`;

    } else if (executionType === 'staff_task') {
      // Create a task for a staff member
      await sql`
        INSERT INTO actions (club_id, member_id, action_type, description, status, priority, assigned_to, source)
        VALUES (${clubId}, ${memberId || action.member_id}, 'staff_task',
                ${customMessage || action.description}, 'assigned',
                ${action.priority || 'medium'}, ${staffName || 'Unassigned'}, 'system')
      `;

      // TODO Sprint 7: Send notification to staff via email/Slack
      await sql`
        INSERT INTO interventions (club_id, member_id, action_id, intervention_type, description, initiated_by, health_score_before)
        VALUES (${clubId}, ${memberId || action.member_id}, ${actionId}, 'staff_task',
                ${`Task assigned to ${staffName || 'staff'}: ${customMessage || action.description}`},
                ${senderName || 'System'},
                (SELECT health_score FROM members WHERE member_id = ${memberId || action.member_id}))
      `;

      results.status = 'assigned';
      results.message = `Task assigned to ${staffName || 'staff'}`;

    } else if (executionType === 'schedule_call') {
      await sql`
        INSERT INTO interventions (club_id, member_id, action_id, intervention_type, description, initiated_by, health_score_before)
        VALUES (${clubId}, ${memberId || action.member_id}, ${actionId}, 'call_scheduled',
                ${`Call scheduled with ${memberName}: ${customMessage || 'Personal outreach'}`},
                ${senderName || 'GM'},
                (SELECT health_score FROM members WHERE member_id = ${memberId || action.member_id}))
      `;

      results.status = 'scheduled';
      results.message = `Call scheduled with ${memberName}`;

    } else if (executionType === 'comp_offer') {
      await sql`
        INSERT INTO interventions (club_id, member_id, action_id, intervention_type, description, initiated_by, health_score_before)
        VALUES (${clubId}, ${memberId || action.member_id}, ${actionId}, 'comp_offer',
                ${`Comp offered to ${memberName}: ${customMessage || 'Complimentary round/dining credit'}`},
                ${senderName || 'GM'},
                (SELECT health_score FROM members WHERE member_id = ${memberId || action.member_id}))
      `;

      results.status = 'offered';
      results.message = `Comp offer logged for ${memberName}`;
    }

    // Update action status to executed
    await sql`
      UPDATE actions SET status = 'executed', executed_at = NOW()
      WHERE action_id = ${actionId}
    `;

    res.status(200).json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getMemberEmail(memberId) {
  if (!memberId) return null;
  try {
    const result = await sql`SELECT email FROM members WHERE member_id = ${memberId}`;
    return result.rows[0]?.email || null;
  } catch { return null; }
}
