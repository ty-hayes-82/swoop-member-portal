// Static tee sheet for demo day: Friday January 17, 2026
// Pinetree Country Club — 2 courses (North, South), 8-min intervals

export const todayTeeSheet = [
  // 7:00 AM block — early birds, mostly Die-Hards
  {
    time: '7:00 AM', course: 'North', memberId: 'mbr_042', name: 'Kevin Hurst',
    archetype: 'Declining', healthScore: 18, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Kevin Hurst', 'Guest'],
    cancelRisk: 0.82,
    cartPrep: { beverage: 'Coffee, black', snack: 'Granola bar', note: 'High churn risk — pro shop greet by name. Include comp round voucher in cart.' },
  },
  {
    time: '7:00 AM', course: 'South', memberId: 'mbr_015', name: 'John Harrison',
    archetype: 'Die-Hard Golfer', healthScore: 88, tier: 'Full Golf', duesAnnual: 18000,
    group: ['John Harrison', 'Tom Gallagher', 'Mike Reeves', 'Dan Schultz'],
    cancelRisk: 0.06,
    cartPrep: { beverage: 'Water + Gatorade', snack: 'Trail mix', note: 'Regular 4-some. Cart #7 preferred. Range balls pre-loaded.' },
  },
  {
    time: '7:08 AM', course: 'North', memberId: 'mbr_089', name: 'Anne Jordan',
    archetype: 'Weekend Warrior', healthScore: 28, tier: 'Full Golf', duesAnnual: 12000,
    group: ['Anne Jordan', 'Marcus Jordan'],
    cancelRisk: 0.71,
    cartPrep: { beverage: 'Sparkling water', snack: 'Mixed nuts', note: 'At-risk — starter greet warmly. Husband Marcus playing too. Suggest post-round brunch.' },
  },
  {
    time: '7:16 AM', course: 'South', memberId: 'mbr_022', name: 'Rob Callaway',
    archetype: 'Die-Hard Golfer', healthScore: 92, tier: 'Full Golf', duesAnnual: 22000,
    group: ['Rob Callaway', 'Steve Whitmore', 'Phil Egan'],
    cancelRisk: 0.04,
    cartPrep: { beverage: 'Coffee with cream', snack: null, note: 'VIP — $22K member. Prefers South course. Towels + extra tees.' },
  },
  {
    time: '7:24 AM', course: 'North', memberId: 'mbr_034', name: 'Sarah Collins',
    archetype: 'Balanced Active', healthScore: 85, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Sarah Collins', 'Lisa Yamamoto'],
    cancelRisk: 0.08,
    cartPrep: { beverage: 'Iced tea', snack: 'Fruit cup', note: 'Regular player. Enjoys North course front nine.' },
  },
  {
    time: '7:32 AM', course: 'South', memberId: 'mbr_067', name: 'Ronald Petersen',
    archetype: 'Snowbird', healthScore: 75, tier: 'Full Golf', duesAnnual: 20000,
    group: ['Ronald Petersen', 'George Langford', 'Don Mueller', 'Frank Pace'],
    cancelRisk: 0.10,
    cartPrep: { beverage: 'Coffee, black', snack: 'Banana', note: 'Snowbird group — first season back. Welcome-back card in cart.' },
  },
  // 8:00 AM block — prime time
  {
    time: '8:00 AM', course: 'North', memberId: 'mbr_203', name: 'James Whitfield',
    archetype: 'Balanced Active', healthScore: 42, tier: 'Full Golf', duesAnnual: 18000,
    group: ['James Whitfield', 'Logan Whitfield'],
    cancelRisk: 0.68,
    cartPrep: { beverage: 'Coffee with refill thermos', snack: 'Muffin', note: 'CRITICAL — Unresolved complaint (Jan 16). GM should greet at starter. Include handwritten apology note + comp lunch voucher. Playing with son Logan.' },
  },
  {
    time: '8:08 AM', course: 'South', memberId: 'mbr_051', name: 'Victoria Sinclair',
    archetype: 'Social Butterfly', healthScore: 82, tier: 'Social', duesAnnual: 9000,
    group: ['Victoria Sinclair', 'Claire Donovan', 'Patricia Monroe', 'Rita Vasquez'],
    cancelRisk: 0.05,
    cartPrep: { beverage: 'Mimosas (pre-ordered)', snack: 'Cheese & crackers', note: 'Social group — event ambassadors. Mention upcoming Wine & Jazz Night.' },
  },
  {
    time: '8:16 AM', course: 'North', memberId: 'mbr_078', name: 'Scott Patterson',
    archetype: 'Weekend Warrior', healthScore: 68, tier: 'Sports', duesAnnual: 16000,
    group: ['Scott Patterson', 'Nathan Burke'],
    cancelRisk: 0.15,
    cartPrep: { beverage: 'Water', snack: 'Protein bar', note: 'Watch list — engagement dipping. Suggest Saturday morning league.' },
  },
  {
    time: '8:24 AM', course: 'South', memberId: 'mbr_112', name: 'Jason Rivera',
    archetype: 'New Member', healthScore: 70, tier: 'Junior Executive', duesAnnual: 14000,
    group: ['Jason Rivera', 'David Chen (guest)'],
    cancelRisk: 0.12,
    cartPrep: { beverage: 'Water + energy drink', snack: null, note: 'New member (3 months). Playing with prospective member David Chen. Welcome packet in cart.' },
  },
  // 9:00 AM block
  {
    time: '9:00 AM', course: 'North', memberId: 'mbr_271', name: 'Robert Callahan',
    archetype: 'Declining', healthScore: 27, tier: 'Corporate', duesAnnual: 18000,
    group: ['Robert Callahan'],
    cancelRisk: 0.59,
    cartPrep: { beverage: 'Sparkling water', snack: null, note: 'AT-RISK — Playing solo. 9-day-old complaint unresolved. F&B Director should check in at turn. Comp beverage cart on back nine.' },
  },
  {
    time: '9:08 AM', course: 'South', memberId: 'mbr_188', name: 'Patricia Monroe',
    archetype: 'Balanced Active', healthScore: 65, tier: 'Full Golf', duesAnnual: 15000,
    group: ['Patricia Monroe', 'Evelyn Park', 'Jennifer Walsh'],
    cancelRisk: 0.12,
    cartPrep: { beverage: 'Water', snack: 'Apple slices', note: 'Regular group. Evelyn is Watch list — be attentive.' },
  },
  {
    time: '9:16 AM', course: 'North', memberId: 'mbr_146', name: 'Sandra Chen',
    archetype: 'Social Butterfly', healthScore: 36, tier: 'House', duesAnnual: 9000,
    group: ['Sandra Chen', 'Avery Chen'],
    cancelRisk: 0.38,
    cartPrep: { beverage: 'Iced coffee', snack: 'Fruit & cheese', note: 'At-risk — dining spend down 58%. Playing with daughter Avery. Suggest family event invite.' },
  },
  // 10:00 AM block
  {
    time: '10:00 AM', course: 'South', memberId: 'mbr_156', name: 'Priya Brock',
    archetype: 'Balanced Active', healthScore: 52, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Priya Brock', 'Greg Holloway'],
    cancelRisk: 0.20,
    cartPrep: { beverage: 'Water', snack: 'Trail mix', note: 'Both on Watch list — email engagement declining. Standard cart setup.' },
  },
  {
    time: '10:08 AM', course: 'North', memberId: 'mbr_198', name: 'Marcus Flynn',
    archetype: 'New Member', healthScore: 55, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Marcus Flynn', 'Paul Serrano'],
    cancelRisk: 0.18,
    cartPrep: { beverage: 'Water + Gatorade', snack: null, note: 'New member pairing. Both Watch list. Starter introduce them properly.' },
  },
  {
    time: '10:30 AM', course: 'South', memberId: 'mbr_312', name: 'Robert Mills',
    archetype: 'Balanced Active', healthScore: 33, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Robert Mills'],
    cancelRisk: 0.45,
    cartPrep: { beverage: 'Coffee', snack: null, note: 'AT-RISK — Practicing but skipping clubhouse. Solo round. Suggest post-round lunch on the house.' },
  },
  // 11:00 AM+ block — lighter
  {
    time: '11:00 AM', course: 'North', memberId: 'mbr_044', name: 'Bill Crawford',
    archetype: 'Die-Hard Golfer', healthScore: 84, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Bill Crawford', 'Ed Santos', 'Ray Cooper', 'Al Peterson'],
    cancelRisk: 0.03,
    cartPrep: { beverage: 'Water', snack: 'Mixed nuts', note: 'Regulars. Cart #12 preferred. Extra towels.' },
  },
  {
    time: '11:30 AM', course: 'South', memberId: 'mbr_099', name: 'Robert Chen',
    archetype: 'Balanced Active', healthScore: 71, tier: 'Full Golf', duesAnnual: 15000,
    group: ['Robert Chen', 'Guest', 'Guest'],
    cancelRisk: 0.09,
    cartPrep: { beverage: 'Water', snack: null, note: 'Bringing 2 guests — potential prospects. Extra scorecards + guest info cards.' },
  },
  {
    time: '12:00 PM', course: 'North', memberId: 'mbr_210', name: 'Mark Patterson',
    archetype: 'Weekend Warrior', healthScore: 54, tier: 'Sports', duesAnnual: 16000,
    group: ['Mark Patterson', 'Guest'],
    cancelRisk: 0.22,
    cartPrep: { beverage: 'Water', snack: 'Protein bar', note: 'Watch list. Standard cart.' },
  },
  {
    time: '1:00 PM', course: 'South', memberId: 'mbr_130', name: 'Tom Bradford',
    archetype: 'Balanced Active', healthScore: 78, tier: 'Full Golf', duesAnnual: 18000,
    group: ['Tom Bradford', 'Client', 'Client', 'Client'],
    cancelRisk: 0.07,
    cartPrep: { beverage: 'Premium water + soft drinks', snack: 'Charcuterie box (pre-ordered)', note: 'Client entertainment round. VIP cart setup — premium amenities, extra towels, branded gifts.' },
  },
];

// Summary stats for the header
export const teeSheetSummary = {
  date: '2026-01-17',
  totalRounds: 220,
  totalGroups: todayTeeSheet.length,
  atRiskOnCourse: todayTeeSheet.filter(t => t.healthScore < 50).length,
  vipCount: todayTeeSheet.filter(t => t.duesAnnual >= 18000).length,
  // 2026-04-09 v2 audit risk-flag fix: was sunny/73/5 which contradicted
  // the Today view's "wind advisory, 68°F, 32 mph" narrative (briefingService
  // and cockpit). During a live demo the GM clicks Today → Tee Sheet and
  // sees contradictory weather across adjacent screens — a 3-second
  // believability break. Synced with the wind-advisory storyboard beat.
  weatherCondition: 'wind advisory',
  weatherTemp: 68,
  weatherWind: 32,
};
