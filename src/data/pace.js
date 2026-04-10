// Pace of play data — Pinetree CC, January 2026
// Round duration distributions and bottleneck hole data

export const paceDistribution = [
  { bucket: '< 3:45', minutes: 225, count: 142, isSlow: false },
  { bucket: '3:45–4:00', minutes: 240, count: 318, isSlow: false },
  { bucket: '4:00–4:15', minutes: 255, count: 496, isSlow: false },
  { bucket: '4:15–4:30', minutes: 270, count: 612, isSlow: false },
  { bucket: '4:30–4:45', minutes: 285, count: 388, isSlow: true },
  { bucket: '4:45–5:00', minutes: 300, count: 198, isSlow: true },
  { bucket: '5:00+',     minutes: 315, count: 82,  isSlow: true },
];

export const slowRoundStats = {
  totalRounds: 2236,
  slowRounds: 668,
  overallRate: 0.28,
  weekendRate: 0.38,
  weekdayRate: 0.19,
  threshold: 270,
};

export const bottleneckHoles = [
  { hole: 4,  course: 'Championship', avgDelay: 8.2, roundsAffected: 312 },
  { hole: 8,  course: 'Championship', avgDelay: 7.6, roundsAffected: 287 },
  { hole: 12, course: 'Championship', avgDelay: 9.1, roundsAffected: 341 },
  { hole: 16, course: 'Championship', avgDelay: 6.8, roundsAffected: 261 },
];

export const paceFBImpact = {
  fastConversionRate: 0.41,
  slowConversionRate: 0.22,
  avgCheckFast: 34.20,
  avgCheckSlow: 28.50,
  slowRoundsPerMonth: 668,
  // Bottom-up: fast conversion 0.41 × $34.20 = $14.02, slow 0.22 × $28.50 = $6.27,
  // delta = $7.75/round × 668 slow rounds = $5,177/mo
  revenueLostPerMonth: 5177,
};
