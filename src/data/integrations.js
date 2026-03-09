export const SYSTEMS = [
  { id: 'tee-sheet',      name: 'ForeTees Tee Sheet',            category: 'tee-sheet', tier: 1, logo: 'FT', status: 'connected',    lastSync: '2m ago',  endpoints: ['teeTimes', 'pacing', 'playerRoster'] },
  { id: 'pos',            name: 'Lightspeed POS',                category: 'pos',       tier: 1, logo: 'LS', status: 'connected',    lastSync: '4m ago',  endpoints: ['checks', 'lineItems', 'tenders'] },
  { id: 'club-mgmt',      name: 'Clubessential CMS',             category: 'crm',       tier: 1, logo: 'CE', status: 'available',    lastSync: null,      endpoints: ['memberProfiles', 'duesLedger', 'households'] },
  { id: 'member-crm',     name: 'Northstar Member CRM',          category: 'crm',       tier: 1, logo: 'NS', status: 'connected',    lastSync: '8m ago',  endpoints: ['members', 'balances', 'segments'] },
  { id: 'staffing',       name: 'ADP Workforce',                 category: 'staffing',  tier: 2, logo: 'ADP',status: 'connected',    lastSync: '11m ago', endpoints: ['schedules', 'laborForecast', 'clockEvents'] },
  { id: 'scheduling',     name: '7shifts Scheduling',            category: 'staffing',  tier: 3, logo: '7S', status: 'available',    lastSync: null,      endpoints: ['shifts', 'coverage', 'roles'] },
  { id: 'public-play',    name: 'GolfNow Public Tee Sheet',      category: 'tee-sheet', tier: 3, logo: 'GN', status: 'coming-soon',  lastSync: null,      endpoints: ['booking', 'priceRules', 'roundCompletions'] },
  { id: 'jonas',          name: 'Jonas Club Management',         category: 'crm',       tier: 1, logo: 'JC', status: 'connected',    lastSync: '15m ago', endpoints: ['members', 'statements', 'events'] },
  { id: 'clubessential',  name: 'Clubessential POS',             category: 'pos',       tier: 2, logo: 'CE', status: 'connected',    lastSync: '9m ago',  endpoints: ['checks', 'covers', 'promoUsage'] },
  { id: 'noteefy',        name: 'Noteefy Waitlist',              category: 'waitlist',  tier: 2, logo: 'NF', status: 'connected',    lastSync: '1m ago',  endpoints: ['waitlist', 'notifications', 'responseRate'] },
  { id: 'clubready',      name: 'ClubReady CRM',                 category: 'crm',       tier: 2, logo: 'CR', status: 'available',    lastSync: null,      endpoints: ['prospects', 'tasks', 'campaigns'] },
  { id: 'club-prophet',   name: 'Club Prophet POS',              category: 'pos',       tier: 3, logo: 'CP', status: 'available',    lastSync: null,      endpoints: ['checks', 'inventory', 'memberSpend'] },
  { id: 'chronogolf',     name: 'Chronogolf by Lightspeed',      category: 'tee-sheet', tier: 1, logo: 'CG', status: 'connected',    lastSync: '3m ago',  endpoints: ['teeTimes', 'cancellations', 'players'] },
  { id: 'foreup',         name: 'ForeUP Tee Sheet',              category: 'tee-sheet', tier: 2, logo: 'FU', status: 'connected',    lastSync: '6m ago',  endpoints: ['teeTimes', 'membership', 'packages'] },
  { id: 'ezlinks',        name: 'EZLinks',                       category: 'tee-sheet', tier: 3, logo: 'EZ', status: 'coming-soon',  lastSync: null,      endpoints: ['booking', 'pricing', 'partnerFeeds'] },
  { id: 'square-pos',     name: 'Square POS',                    category: 'pos',       tier: 2, logo: 'SQ', status: 'connected',    lastSync: '12m ago', endpoints: ['tenders', 'checks', 'tipPool'] },
  { id: 'toast-pos',      name: 'Toast Restaurant POS',          category: 'pos',       tier: 1, logo: 'TO', status: 'connected',    lastSync: '5m ago',  endpoints: ['checks', 'modifiers', 'kitchenState'] },
  { id: 'sevenrooms',     name: 'SevenRooms',                    category: 'waitlist',  tier: 2, logo: '7R', status: 'available',    lastSync: null,      endpoints: ['reservations', 'guestNotes', 'covers'] },
  { id: 'adp-payroll',    name: 'ADP Payroll',                   category: 'staffing',  tier: 2, logo: 'AP', status: 'connected',    lastSync: '7m ago',  endpoints: ['payroll', 'benefits', 'positions'] },
  { id: 'paylocity',      name: 'Paylocity',                     category: 'staffing',  tier: 2, logo: 'PL', status: 'available',    lastSync: null,      endpoints: ['shifts', 'overtime', 'alerts'] },
  { id: 'quickbooks',     name: 'QuickBooks Online',             category: 'crm',       tier: 2, logo: 'QB', status: 'connected',    lastSync: '18m ago', endpoints: ['journal', 'classes', 'receivables'] },
  { id: 'salesforce',     name: 'Salesforce',                    category: 'crm',       tier: 2, logo: 'SF', status: 'connected',    lastSync: '10m ago', endpoints: ['leads', 'opportunities', 'tasks'] },
  { id: 'hubspot',        name: 'HubSpot Marketing',             category: 'crm',       tier: 3, logo: 'HS', status: 'available',    lastSync: null,      endpoints: ['emails', 'forms', 'workflows'] },
  { id: 'mailchimp',      name: 'Mailchimp',                     category: 'crm',       tier: 3, logo: 'MC', status: 'coming-soon',  lastSync: null,      endpoints: ['audiences', 'campaigns'] },
  { id: 'paytronix',      name: 'Paytronix Loyalty',             category: 'crm',       tier: 3, logo: 'PX', status: 'available',    lastSync: null,      endpoints: ['loyalty', 'offers', 'checkin'] },
  { id: 'gganalytics',    name: 'GGA PerformanceAI',             category: 'analytics', tier: 2, logo: 'GGA',status: 'connected',    lastSync: '20m ago', endpoints: ['benchmarks', 'forecast', 'alerts'] },
  { id: 'ibs-club',       name: 'IBS Club System',               category: 'crm',       tier: 2, logo: 'IBS',status: 'available',    lastSync: null,      endpoints: ['members', 'ledger', 'events'] },
  { id: 'teesnap',        name: 'Teesnap',                       category: 'tee-sheet', tier: 2, logo: 'TS', status: 'connected',    lastSync: '9m ago',  endpoints: ['booking', 'marketing', 'pos'] },
  { id: 'spoton-pos',     name: 'SpotOn Restaurant',             category: 'pos',       tier: 2, logo: 'SO', status: 'available',    lastSync: null,      endpoints: ['checks', 'kds', 'covers'] },
  { id: 'stripe-pay',     name: 'Stripe Payments',               category: 'pos',       tier: 3, logo: 'ST', status: 'connected',    lastSync: '3m ago',  endpoints: ['charges', 'refunds', 'payouts'] },
];

export const COMBOS = [
  {
    id: 'tee-sheet-pos',
    systems: ['tee-sheet', 'pos'],
    insight: 'Slow weekend rounds suppress post-round dining conversion in the grill.',
    kpi: { value: '-11%', label: 'Dining conversion after >4:20 rounds' },
    preview: {
      type: 'sparkline',
      label: 'Post-round dining conversion (8 weeks)',
      value: '37%',
      trend: 'down',
      data: [52, 49, 47, 45, 42, 41, 39, 37],
    },
  },
  {
    id: 'tee-sheet-demand-optimizer',
    systems: ['tee-sheet'],
    insight: 'Swoop detects cancellations instantly and prioritizes waitlist by member retention value and tee time match-fit.',
    kpi: { value: '3.4x', label: 'Fill rate with retention-prioritized alerts' },
    preview: { type: 'kpi', value: '86%', label: 'Recovered cancellations in 30 days' },
  },
  {
    id: 'member-crm-pos',
    systems: ['member-crm', 'pos'],
    insight: 'High-visit members under-index on F&B spend relative to peers in the same tenure band.',
    kpi: { value: '$128K', label: 'Annualized unactivated F&B revenue' },
    preview: {
      type: 'sparkline',
      label: 'High-visit member F&B spend index',
      value: '0.72x',
      trend: 'down',
      data: [0.94, 0.9, 0.86, 0.84, 0.8, 0.78, 0.75, 0.72],
    },
  },
  {
    id: 'member-crm-staffing',
    systems: ['member-crm', 'staffing'],
    insight: 'Understaffed prime dining windows correlate with lower member sentiment the next day.',
    kpi: { value: '+19 pts', label: 'Satisfaction swing when shifts are fully covered' },
    preview: { type: 'kpi', value: '27%', label: 'Prime windows flagged understaffed' },
  },
  {
    id: 'club-mgmt-demand-optimizer',
    systems: ['club-mgmt'],
    insight: 'Swoop detects repeated waitlist misses and flags members with sharply lower 60-day engagement scores.',
    kpi: { value: '2.1x', label: 'Churn risk after 3+ failed waitlists' },
    preview: {
      type: 'sparkline',
      label: 'At-risk members after waitlist misses',
      value: '34',
      trend: 'up',
      data: [12, 15, 17, 20, 23, 26, 30, 34],
    },
  },
  {
    id: 'public-play-scheduling',
    systems: ['public-play', 'scheduling'],
    insight: 'Tier-3 connections still uncover staffing opportunities around high-volume public play blocks.',
    kpi: { value: '14 hrs', label: 'Weekly labor reallocation opportunity' },
    preview: { type: 'kpi', value: '9%', label: 'Forecast variance in tee-sheet demand' },
  },
];

export const integrations = SYSTEMS;
export const integrationsById = Object.fromEntries(SYSTEMS.map((system) => [system.id, system]));

export const INTEGRATION_CATEGORY_SECTIONS = {
  'tee-sheet': {
    title: 'Tee Sheet Intelligence',
    read: ['Tee times, player roster, pace windows, and cancellation patterns'],
    intelligence: ['Predicts at-risk cancellations and maps slow-round spillover into F&B conversion'],
  },
  pos: {
    title: 'POS Intelligence',
    read: ['Checks, line items, modifiers, tip signals, and cover counts'],
    intelligence: ['Links spend behavior to member health shifts and surfaces lost-revenue windows'],
  },
  crm: {
    title: 'Member CRM Intelligence',
    read: ['Profiles, balances, lifecycle notes, and household context'],
    intelligence: ['Builds retention risk scores and recommends personalized outreach timing'],
  },
  staffing: {
    title: 'Staffing Intelligence',
    read: ['Schedules, labor forecast variance, overtime, and clock events'],
    intelligence: ['Flags service-risk shifts before member complaints spike'],
  },
  waitlist: {
    title: 'Waitlist Intelligence',
    read: ['Waitlist priority, alerts sent, and response-rate history'],
    intelligence: ['Ranks refill options by retention value, not first-come order'],
  },
};

export const VENDOR_INTELLIGENCE_DETAILS = {
  'tee-sheet': {
    reads: ['Tee interval pacing', 'Daily roster', 'No-show history'],
    adds: ['Slow-round risk projections', 'Post-round conversion impact tags'],
  },
  pos: {
    reads: ['Check-level spend', 'Item mix by outlet', 'Dining dayparts'],
    adds: ['Spend-decay member alerts', 'Understaffing revenue leakage flags'],
  },
  'member-crm': {
    reads: ['Member profile metadata', 'Dues and tenure', 'Lifecycle notes'],
    adds: ['Churn risk trajectories', 'Action-ready retention segments'],
  },
  staffing: {
    reads: ['Shift templates', 'Coverage gaps', 'Overtime'],
    adds: ['Service gap warnings', 'Preventable complaint forecasts'],
  },
  noteefy: {
    reads: ['Waitlist intent', 'Open slot responses', 'Response latency'],
    adds: ['Retention-priority backfill queue', 'Cancellation save recommendations'],
  },
};
