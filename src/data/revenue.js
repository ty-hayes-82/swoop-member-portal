// Raw revenue data — Oakmont Hills CC, January 2026
// Day-by-day golf + F&B revenue with weather and staffing flags

export const dailyRevenue = [
  { date: '2026-01-01', day: 'Thu', golf: 8200, fb: 3100, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-02', day: 'Fri', golf: 9400, fb: 3400, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-03', day: 'Sat', golf: 14200, fb: 5200, weather: 'sunny',   isUnderstaffed: false },
  { date: '2026-01-04', day: 'Sun', golf: 13800, fb: 4900, weather: 'sunny',   isUnderstaffed: false },
  { date: '2026-01-05', day: 'Mon', golf: 6100, fb: 2200, weather: 'cloudy',   isUnderstaffed: false },
  { date: '2026-01-06', day: 'Tue', golf: 0,    fb: 1100, weather: 'cloudy',   isUnderstaffed: false }, // maintenance
  { date: '2026-01-07', day: 'Wed', golf: 5800, fb: 2100, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-08', day: 'Thu', golf: 7200, fb: 2600, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-09', day: 'Fri', golf: 8400, fb: 2900, weather: 'sunny',    isUnderstaffed: true  },
  { date: '2026-01-10', day: 'Sat', golf: 13100, fb: 4600, weather: 'windy',   isUnderstaffed: false },
  { date: '2026-01-11', day: 'Sun', golf: 13400, fb: 4800, weather: 'sunny',   isUnderstaffed: false },
  { date: '2026-01-12', day: 'Mon', golf: 5900, fb: 2100, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-13', day: 'Tue', golf: 5400, fb: 1900, weather: 'cloudy',   isUnderstaffed: false },
  { date: '2026-01-14', day: 'Wed', golf: 6100, fb: 2300, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-15', day: 'Thu', golf: 7800, fb: 2800, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-16', day: 'Fri', golf: 7600, fb: 2600, weather: 'sunny',    isUnderstaffed: true  },
  { date: '2026-01-17', day: 'Sat', golf: 14600, fb: 5400, weather: 'perfect', isUnderstaffed: false },
  { date: '2026-01-18', day: 'Sun', golf: 14100, fb: 5100, weather: 'sunny',   isUnderstaffed: false },
  { date: '2026-01-19', day: 'Mon', golf: 11200, fb: 4200, weather: 'sunny',   isUnderstaffed: false }, // MLK Day
  { date: '2026-01-20', day: 'Tue', golf: 5100, fb: 1800, weather: 'windy',    isUnderstaffed: false },
  { date: '2026-01-21', day: 'Wed', golf: 6400, fb: 2400, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-22', day: 'Thu', golf: 7100, fb: 2600, weather: 'cloudy',   isUnderstaffed: false },
  { date: '2026-01-23', day: 'Fri', golf: 8800, fb: 3200, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-24', day: 'Sat', golf: 13600, fb: 4800, weather: 'sunny',   isUnderstaffed: false },
  { date: '2026-01-25', day: 'Sun', golf: 13200, fb: 4700, weather: 'sunny',   isUnderstaffed: false },
  { date: '2026-01-26', day: 'Mon', golf: 5600, fb: 2000, weather: 'rainy',    isUnderstaffed: false },
  { date: '2026-01-27', day: 'Tue', golf: 3200, fb: 3600, weather: 'rainy',    isUnderstaffed: false },
  { date: '2026-01-28', day: 'Wed', golf: 5800, fb: 2100, weather: 'cloudy',   isUnderstaffed: true  },
  { date: '2026-01-29', day: 'Thu', golf: 7900, fb: 2900, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-30', day: 'Fri', golf: 9100, fb: 3300, weather: 'sunny',    isUnderstaffed: false },
  { date: '2026-01-31', day: 'Sat', golf: 14800, fb: 5600, weather: 'perfect', isUnderstaffed: false },
];

// Revenue per slot — comparison of reactive vs. retention-priority waitlist fills
// Used by IntelligenceTab to show dollar value of smart prioritization
export const revenuePerSlot = {
  reactive:          187,   // avg total club spend when slot filled first-come-first-served
  retentionPriority: 312,   // avg total club spend when slot filled via retention-flagged member
  emptySlot:           0,
  upliftPct:          67,   // percentage difference
  upliftDollars:     125,   // 312 - 187 per slot
};
