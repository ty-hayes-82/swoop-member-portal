/**
 * POST /api/concierge/learn-preferences
 *
 * Learns member preferences from interactions and updates the
 * member_concierge_sessions.preferences_cache with new patterns.
 *
 * Body: { club_id, member_id, interaction_type, data }
 * Interaction types:
 *   booking_accepted, booking_declined, dining_choice, event_rsvp,
 *   event_skip, message_response, message_ignored
 *
 * Uses JSON merge strategy — never overwrites, only appends/updates.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

const VALID_INTERACTION_TYPES = [
  'booking_accepted',
  'booking_declined',
  'dining_choice',
  'event_rsvp',
  'event_skip',
  'message_response',
  'message_ignored',
];

/**
 * Extract preference signals from an interaction.
 */
function extractSignals(interactionType, data) {
  const signals = {};

  switch (interactionType) {
    case 'booking_accepted': {
      if (data.day_of_week) signals.preferred_days = [data.day_of_week];
      if (data.tee_time) signals.preferred_times = [data.tee_time];
      if (data.course) signals.favorite_courses = [data.course];
      if (data.players) signals.golf_partners = data.players;
      signals.acceptance_rate_delta = 1; // accepted
      break;
    }
    case 'booking_declined': {
      signals.acceptance_rate_delta = 0; // declined
      if (data.reason) signals.decline_reasons = [data.reason];
      break;
    }
    case 'dining_choice': {
      if (data.companions) signals.dining_companions = data.companions;
      if (data.beverage) signals.beverage_orders = [data.beverage];
      if (data.outlet) signals.favorite_outlets = [data.outlet];
      if (data.items) signals.favorite_items = data.items;
      break;
    }
    case 'event_rsvp': {
      if (data.event_type) signals.preferred_event_types = [data.event_type];
      signals.acceptance_rate_delta = 1;
      break;
    }
    case 'event_skip': {
      signals.acceptance_rate_delta = 0;
      if (data.event_type) signals.skipped_event_types = [data.event_type];
      break;
    }
    case 'message_response': {
      if (data.response_time_minutes) signals.response_windows = [data.response_time_minutes];
      signals.communication_style = data.tone || null;
      signals.message_response_delta = 1;
      break;
    }
    case 'message_ignored': {
      signals.message_response_delta = 0;
      break;
    }
  }

  return signals;
}

/**
 * Merge new signals into existing preferences using append-only strategy.
 * Arrays are unioned (deduplicated), counters are incremented, rates are recalculated.
 */
function mergePreferences(existing, signals) {
  const merged = { ...existing };

  // Array fields: append unique values, keep last N
  const arrayFields = [
    'preferred_days', 'preferred_times', 'favorite_courses', 'dining_companions',
    'beverage_orders', 'favorite_outlets', 'favorite_items', 'preferred_event_types',
    'skipped_event_types', 'decline_reasons', 'golf_partners',
  ];

  for (const field of arrayFields) {
    if (!signals[field]) continue;
    const prev = Array.isArray(merged[field]) ? merged[field] : [];
    const incoming = Array.isArray(signals[field]) ? signals[field] : [signals[field]];
    // Union and keep most recent 20 entries
    const combined = [...new Set([...prev, ...incoming])];
    merged[field] = combined.slice(-20);
  }

  // Response windows: keep rolling window of last 10 response times
  if (signals.response_windows) {
    const prev = Array.isArray(merged.response_windows) ? merged.response_windows : [];
    merged.response_windows = [...prev, ...signals.response_windows].slice(-10);
  }

  // Communication style: update to latest if provided
  if (signals.communication_style) {
    merged.communication_style = signals.communication_style;
  }

  // Acceptance rate: rolling count
  if (typeof signals.acceptance_rate_delta === 'number') {
    merged._acceptance_total = (merged._acceptance_total || 0) + 1;
    merged._acceptance_positive = (merged._acceptance_positive || 0) + signals.acceptance_rate_delta;
    merged.acceptance_rate = Math.round((merged._acceptance_positive / merged._acceptance_total) * 100) / 100;
  }

  // Message response rate: rolling count
  if (typeof signals.message_response_delta === 'number') {
    merged._message_total = (merged._message_total || 0) + 1;
    merged._message_responded = (merged._message_responded || 0) + signals.message_response_delta;
    merged.message_response_rate = Math.round((merged._message_responded / merged._message_total) * 100) / 100;
  }

  merged.last_updated = new Date().toISOString();

  return merged;
}

/**
 * Compute confidence scores based on data volume.
 */
function computeConfidence(prefs) {
  const scores = {};
  const arrayConfidence = (field, threshold) => {
    const arr = prefs[field];
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
    return Math.min(arr.length / threshold, 1.0);
  };

  scores.preferred_days = arrayConfidence('preferred_days', 5);
  scores.preferred_times = arrayConfidence('preferred_times', 5);
  scores.favorite_courses = arrayConfidence('favorite_courses', 3);
  scores.dining_companions = arrayConfidence('dining_companions', 3);
  scores.beverage_orders = arrayConfidence('beverage_orders', 3);
  scores.communication_style = prefs.communication_style ? 0.7 : 0;
  scores.response_windows = arrayConfidence('response_windows', 5);
  scores.acceptance_rate = (prefs._acceptance_total || 0) >= 5 ? 0.9 : (prefs._acceptance_total || 0) * 0.18;

  // Round all to 2 decimals
  for (const key of Object.keys(scores)) {
    scores[key] = Math.round(scores[key] * 100) / 100;
  }

  return scores;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { member_id, interaction_type, data } = req.body;

  if (!member_id) return res.status(400).json({ error: 'member_id is required' });
  if (!interaction_type) return res.status(400).json({ error: 'interaction_type is required' });
  if (!VALID_INTERACTION_TYPES.includes(interaction_type)) {
    return res.status(400).json({ error: `Invalid interaction_type. Must be one of: ${VALID_INTERACTION_TYPES.join(', ')}` });
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'data is required and must be an object' });
  }

  try {
    // Load existing preferences from session
    let existing = {};
    try {
      const sessionResult = await sql`
        SELECT preferences_cache FROM member_concierge_sessions
        WHERE club_id = ${clubId} AND member_id = ${member_id}
      `;
      if (sessionResult.rows.length > 0 && sessionResult.rows[0].preferences_cache) {
        const raw = sessionResult.rows[0].preferences_cache;
        existing = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    } catch (e) {
      console.warn('[learn-preferences] session read error (continuing with empty):', e.message);
    }

    // Extract signals from the interaction
    const signals = extractSignals(interaction_type, data);

    // Merge into existing preferences
    const updated = mergePreferences(existing, signals);

    // Write back to session
    try {
      const updatedJson = JSON.stringify(updated);
      await sql`
        INSERT INTO member_concierge_sessions (session_id, club_id, member_id, preferences_cache, last_active, created_at)
        VALUES (
          'ses_' || substr(md5(random()::text), 1, 12),
          ${clubId}, ${member_id}, ${updatedJson}::jsonb, NOW(), NOW()
        )
        ON CONFLICT (club_id, member_id)
        DO UPDATE SET preferences_cache = ${updatedJson}::jsonb, last_active = NOW()
      `;
    } catch (e) {
      console.warn('[learn-preferences] session write error:', e.message);
      // Still return what we computed even if write failed
    }

    const confidence = computeConfidence(updated);

    return res.status(200).json({
      member_id,
      interaction_type,
      updated_preferences: updated,
      confidence_scores: confidence,
    });
  } catch (err) {
    console.error('[learn-preferences] error:', err);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}

export default withAuth(handler, { allowDemo: true });
