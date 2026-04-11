/**
 * Milestone definitions for the 90-day new-member onboarding sequence.
 *
 * Each milestone fires once per member at the specified day offset from
 * their join_date. The cron job (api/cron/member-onboarding.js) checks
 * member_proactive_log to avoid double-sends.
 */

export const ONBOARDING_MILESTONES = [
  {
    day: 1,
    key: 'onboarding_day1',
    label: 'Welcome + Preferences Quiz',
    gmAction: false,
    buildMessage: (member, club) =>
      `Hi ${member.first_name}! Welcome to ${club}. We're thrilled to have you as a member. ` +
      `To make your experience perfect from day one, I'd love to learn a little about you — ` +
      `what's your usual tee time? Do you have a favorite dining spot? Any activities your family enjoys? ` +
      `Just reply and I'll make sure we personalize everything for you.`,
  },
  {
    day: 3,
    key: 'onboarding_day3',
    label: 'Club Highlights',
    gmAction: false,
    buildMessage: (member, club) =>
      `Hey ${member.first_name}! Quick heads up — ${club} has some great things coming up. ` +
      `Did you know we have a Wine Dinner this month? There are also weekly mixers and golf clinics ` +
      `that are perfect for meeting other members. Want me to RSVP you for anything?`,
  },
  {
    day: 7,
    key: 'onboarding_day7',
    label: 'First Week Check-in',
    gmAction: false,
    buildMessage: (member) =>
      `Hi ${member.first_name}, you've been a member for a week now! How's everything going so far? ` +
      `Have you had a chance to check out the course or the dining room? ` +
      `I'm here to help with anything — booking tee times, making reservations, or just answering questions.`,
  },
  {
    day: 14,
    key: 'onboarding_day14',
    label: 'Event Recommendation',
    gmAction: false,
    buildMessage: (member) => {
      const type = (member.membership_type || '').toUpperCase();
      const isGolf = type.includes('FG') || type.includes('GOLF') || type.includes('SPT');
      const suggestion = isGolf
        ? `As a golf member, you'd love our upcoming member-guest tournament and Saturday morning shotgun events.`
        : `Based on your membership, I'd recommend our social mixers, wine tastings, and family dining events.`;
      return (
        `${member.first_name}, now that you're settling in, I wanted to share some events I think you'd enjoy. ` +
        `${suggestion} Want me to add any of these to your calendar?`
      );
    },
  },
  {
    day: 30,
    key: 'onboarding_day30',
    label: 'GM Personal Call',
    gmAction: true,
    buildMessage: (member, club) =>
      `Hi ${member.first_name}, you've been with ${club} for a month now! ` +
      `Our General Manager would love to personally check in with you and hear how your first month has been. ` +
      `Expect a call in the next day or two — we genuinely want to make sure you feel at home here.`,
    gmActionDescription: (member) =>
      `Call ${member.first_name} ${member.last_name} for their 30-day new member check-in. ` +
      `Member since ${member.join_date}. Membership type: ${member.membership_type}.`,
  },
  {
    day: 60,
    key: 'onboarding_day60',
    label: 'Usage Review',
    gmAction: false,
    buildMessage: (member) =>
      `${member.first_name}, two months in! ` +
      `Other ${member.archetype || 'active'} members like you really enjoy our weekend tournaments and the Thursday dining specials. ` +
      `Have you tried them yet? I can set something up anytime.`,
  },
  {
    day: 90,
    key: 'onboarding_day90',
    label: 'Retention Checkpoint',
    gmAction: false,
    buildMessage: (member, club) =>
      `${member.first_name}, it's been 90 days since you joined ${club}. ` +
      `How are you enjoying the club? Is there anything we can improve or anything you'd like to see more of? ` +
      `Your feedback matters a lot to us — I'm all ears.`,
  },
];

/** Quick lookup: day number -> milestone definition */
export const MILESTONE_BY_DAY = Object.fromEntries(
  ONBOARDING_MILESTONES.map((m) => [m.day, m]),
);

export default ONBOARDING_MILESTONES;
