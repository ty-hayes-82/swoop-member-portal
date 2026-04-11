/**
 * POST /api/concierge/life-events
 *
 * Life Event Awareness — records significant life events for a member and
 * adjusts concierge tone, preferences, and suggested next actions accordingly.
 *
 * Body: { club_id, member_id, event_type, context }
 * Event types: injury_recovery, retirement, new_family_member, job_change,
 *              bereavement, achievement
 * Returns: { acknowledged, adjusted_preferences, next_suggested_action }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

const EVENT_ADJUSTMENTS = {
  injury_recovery: {
    tone: 'gentle and supportive — avoid pressure to play, focus on social offerings',
    preference_updates: {
      activity_level: 'reduced',
      suggest_golf: false,
      suggest_social: true,
      suggest_dining: true,
    },
    next_action: 'Send a thoughtful note. Suggest low-impact social events (dining, trivia, wine tastings). Check in every 2 weeks on recovery progress.',
  },
  retirement: {
    tone: 'celebratory and warm — acknowledge the milestone, highlight daytime availability',
    preference_updates: {
      availability: 'weekday_daytime',
      suggest_golf: true,
      suggest_events: true,
      suggest_committees: true,
    },
    next_action: 'Congratulate them. Suggest weekday golf groups, committee involvement, and men\'s/women\'s day programs. Great candidate for ambassador role.',
  },
  new_family_member: {
    tone: 'congratulatory — highlight family-friendly amenities and flexibility',
    preference_updates: {
      family_focus: true,
      suggest_family_events: true,
      schedule_flexibility: 'needed',
    },
    next_action: 'Send congratulations. Highlight family dining, kids\' programs, and flexible booking. If new baby, be mindful of reduced availability for 3-6 months.',
  },
  job_change: {
    tone: 'supportive — acknowledge transition, highlight networking opportunities',
    preference_updates: {
      networking_interest: true,
      schedule_change: 'likely',
    },
    next_action: 'Check in on new schedule preferences. Suggest networking events, business dinners, and member introductions in their new industry.',
  },
  bereavement: {
    tone: 'deeply empathetic — minimal outreach, no promotional messages for 30 days',
    preference_updates: {
      outreach_pause: 30,
      tone_override: 'gentle',
      suggest_golf: false,
      promotional_hold: true,
    },
    next_action: 'Send condolences (handwritten note from GM preferred). Pause all proactive outreach for 30 days. When resuming, start with a quiet check-in — no event pushes.',
  },
  achievement: {
    tone: 'enthusiastic and proud — celebrate publicly if appropriate',
    preference_updates: {
      recognition_opportunity: true,
    },
    next_action: 'Acknowledge the achievement. Consider a mention in the club newsletter (with permission), a congratulatory drink at the Grill Room, or recognition at the next club event.',
  },
};

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clubId = getReadClubId(req);
  const { member_id, event_type, context } = req.body;

  if (!member_id) return res.status(400).json({ error: 'member_id is required' });
  if (!event_type) return res.status(400).json({ error: 'event_type is required' });

  const validTypes = Object.keys(EVENT_ADJUSTMENTS);
  if (!validTypes.includes(event_type)) {
    return res.status(400).json({
      error: `Invalid event_type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  try {
    const adjustment = EVENT_ADJUSTMENTS[event_type];
    const contextStr = context ? (typeof context === 'string' ? context : JSON.stringify(context)) : '';

    // 1. Load current member info
    let memberName = 'Member';
    try {
      const memberResult = await sql`
        SELECT first_name, last_name FROM members
        WHERE member_id = ${member_id} AND club_id = ${clubId}
      `;
      if (memberResult.rows.length) {
        const m = memberResult.rows[0];
        memberName = `${m.first_name} ${m.last_name}`.trim();
      }
    } catch {}

    // 2. Log the life event to activity_log
    try {
      await sql`
        INSERT INTO activity_log
          (club_id, member_id, member_name, action_type, action_subtype, detail, created_at)
        VALUES (
          ${clubId}, ${member_id}, ${memberName},
          'life_event', ${event_type},
          ${`Life event recorded: ${event_type}. Context: ${contextStr.slice(0, 300)}. Tone adjusted to: ${adjustment.tone.slice(0, 100)}`},
          NOW()
        )
      `;
    } catch {}

    // 3. Update concierge session preferences with life event context
    try {
      await sql`
        UPDATE member_concierge_sessions
        SET preferences_cache = jsonb_set(
          COALESCE(preferences_cache::jsonb, '{}'::jsonb),
          '{life_event}',
          ${JSON.stringify({
            type: event_type,
            context: contextStr.slice(0, 500),
            recorded_at: new Date().toISOString(),
            tone_adjustment: adjustment.tone,
            preference_updates: adjustment.preference_updates,
          })}::jsonb
        ),
        updated_at = NOW()
        WHERE member_id = ${member_id} AND club_id = ${clubId}
      `;
    } catch {}

    // 4. If bereavement, pause proactive outreach
    if (event_type === 'bereavement') {
      try {
        await sql`
          INSERT INTO member_proactive_log
            (club_id, member_id, outreach_type, channel, message_preview, sent_at)
          VALUES (
            ${clubId}, ${member_id}, 'outreach_pause',
            'system',
            ${`Proactive outreach paused for 30 days due to bereavement. Resume after ${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}.`},
            NOW()
          )
        `;
      } catch {}
    }

    // 5. Log to member_proactive_log for tracking
    try {
      await sql`
        INSERT INTO member_proactive_log
          (club_id, member_id, outreach_type, channel, message_preview, sent_at)
        VALUES (
          ${clubId}, ${member_id}, 'life_event_recorded',
          'system',
          ${`${event_type}: ${contextStr.slice(0, 150)}. Next: ${adjustment.next_action.slice(0, 100)}`},
          NOW()
        )
      `;
    } catch {}

    return res.status(200).json({
      member_id,
      member_name: memberName,
      event_type,
      acknowledged: true,
      adjusted_preferences: {
        tone: adjustment.tone,
        updates: adjustment.preference_updates,
      },
      next_suggested_action: adjustment.next_action,
      context_recorded: contextStr.slice(0, 200) || null,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/concierge/life-events error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export default withAuth(handler, { allowDemo: true });
