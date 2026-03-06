// data/integrations.js — SYSTEMS and COMBOS for the Integrations page
// Phase 2 swap: integrationsService.js fetches from /api/integrations instead

export const SYSTEMS = [
  {
    id: 'foretees',
    name: 'ForeTees',
    category: 'Tee Sheet',
    icon: '⛳',
    themeColor: 'operations',
    status: 'connected',
    lastSync: '4 min ago',
    goLive: '3–5 days',
    partners: ['ForeTees', 'EZLinks', 'Golf Genius'],
    description: 'Tee sheet reservations, pace of play, booking players, and round completion data.',
  },
  {
    id: 'jonas',
    name: 'Jonas POS',
    category: 'Food & Beverage',
    icon: '🍽',
    themeColor: 'fb',
    status: 'connected',
    lastSync: '2 min ago',
    goLive: '3–5 days',
    partners: ['Jonas Club Software', 'Northstar ClubPOS', 'Lightspeed', 'Square for Restaurants'],
    description: 'POS checks, line items, payment methods, ticket timing, and comp/discount tracking.',
  },
  {
    id: 'northstar',
    name: 'Northstar',
    category: 'Member CRM',
    icon: '★',
    themeColor: 'members',
    status: 'connected',
    lastSync: '12 min ago',
    goLive: '5–7 days',
    partners: ['Northstar Club Management', 'ClubEssential', 'Jonas Club Software', 'MembersFirst'],
    description: 'Member profiles, dues, household relationships, membership types, and churn data.',
  },
  {
    id: 'clubready',
    name: 'ClubReady',
    category: 'Staff Scheduling',
    icon: '📅',
    themeColor: 'staffing',
    status: 'connected',
    lastSync: '8 min ago',
    goLive: '2–3 days',
    partners: ['ClubReady', '7shifts', 'HotSchedules (Fourth)', 'When I Work'],
    description: 'Staff shifts, department coverage, understaffed day flags, and labor cost tracking.',
  },
  {
    id: 'clubprophet',
    name: 'Club Prophet',
    category: 'Membership Mgmt',
    icon: '◉',
    themeColor: 'briefing',
    status: 'available',
    lastSync: null,
    goLive: '5–7 days',
    partners: ['Club Prophet', 'Northstar', 'ClubEssential HQ'],
    description: 'Membership financials, F&B minimums, account balances, and prospect pipeline.',
  },
  {
    id: 'weather',
    name: 'Weather API',
    category: 'Demand Forecasting',
    icon: '🌤',
    themeColor: 'operations',
    status: 'connected',
    lastSync: '1 min ago',
    goLive: '1 day',
    partners: ['Tomorrow.io', 'Weather.com API', 'OpenWeatherMap'],
    description: 'Daily conditions, precipitation, wind, and demand modifier computation.',
  },
  {
    id: 'email',
    name: 'Email & Comms',
    category: 'Communications',
    icon: '✉',
    themeColor: 'members',
    status: 'available',
    lastSync: null,
    goLive: '3–5 days',
    partners: ['Mailchimp', 'Constant Contact', 'SendGrid', 'MembersFirst Engage'],
    description: 'Campaign sends, open and click tracking, unsubscribes, and engagement decay signals.',
  },
  {
    id: 'events',
    name: 'Event Mgmt',
    category: 'Programming',
    icon: '🏆',
    themeColor: 'pipeline',
    status: 'coming_soon',
    lastSync: null,
    goLive: 'Coming Q2',
    partners: ['Golf Genius', 'Tripleseat', 'OpenTable', 'Eventbrite'],
    description: 'Tournament registrations, dining event attendance, social event RSVP, and no-show rates.',
  },
];

export const COMBOS = [
  {
    id: 'tee-to-table',
    systems: ['foretees', 'jonas'],
    label: 'Tee-to-Table Revenue',
    insight: 'After a slow round (>270 min), post-round dining conversion drops 15%. Slow rounds cost an estimated $5,760/month in lost F&B revenue.',
    automations: [
      'Alert F&B host when a round exceeds 4 hours',
      'Offer comp dessert to groups checking out late',
      'Track post-round revenue per tee-time slot',
    ],
    preview: { type: 'sparkline', sparklineKey: 'postRoundConversion', value: '35%', label: 'Post-round dining conversion', subtext: 'Drops to 20% after slow rounds', trend: 'down' },
    swoop_only: true,
  },
  {
    id: 'weather-demand',
    systems: ['foretees', 'weather'],
    label: 'Weather × Demand',
    insight: 'Rain reduces golf bookings 40% but increases F&B revenue 15% — members come to the club anyway. Invisible when systems are siloed.',
    automations: [
      'Proactively text waitlisted members on rain days',
      'Adjust F&B staffing 24 hours in advance',
      'Push dining promotions the evening before rain',
    ],
    preview: { type: 'kpi', value: '+15%', label: 'F&B revenue on rain days', subtext: '−40% golf, +15% dining — always' },
    swoop_only: true,
  },
  {
    id: 'churn-signal',
    systems: ['northstar', 'foretees'],
    label: 'Engagement Decay → Churn',
    insight: 'Members who resign show a 2–3 month decay pattern across golf, dining, and email before submitting notice. No single system sees the full picture.',
    automations: [
      'Flag members trending down across all domains',
      'Trigger GM personal outreach at health score 50',
      'Schedule retention call before score hits 30',
    ],
    preview: { type: 'sparkline', sparklineKey: 'atRiskMemberCount', value: '6–8 wks', label: 'Average warning lead time', subtext: 'Before resignation letter arrives', trend: 'up' },
    swoop_only: true,
  },
  {
    id: 'complaint-churn',
    systems: ['northstar', 'jonas'],
    label: 'Service Failure → Resignation',
    insight: 'James Whitfield: active Balanced Active member. Service Speed complaint Jan 18 (−0.8 sentiment) went unresolved. Resigned Jan 22. A $22K/year dues loss, preventable in 4 days.',
    automations: [
      'Escalate unresolved complaints after 48 hours',
      'Assign GM follow-up for members with health < 60',
      'Draft personal apology email in one click',
    ],
    preview: { type: 'kpi', value: '$22K', label: 'Annual dues lost — James Whitfield', subtext: 'Complaint unresolved → resigned in 4 days' },
    swoop_only: true,
  },
  {
    id: 'staff-revenue',
    systems: ['clubready', 'jonas'],
    label: 'Staffing Gap → Revenue Loss',
    insight: 'On understaffed Grill Room days (Jan 9, 16, 28), ticket times ran 20% longer, complaints doubled, and F&B revenue was ~8% lower. The cost is invisible unless staffing and POS are connected.',
    automations: [
      'Flag scheduling gaps 72 hours in advance',
      'Compute revenue-at-risk per understaffed shift',
      'Suggest coverage from cross-trained staff',
    ],
    preview: { type: 'kpi', value: '−8%', label: 'F&B revenue on understaffed days', subtext: 'Jan 9, 16, 28 — Grill Room' },
    swoop_only: true,
  },
  {
    id: 'email-churn',
    systems: ['email', 'northstar'],
    label: 'Email Decay → Churn Prediction',
    insight: 'Members who stop opening emails are 3× more likely to resign within 90 days. Email silence is a churn signal most clubs miss entirely.',
    automations: [
      'Flag members with 3+ consecutive non-opens',
      'Trigger re-engagement sequence before score drops',
      'Notify GM when email score diverges from health score',
    ],
    preview: { type: 'sparkline', sparklineKey: 'emailOpenRateAvg', value: '36%', label: 'Avg email open rate (Jan)', subtext: 'Down from 42% in August', trend: 'down' },
    swoop_only: true,
  },
];

// ── Backward-compat exports for src/features/integrations/* ──────────────────
// These files predate the SYSTEMS/COMBOS refactor and import the old shapes.
// Remove once features/integrations/* is consolidated into demo-mode/Integrations.

/** Legacy flat array (id, name, icon, category, description, dataPoints, themeColor) */
export const integrations = SYSTEMS.map(s => ({
  ...s,
  dataPoints: [],   // legacy field — not in new schema, stub to empty
}));

/** Legacy lookup map by id */
export const integrationsById = Object.fromEntries(
  integrations.map(i => [i.id, i])
);
