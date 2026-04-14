/**
 * Intent Router
 * POST /api/intents/route
 *
 * Accepts an agent intent and routes it to the correct SMS template
 * via the outbound send engine. Agents call this instead of sending
 * SMS directly so all consent/rate-limit/quiet-hours logic stays central.
 *
 * Intent shape (minimum):
 *   {
 *     intent_type: string,          // see INTENT_TO_TEMPLATE map below
 *     club_id: string,
 *     target_member_id?: string,    // for member-facing messages
 *     target_user_id?: string,      // for staff-facing messages
 *     priority?: 'normal' | 'urgent',
 *     intent_id?: string,           // correlates log rows to agent action
 *     context: { ...variables }     // template slot values
 *   }
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { cors } from '../lib/cors.js';
import { sendMemberSms, sendStaffSms } from '../sms/send.js';

// ---------------------------------------------------------------------------
// Intent → template mapping
// ---------------------------------------------------------------------------

const INTENT_TO_TEMPLATE = {
  // Member-facing
  post_round_dining_bridge:    { templateId: 'dining_nudge',        target: 'member', category: 'dining' },
  member_replied_HOLD:         { templateId: 'dining_hold_confirmed', target: 'member', category: 'dining' },
  demand_optimizer_slot:       { templateId: 'tee_time_offer',      target: 'member', category: 'tee_time' },
  member_replied_BOOK:         { templateId: 'tee_time_confirmed',   target: 'member', category: 'tee_time' },
  tee_time_t_minus_90:         { templateId: 'tee_time_reminder',   target: 'member', category: 'tee_time' },
  weather_pivot_concierge:     { templateId: 'weather_pivot',       target: 'member', category: 'weather' },
  milestone_concierge:         { templateId: 'milestone',           target: 'member', category: 'milestone' },
  bulk_consent_request:        { templateId: 'welcome_opt_in',      target: 'member', category: 'consent' },

  // Staff-facing
  service_recovery_escalation: { templateId: 'staff_complaint',     target: 'staff', category: 'staff_alert' },
  demand_optimizer_cancellation:{ templateId: 'staff_cancellation', target: 'staff', category: 'staff_alert' },
  labor_optimizer_gap:         { templateId: 'staff_staffing_gap',  target: 'staff', category: 'staff_alert' },
  arrival_anticipation:        { templateId: 'staff_arrival_brief', target: 'staff', category: 'staff_alert' },
};

// ---------------------------------------------------------------------------
// Category opt-out check
// ---------------------------------------------------------------------------

async function isCategoryDisabled(memberId, clubId, category) {
  const res = await sql`
    SELECT categories_disabled FROM member_comm_preferences
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  const disabled = res.rows[0]?.categories_disabled || [];
  return disabled.includes(category);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { intent } = req.body || {};
  if (!intent?.intent_type || !intent?.club_id) {
    return res.status(400).json({ error: 'intent.intent_type and intent.club_id are required' });
  }

  const mapping = INTENT_TO_TEMPLATE[intent.intent_type];
  if (!mapping) {
    return res.status(400).json({ error: `Unknown intent_type: ${intent.intent_type}` });
  }

  const { templateId, target, category } = mapping;
  const variables = intent.context || {};

  if (target === 'member') {
    if (!intent.target_member_id) {
      return res.status(400).json({ error: 'target_member_id required for member intent' });
    }

    // Check category opt-out
    if (category !== 'consent') {
      const disabled = await isCategoryDisabled(intent.target_member_id, intent.club_id, category);
      if (disabled) {
        return res.json({ delivered: false, reason: 'category_disabled', category });
      }
    }

    const result = await sendMemberSms({
      clubId: intent.club_id,
      memberId: intent.target_member_id,
      templateId,
      variables,
      priority: intent.priority,
      intentId: intent.intent_id,
    });

    return res.json({ delivered: result.sent, ...result });
  }

  if (target === 'staff') {
    if (!intent.target_user_id) {
      return res.status(400).json({ error: 'target_user_id required for staff intent' });
    }

    const result = await sendStaffSms({
      clubId: intent.club_id,
      userId: intent.target_user_id,
      templateId,
      variables,
      priority: intent.priority,
      intentId: intent.intent_id,
    });

    return res.json({ delivered: result.sent, ...result });
  }

  return res.status(400).json({ error: `Unknown target type: ${target}` });
}

export default withAuth(handler);
