/**
 * Outbound SMS send engine
 *
 * All agent-triggered and system-triggered SMS flows through here.
 * Single point of control for: consent check, quiet hours, daily rate limit,
 * template rendering, Twilio delivery, and logging.
 */
import { sql } from '@vercel/postgres';
import { normalizePhone } from '../lib/phone.js';

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_BASE_URL || 'https://swoop-member-portal-dev.vercel.app');

const DRY_RUN = process.env.SMS_DRY_RUN === 'true';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTemplate(body, vars) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function isQuietHours(config) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const start = config.quiet_hours_start || '21:00';
  const end = config.quiet_hours_end || '07:00';
  // Quiet window can span midnight (e.g. 21:00 - 07:00)
  if (start > end) {
    return hhmm >= start || hhmm < end;
  }
  return hhmm >= start && hhmm < end;
}

async function getClubSmsConfig(clubId) {
  const res = await sql`SELECT * FROM club_sms_config WHERE club_id = ${clubId}`;
  return res.rows[0] || null;
}

async function getMemberCommPrefs(memberId, clubId) {
  const res = await sql`
    SELECT * FROM member_comm_preferences
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  return res.rows[0] || null;
}

async function getTemplate(templateId, clubId) {
  // Prefer club-specific override, fall back to system default
  const res = await sql`
    SELECT * FROM sms_templates
    WHERE template_id = ${templateId}
      AND (club_id = ${clubId} OR club_id IS NULL)
      AND active = TRUE
    ORDER BY club_id NULLS LAST
    LIMIT 1
  `;
  return res.rows[0] || null;
}

async function getDailyCount(memberId, clubId) {
  const res = await sql`
    SELECT COUNT(*) AS cnt FROM sms_log
    WHERE member_id = ${memberId}
      AND club_id = ${clubId}
      AND direction = 'outbound'
      AND sent_at >= CURRENT_DATE
  `;
  return parseInt(res.rows[0]?.cnt || '0', 10);
}

async function twilioSend({ to, body, from, messagingServiceSid, statusCallback }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!sid) throw new Error('TWILIO_ACCOUNT_SID not configured');
  const username = apiKey || sid;
  const password = apiSecret || authToken;
  if (!password) throw new Error('Twilio auth credentials not configured');

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('Body', body);
  if (messagingServiceSid) {
    params.append('MessagingServiceSid', messagingServiceSid);
  } else if (from) {
    params.append('From', from);
  } else {
    throw new Error('Need MessagingServiceSid or From number');
  }
  if (statusCallback) params.append('StatusCallback', statusCallback);

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
  if (!resp.ok) {
    throw new Error(`Twilio error ${data.code}: ${data.message}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an SMS to a member. Checks consent, quiet hours, daily limit.
 *
 * @param {object} opts
 * @param {string} opts.clubId
 * @param {string} opts.memberId
 * @param {string} opts.templateId  - template key from sms_templates
 * @param {object} opts.variables   - key/value for {{slot}} substitution
 * @param {string} [opts.priority]  - 'urgent' skips quiet hours + rate limit
 * @param {string} [opts.intentId]  - link to agent intent that triggered this
 * @returns {{ sent: boolean, reason?: string, sid?: string }}
 */
export async function sendMemberSms({ clubId, memberId, templateId, variables = {}, priority, intentId }) {
  // 1. Club SMS enabled?
  const config = await getClubSmsConfig(clubId);
  if (!config?.enabled) return { sent: false, reason: 'club_sms_disabled' };

  // 2. Member consent
  const prefs = await getMemberCommPrefs(memberId, clubId);
  if (!prefs?.sms_opted_in) return { sent: false, reason: 'member_not_opted_in' };

  // 3. Quiet hours (skip for urgent)
  if (priority !== 'urgent' && isQuietHours(config)) {
    return { sent: false, reason: 'quiet_hours' };
  }

  // 4. Daily rate limit (skip for urgent)
  if (priority !== 'urgent') {
    const todayCount = await getDailyCount(memberId, clubId);
    if (todayCount >= (config.max_daily_per_member || 3)) {
      return { sent: false, reason: 'daily_limit_reached' };
    }
  }

  // 5. Member phone
  const memberRes = await sql`SELECT phone, first_name FROM members WHERE member_id = ${memberId}`;
  const member = memberRes.rows[0];
  const phone = member?.phone ? normalizePhone(member.phone) : null;
  if (!phone) return { sent: false, reason: 'no_phone' };

  // 6. Resolve template
  const template = await getTemplate(templateId, clubId);
  if (!template) return { sent: false, reason: `template_not_found:${templateId}` };

  // 7. Render body
  const rendered = renderTemplate(template.body, { ...variables, first_name: member.first_name });

  // 8. Prepend sender name if not already present
  const senderName = config.sender_name || 'Your Club';
  const finalBody = rendered.startsWith(senderName) ? rendered : `${senderName}: ${rendered}`;

  // 9. Send (or simulate in dry-run mode)
  let twilioResult;
  let errorMsg;
  if (DRY_RUN) {
    twilioResult = { sid: `SIM_${Date.now()}`, status: 'simulated' };
    console.log(`[sms/send] DRY RUN — would send to ${phone}: ${finalBody}`);
  } else {
    try {
      twilioResult = await twilioSend({
        to: phone,
        body: finalBody,
        from: config.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER,
        messagingServiceSid: config.messaging_service_sid || process.env.TWILIO_MESSAGING_SERVICE_SID,
        statusCallback: `${BASE_URL}/api/twilio/status`,
      });
    } catch (e) {
      errorMsg = e.message;
      console.error('[sms/send] Twilio error:', e.message);
    }
  }

  // 10. Log
  await sql`
    INSERT INTO sms_log (club_id, member_id, template_id, direction, body, twilio_sid, status, error_message, intent_id, sent_at)
    VALUES (${clubId}, ${memberId}, ${templateId}, 'outbound', ${finalBody},
            ${twilioResult?.sid || null}, ${twilioResult ? (twilioResult.status || 'sent') : 'failed'},
            ${errorMsg || null}, ${intentId || null}, NOW())
  `.catch(e => console.error('[sms/send] log error:', e.message));

  if (errorMsg) return { sent: false, reason: 'twilio_error', error: errorMsg };
  return { sent: true, sid: twilioResult.sid };
}

/**
 * Send an SMS to a staff user. Skips member consent check.
 * Respects quiet hours unless priority is 'urgent'.
 */
export async function sendStaffSms({ clubId, userId, templateId, variables = {}, priority, intentId }) {
  // Staff phone + alert enabled
  const userRes = await sql`
    SELECT phone, name, sms_alerts_enabled FROM users
    WHERE user_id = ${userId} AND club_id = ${clubId}
  `;
  const user = userRes.rows[0];
  if (!user?.phone || user.sms_alerts_enabled === false) {
    return { sent: false, reason: 'staff_sms_disabled' };
  }

  const phone = normalizePhone(user.phone);
  if (!phone) return { sent: false, reason: 'no_phone' };

  // Quiet hours for non-urgent staff messages
  if (priority !== 'urgent') {
    const config = await getClubSmsConfig(clubId);
    if (config && isQuietHours(config)) {
      return { sent: false, reason: 'quiet_hours' };
    }
  }

  const template = await getTemplate(templateId, clubId);
  if (!template) return { sent: false, reason: `template_not_found:${templateId}` };

  const rendered = renderTemplate(template.body, variables);

  let twilioResult;
  let errorMsg;
  if (DRY_RUN) {
    twilioResult = { sid: `SIM_${Date.now()}`, status: 'simulated' };
    console.log(`[sms/send] DRY RUN (staff) — would send to ${phone}: ${rendered}`);
  } else {
    try {
      const config = await getClubSmsConfig(clubId);
      twilioResult = await twilioSend({
        to: phone,
        body: rendered,
        from: config?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER,
        messagingServiceSid: config?.messaging_service_sid || process.env.TWILIO_MESSAGING_SERVICE_SID,
        statusCallback: `${BASE_URL}/api/twilio/status`,
      });
    } catch (e) {
      errorMsg = e.message;
      console.error('[sms/send] staff Twilio error:', e.message);
    }
  }

  await sql`
    INSERT INTO sms_log (club_id, user_id, template_id, direction, body, twilio_sid, status, error_message, intent_id, sent_at)
    VALUES (${clubId}, ${userId}, ${templateId}, 'outbound_staff', ${rendered},
            ${twilioResult?.sid || null}, ${twilioResult ? (twilioResult.status || 'sent') : 'failed'},
            ${errorMsg || null}, ${intentId || null}, NOW())
  `.catch(e => console.error('[sms/send] staff log error:', e.message));

  if (errorMsg) return { sent: false, reason: 'twilio_error', error: errorMsg };
  return { sent: true, sid: twilioResult.sid };
}

// Export helpers for use by inbound handler and bulk-consent
export { getClubSmsConfig, renderTemplate };
