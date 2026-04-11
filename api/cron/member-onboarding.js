/**
 * POST /api/cron/member-onboarding
 *
 * Daily cron (9 AM): drives the 90-day new-member onboarding sequence.
 *
 * For every member who joined within the last 90 days, checks which
 * milestone(s) they've hit today and, if that milestone hasn't been
 * sent yet, generates the message and logs it to member_proactive_log.
 *
 * Day 30 also creates a GM action in agent_actions so the GM gets a
 * reminder to personally call the member.
 */
import { sql } from '@vercel/postgres';

/* ── Milestone definitions ──────────────────────────────────────────── */

const MILESTONES = [
  {
    day: 1,
    key: 'onboarding_day1',
    gmAction: false,
    buildMessage: (m, club) =>
      `Hi ${m.first_name}! Welcome to ${club}. We're thrilled to have you as a member. ` +
      `To make your experience perfect from day one, I'd love to learn a little about you — ` +
      `what's your usual tee time? Do you have a favorite dining spot? Any activities your family enjoys? ` +
      `Just reply and I'll make sure we personalize everything for you.`,
  },
  {
    day: 3,
    key: 'onboarding_day3',
    gmAction: false,
    buildMessage: (m, club) =>
      `Hey ${m.first_name}! Quick heads up — ${club} has some great things coming up. ` +
      `Did you know we have a Wine Dinner this month? There are also weekly mixers and golf clinics ` +
      `that are perfect for meeting other members. Want me to RSVP you for anything?`,
  },
  {
    day: 7,
    key: 'onboarding_day7',
    gmAction: false,
    buildMessage: (m) =>
      `Hi ${m.first_name}, you've been a member for a week now! How's everything going so far? ` +
      `Have you had a chance to check out the course or the dining room? ` +
      `I'm here to help with anything — booking tee times, making reservations, or just answering questions.`,
  },
  {
    day: 14,
    key: 'onboarding_day14',
    gmAction: false,
    buildMessage: (m) => {
      const type = (m.membership_type || '').toUpperCase();
      const isGolf = type.includes('FG') || type.includes('GOLF') || type.includes('SPT');
      const suggestion = isGolf
        ? `As a golf member, you'd love our upcoming member-guest tournament and Saturday morning shotgun events.`
        : `Based on your membership, I'd recommend our social mixers, wine tastings, and family dining events.`;
      return (
        `${m.first_name}, now that you're settling in, I wanted to share some events I think you'd enjoy. ` +
        `${suggestion} Want me to add any of these to your calendar?`
      );
    },
  },
  {
    day: 30,
    key: 'onboarding_day30',
    gmAction: true,
    buildMessage: (m, club) =>
      `Hi ${m.first_name}, you've been with ${club} for a month now! ` +
      `Our General Manager would love to personally check in with you and hear how your first month has been. ` +
      `Expect a call in the next day or two — we genuinely want to make sure you feel at home here.`,
    gmActionDescription: (m) =>
      `Call ${m.first_name} ${m.last_name} for their 30-day new member check-in. ` +
      `Member since ${m.join_date}. Membership type: ${m.membership_type}.`,
  },
  {
    day: 60,
    key: 'onboarding_day60',
    gmAction: false,
    buildMessage: (m) =>
      `${m.first_name}, two months in! ` +
      `Other ${m.archetype || 'active'} members like you really enjoy our weekend tournaments and the Thursday dining specials. ` +
      `Have you tried them yet? I can set something up anytime.`,
  },
  {
    day: 90,
    key: 'onboarding_day90',
    gmAction: false,
    buildMessage: (m, club) =>
      `${m.first_name}, it's been 90 days since you joined ${club}. ` +
      `How are you enjoying the club? Is there anything we can improve or anything you'd like to see more of? ` +
      `Your feedback matters a lot to us — I'm all ears.`,
  },
];

const CRON_SECRET = process.env.CRON_SECRET;
const DEFAULT_CLUB = 'seed_pinetree';

/* ── Helpers ────────────────────────────────────────────────────────── */

/** Fetch club name for branding in messages. */
async function getClubName(clubId) {
  try {
    const r = await sql`SELECT name FROM clubs WHERE club_id = ${clubId} LIMIT 1`;
    return r.rows[0]?.name || 'the club';
  } catch {
    return 'the club';
  }
}

/**
 * Find all active members who joined within the last 90 days.
 * Returns each member with days_since_join computed.
 */
async function getNewMembers(clubId) {
  try {
    const result = await sql`
      SELECT m.member_id::text,
             m.first_name,
             m.last_name,
             m.email,
             m.phone,
             m.membership_type,
             m.archetype,
             m.join_date,
             m.preferred_channel,
             CURRENT_DATE - m.join_date::date AS days_since_join
      FROM members m
      WHERE m.club_id = ${clubId}
        AND m.membership_status = 'active'
        AND m.join_date::date >= CURRENT_DATE - 90
      ORDER BY m.join_date::date DESC
    `;
    return result.rows;
  } catch (err) {
    console.error('member-onboarding: getNewMembers error', err.message);
    return [];
  }
}

/**
 * Check whether a specific onboarding milestone was already sent for a member.
 */
async function alreadySent(clubId, memberId, outreachType) {
  try {
    const result = await sql`
      SELECT 1 FROM member_proactive_log
      WHERE club_id = ${clubId}
        AND member_id = ${memberId}
        AND outreach_type = ${outreachType}
      LIMIT 1
    `;
    return result.rows.length > 0;
  } catch {
    // Table may not exist yet — treat as "not sent"
    return false;
  }
}

/**
 * Log a proactive onboarding message.
 */
async function logOutreach(clubId, memberId, outreachType, channel, message) {
  try {
    await sql`
      INSERT INTO member_proactive_log
        (club_id, member_id, outreach_type, channel, message_preview, sent_at)
      VALUES
        (${clubId}, ${memberId}, ${outreachType}, ${channel}, ${message.slice(0, 200)}, NOW())
    `;
  } catch (err) {
    console.error('member-onboarding: logOutreach error', err.message);
  }
}

/**
 * Create a GM action for the Day-30 personal call.
 */
async function createGmAction(clubId, member, description) {
  try {
    const actionId = `act_onb30_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      INSERT INTO agent_actions
        (action_id, club_id, agent_id, action_type, priority, source,
         description, impact_metric, member_id, status, timestamp)
      VALUES
        (${actionId}, ${clubId}, 'member-onboarding', 'DAY30_CHECKIN', 'high',
         'member-onboarding',
         ${description}, 'New member retention', ${member.member_id}, 'pending', NOW())
    `;
    return actionId;
  } catch (err) {
    console.error('member-onboarding: createGmAction error', err.message);
    return null;
  }
}

/* ── Handler ────────────────────────────────────────────────────────── */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const cronKey = req.headers['x-cron-key'] || req.body?.cron_key;
  if (CRON_SECRET && cronKey !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const clubId = req.body?.club_id || DEFAULT_CLUB;

  try {
    const clubName = await getClubName(clubId);
    const members = await getNewMembers(clubId);

    // Results keyed by milestone
    const results = {};
    for (const ms of MILESTONES) {
      results[ms.key] = [];
    }

    for (const member of members) {
      const daysSinceJoin = Number(member.days_since_join);

      for (const milestone of MILESTONES) {
        // Only fire on the exact day (or later if they were missed, up to
        // the next milestone). This lets the cron catch members who joined
        // on a weekend when the cron might not have run.
        const nextMilestoneDay =
          MILESTONES.find((m) => m.day > milestone.day)?.day ?? 91;

        if (daysSinceJoin < milestone.day || daysSinceJoin >= nextMilestoneDay) {
          continue;
        }

        // Dedup: skip if already sent
        const sent = await alreadySent(clubId, member.member_id, milestone.key);
        if (sent) continue;

        // Build message
        const message = milestone.buildMessage(member, clubName);
        const channel = member.preferred_channel || 'email';

        // Log to proactive log
        await logOutreach(clubId, member.member_id, milestone.key, channel, message);

        // Day 30: also create a GM action
        let gmActionId = null;
        if (milestone.gmAction && milestone.gmActionDescription) {
          const desc = milestone.gmActionDescription(member);
          gmActionId = await createGmAction(clubId, member, desc);
        }

        results[milestone.key].push({
          member_id: member.member_id,
          name: `${member.first_name} ${member.last_name}`.trim(),
          channel,
          message_preview: message.slice(0, 120),
          ...(gmActionId ? { gm_action_id: gmActionId } : {}),
        });
      }
    }

    // Flatten for summary
    const totalMessaged = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    return res.status(200).json({
      triggered: true,
      club_id: clubId,
      club_name: clubName,
      new_members_in_window: members.length,
      total_messaged: totalMessaged,
      milestones: results,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('/api/cron/member-onboarding error:', err);
    return res.status(500).json({ error: err.message });
  }
}
