// Static fallback data for Board Report
// Source of truth until live Postgres wiring is confirmed working

export const kpis = [
  { label: 'Members Saved', value: 14, prefix: '', suffix: '', color: 'green' },
  { label: 'Dues Protected', value: 168, prefix: '$', suffix: 'K', color: 'green' },
  { label: 'Lifetime Value Protected', value: 840, prefix: '$', suffix: 'K', color: 'green' },
  { label: 'Revenue Recovered', value: 42.5, prefix: '$', suffix: 'K', color: 'blue' },
  { label: 'Service Failures Caught', value: 23, prefix: '', suffix: '', color: 'orange' },
  { label: 'Avg Response Time', value: 4.2, prefix: '', suffix: ' hrs', color: 'blue' },
  { label: 'Board Confidence Score', value: 94, prefix: '', suffix: '%', color: 'green' },
];

export const memberSaves = [
  {
    name: 'James Whitfield',
    healthBefore: 34,
    healthAfter: 71,
    trigger: 'Pace-of-play complaint went unresolved for 5 days; spend dropped 40%',
    action: 'GM personal call + complimentary round + service recovery note',
    outcome: 'Re-engaged within 48 hrs, booked 3 rounds following week',
    duesAtRisk: 18500,
  },
  {
    name: 'Catherine Morales',
    healthBefore: 41,
    healthAfter: 68,
    trigger: 'Dining frequency dropped 60% after cold-food complaint',
    action: 'F&B director outreach + private tasting invitation',
    outcome: 'Returned to weekly dining pattern within 2 weeks',
    duesAtRisk: 14200,
  },
  {
    name: 'Robert & Linda Chen',
    healthBefore: 28,
    healthAfter: 62,
    trigger: 'Family membership — kids program schedule conflict led to 3 missed events',
    action: 'Membership director meeting + custom schedule accommodation',
    outcome: 'Family re-enrolled in junior program, added pool membership',
    duesAtRisk: 31000,
  },
  {
    name: 'David Harrington',
    healthBefore: 38,
    healthAfter: 74,
    trigger: 'Pro shop billing dispute escalated twice without resolution',
    action: 'Controller review + credit issued + personal follow-up from GM',
    outcome: 'Dispute resolved, member upgraded to premium locker',
    duesAtRisk: 16800,
  },
  {
    name: 'Patricia Nguyen',
    healthBefore: 45,
    healthAfter: 77,
    trigger: 'Tee time availability frustration — 4 preferred slots missed in 2 weeks',
    action: 'Priority booking window + starter introduction',
    outcome: 'Secured regular Saturday 8am slot, satisfaction restored',
    duesAtRisk: 12500,
  },
  {
    name: 'Michael Torres',
    healthBefore: 31,
    healthAfter: 65,
    trigger: 'Guest policy confusion led to embarrassing denial at gate',
    action: 'Membership committee apology + revised guest pass issued same day',
    outcome: 'Hosted 2 guest events following month, referred 1 new member',
    duesAtRisk: 15000,
  },
];

export const operationalSaves = [
  {
    event: 'Wind Advisory — Feb 8',
    detection: 'Weather API flagged 35mph gusts at 5:42am, 47 tee times at risk',
    action: 'Auto-notified 47 members with reschedule options; moved 12 to simulator slots',
    outcome: '38 of 47 rebooked within 72 hrs, zero complaints filed',
    revenueProtected: 8400,
  },
  {
    event: 'Starter No-Show — Jan 22',
    detection: 'Staffing system detected no clock-in for AM starter by 6:15am',
    action: 'Alert sent to Head Pro; backup starter dispatched by 6:28am',
    outcome: 'First tee time (6:45am) launched on schedule, no member impact',
    revenueProtected: 0,
  },
  {
    event: 'Valentine Dinner Overbook — Feb 14',
    detection: 'Reservation system hit 110% capacity at 11am, 14 hrs before event',
    action: 'Expanded to patio with heaters; added second seating at 8:30pm',
    outcome: 'All 126 covers served, NPS 4.8/5 for the evening',
    revenueProtected: 12600,
  },
];

export const monthlyTrends = [
  { month: 'Sep', membersSaved: 1, duesProtected: 12000, serviceFailures: 4, responseTime: 8.1 },
  { month: 'Oct', membersSaved: 2, duesProtected: 28000, serviceFailures: 5, responseTime: 6.8 },
  { month: 'Nov', membersSaved: 2, duesProtected: 31000, serviceFailures: 4, responseTime: 5.9 },
  { month: 'Dec', membersSaved: 3, duesProtected: 38000, serviceFailures: 5, responseTime: 5.2 },
  { month: 'Jan', membersSaved: 3, duesProtected: 42000, serviceFailures: 3, responseTime: 4.2 },
  { month: 'Feb', membersSaved: 3, duesProtected: 17000, serviceFailures: 2, responseTime: 3.8 },
];
