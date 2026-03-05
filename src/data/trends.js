// Monthly aggregates — Aug 2025 through Jan 2026
// Used for trend sparklines throughout the platform

export const trends = {
  postRoundConversion:   [0.39, 0.40, 0.41, 0.38, 0.37, 0.35],
  slowRoundRate:         [0.19, 0.20, 0.22, 0.24, 0.26, 0.28],
  memberHealthAvg:       [72,   71,   70,   69,   67,   65  ],
  atRiskMemberCount:     [54,   58,   62,   66,   70,   72  ],
  fbRevenue:             [108000, 110000, 116000, 110000, 118000, 119400],
  golfRevenue:           [298000, 312000, 326000, 318000, 335000, 352400],
  avgDiningCheck:        [36.2, 37.0, 38.4, 37.8, 38.0, 38.6],
  emailOpenRateAvg:      [0.42, 0.41, 0.40, 0.38, 0.37, 0.36],
  complaintsPerMonth:               [18,   20,   22,   24,   28,   34  ],
  newMemberCount:                   [3,    2,    4,    2,    3,    1   ],
  resignationCount:                 [0,    1,    1,    2,    2,    5   ],
  waitlistFillRate:                 [0.88, 0.84, 0.80, 0.76, 0.72, 0.67],
  postRoundConversionFromWaitlist:  [0.38, 0.36, 0.34, 0.30, 0.27, 0.22],
};

export const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

// Per-outlet monthly revenue — Aug through Jan
// Seasonal patterns: Grill Room strong year-round, Pool Bar peaks in summer (off-peak in Jan)
export const outletTrends = {
  'Grill Room':     [38000, 40000, 42000, 41000, 43000, 44200],
  'Main Dining':    [28000, 29000, 31000, 30000, 32000, 33800],
  'Bar/Lounge':     [18000, 19000, 20000, 19500, 20000, 20400],
  'Halfway House':  [12000, 11000, 12000, 11500, 12000, 12200],
  'Pool Bar':       [14000, 13000, 11000,  9000,  8500,  8800],
};
