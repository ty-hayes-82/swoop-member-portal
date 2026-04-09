// Static fallback data for Cockpit / TodayMode
// Mirrors the exact shape consumed by TodayMode.jsx

export const cockpitItems = [
  {
    priority: 1,
    urgency: 'urgent',
    questionDomain: 'Operational Command',
    questionLabel: 'Where is today at risk of breaking?',
    icon: '\u26A0',
    headline: 'James Whitfield filed a complaint 6 days ago. No one has followed up.',
    recommendation:
      'GM to call James personally with apology + complimentary round. Send recovery note via Swoop app within 2 hours.',
    evidenceSignals: [
      { source: 'Complaint', detail: 'Jan 16 pace-of-play complaint' },
      { source: 'Tee Sheet', detail: '3 cancellations in 10 days' },
      { source: 'POS', detail: 'Grill Room visits dropped to zero' },
    ],
    bullets: [
      'Complaint acknowledged but unresolved \u2014 timer exceeded 6-day SLA.',
      'Average Grill Room check dropped from $47 \u2192 $28 since January 3.',
      'Health score fell 78 \u2192 42 once the third complaint hit.',
    ],
    stakes: '$18,000/yr in dues ($90K lifetime value)',
    memberName: 'James Whitfield',
    memberId: 'mbr_203',
    context: 'Slow service complaint at Grill Room \u2014 felt ignored after acknowledging.',
    linkLabel: 'Full case \u2192 Staffing & Service',
    linkKey: 'staffing-service',
    meta: {
      sourceIcon: '\uD83D\uDCC2',
      source: 'CRM + POS + Complaints',
      freshness: 'Updated 11 min ago',
      urgency: 'Act Now',
      urgencyColor: '#ef4444',
      why: 'Complaint aging 6d & spend down 42%',
      metric: { value: '6-day', label: 'warning lead time' },
    },
  },
  {
    priority: 2,
    urgency: 'warning',
    questionDomain: 'Weather & Course Ops',
    questionLabel: 'What external factors could disrupt today?',
    icon: '\uD83C\uDF2C\uFE0F',
    headline: 'Wind advisory forecast for Saturday — 30-40 mph gusts expected after 11am.',
    recommendation:
      'Pre-notify 32 afternoon tee times with reschedule options. Open 6 simulator slots as backup. Alert F&B to shift lunch capacity indoors.',
    evidenceSignals: [
      { source: 'Weather API', detail: 'NWS Wind Advisory 11am\u20135pm, gusts to 40mph' },
      { source: 'Tee Sheet', detail: '32 tee times booked after 11am' },
      { source: 'Historical', detail: 'Last wind event (Feb 8): 47 affected, 38 rebooked' },
    ],
    bullets: [
      '32 members have afternoon tee times that may be disrupted.',
      'Proactive notification reduced complaint rate 91% during Feb 8 event.',
      'Simulator availability can absorb ~6 groups if offered early.',
    ],
    stakes: '$4,800 in green fees + $2,100 estimated F&B at risk',
    memberName: null,
    memberId: null,
    context: 'Wind advisory issued by NWS for the local area, affecting afternoon play.',
    linkLabel: 'View tee sheet \u2192 Operations',
    linkKey: 'operations',
    meta: {
      sourceIcon: '\uD83C\uDF24\uFE0F',
      source: 'Weather API + Tee Sheet',
      freshness: 'Updated 23 min ago',
      urgency: 'Review Today',
      urgencyColor: '#f59e0b',
      why: 'NWS advisory + 32 afternoon bookings',
      metric: { value: '32', label: 'tee times at risk' },
    },
  },
  {
    priority: 3,
    urgency: 'neutral',
    questionDomain: 'Member Retention',
    questionLabel: 'Which at-risk members are on-site today?',
    icon: '\uD83D\uDC65',
    headline: '3 at-risk members have tee times today \u2014 opportunity for personal touchpoints.',
    recommendation:
      'Brief starter and pro shop staff on these members. GM or Head Pro to greet at least one personally. Log interaction in CRM by end of day.',
    evidenceSignals: [
      { source: 'Health Score', detail: '3 members below 50 with today bookings' },
      { source: 'Tee Sheet', detail: 'Catherine Morales 9:12am, David Harrington 10:48am, Michael Torres 1:24pm' },
      { source: 'CRM', detail: 'All 3 had recent negative interactions in past 30 days' },
    ],
    bullets: [
      'Catherine Morales (health: 41) \u2014 dining complaint 2 weeks ago, plays at 9:12am.',
      'David Harrington (health: 38) \u2014 billing dispute unresolved, plays at 10:48am.',
      'Michael Torres (health: 31) \u2014 guest policy incident last month, plays at 1:24pm.',
    ],
    // 2026-04-09 demo-data audit bump: was $62,000. Three members at $28K
    // blended (one family + two singles) lands harder while still being
    // believable for Pinetree-tier dues math. Stays under the 2x ceiling.
    stakes: '$84,000 combined annual dues at risk',
    memberName: null,
    memberId: null,
    context: 'Three members flagged as at-risk by health scoring are on the tee sheet today.',
    linkLabel: 'View member profiles \u2192 Members',
    linkKey: 'members',
    meta: {
      sourceIcon: '\uD83D\uDCCA',
      source: 'Health Score + Tee Sheet + CRM',
      freshness: 'Updated 8 min ago',
      urgency: 'Act Now',
      urgencyColor: '#ef4444',
      why: '3 at-risk members on today\u2019s tee sheet',
      metric: { value: '3', label: 'at-risk members on-site' },
    },
  },
];

export const sinceLastLogin = {
  newAlerts: 3,
  membersChanged: 2,
  revenueImpact: '$8,736',
  lastLoginAt: null,
};
