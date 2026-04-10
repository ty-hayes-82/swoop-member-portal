// Member data — Pinetree CC, January 2026

import { theme } from '@/config/theme';

export const memberArchetypes = [
  { archetype: 'Die-Hard Golfer',  count: 78, golf: 88, dining: 42, events: 28, email: 32, trend: +4,  action: 'Tee time priority + post-round dining comp' },
  { archetype: 'Social Butterfly', count: 58, golf: 18, dining: 82, events: 78, email: 72, trend: +6,  action: 'Event invite + dining comp' },
  { archetype: 'Balanced Active',  count: 72, golf: 68, dining: 62, events: 54, email: 55, trend: -2,  action: 'Quarterly GM lunch — "How can we make the club better?" Balanced Actives are your product council.' },
  { archetype: 'Weekend Warrior',  count: 58, golf: 52, dining: 44, events: 32, email: 28, trend: -8,  action: 'Saturday tee time hold + personal invite' },
  { archetype: 'Declining',        count: 32, golf: 24, dining: 18, events: 8,  email: 22, trend: -18, action: 'Membership Director personal call within 5 days — ask about satisfaction, offer complimentary guest round to re-engage' },
  { archetype: 'New Member',       count: 39, golf: 42, dining: 48, events: 38, email: 68, trend: +14, action: 'Welcome event + mentor pairing' },
  { archetype: 'Ghost',            count: 20, golf: 4,  dining: 6,  events: 2,  email: 8,  trend: -4,  action: 'Personal GM call within 48h' },
  { archetype: 'Snowbird',         count: 33, golf: 62, dining: 52, events: 34, email: 44, trend: +2,  action: 'Welcome-back call at season start' },
];

export const healthDistribution = [
  { level: 'Healthy',  min: 70,  count: 265, percentage: 0.679, color: theme.colors.success, delta: -4 },
  { level: 'Watch',    min: 50,  count: 50,  percentage: 0.128, color: theme.colors.warning, delta: 5 },
  { level: 'At Risk',  min: 30,  count: 45,  percentage: 0.115, color: theme.colors.riskAtRiskAlt, delta: 6 },
  { level: 'Critical', min: 0,   count: 30,  percentage: 0.077, color: theme.colors.urgent, delta: 3 },
];

export const memberSummary = {
  total: 390,
  healthy: 265,
  watch: 50,
  atRisk: 45,
  critical: 30,
  riskCount: 75,
  avgHealthScore: 68,
  // 75 at-risk + critical members × $11,573 avg dues = $868K (7 visible below sum to $111K; 68 others in full roster)
  potentialDuesAtRisk: 868000,
  avgTenure: 6.2,
  avgDues: 16400,
  renewalRate: 0.91,
};

// Watch tier members — early-stage decay signals, not yet At Risk
export const watchMembers = [
  { memberId: 'mbr_301', name: 'Diane Prescott', score: 62, archetype: 'Balanced Active', signal: 'Email open rate declined 22% over 6 weeks', action: 'Concierge check-in', duesAnnual: 15000 },
  { memberId: 'mbr_302', name: 'Tom Gallagher', score: 58, archetype: 'Weekend Warrior', signal: 'Round frequency down from 3→2/month', action: 'Pro shop greeting + tee time suggestion', duesAnnual: 12000 },
  { memberId: 'mbr_303', name: 'Evelyn Park', score: 64, archetype: 'Social Butterfly', signal: 'Skipped last 2 member events', action: 'Personal event invitation from Membership Director', duesAnnual: 18000 },
  { memberId: 'mbr_304', name: 'Greg Holloway', score: 55, archetype: 'Die-Hard Golfer', signal: 'Post-round dining stopped 3 weeks ago', action: 'Grill Room staff greeting on next visit', duesAnnual: 22000 },
  { memberId: 'mbr_305', name: 'Rita Vasquez', score: 61, archetype: 'Balanced Active', signal: 'Newsletter open rate dropped from 65% to 38%', action: 'Personalized event email', duesAnnual: 14000 },
  { memberId: 'mbr_306', name: 'Nathan Burke', score: 53, archetype: 'Weekend Warrior', signal: 'Cancelled last 2 Saturday tee times', action: 'Pro shop call with preferred time offer', duesAnnual: 16000 },
  { memberId: 'mbr_307', name: 'Claire Donovan', score: 65, archetype: 'Social Butterfly', signal: 'Dining visits down 30% in January', action: 'Chef\'s Table invitation', duesAnnual: 20000 },
  { memberId: 'mbr_308', name: 'Paul Serrano', score: 56, archetype: 'Declining', signal: 'Email and golf both showing 2-week decline', action: 'Membership Director outreach', duesAnnual: 11000 },
  { memberId: 'mbr_309', name: 'Jennifer Walsh', score: 60, archetype: 'New Member', signal: 'No events attended in first 60 days', action: 'New member welcome event invitation', duesAnnual: 28000 },
  { memberId: 'mbr_310', name: 'David Chen', score: 57, archetype: 'Balanced Active', signal: 'Pro shop spend dropped to zero this month', action: 'Equipment recommendation from pro', duesAnnual: 15000 },
  { memberId: 'mbr_311', name: 'Lisa Yamamoto', score: 63, archetype: 'Snowbird', signal: 'In-season activity 40% below expected', action: 'Welcome-back personal call', duesAnnual: 24000 },
  { memberId: 'mbr_313', name: 'Mark Patterson', score: 54, archetype: 'Weekend Warrior', signal: 'Golf frequency and email engagement both declining', action: 'Saturday morning tee time hold + personal invite', duesAnnual: 16000 },
];

export const atRiskMembers = [
  // ON-41 data model note: include duesAnnual on at-risk rows so UI can derive totals from row data.
  { memberId: 'mbr_t03', name: 'Kevin Hurst', score: 18, trend: 'declining', topRisk: 'Zero activity since December; email decay since November', archetype: 'Declining', duesAnnual: 18000, roundsTrend: [{month:'Oct',rounds:10},{month:'Nov',rounds:6},{month:'Dec',rounds:0},{month:'Jan',rounds:0}] },
  { memberId: 'mbr_t07', name: 'Linda Leonard', score: 12, trend: 'declining', topRisk: 'Last visit October; dues-only member', archetype: 'Ghost', duesAnnual: 18000, roundsTrend: [{month:'Oct',rounds:1},{month:'Nov',rounds:0},{month:'Dec',rounds:0},{month:'Jan',rounds:0}] },
  { memberId: 'mbr_t01', name: 'James Whitfield', score: 42, trend: 'declining', topRisk: 'Unresolved complaint Jan 16 — 42-min Grill Room wait, felt ignored. $18K dues at risk', archetype: 'Balanced Active', duesAnnual: 18000, roundsTrend: [{month:'Oct',rounds:4},{month:'Nov',rounds:3},{month:'Dec',rounds:2},{month:'Jan',rounds:1}] },
  { memberId: 'mbr_t04', name: 'Anne Jordan', score: 28, trend: 'declining', topRisk: 'Missed 3 Saturday waitlists, walked off Jan 7 after slow pace — zero rounds since. 10-year member', archetype: 'Weekend Warrior', duesAnnual: 12000, roundsTrend: [{month:'Oct',rounds:4},{month:'Nov',rounds:2},{month:'Dec',rounds:1},{month:'Jan',rounds:0}] },
  { memberId: 'mbr_t05', name: 'Robert Callahan', score: 22, trend: 'declining', topRisk: 'Hitting exact $3,020 F&B minimum then stopping. 9-day complaint unresolved. No golf since Nov', archetype: 'Declining', duesAnnual: 18000, roundsTrend: [{month:'Oct',rounds:3},{month:'Nov',rounds:2},{month:'Dec',rounds:1},{month:'Jan',rounds:1}] },
  { memberId: 'mbr_146', name: 'Sandra Chen', score: 36, trend: 'declining', topRisk: 'Dining spend dropped 87% ($18 last visit vs $142 avg). Declined 3 consecutive event invites. $9K annual dues — last 2 renewals were late.', archetype: 'Social Butterfly', duesAnnual: 9000, roundsTrend: [{month:'Oct',rounds:1},{month:'Nov',rounds:1},{month:'Dec',rounds:0},{month:'Jan',rounds:0}] },
  { memberId: 'mbr_312', name: 'Robert Mills', score: 33, trend: 'declining', topRisk: 'Two slow-play complaints filed and ignored. Skipping dining entirely. 12-year member, $15K dues', archetype: 'Balanced Active', duesAnnual: 18000, roundsTrend: [{month:'Oct',rounds:3},{month:'Nov',rounds:2},{month:'Dec',rounds:1},{month:'Jan',rounds:0}] },
];

export const resignationScenarios = [
  {
    memberId: 'mbr_t03', name: 'Kevin Hurst', archetype: 'Declining', resignDate: '2026-01-08',
    pattern: 'Gradual multi-domain decay over 3 months', keySignal: 'Email open rate dropped 60% Nov→Dec',
    missedIntervention: 'November email open-rate drop should have triggered Watch-tier outreach — 8-week window missed',
    lifetimeValue: 72000, dues: 18000,
    timeline: [
      { date: 'Oct 2025', event: 'Email open rate drops from 80% to 40% — first sign of disengagement', domain: 'Email' },
      { date: 'Nov 2025', event: 'Golf drops from 10 to 6 rounds/mo; email open rate falls below 20%', domain: 'Golf' },
      { date: 'Dec 2025', event: 'Zero rounds played; one dining visit', domain: 'Golf' },
      { date: 'Jan 8', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_t07', name: 'Linda Leonard', archetype: 'Ghost', resignDate: '2026-01-15',
    pattern: 'Complete disengagement; dues-only member for 3+ months', keySignal: 'No visits since October',
    missedIntervention: '3+ weeks of zero visits should have triggered GM personal call — intervention window: mid-November',
    lifetimeValue: 36000, dues: 18000,
    timeline: [
      { date: 'Oct 2025', event: 'Last recorded visit', domain: 'Golf' },
      { date: 'Nov 2025', event: 'Stops opening emails entirely', domain: 'Email' },
      { date: 'Dec 2025', event: 'No activity across all domains', domain: 'All' },
      { date: 'Jan 15', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_t01', name: 'James Whitfield', archetype: 'Balanced Active', resignDate: '2026-01-22',
    pattern: 'Service recovery failure — preventable departure', keySignal: 'Complaint Jan 16, unresolved → resign Jan 22',
    lifetimeValue: 54000, dues: 18000,
    timeline: [
      { date: 'Dec 2025', event: 'Active, healthy member. 8 rounds, dining weekly.', domain: 'All' },
      { date: 'Jan 1–17', event: 'Normal activity continues', domain: 'All' },
      { date: 'Jan 16', event: 'Complaint filed — slow lunch at Grill Room, felt ignored. Very unhappy.', domain: 'Feedback' },
      { date: 'Jan 17–21', event: 'Complaint status: "Acknowledged" — never resolved', domain: 'Feedback' },
      { date: 'Jan 22', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_t04', name: 'Anne Jordan', archetype: 'Weekend Warrior', resignDate: '2026-01-27',
    pattern: 'Slow weekday-then-weekend withdrawal', keySignal: 'Rounds: Oct 4 → Nov 2 → Dec 1',
    missedIntervention: 'Oct round drop from 4 to 2/mo should have triggered priority Saturday slot offer',
    lifetimeValue: 48000, dues: 12000,
    timeline: [
      { date: 'Oct 2025', event: '4 rounds played (Sat/Sun only)', domain: 'Golf' },
      { date: 'Nov 2025', event: 'Down to 2 rounds; skips 3 weekend events', domain: 'Golf' },
      { date: 'Nov 2025', event: 'Email open rate drops from 40% to 28%', domain: 'Email' },
      { date: 'Dec 2025', event: '1 round played; email engagement falls to 11%; no dining or events', domain: 'All' },
      { date: 'Jan 27', event: 'Resignation submitted', domain: 'Membership' },
    ],
  },
  {
    memberId: 'mbr_t05', name: 'Robert Callahan', archetype: 'Declining', resignDate: '2026-01-31',
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
  mbr_t01: {
    memberId: 'mbr_t01',
    name: 'James Whitfield',
    tier: 'Full Golf',
    joinDate: '2019-04-12',
    archetype: 'Balanced Active',
    healthScore: 42,
    trend: [78, 74, 70, 65, 58, 49, 42],
    duesAnnual: 18000,
    memberValueAnnual: 26000,
    preferredChannel: 'Call',
    lastSeenLocation: 'Hole 14 · North Course',
    family: [
      { name: 'Erin Whitfield', relation: 'Spouse', notes: 'Loves Grill Room wine dinners' },
      { name: 'Logan Whitfield', relation: 'Son', notes: 'Junior golf clinics' },
    ],
    preferences: {
      favoriteSpots: ['Grill Room booth 12', 'North course back nine'],
      teeWindows: 'Thu/Fri 7:00–8:30 AM',
      dining: 'Prefers slow mornings with coffee refills and booth seating',
      notes: 'Responds best to personal call from GM within 24h of any feedback.',
    },
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
      { id: 'act5', timestamp: 'Jan 08 · 4:02 PM', type: 'Email', detail: 'Opened “Course Maintenance” email · no click' },
    ],
    drafts: {
      callScript: [
        'Apologize for the Jan 16 wait and acknowledge his loyalty.',
        'Share staffing fix + reservation already held for Saturday.',
        'Invite him to pick the follow-up time/place — keep it personal.',
      ],
      emailSubject: 'Making Friday right before your 9:20 tee time',
      emailBody: `Hi James — I saw your note about Friday’s lunch and I agree we missed the mark. We overhauled that shift and I reserved your usual table for Saturday in case you and your foursome would like to stay after the round. I’d also like to call you personally if you have five minutes today. Appreciate you allowing us to fix this.

— Alice`,
      smsDraft: 'James — it’s Alice from Pinetree. Saw your Friday lunch note and I’d like to call you personally before your tee time tomorrow. What time works?',
    },
    staffNotes: [
      { id: 'note_whitfield_1', author: 'Membership Director', department: 'Membership', text: 'Hosted 2025 member-guest; expects white-glove treatment when entertaining clients.', timestamp: '2025-11-04T18:10:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Recommended by Member Pulse', owner: 'Member Pulse', timestamp: '2026-01-17T06:02:00Z' },
      { id: 'queued', status: 'Queued for GM review', owner: 'Recommended Actions', timestamp: '2026-01-17T06:05:00Z' },
    ],
  },
  mbr_t04: {
    memberId: 'mbr_t04',
    name: 'Anne Jordan',
    tier: 'Full Golf',
    joinDate: '2016-08-01',
    archetype: 'Weekend Warrior',
    healthScore: 28,
    trend: [66, 62, 58, 52, 48, 35, 28],
    duesAnnual: 12000,
    memberValueAnnual: 17800,
    preferredChannel: 'SMS',
    lastSeenLocation: 'Practice putting green',
    family: [
      { name: 'Marcus Jordan', relation: 'Spouse', notes: 'Prefers late-morning tee times' },
    ],
    preferences: {
      favoriteSpots: ['West course front nine', 'Mixed-grill patio'],
      teeWindows: 'Sat/Sun 7:30–9:00 AM',
      dining: 'High on-demand for patio seating after early rounds',
      notes: 'Texts preferred; will decline calls during workday.',
    },
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
      { id: 'anne0', timestamp: 'Nov 10 · 6:15 PM', type: 'Events', detail: 'Couples wine dinner with Marcus — table of 6, stayed 2.5 hrs' },
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
      emailBody: `Anne — a prime Saturday slot just opened and I can hold it for you for the next hour. I’d also like to make sure the pace fits what you’re looking for so let me know how last weekend felt. Happy to coordinate your foursome if that helps.

— Rafael`,
      smsDraft: 'Anne, it’s Rafael. 7:00 AM Saturday just freed up — want it? I’ll hold for 60 min.',
    },
    staffNotes: [
      { id: 'note_jordan_1', author: 'Head Golf Professional', department: 'Golf', text: 'Prefers walking groups; pace-of-play messaging resonates.', timestamp: '2025-12-15T15:22:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Recommended by Demand Optimizer', owner: 'Demand Optimizer', timestamp: '2026-01-17T06:04:00Z' },
    ],
  },
  mbr_t05: {
    memberId: 'mbr_t05',
    name: 'Robert Callahan',
    tier: 'Corporate',
    joinDate: '2015-03-19',
    archetype: 'Declining',
    healthScore: 22,
    trend: [58, 54, 48, 42, 36, 28, 22],
    duesAnnual: 18000,
    memberValueAnnual: 21000,
    preferredChannel: 'Email',
    lastSeenLocation: 'Grill Room',
    family: [
      { name: 'Elizabeth Callahan', relation: 'Spouse', notes: 'Only attends wine dinners.' },
    ],
    preferences: {
      favoriteSpots: ['Executive dining room', 'Wine cellar'],
      teeWindows: 'Client rounds Tue/Thu 1 PM',
      dining: 'Meets F&B minimum with methodical lunches. Values quiet corner table.',
      notes: 'Needs reassurance on service consistency before recommitting.',
    },
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
      { id: 'rob0', timestamp: 'Jan 08 · 3:22 PM', type: 'Feedback', detail: 'Complaint: "Asked for private dining room for client lunch — told none available despite empty rooms"' },
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
      emailBody: `Robert — I’m stepping in to close the loop on your Grill Room note. We re-staffed that shift and I’d like to host you (and a guest) after your next round to make sure the experience is right. Can you let me know which day works?

— Maya, F&B Director`,
      smsDraft: 'Robert, it’s Maya at Pinetree. Saw your note. Free tomorrow to talk?',
    },
    staffNotes: [
      { id: 'note_callahan_1', author: 'F&B Director', department: 'F&B', text: 'Prefers mid-week lunch with CFO. Always orders sparkling water + chopped salad.', timestamp: '2025-10-02T19:15:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Escalated by Service Recovery', owner: 'Service Recovery', timestamp: '2026-01-17T08:43:00Z' },
    ],
  },
  mbr_146: {
    memberId: 'mbr_146',
    name: 'Sandra Chen',
    tier: 'House',
    joinDate: '2021-05-22',
    archetype: 'Social Butterfly',
    healthScore: 36,
    trend: [72, 70, 65, 58, 52, 44, 36],
    duesAnnual: 9000,
    memberValueAnnual: 14500,
    preferredChannel: 'SMS',
    lastSeenLocation: 'Grill Room',
    family: [
      { name: 'Avery Chen', relation: 'Daughter', notes: 'Volleyball team — summer camps' },
    ],
    preferences: {
      favoriteSpots: ['Grill Room', 'Event lawn'],
      teeWindows: 'Rarely plays golf',
      dining: 'Prefers table 6 near windows; pescatarian.',
      notes: 'Attends every wine dinner when personally invited.',
    },
    contact: {
      phone: '(480) 555-0173',
      email: 'sandra.chen@example.com',
      preferredChannel: 'SMS',
      lastOutreach: '2026-01-11T14:30:00Z',
    },
    riskSignals: [
      { id: 'dining', label: 'Dining spend down 58% MoM', timestamp: '2026-01-08T19:00:00Z', source: 'POS', confidence: '74%' },
      { id: 'events', label: 'Declined last 3 social invitations', timestamp: '2026-01-12T09:10:00Z', source: 'Events', confidence: '69%' },
    ],
    activity: [
      { id: 'chen0', timestamp: 'Dec 18 · 9:04 AM', type: 'Email', detail: 'Opened holiday gala invite — clicked RSVP but abandoned before confirming' },
      { id: 'chen1', timestamp: 'Jan 13 · 6:42 PM', type: 'Dining', detail: 'Canceled wine dinner RSVP (schedule conflict)' },
      { id: 'chen2', timestamp: 'Jan 09 · 8:05 PM', type: 'Lounge', detail: 'Stopped by lounge for 30 min · no spend' },
      { id: 'chen3', timestamp: 'Jan 05 · 1:20 PM', type: 'Dining', detail: 'Grab-and-go salad · $18' },
    ],
    drafts: {
      callScript: [
        'Invite Sandra to host 2 guests at the next wine dinner with complimentary pairings.',
        'Offer to reserve her favorite booth and pre-select pescatarian options.',
      ],
      emailSubject: 'Save you a booth for Friday’s wine dinner?',
      emailBody: `Sandra — we missed you at the last dinner and wanted to hold booth 6 for you this Friday. Chef added two pescatarian pairings just for you. Should I confirm 7:15 PM for you and Avery?

— Nina`,
      smsDraft: 'Sandra! Booth 6 is yours Friday if you want it. New Riesling flight just landed 🍷',
    },
    staffNotes: [
      { id: 'note_chen_1', author: 'Events Director', department: 'Events', text: 'Relies on us for guest seating. Text reminder the morning of events boosts turnout.', timestamp: '2025-12-01T16:00:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Flagged by F&B Intelligence', owner: 'F&B Intelligence', timestamp: '2026-01-13T09:05:00Z' },
    ],
  },
  mbr_312: {
    memberId: 'mbr_312',
    name: 'Robert Mills',
    tier: 'Full Golf',
    joinDate: '2014-02-09',
    archetype: 'Balanced Active',
    healthScore: 33,
    trend: [68, 64, 60, 55, 49, 40, 33],
    duesAnnual: 18000,
    memberValueAnnual: 23000,
    preferredChannel: 'Call',
    lastSeenLocation: 'Driving range',
    family: [
      { name: 'Maya Mills', relation: 'Spouse', notes: 'Prefers spa + pool during events' },
      { name: 'Ethan Mills', relation: 'Son', notes: 'College freshman — plays summer golf' },
    ],
    preferences: {
      favoriteSpots: ['Driving range', 'North course finishing stretch'],
      teeWindows: 'Weekdays 6:30–8:00 AM',
      dining: 'Orders flat white + breakfast sandwich post-practice',
      notes: 'Huge advocate when he feels seen. Dials golf staff directly.',
    },
    contact: {
      phone: '(480) 555-0114',
      email: 'robert.mills@example.com',
      preferredChannel: 'Call',
      lastOutreach: '2026-01-10T07:15:00Z',
    },
    riskSignals: [
      { id: 'range', label: 'Practicing but skipping post-round dining', timestamp: '2026-01-14T08:42:00Z', source: 'POS', confidence: '71%' },
      { id: 'complaint', label: 'Mentioned slow-driver issue twice without follow-up', timestamp: '2026-01-06T06:55:00Z', source: 'CRM', confidence: '64%' },
    ],
    activity: [
      { id: 'mills0', timestamp: 'Dec 14 · 7:50 AM', type: 'Dining', detail: 'Post-practice flat white + breakfast sandwich — $22 · asked about marshal schedule' },
      { id: 'mills1', timestamp: 'Jan 14 · 6:48 AM', type: 'Practice', detail: 'Driving range session — no clubhouse spend' },
      { id: 'mills2', timestamp: 'Jan 11 · 2:15 PM', type: 'Golf', detail: '18 holes · +45 mins pace · left club immediately' },
      { id: 'mills3', timestamp: 'Jan 05 · 7:35 AM', type: 'Complaint', detail: 'Flagged slow marshal response on holes 9–10' },
    ],
    drafts: {
      callScript: [
        'Invite Robert to test the new TrackMan range session with the head pro.',
        'Offer coffee + breakfast at the Grill Room right after practice.',
        'Close loop on marshal staffing for weekday mornings.',
      ],
      emailSubject: 'Walk the back nine with us tomorrow?',
      emailBody: `Robert — we added a TrackMan bay this week and I’d love for you to try it with our head pro. I also blocked a table for your usual flat white afterwards. Can we meet at 6:45 AM tomorrow?

— Chris`,
      smsDraft: 'Range looks perfect tomorrow early. Want your usual TrackMan bay at 6:45? Coffee’s on me.',
    },
    staffNotes: [
      { id: 'note_mills_1', author: 'Head Golf Professional', department: 'Golf', text: 'Values proactive marshal coverage. Invite him to weigh in on new player-assist tech.', timestamp: '2025-12-18T12:05:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Flagged by Operations', owner: 'Operations Intelligence', timestamp: '2026-01-14T07:05:00Z' },
    ],
  },
  mbr_t03: {
    memberId: 'mbr_t03',
    name: 'Kevin Hurst',
    tier: 'Full Golf',
    joinDate: '2022-03-15',
    archetype: 'Declining',
    healthScore: 18,
    trend: [72, 68, 60, 48, 34, 22, 18],
    duesAnnual: 18000,
    memberValueAnnual: 22000,
    preferredChannel: 'Email',
    lastSeenLocation: 'Grill Room',
    family: [],
    preferences: {
      favoriteSpots: ['North course', 'Grill Room bar'],
      teeWindows: 'Any morning',
      dining: 'Grill Room solo, quick service',
      notes: 'Regular in the Saturday foursome. Responds to email only.',
    },
    contact: {
      phone: '(770) 555-0147',
      email: 'kevin.hurst@example.com',
      preferredChannel: 'Email',
      lastOutreach: '2025-12-04T10:12:00Z',
    },
    riskSignals: [
      { id: 'email', label: 'Email open rate crashed from 80% to 0% in 8 weeks', timestamp: '2025-12-20T08:00:00Z', source: 'Email', confidence: '91%' },
      { id: 'rounds', label: 'Zero rounds since November — was playing 10/month', timestamp: '2025-12-31T08:00:00Z', source: 'Tee Sheet', confidence: '88%' },
      { id: 'resign', label: 'Resignation submitted Jan 8 — no outreach attempted', timestamp: '2026-01-08T10:00:00Z', source: 'CRM', confidence: '100%' },
    ],
    activity: [
      { id: 'kh1', timestamp: 'Oct 12 · 7:30 AM', type: 'Golf', detail: '18 holes w/ regular foursome — 4:02 round, normal pace' },
      { id: 'kh2', timestamp: 'Nov 8 · 8:15 AM', type: 'Golf', detail: '9 holes only — left after front nine, said "not feeling it"' },
      { id: 'kh3', timestamp: 'Nov 22 · 6:45 PM', type: 'Dining', detail: 'Solo dinner at Grill Room — $38 check, no conversation with staff' },
      { id: 'kh4', timestamp: 'Dec 4 · 10:12 AM', type: 'Email', detail: 'Last email opened — "Holiday Tournament" invite. No click.' },
      { id: 'kh5', timestamp: 'Jan 8', type: 'CRM', detail: 'Resignation submitted via email. No exit interview requested.' },
    ],
    drafts: {
      callScript: [
        'This is a post-mortem — Kevin already resigned Jan 8.',
        'Ask what one thing could have changed his mind.',
        'Document answer for pattern recognition on future Declining members.',
      ],
      emailSubject: 'We noticed too late, Kevin',
      emailBody: `Kevin — I owe you a call I should have made in November. We saw the signs and didn't act. If you'd be open to a 10-minute conversation about what we could have done differently, I'd genuinely appreciate it.

— Alice`,
      smsDraft: 'Kevin, it\'s Alice from Pinetree. I know we\'re past the point — but I\'d value 10 minutes of your time to hear what we missed.',
    },
    staffNotes: [
      { id: 'note_hurst_1', author: 'Pro Shop', department: 'Golf', text: 'Regular in the Saturday foursome with Bill Evans. Competitive handicap.', timestamp: '2025-10-15T09:00:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Resignation received — no prior outreach', owner: 'Member Pulse', timestamp: '2026-01-08T10:05:00Z' },
    ],
  },
  mbr_t07: {
    memberId: 'mbr_t07',
    name: 'Linda Leonard',
    tier: 'Social',
    joinDate: '2025-06-10',
    archetype: 'Ghost',
    healthScore: 12,
    trend: [64, 58, 42, 28, 18, 14, 12],
    duesAnnual: 18000,
    memberValueAnnual: 24000,
    preferredChannel: 'Call',
    lastSeenLocation: 'Event lawn',
    family: [],
    preferences: {
      favoriteSpots: ['Wine cellar dining room', 'Event lawn'],
      teeWindows: 'N/A — social member',
      dining: 'Wine dinners, always table with Diane Prescott. Enjoys the social atmosphere.',
      notes: 'Joined after her husband passed away. Friends encouraged her to join for the social calendar. Needs personal, warm outreach — not transactional.',
    },
    contact: {
      phone: '(480) 555-0162',
      email: 'linda.leonard@example.com',
      preferredChannel: 'Call',
      lastOutreach: null,
    },
    riskSignals: [
      { id: 'visits', label: 'Zero visits since October — 3 months dark', timestamp: '2025-12-31T08:00:00Z', source: 'Access Log', confidence: '94%' },
      { id: 'email', label: 'Stopped opening emails entirely in November', timestamp: '2025-11-20T08:00:00Z', source: 'Email', confidence: '86%' },
      { id: 'social', label: 'Bridge partner Diane Prescott asked staff if Linda was okay — no follow-up logged', timestamp: '2025-12-08T14:00:00Z', source: 'CRM', confidence: '79%' },
    ],
    activity: [
      { id: 'll1', timestamp: 'Aug 14 · 6:30 PM', type: 'Events', detail: 'Wine dinner #1 — sat with Diane Prescott\'s table. Stayed until close. Staff noted she was "glowing."' },
      { id: 'll2', timestamp: 'Aug 28 · 6:45 PM', type: 'Events', detail: 'Wine dinner #2 — brought a guest (neighbor). $180 check, bought a case of the featured Pinot.' },
      { id: 'll3', timestamp: 'Sep 12 · 7:00 PM', type: 'Events', detail: 'Wine dinner #3 — arrived early, helped arrange flowers. Last recorded visit.' },
      { id: 'll4', timestamp: 'Dec 8 · 2:15 PM', type: 'CRM', detail: 'Diane Prescott asked front desk: "Is Linda okay? She hasn\'t been to bridge in weeks." No follow-up logged.' },
      { id: 'll5', timestamp: 'Jan 15', type: 'CRM', detail: 'Resignation submitted by mail. No exit interview. No outreach ever attempted.' },
    ],
    drafts: {
      callScript: [
        'This is personal — Linda joined after losing her husband. Lead with empathy, not retention.',
        'Ask how she\'s doing. Mention Diane misses her at bridge.',
        'If she\'s open to it, offer to have Diane call her directly — peer connection matters more than club programming.',
      ],
      emailSubject: 'We miss you, Linda — so does Diane',
      emailBody: `Linda — I hope you're doing well. Diane Prescott mentioned she misses seeing you at bridge night and I realized we never reached out to check in. That's on us. If you'd ever like to come back for a wine dinner — no pressure, no paperwork — I'd love to hold a seat for you at Diane's table. You brought something special to those evenings.

— Alice`,
      smsDraft: 'Linda, it\'s Alice from Pinetree. Just checking in — Diane mentioned she\'d love to see you at bridge. No agenda, just wanted you to know you\'re missed.',
    },
    staffNotes: [
      { id: 'note_leonard_1', author: 'Events Director', department: 'Events', text: 'Joined June 2025 after husband passed. Friends (Diane Prescott\'s circle) encouraged her. Attended 3 wine dinners in first 6 weeks — very engaged. Then went silent.', timestamp: '2025-09-20T16:00:00Z' },
    ],
    auditTrail: [
      { id: 'recommend', status: 'Resignation received — zero outreach in member history', owner: 'Member Pulse', timestamp: '2026-01-15T10:00:00Z' },
    ],
  },
};
