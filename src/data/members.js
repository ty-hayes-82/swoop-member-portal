// Member data — Oakmont Hills CC, January 2026

import { theme } from '@/config/theme';

export const memberArchetypes = [
  { archetype: 'Die-Hard Golfer',  count: 54, golf: 88, dining: 42, events: 28, email: 32, trend: +4  },
  { archetype: 'Social Butterfly', count: 45, golf: 18, dining: 82, events: 78, email: 72, trend: +6  },
  { archetype: 'Balanced Active',  count: 66, golf: 68, dining: 62, events: 54, email: 55, trend: -2  },
  { archetype: 'Weekend Warrior',  count: 45, golf: 52, dining: 44, events: 32, email: 28, trend: -8  },
  { archetype: 'Declining',        count: 30, golf: 24, dining: 18, events: 8,  email: 22, trend: -18 },
  { archetype: 'New Member',       count: 24, golf: 42, dining: 48, events: 38, email: 68, trend: +14 },
  { archetype: 'Ghost',            count: 21, golf: 4,  dining: 6,  events: 2,  email: 8,  trend: -4  },
  { archetype: 'Snowbird',         count: 15, golf: 62, dining: 52, events: 34, email: 44, trend: +2  },
];

export const healthDistribution = [
  { level: 'Healthy',  min: 70,  count: 138, percentage: 0.46, color: theme.colors.success },  // theme.colors.success
  { level: 'Watch',    min: 50,  count: 82,  percentage: 0.27, color: theme.colors.warning },  // theme.colors.warning
  { level: 'At Risk',  min: 30,  count: 52,  percentage: 0.17, color: theme.colors.riskAtRiskAlt },  // between warning + urgent
  { level: 'Critical', min: 0,   count: 28,  percentage: 0.09, color: theme.colors.urgent },  // theme.colors.urgent
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
