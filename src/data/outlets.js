// F&B outlet performance data — Pinetree CC, January 2026

export const outlets = [
  {
    outlet: 'Main Dining Room',
    revenue: 28400,
    covers: 842,
    avgCheck: 33.73,
    understaffedImpact: -1820,
    periods: [
      { period: 'Breakfast', revenue: 6200, covers: 248 },
      { period: 'Dinner', revenue: 22200, covers: 594 },
    ],
  },
  {
    // understaffedImpact is a card metric only — NOT aggregated into STAFFING_LOSS (fbService.js exposes outlets unmodified).
    outlet: 'Grill Room',
    revenue: 34600,
    covers: 1124,
    avgCheck: 30.78,
    understaffedImpact: -4120,
    periods: [
      { period: 'Lunch', revenue: 34600, covers: 1124 },
    ],
  },
  {
    outlet: 'Bar / Lounge',
    revenue: 18200,
    covers: 682,
    avgCheck: 26.69,
    understaffedImpact: -640,
    periods: [
      { period: 'All Day', revenue: 18200, covers: 682 },
    ],
  },
  {
    outlet: 'Halfway House',
    revenue: 12400,
    covers: 892,
    avgCheck: 13.90,
    understaffedImpact: 0,
    periods: [
      { period: 'All Day', revenue: 12400, covers: 892 },
    ],
  },
  {
    outlet: 'Pool Bar',
    revenue: 4800,
    covers: 294,
    avgCheck: 16.33,
    understaffedImpact: 0,
    periods: [
      { period: 'All Day', revenue: 4800, covers: 294 },
    ],
  },
];

export const postRoundConversion = [
  { archetype: 'Die-Hard Golfer',  rate: 0.50, avgCheck: 38.20 },
  { archetype: 'Balanced Active',  rate: 0.42, avgCheck: 34.80 },
  { archetype: 'Social Butterfly', rate: 0.40, avgCheck: 36.10 },
  { archetype: 'New Member',       rate: 0.35, avgCheck: 31.40 },
  { archetype: 'Weekend Warrior',  rate: 0.25, avgCheck: 29.60 },
  { archetype: 'Snowbird',         rate: 0.22, avgCheck: 27.80 },
  { archetype: 'Declining',        rate: 0.18, avgCheck: 24.20 },
  { archetype: 'Ghost',            rate: 0.10, avgCheck: 19.50 },
];

export const rainDayImpact = [
  { date: '2026-01-26', weather: 'rainy', golfRevenue: 5600,  fbRevenue: 4800 },
  { date: '2026-01-27', weather: 'rainy', golfRevenue: 3200,  fbRevenue: 5800 },
];

export const fbMonthComparison = {
  currentMonth: 'January 2026',
  previousMonth: 'December 2025',
  currentRevenue: 98400,
  previousRevenue: 108600,
  context: 'December included six holiday banquets and a 3-day closure, so January typically runs about 10% softer.',
};
