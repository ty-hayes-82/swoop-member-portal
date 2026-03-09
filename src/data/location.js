const manualMembers = [
  {
    memberId: 'mbr_203',
    name: 'James Whitfield',
    zoneId: 'course',
    zoneGroup: 'course',
    x: 760,
    y: 230,
    healthScore: 42,
    status: 'at-risk',
    timeInZone: '35 min on hole 14',
    lastActivity: 'Filed Grill Room complaint Jan 16',
    recommendedAction: 'Meet him at Grill Room when he finishes — comp lunch and personal apology.',
    channel: 'Call · GM',
    needsAttention: true,
  },
  {
    memberId: 'mbr_146',
    name: 'Sandra Chen',
    zoneId: 'grill-room',
    zoneGroup: 'clubhouse',
    x: 660,
    y: 310,
    healthScore: 36,
    status: 'at-risk',
    timeInZone: '18 min at Grill Room booth',
    lastActivity: 'Declined last 3 wine dinners',
    recommendedAction: 'Invite her to tonight’s wine dinner and comp guests.',
    channel: 'Text · Events',
    needsAttention: true,
  },
  {
    memberId: 'mbr_312',
    name: 'Robert Mills',
    zoneId: 'driving-range',
    zoneGroup: 'range',
    x: 210,
    y: 160,
    healthScore: 33,
    status: 'watch',
    timeInZone: '22 min on TrackMan bay',
    lastActivity: 'Raised marshal concern last week',
    recommendedAction: 'Head pro should stop by with marshaling update + coffee.',
    channel: 'In-person · Head Pro',
    needsAttention: false,
  },
  {
    memberId: 'mbr_089',
    name: 'Anne Jordan',
    zoneId: 'course',
    zoneGroup: 'course',
    x: 540,
    y: 260,
    healthScore: 38,
    status: 'watch',
    timeInZone: 'Front nine · 55 min',
    lastActivity: 'Declined last waitlist offer',
    recommendedAction: 'Guarantee post-round lunch table + priority tee time.',
    channel: 'SMS',
    needsAttention: false,
  },
  {
    memberId: 'mbr_271',
    name: 'Robert Callahan',
    zoneId: 'main-dining',
    zoneGroup: 'clubhouse',
    x: 700,
    y: 340,
    healthScore: 41,
    status: 'watch',
    timeInZone: 'Lunch meeting · 20 min',
    lastActivity: 'Only hitting F&B minimum',
    recommendedAction: 'Offer hosted grill experience after next round.',
    channel: 'Email · F&B Director',
    needsAttention: false,
  },
];

const generatedMembers = [];
let memberCounter = 1;

function seedMembers({ zoneId, zoneGroup, count, startX, startY, columns, dx, dy, baseScore = 75, status = 'healthy' }) {
  for (let i = 0; i < count; i += 1) {
    generatedMembers.push({
      memberId: `live_${zoneId}_${memberCounter}`,
      name: `Onsite Member ${memberCounter.toString().padStart(2, '0')}`,
      zoneId,
      zoneGroup,
      x: startX + (i % columns) * dx,
      y: startY + Math.floor(i / columns) * dy,
      healthScore: Math.max(32, baseScore - (i % 5) * 3),
      status,
      timeInZone: `${15 + (i % 20)} min`,
      lastActivity: 'Standard visit',
      recommendedAction: 'Monitor experience; no action needed.',
      channel: 'N/A',
      needsAttention: false,
    });
    memberCounter += 1;
  }
}

const targetCounts = {
  course: 22,
  clubhouse: 12,
  pool: 6,
  proshop: 3,
  range: 4,
};

function currentCount(group) {
  return manualMembers.filter((m) => m.zoneGroup === group).length + generatedMembers.filter((m) => m.zoneGroup === group).length;
}

// Course clusters
seedMembers({ zoneId: 'course', zoneGroup: 'course', count: targetCounts.course - currentCount('course'), startX: 220, startY: 180, columns: 5, dx: 70, dy: 35, baseScore: 78, status: 'healthy' });

// Clubhouse / dining clusters split across rooms
const clubhouseNeeded = targetCounts.clubhouse - currentCount('clubhouse');
seedMembers({ zoneId: 'clubhouse', zoneGroup: 'clubhouse', count: Math.min(5, clubhouseNeeded), startX: 600, startY: 300, columns: 3, dx: 36, dy: 34, baseScore: 70, status: 'healthy' });
seedMembers({ zoneId: 'lounge', zoneGroup: 'clubhouse', count: Math.max(0, clubhouseNeeded - 5), startX: 660, startY: 360, columns: 2, dx: 38, dy: 34, baseScore: 68, status: 'healthy' });

// Pool & fitness
const poolNeeded = targetCounts.pool - currentCount('pool');
seedMembers({ zoneId: 'pool', zoneGroup: 'pool', count: Math.min(poolNeeded, 4), startX: 520, startY: 430, columns: 2, dx: 42, dy: 32, baseScore: 74, status: 'healthy' });
if (poolNeeded > 4) {
  seedMembers({ zoneId: 'fitness', zoneGroup: 'pool', count: poolNeeded - 4, startX: 460, startY: 420, columns: 1, dx: 32, dy: 36, baseScore: 72, status: 'healthy' });
}

// Pro shop
seedMembers({ zoneId: 'pro-shop', zoneGroup: 'proshop', count: targetCounts.proshop - currentCount('proshop'), startX: 360, startY: 260, columns: 1, dx: 26, dy: 34, baseScore: 76, status: 'healthy' });

// Driving range / practice green (remaining slots after manual)
const rangeNeeded = targetCounts.range - currentCount('range');
if (rangeNeeded > 0) {
  seedMembers({ zoneId: 'practice-green', zoneGroup: 'range', count: rangeNeeded, startX: 250, startY: 220, columns: 1, dx: 32, dy: 28, baseScore: 70, status: 'healthy' });
}

const locationMembers = [...manualMembers, ...generatedMembers].slice(0, 47);

const zoneGroups = [
  { id: 'course', label: 'On Course', zones: ['course'], dwell: '1h 42m', peak: '7:00–11:00 AM' },
  { id: 'clubhouse', label: 'Clubhouse & Dining', zones: ['clubhouse', 'grill-room', 'main-dining', 'lounge'], dwell: '58m', peak: '12:00–2:00 PM' },
  { id: 'pool', label: 'Pool & Fitness', zones: ['pool', 'fitness'], dwell: '1h 10m', peak: '3:00–6:00 PM' },
  { id: 'range', label: 'Driving Range & Practice', zones: ['driving-range', 'practice-green'], dwell: '32m', peak: '6:00–9:00 AM' },
  { id: 'proshop', label: 'Pro Shop', zones: ['pro-shop'], dwell: '14m', peak: '8:00–10:00 AM' },
];

const zoneAnalytics = zoneGroups.map((group) => ({
  ...group,
  count: locationMembers.filter((member) => group.zones.includes(member.zoneId)).length,
}));

export const alertsFeed = [
  {
    id: 'alert_james',
    timestamp: '10:12 AM',
    memberId: 'mbr_203',
    title: 'James Whitfield finishing hole 14',
    detail: 'He has not dined in six weeks. Have F&B director greet him with a comp lunch when he reaches the Grill Room.',
    severity: 'urgent',
  },
  {
    id: 'alert_sandra',
    timestamp: '10:05 AM',
    memberId: 'mbr_146',
    title: 'Sandra Chen seated in Grill Room',
    detail: 'Pescatarian wine dinner guest. Send confirmation that booth 6 is held for tonight’s event.',
    severity: 'warning',
  },
  {
    id: 'alert_board',
    timestamp: '9:48 AM',
    memberId: null,
    title: 'Board cluster in Lounge',
    detail: 'Four board members gathered near the fireplace. Offer concierge support before lunch rush.',
    severity: 'info',
  },
];

export { locationMembers, zoneAnalytics };
