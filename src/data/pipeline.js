// Growth pipeline data — warm leads from guest appearances

export const warmLeads = [
  { guestName: 'David Chen',     visits: 8,  totalSpend: 1240, sponsor: 'mbr_028',
    score: 92, tier: 'hot',  rounds: 7,  dining: 5, events: 2, potentialDues: 18000 },
  { guestName: 'Sarah Mitchell', visits: 6,  totalSpend: 980,  sponsor: 'mbr_145',
    score: 88, tier: 'hot',  rounds: 5,  dining: 4, events: 1, potentialDues: 18000 },
  { guestName: 'Robert Torres',  visits: 5,  totalSpend: 820,  sponsor: 'mbr_067',
    score: 76, tier: 'warm', rounds: 4,  dining: 3, events: 1, potentialDues: 12000 },
  { guestName: 'Jennifer Walsh', visits: 4,  totalSpend: 640,  sponsor: 'mbr_201',
    score: 71, tier: 'warm', rounds: 3,  dining: 2, events: 2, potentialDues: 18000 },
  { guestName: 'Mark Patterson', visits: 4,  totalSpend: 580,  sponsor: 'mbr_089',
    score: 68, tier: 'warm', rounds: 4,  dining: 1, events: 0, potentialDues: 12000 },
  { guestName: 'Lisa Yamamoto',  visits: 3,  totalSpend: 520,  sponsor: 'mbr_112',
    score: 64, tier: 'warm', rounds: 2,  dining: 3, events: 1, potentialDues: 6000  },
  { guestName: 'Tom Bradford',   visits: 3,  totalSpend: 440,  sponsor: 'mbr_044',
    score: 52, tier: 'cool', rounds: 3,  dining: 1, events: 0, potentialDues: 18000 },
  { guestName: 'Maria Santos',   visits: 2,  totalSpend: 360,  sponsor: 'mbr_188',
    score: 48, tier: 'cool', rounds: 1,  dining: 2, events: 1, potentialDues: 12000 },
  { guestName: 'James Hawkins',  visits: 2,  totalSpend: 290,  sponsor: 'mbr_072',
    score: 44, tier: 'cool', rounds: 2,  dining: 1, events: 0, potentialDues: 18000 },
  { guestName: 'Karen Lee',      visits: 2,  totalSpend: 240,  sponsor: 'mbr_156',
    score: 40, tier: 'cool', rounds: 1,  dining: 1, events: 1, potentialDues: 6000  },
  { guestName: 'Steve Morrison', visits: 1,  totalSpend: 180,  sponsor: 'mbr_033',
    score: 28, tier: 'cold', rounds: 1,  dining: 1, events: 0, potentialDues: 12000 },
  { guestName: 'Amy Russell',    visits: 1,  totalSpend: 140,  sponsor: 'mbr_221',
    score: 22, tier: 'cold', rounds: 0,  dining: 1, events: 1, potentialDues: 6000  },
];

// Monthly trend data for sparklines (Aug–Jan)
export const trends = {
  postRoundConversion: [38, 39, 41, 38, 36, 35],
  monthlyRevenue: [218000, 224000, 231000, 189000, 204000, 218400],
  slowRoundRate: [0.22, 0.23, 0.24, 0.26, 0.27, 0.28],
  memberHealthScore: [74, 73, 72, 70, 68, 66],
  fbRevenue: [82000, 84000, 88000, 76000, 80000, 98400],
  memberCount: [302, 301, 300, 299, 298, 300],
  labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
};

export const waitlistEntries = [
  { date: '2026-01-04', slot: 'Sat 8 AM', count: 4,  hasEventOverlap: true  },
  { date: '2026-01-10', slot: 'Sat 9 AM', count: 6,  hasEventOverlap: false },
  { date: '2026-01-11', slot: 'Sun 8 AM', count: 5,  hasEventOverlap: true  },
  { date: '2026-01-17', slot: 'Sat 7 AM', count: 8,  hasEventOverlap: false },
  { date: '2026-01-17', slot: 'Sat 8 AM', count: 7,  hasEventOverlap: false },
  { date: '2026-01-18', slot: 'Sun 9 AM', count: 4,  hasEventOverlap: true  },
  { date: '2026-01-19', slot: 'Mon 8 AM', count: 3,  hasEventOverlap: true  }, // MLK
  { date: '2026-01-24', slot: 'Sat 8 AM', count: 5,  hasEventOverlap: false },
  { date: '2026-01-25', slot: 'Sun 8 AM', count: 6,  hasEventOverlap: true  },
  { date: '2026-01-31', slot: 'Sat 7 AM', count: 9,  hasEventOverlap: true  },
  { date: '2026-01-31', slot: 'Sat 8 AM', count: 8,  hasEventOverlap: true  },
];
