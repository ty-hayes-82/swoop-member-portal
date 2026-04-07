/**
 * Demo Source Definitions — Jonas CSV exports for guided demo mode.
 * Each source maps to real club system exports that users would recognize.
 * Preview shows the actual CSV data; loading triggers the app insights.
 */

export const DEMO_SOURCES = [
  {
    id: 'members',
    name: 'Member Roster',
    icon: '👥',
    system: 'Jonas Club Management',
    description: 'Member profiles, contact info, membership types, and dues',
    unlocks: ['Member Health page', 'At-risk member list', 'Health score distribution', 'Member profile drawers'],
    csvFiles: [
      { file: 'JCM_Members_F9.csv', label: 'Members (F9 Export)', rows: 250 },
      { file: 'JCM_Dependents_F9.csv', label: 'Dependents / Family', rows: 180 },
      { file: 'JCM_Membership_Types_F9.csv', label: 'Membership Types', rows: 5 },
    ],
    category: 'Core',
  },
  {
    id: 'tee-sheet',
    name: 'Tee Sheet',
    icon: '⛳',
    system: 'Jonas Tee Time Manager',
    description: 'Tee time reservations, player history, course setup',
    unlocks: ['Tee Sheet page', 'At-risk members on course', 'Cart prep recommendations', 'Cancel risk predictions'],
    csvFiles: [
      { file: 'TTM_Tee_Sheet_SV.csv', label: 'Tee Sheet Reservations', rows: 4200 },
      { file: 'TTM_Tee_Sheet_Players_SV.csv', label: 'Tee Sheet Players', rows: 3800 },
      { file: 'TTM_Course_Setup_F9.csv', label: 'Course Setup', rows: 2 },
    ],
    category: 'Core',
  },
  {
    id: 'fb',
    name: 'F&B / Point of Sale',
    icon: '🍽',
    system: 'Jonas POS',
    description: 'Sales transactions, line items, payments, and outlet performance',
    unlocks: ['F&B section on Service page', 'Revenue trends', 'Post-round dining conversion', 'Outlet performance'],
    csvFiles: [
      { file: 'POS_Sales_Detail_SV.csv', label: 'Sales Detail', rows: 2400 },
      { file: 'POS_Line_Items_SV.csv', label: 'Line Items', rows: 8500 },
      { file: 'POS_Payments_SV.csv', label: 'Payments', rows: 2100 },
      { file: 'POS_Daily_Close_SV.csv', label: 'Daily Close Summary', rows: 60 },
      { file: 'POS_Sales_Areas_F9.csv', label: 'Sales Areas / Outlets', rows: 6 },
    ],
    category: 'Revenue',
  },
  {
    id: 'complaints',
    name: 'Service Requests',
    icon: '📋',
    system: 'Jonas Club Management',
    description: 'Member service requests, complaints, and resolution tracking',
    unlocks: ['Service page complaints tab', 'Complaint patterns', 'Understaffed day flags', 'Service quality metrics'],
    csvFiles: [
      { file: 'JCM_Service_Requests_RG.csv', label: 'Service Requests', rows: 320 },
      { file: 'JCM_Communications_RG.csv', label: 'Member Communications', rows: 85 },
      { file: 'JCM_Aged_Receivables_SV.csv', label: 'Aged Receivables', rows: 250 },
    ],
    category: 'Service',
  },
  {
    id: 'email',
    name: 'Email & Events',
    icon: '✉',
    system: 'Clubhouse Online / Jonas Events',
    description: 'Email campaigns, open/click events, event registrations',
    unlocks: ['Email engagement section', 'Decaying member alerts', 'Event attendance tracking', 'Campaign effectiveness'],
    csvFiles: [
      { file: 'CHO_Email_Events_SV.csv', label: 'Email Open/Click Events', rows: 12000 },
      { file: 'CHO_Campaigns_SV.csv', label: 'Email Campaigns', rows: 8 },
      { file: 'JAM_Event_List_SV.csv', label: 'Event List', rows: 12 },
      { file: 'JAM_Registrations_SV.csv', label: 'Event Registrations', rows: 1800 },
    ],
    category: 'Engagement',
  },
  {
    id: 'agents',
    name: 'AI Agents',
    icon: '🤖',
    system: 'Swoop Intelligence',
    description: 'AI-powered action recommendations, briefings, and agent reasoning',
    unlocks: ['Today page action queue', 'Automations inbox', 'Agent-generated actions', 'Morning briefing alerts'],
    csvFiles: [],
    isInternal: true,
    category: 'Intelligence',
  },
  {
    id: 'weather',
    name: 'Weather & Operations',
    icon: '🌤',
    system: 'Weather API + 7shifts',
    description: 'Weather forecasts, staffing shifts, and operational planning',
    unlocks: ['Weather impact on service page', 'Staffing vs demand', 'Pace of play analysis', 'Operational planning'],
    csvFiles: [
      { file: '7shifts_Staff_Shifts.csv', label: 'Staff Shifts', rows: 450 },
      { file: 'ADP_Staff_Roster.csv', label: 'Staff Roster', rows: 35 },
    ],
    category: 'Operations',
  },
  {
    id: 'pipeline',
    name: 'Club Profile & Benchmarks',
    icon: '📈',
    system: 'Jonas Club Management',
    description: 'Club profile, industry benchmarks, board report data, growth pipeline',
    unlocks: ['Board report', 'Monthly trends', 'Industry benchmarks', 'Club profile overview'],
    csvFiles: [
      { file: 'JCM_Club_Profile.csv', label: 'Club Profile', rows: 1 },
    ],
    category: 'Growth',
  },
];

// Helper: get all source IDs
export const ALL_SOURCE_IDS = DEMO_SOURCES.map(s => s.id);
