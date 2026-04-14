/**
 * Bulk SMS Consent
 * POST /api/sms/bulk-consent
 *
 * Two modes:
 *   { mode: 'membership_agreement', clubId }
 *     — marks all active members with phones as opted-in (club confirmed
 *       their membership agreement covers SMS consent). Skips members
 *       who already have an explicit opt-out recorded.
 *
 *   { mode: 'welcome_text', clubId }
 *     — sends the welcome_opt_in SMS to all active members with phones
 *       who have no existing preference record. Members reply YES to opt in.
 *       Batched in groups of 10 to stay within Twilio throughput limits.
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { cors } from '../lib/cors.js';
import { sendMemberSms, getClubSmsConfig, renderTemplate } from './send.js';
import { normalizePhone } from '../lib/phone.js';

async function twilioSendDirect({ to, body, config }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!sid) throw new Error('TWILIO_ACCOUNT_SID not configured');
  const username = apiKey || sid;
  const password = apiSecret || authToken;
  if (!password) throw new Error('Twilio credentials missing');

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('Body', body);
  const msSid = config?.messaging_service_sid || process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNum = config?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;
  if (msSid) params.append('MessagingServiceSid', msSid);
  else if (fromNum) params.append('From', fromNum);
  else throw new Error('Need MessagingServiceSid or From number');

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Twilio ${data.code}: ${data.message}`);
  return data;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { mode, clubId } = req.body || {};
  if (!mode || !clubId) return res.status(400).json({ error: 'mode and clubId required' });
  if (!['membership_agreement', 'welcome_text'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be membership_agreement or welcome_text' });
  }

  if (mode === 'membership_agreement') {
    // Bulk opt-in for members with phones, skipping explicit opt-outs
    const result = await sql`
      INSERT INTO member_comm_preferences (member_id, club_id, sms_opted_in, sms_consent_date, sms_consent_method)
      SELECT m.member_id, m.club_id, TRUE, NOW(), 'membership_agreement'
      FROM members m
      WHERE m.club_id = ${clubId}
        AND m.phone IS NOT NULL
        AND m.membership_status = 'active'
      ON CONFLICT (member_id, club_id) DO UPDATE SET
        sms_opted_in = CASE
          WHEN member_comm_preferences.opt_out_date IS NOT NULL THEN member_comm_preferences.sms_opted_in
          ELSE TRUE
        END,
        sms_consent_date = CASE
          WHEN member_comm_preferences.opt_out_date IS NOT NULL THEN member_comm_preferences.sms_consent_date
          ELSE NOW()
        END,
        sms_consent_method = CASE
          WHEN member_comm_preferences.opt_out_date IS NOT NULL THEN member_comm_preferences.sms_consent_method
          ELSE 'membership_agreement'
        END,
        updated_at = NOW()
    `;

    return res.json({
      ok: true,
      mode,
      opted_in: result.rowCount,
    });
  }

  // mode === 'welcome_text'
  // Get members with phones who have no existing prefs
  const membersRes = await sql`
    SELECT m.member_id, m.phone, m.first_name, m.club_id
    FROM members m
    LEFT JOIN member_comm_preferences mcp ON mcp.member_id = m.member_id AND mcp.club_id = m.club_id
    WHERE m.club_id = ${clubId}
      AND m.phone IS NOT NULL
      AND m.membership_status = 'active'
      AND mcp.member_id IS NULL
  `;

  if (membersRes.rows.length === 0) {
    return res.json({ ok: true, mode, sent: 0, message: 'No eligible members without existing preferences' });
  }

  const config = await getClubSmsConfig(clubId);
  if (!config?.enabled) {
    return res.status(400).json({ error: 'SMS not enabled for this club. Enable it in SMS config first.' });
  }

  // Get welcome_opt_in template
  const templateRes = await sql`
    SELECT body FROM sms_templates
    WHERE template_id = 'welcome_opt_in' AND (club_id = ${clubId} OR club_id IS NULL)
    ORDER BY club_id NULLS LAST LIMIT 1
  `;
  const templateBody = templateRes.rows[0]?.body;
  if (!templateBody) {
    return res.status(500).json({ error: 'welcome_opt_in template not found' });
  }

  const senderName = config.sender_name || 'Your Club';
  const members = membersRes.rows;
  let sent = 0;
  let failed = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);

    for (const m of batch) {
      const phone = normalizePhone(m.phone);
      if (!phone) { failed++; continue; }

      const body = renderTemplate(templateBody, { club_name: senderName, first_name: m.first_name });
      const finalBody = body.startsWith(senderName) ? body : `${senderName}: ${body}`;

      try {
        const result = await twilioSendDirect({ to: phone, body: finalBody, config });
        await sql`
          INSERT INTO sms_log (club_id, member_id, template_id, direction, body, twilio_sid, status, sent_at)
          VALUES (${clubId}, ${m.member_id}, 'welcome_opt_in', 'outbound', ${finalBody}, ${result.sid}, ${result.status || 'sent'}, NOW())
        `.catch(() => {});
        sent++;
      } catch (e) {
        console.error(`[bulk-consent] send error for ${m.member_id}:`, e.message);
        failed++;
      }
    }

    // 1s delay between batches to stay within Twilio throughput
    if (i + BATCH_SIZE < members.length) await sleep(1000);
  }

  return res.json({ ok: true, mode, total: members.length, sent, failed });
}

export default withAuth(handler);
