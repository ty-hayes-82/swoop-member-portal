/**
 * Archetype Playbooks — AI Recommendation Engine
 *
 * Defines triggers and recommended actions per member archetype.
 * Used by api/generate-recommendation.js to assemble context for Claude.
 */

export const ARCHETYPE_PLAYBOOKS = {
  'Balanced Active': {
    description: 'Engages across golf, dining, events. Declines from specific negative experiences.',
    triggers: ['complaint_unresolved', 'score_drop_10', 'on_premise_at_risk', 'spend_decline_30pct'],
    actions: [
      { type: 'personal_call', owner: 'GM', window: '24h', priority: 'urgent', template: 'Acknowledge the specific issue directly. Share what the club has done to prevent recurrence. Invite to upcoming event.' },
      { type: 'comp_dining', owner: 'F&B Director', window: '48h', priority: 'high', template: 'Complimentary dinner for the family at their preferred dining spot.' },
      { type: 'quarterly_lunch', owner: 'GM', window: '1w', priority: 'medium', template: 'Relationship check-in: "How can we make the club better?" These members are your product council.' },
      { type: 'event_invite', owner: 'Membership Director', window: '1w', priority: 'medium', template: 'Personal invitation to the next marquee event — wine dinner, member-guest, or holiday party.' },
    ],
  },
  'Ghost': {
    description: 'Minimal activity across all dimensions. May have mentally resigned but not formally.',
    triggers: ['zero_activity_30d', 'email_decay_50pct', 'fb_minimum_only'],
    actions: [
      { type: 'personal_call', owner: 'GM', window: '48h', priority: 'urgent', template: 'Genuine check-in: "We miss seeing you. Is there something we can do better?" No sales pitch — just listen.' },
      { type: 'reactivation_offer', owner: 'Membership Director', window: '1w', priority: 'high', template: 'Offer a complimentary round with the pro or a guest pass to bring a friend. Lower the barrier to return.' },
      { type: 'survey_outreach', owner: 'Membership Director', window: '2w', priority: 'medium', template: 'Short 3-question survey: "What would bring you back more often?" Position as genuine curiosity, not marketing.' },
    ],
  },
  'Social Butterfly': {
    description: 'Events and dining dominant, minimal golf. Values community and social connections.',
    triggers: ['complaint_unresolved', 'spend_decline_30pct', 'email_decay_50pct'],
    actions: [
      { type: 'personal_call', owner: 'GM', window: '24h', priority: 'urgent', template: 'Acknowledge the issue and emphasize how valued they are to the club community. Reference a specific event they attended.' },
      { type: 'event_vip', owner: 'Events Director', window: '48h', priority: 'high', template: 'VIP seating or host role at the next social event. Make them feel like an insider.' },
      { type: 'comp_dining', owner: 'F&B Director', window: '1w', priority: 'high', template: 'Complimentary dinner for their social group — they bring friends, the club wins.' },
      { type: 'committee_invite', owner: 'GM', window: '2w', priority: 'medium', template: 'Invite to join a social committee or planning group. Deepens investment in the club.' },
    ],
  },
  'Weekend Warrior': {
    description: 'Moderate golf concentrated on weekends. Limited weekday or dining engagement.',
    triggers: ['waitlist_frustrated', 'score_drop_10', 'spend_decline_30pct'],
    actions: [
      { type: 'personal_call', owner: 'Head Pro', window: '24h', priority: 'urgent', template: 'Address tee time frustration directly. Offer a guaranteed Saturday morning slot or weekday incentive.' },
      { type: 'weekday_incentive', owner: 'Head Pro', window: '48h', priority: 'high', template: 'Complimentary weekday round or clinic to shift some usage off peak. Frame as exclusive access, not overflow.' },
      { type: 'dining_intro', owner: 'F&B Director', window: '1w', priority: 'medium', template: 'Invite to a casual Friday evening event — bridge from golf-only to social engagement.' },
    ],
  },
  'Declining': {
    description: 'All engagement dimensions trending down. May be dissatisfied or experiencing life changes.',
    triggers: ['score_drop_10', 'spend_decline_30pct', 'zero_activity_30d', 'email_decay_50pct'],
    actions: [
      { type: 'personal_call', owner: 'GM', window: '24h', priority: 'urgent', template: 'Warm, concerned call — not scripted. "I noticed we haven\'t seen you lately. Everything okay?" Listen for life events.' },
      { type: 'flexible_membership', owner: 'Membership Director', window: '1w', priority: 'high', template: 'If financial stress, offer payment plan or temporary downgrade. Retention at reduced rate beats resignation.' },
      { type: 'reactivation_package', owner: 'GM', window: '1w', priority: 'high', template: 'Curated re-engagement: round with the pro, dinner on the house, event tickets. Three touchpoints in one week.' },
      { type: 'exit_interview', owner: 'Membership Director', window: '2w', priority: 'medium', template: 'If resignation seems likely, schedule a sit-down. Understand the real reason — it\'s rarely just money.' },
    ],
  },
  'Die-Hard Golfer': {
    description: 'Golf-dominant engagement. Low dining and event participation. Values course conditions and access.',
    triggers: ['waitlist_frustrated', 'complaint_unresolved', 'score_drop_10'],
    actions: [
      { type: 'personal_call', owner: 'Head Pro', window: '24h', priority: 'urgent', template: 'Address the specific golf issue — pace of play, course conditions, tee time access. Be concrete about fixes.' },
      { type: 'priority_tee_time', owner: 'Head Pro', window: '24h', priority: 'high', template: 'Guaranteed preferred tee time for the next 4 weeks. Show you value their golf commitment.' },
      { type: 'golf_experience', owner: 'Head Pro', window: '1w', priority: 'medium', template: 'Invite to play with the pro or join an exclusive member group. Deepen the golf relationship.' },
      { type: 'cross_sell_dining', owner: 'F&B Director', window: '2w', priority: 'low', template: 'Post-round dining credit. Get them comfortable in the Grill Room — start building dining habits.' },
    ],
  },
  'New Member': {
    description: 'Joined within 120 days. Critical habit-formation window. Needs guided onboarding.',
    triggers: ['new_member_no_habits', 'zero_activity_30d', 'email_decay_50pct'],
    actions: [
      { type: 'personal_call', owner: 'Membership Director', window: '24h', priority: 'urgent', template: 'Welcome check-in at 30/60/90 days. "How has your experience been? Have you found your rhythm?"' },
      { type: 'buddy_match', owner: 'Membership Director', window: '48h', priority: 'high', template: 'Pair with an established member who shares interests. The fastest path to belonging is a friend.' },
      { type: 'onboarding_experience', owner: 'Head Pro', window: '1w', priority: 'high', template: 'Complimentary lesson or playing introduction. Remove intimidation from the golf experience.' },
      { type: 'social_intro', owner: 'Events Director', window: '1w', priority: 'medium', template: 'Personal invitation to the next new-member mixer or casual social event. Introduce to 3+ members by name.' },
    ],
  },
  'Snowbird': {
    description: 'Seasonal engagement pattern. High activity in-season, absent off-season. Needs pre-arrival warmth.',
    triggers: ['score_drop_10', 'zero_activity_30d', 'email_decay_50pct'],
    actions: [
      { type: 'pre_arrival_call', owner: 'GM', window: '2w', priority: 'high', template: 'Call 2 weeks before expected arrival. "We\'re looking forward to having you back. Here\'s what\'s new."' },
      { type: 'arrival_package', owner: 'Membership Director', window: '1w', priority: 'high', template: 'Welcome-back package: updated club info, event calendar, pre-booked tee time for first weekend.' },
      { type: 'off_season_engagement', owner: 'Events Director', window: '1m', priority: 'medium', template: 'Monthly email during off-season with club updates, course projects, event previews. Keep them connected.' },
      { type: 'departure_farewell', owner: 'GM', window: '1w', priority: 'medium', template: 'End-of-season goodbye: "Great having you. See you in [month]." Personal touch prevents drift.' },
    ],
  },
};

export const TRIGGER_DEFINITIONS = {
  'complaint_unresolved': { label: 'Unresolved complaint', minAge: 1, escalatesAt: 3 },
  'score_drop_10': { label: 'Health score dropped 10+ points', lookback: '30d' },
  'on_premise_at_risk': { label: 'At-risk member on today\'s tee sheet', window: 'same_day' },
  'spend_decline_30pct': { label: 'Spending down 30%+ month-over-month', lookback: '60d' },
  'zero_activity_30d': { label: 'No activity in 30 days', lookback: '30d' },
  'email_decay_50pct': { label: 'Email engagement down 50%+', lookback: '60d' },
  'new_member_no_habits': { label: 'New member with no habits forming', window: '60d' },
  'fb_minimum_only': { label: 'Hitting F&B minimum only', lookback: '90d' },
  'waitlist_frustrated': { label: '3+ waitlist misses', lookback: '90d' },
};
