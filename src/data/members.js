// Member data — Oakmont Hills CC, January 2026

import { theme } from '@/config/theme';

export const memberArchetypes = [
  { archetype: 'Die-Hard Golfer',  count: 52, golf: 88, dining: 42, events: 28, email: 32, trend: +4  },
  { archetype: 'Social Butterfly', count: 44, golf: 18, dining: 82, events: 78, email: 72, trend: +6  },
  { archetype: 'Balanced Active',  count: 64, golf: 68, dining: 62, events: 54, email: 55, trend: -2  },
  { archetype: 'Weekend Warrior',  count: 46, golf: 52, dining: 44, events: 32, email: 28, trend: -8  },
  { archetype: 'Declining',        count: 30, golf: 24, dining: 18, events: 8,  email: 22, trend: -18 },
  { archetype: 'New Member',       count: 24, golf: 42, dining: 48, events: 38, email: 68, trend: +14 },
  { archetype: 'Ghost',            count: 24, golf: 4,  dining: 6,  events: 2,  email: 8,  trend: -4  },
  { archetype: 'Snowbird',         count: 16, golf: 62, dining: 52, events: 34, email: 44, trend: +2  },
];

export const healthDistribution = [
  { level: 'Healthy',  min: 70,  count: 240, percentage: 0.80, color: theme.colors.success },
  { level: 'Watch',    min: 50,  count: 30,  percentage: 0.10, color: theme.colors.warning },
  { level: 'At Risk',  min: 30,  count: 20,  percentage: 0.07, color: theme.colors.riskAtRiskAlt },
  { level: 'Critical', min: 0,   count: 10,  percentage: 0.03, color: theme.colors.urgent },
];

export const atRiskMembers = [
  { memberId: 'mbr_042', name: 'Kevin Hurst',    score: 18, trend: 'declining', topRisk: 'Zero activity since December; email decay since November', archetype: 'Declining' },
  { memberId: 'mbr_117', name: 'Linda Leonard',  score: 12, trend: 'declining', topRisk: 'Last visit October; dues-only member', archetype: 'Ghost' },
  { memberId: 'mbr_203', name: 'James Whitfield',     score: 42, trend: 'declining', topRisk: 'Unresolved complaint Jan 18 — service speed', archetype: 'Balanced Active' },
  { memberId: 'mbr_089', name: 'Anne Jordan',    score: 28, trend: 'declining', topRisk: 'Oct 4 rounds → Nov 2 → Dec 1 — steady withdrawal', archetype: 'Weekend Warrior' },
  { memberId: 'mbr_271', name: 'Robert Callahan',     score: 22, trend: 'declining', topRisk: 'Hitting exact F&B minimum; no golf since November', archetype: 'Declining' },
];

export const resignationScenarios = [
  {
    memberId: 'mbr_042', name: 'Kevin Hurst', archetype: 'Declining', resignDate: '2026-01-08',
    pattern: 'Gradual multi-domain decay over 3 months', keySignal: 'Email open rate dropped 60% Nov→Dec',
    lifetimeValue: 72000, dues: 18000,
    timeline: [
      { date: 'Oct 2025', event: 'Golf drops from 14 to 8 rounds/mo', domain: 'Golf' },
      { date: 'Nov 2025', event: 'Email open rate falls below 20%', domain: 'Email' },
      { date: 'Dec 2025', event: 'Zero rounds played; one dining visit', domain: 'Golf' },
      { date: 'Jan 8', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_117', name: 'Linda Leonard', archetype: 'Ghost', resignDate: '2026-01-15',
    pattern: 'Complete disengagement; dues-only member for 3+ months', keySignal: 'No visits since October',
    lifetimeValue: 36000, dues: 18000,
    timeline: [
      { date: 'Oct 2025', event: 'Last recorded visit', domain: 'Golf' },
      { date: 'Nov 2025', event: 'Stops opening emails entirely', domain: 'Email' },
      { date: 'Dec 2025', event: 'No activity across all domains', domain: 'All' },
      { date: 'Jan 15', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_203', name: 'James Whitfield', archetype: 'Balanced Active', resignDate: '2026-01-22',
    pattern: 'Service recovery failure — preventable departure', keySignal: 'Complaint Jan 18, unresolved → resign Jan 22',
    lifetimeValue: 54000, dues: 18000,
    timeline: [
      { date: 'Dec 2025', event: 'Active, healthy member. 8 rounds, dining weekly.', domain: 'All' },
      { date: 'Jan 1–17', event: 'Normal activity continues', domain: 'All' },
      { date: 'Jan 18', event: 'Complaint filed — slow lunch at Grill Room, felt ignored. Very unhappy.', domain: 'Feedback' },
      { date: 'Jan 19–21', event: 'Complaint status: "Acknowledged" — never resolved', domain: 'Feedback' },
      { date: 'Jan 22', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_089', name: 'Anne Jordan', archetype: 'Weekend Warrior', resignDate: '2026-01-27',
    pattern: 'Slow weekday-then-weekend withdrawal', keySignal: 'Rounds: Oct 4 → Nov 2 → Dec 1',
    lifetimeValue: 48000, dues: 12000,
    timeline: [
      { date: 'Oct 2025', event: '4 rounds played (Sat/Sun only)', domain: 'Golf' },
      { date: 'Nov 2025', event: 'Down to 2 rounds; skips 3 weekend events', domain: 'Golf' },
      { date: 'Dec 2025', event: '1 round played; no dining or events', domain: 'All' },
      { date: 'Jan 27', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_271', name: 'Robert Callahan', archetype: 'Declining', resignDate: '2026-01-31',
    pattern: 'Obligation-only spending — F&B minimum hit then stop', keySignal: 'Spent exactly $3,020 F&B minimum then ceased',
    lifetimeValue: 54000, dues: 18000,
    timeline: [
      { date: 'Oct 2025', event: 'Last round of golf played', domain: 'Golf' },
      { date: 'Nov–Dec', event: 'Dining only — methodically meeting F&B minimum', domain: 'F&B' },
      { date: 'Jan 1–15', event: 'Final dining visits to hit $3,000 minimum', domain: 'F&B' },
      { date: 'Jan 31', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
];

export const memberProfiles = {
  mbr_203: {
    memberId: 'mbr_203',
    name: 'James Whitfield',
    tier: 'Full Golf',
    joinDate: '2019-04-12',
    archetype: 'Balanced Active',
    healthScore: 42,
    trend: [78, 74, 70, 65, 58, 49, 42],
    duesAnnual: 18000,
    memberValueAnnual: 26000,
    preferredChannel: 'Call',
    contact: {
      phone: '(480) 555-0129',
      email: 'james.whitfield@example.com',
      preferredChannel: 'Call',
      lastOutreach: '2026-01-13T15:10:00Z',
    },
    riskSignals: [
      { id: 'complaint', label: 'Complaint unresolved 6 days', timestamp: '2026-01-18T19:12:00Z', source: 'CRM', confidence: '93%' },
      { id: 'spend', label: 'F&B spend down 41% since Jan 3', timestamp: '2026-01-16T13:05:00Z', source: 'POS', confidence: '88%' },
      { id: 'email', label: 'Email engagement -36 pts', timestamp: '2026-01-12T08:55:00Z', source: 'Email', confidence: '76%' },
    ],
    activity: [
      { id: 'act1', timestamp: 'Jan 16 · 1:12 PM', type: 'Dining', detail: 'Grill Room lunch — 42 min ticket time' },
      { id: 'act2', timestamp: 'Jan 16 · 7:14 PM', type: 'Feedback', detail: 'Submitted complaint: “Felt ignored after we were seated.”' },
      { id: 'act3', timestamp: 'Jan 14 · 9:20 AM', type: 'Golf', detail: '18 holes w/ Saturday group — normal pace' },
      { id: 'act4', timestamp: 'Jan 12 · 5:40 PM', type: 'Dining', detail: 'Family dinner · $142 check · 5-star feedback' },
      { id: 'act5', timestamp: 'Jan 8 · 4:02 PM', type: 'Email', detail: 'Opened “Course Maintenance” email · no click' },
    ],
    drafts: {
      callScript: [
        'Apologize for the Jan 16 wait and acknowledge his loyalty.',
        'Share staffing fix + reservation already held for Saturday.',
        'Invite him to pick the follow-up time/place — keep it personal.',
      ],
      emailSubject: 'Making Friday right before your 9:20 tee time',
      emailBody: 'Hi James — I saw your note about Friday’s lunch and I agree we missed the mark. We overhauled that shift and I reserved your usual table for Saturday in case you and your foursome would like to stay after the round. I’d also like to call you personally if you have five minutes today. Appreciate you allowing us to fix this.\n\n— Alice',
      smsDraft: 'James — it’s Alice from Oakmont Hills. Saw your Friday lunch note and I’d like to call you personally before your tee time tomorrow. What time works?',
    },
    auditTrail: [
      { id: 'recommend', status: 'Recommended by Member Pulse', owner: 'Member Pulse', timestamp: 'Jan 17 · 6:02 AM' },
      { id: 'queued', status: 'Queued for GM review', owner: 'Agent Command', timestamp: 'Jan 17 · 6:05 AM' },
    ],
  },
  mbr_089: {
    memberId: 'mbr_089',
    name: 'Anne Jordan',
    tier: 'Full Golf',
    joinDate: '2016-08-01',
    archetype: 'Weekend Warrior',
    healthScore: 38,
    trend: [66, 62, 58, 52, 48, 42, 38],
    duesAnnual: 12000,
    memberValueAnnual: 17800,
    preferredChannel: 'SMS',
    contact: {
      phone: '(480) 555-0198',
      email: 'anne.jordan@example.com',
      preferredChannel: 'SMS',
      lastOutreach: '2026-01-05T11:14:00Z',
    },
    riskSignals: [
      { id: 'rounds', label: 'Rounds: Oct 4 → Nov 2 → Dec 1', timestamp: '2026-01-10T08:00:00Z', source: 'Tee Sheet', confidence: '81%' },
      { id: 'waitlist', label: 'Missed 3 Saturday waitlists in a row', timestamp: '2026-01-12T07:45:00Z', source: 'Demand Optimizer', confidence: '78%' },
    ],
    activity: [
      { id: 'anne1', timestamp: 'Jan 12 · 10:10 AM', type: 'Waitlist', detail: 'Declined Saturday slot due to late notification' },
      { id: 'anne2', timestamp: 'Jan 07 · 8:40 AM', type: 'Golf', detail: '9 holes · walked off after 7 due to pace' },
      { id: 'anne3', timestamp: 'Dec 28 · 12:05 PM', type: 'Dining', detail: 'Canceled lounge reservation last minute' },
    ],
    drafts: {
      callScript: [
        'Thank Anne for hosting guests during last member-guest.',
        'Offer first call on any Saturday cancellation this week.',
        'Invite her to join Thursday evening 9-hole social event.',
      ],
      emailSubject: 'You’re first on Saturday’s 7:00 AM slot',
      emailBody: 'Anne — a prime Saturday slot just opened and I can hold it for you for the next hour. I’d also like to make sure the pace fits what you’re looking for so let me know how last weekend felt. Happy to coordinate your foursome if that helps.\n\n— Rafael',
      smsDraft: 'Anne, it’s Rafael. 7:00 AM Saturday just freed up — want it? I’ll hold for 60 min.',
    },
    auditTrail: [
      { id: 'recommend', status: 'Recommended by Demand Optimizer', owner: 'Demand Optimizer', timestamp: 'Jan 17 · 6:04 AM' },
    ],
  },
  mbr_271: {
    memberId: 'mbr_271',
    name: 'Robert Callahan',
    tier: 'Corporate',
    joinDate: '2015-03-19',
    archetype: 'Declining',
    healthScore: 27,
    trend: [58, 54, 48, 42, 36, 30, 27],
    duesAnnual: 18000,
    memberValueAnnual: 21000,
    preferredChannel: 'Email',
    contact: {
      phone: '(602) 555-0144',
      email: 'robert.callahan@example.com',
      preferredChannel: 'Email',
      lastOutreach: '2026-01-03T17:00:00Z',
    },
    riskSignals: [
      { id: 'complaint', label: 'Complaint aging 9 days', timestamp: '2026-01-17T08:42:00Z', source: 'CRM', confidence: '89%' },
      { id: 'spend', label: 'Only minimum F&B spend since Nov', timestamp: '2026-01-15T12:00:00Z', source: 'POS', confidence: '82%' },
    ],
    activity: [
      { id: 'rob1', timestamp: 'Jan 09 · 12:48 PM', type: 'Dining', detail: 'Minimum spend lunch · no guests' },
      { id: 'rob2', timestamp: 'Dec 21 · 5:12 PM', type: 'Email', detail: 'Ignored “Let us host your client dinner” invite' },
      { id: 'rob3', timestamp: 'Nov 30 · 2:05 PM', type: 'Golf', detail: 'Last recorded round' },
    ],
    drafts: {
      callScript: [
        'Offer to personally host Robert + guest at Grill Room.',
        'Acknowledge complaint delay and explain new coverage fix.',
        'Ask what “great service” looks like to him next visit.',
      ],
      emailSubject: 'Let me host you after next round',
      emailBody: 'Robert — I’m stepping in to close the loop on your Grill Room note. We re-staffed that shift and I’d like to host you (and a guest) after your next round to make sure the experience is right. Can you let me know which day works?\n\n— Maya, F&B Director',
      smsDraft: 'Robert, it’s Maya at Oakmont Hills. Saw your note. Free tomorrow to talk?',
    },
    auditTrail: [
      { id: 'recommend', status: 'Escalated by Service Recovery', owner: 'Service Recovery', timestamp: 'Jan 17 · 8:43 AM' },
    ],
  },
};
