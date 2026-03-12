// data/combinations.js — 14 integration pair definitions
// Keys are always sorted alphabetically: idA+idB where idA < idB
const raw = [
  {
    key: 'pos+teesheet',
    title: 'Revenue Per Round Intelligence',
    insights: [
      'See exactly how much each member spends per visit — golf + dining + pro shop combined',
      'Identify which tee times drive the most F&B revenue downstream',
      'Detect members who play frequently but never eat — hidden churn signals',
    ],
    automations: [
      "Alert GM when a high-value member's spend-per-round drops below their 90-day average",
      'Auto-suggest F&B promotions for tee times that historically underperform on dining',
      'Flag "ghost members" — those who book but generate zero ancillary revenue',
    ],
    example: 'Members teeing off before 8 AM spend 2.3x more in the Grill Room than afternoon players — but we\'re short-staffed at lunch on early-bird days.',
  },
  {
    key: 'crm+pos',
    title: 'Member Lifetime Value Engine',
    insights: [
      'Calculate true member LTV including all spend channels — not just dues',
      'Segment members by spending behavior across dining, events, and pro shop',
      'Identify which membership classes generate the highest total revenue per member',
    ],
    automations: [
      "Trigger retention outreach when a top-spender's monthly total drops 40%+",
      'Auto-generate personalized dining recommendations based on purchase history',
      "Alert membership director when a prospect's guest spending suggests readiness to join",
    ],
    example: 'Social members generate 68% more F&B revenue than full golf members — but our marketing budget is 90% golf-focused.',
  },
  {
    key: 'pos+weather',
    title: 'Weather-Adjusted Revenue Forecasting',
    insights: [
      'Predict F&B covers and revenue based on weather forecast accuracy',
      'Understand which weather conditions drive members to the clubhouse vs. staying home',
      'Optimize prep levels — know when rainy days actually increase dining revenue',
    ],
    automations: [
      "Auto-adjust kitchen prep based on tomorrow's forecast and historical weather-spend correlation",
      'Send "perfect weather" dining promotions when conditions favor clubhouse visits',
      'Alert F&B manager when a storm forecast means 30%+ uptick in lunch covers',
    ],
    example: 'Wind days above 15 mph reduce golf rounds by 22% but increase Grill Room lunch revenue by 31%. Staff accordingly.',
  },
  {
    key: 'pos+staffing',
    title: 'Service Quality & Labor ROI',
    insights: [
      'Correlate service speed and ticket times with staffing levels in real-time',
      'Identify which staff members drive the highest per-table revenue',
      'Detect when understaffing directly causes revenue loss — not just complaints',
    ],
    automations: [
      'Alert F&B director when ticket times exceed 25 min during peak — with staffing context',
      'Auto-calculate revenue-per-labor-hour for every shift and outlet',
      'Recommend shift adjustments when projected covers exceed comfortable staffing ratios',
    ],
    example: 'When Grill Room is below 3 servers during Saturday lunch, average ticket time rises 18 min and per-table spend drops 23%.',
  },
  {
    key: 'dining+pos',
    title: 'F&B Revenue Optimization',
    insights: [
      'Track real-time covers vs. reservations — measure walk-in and no-show patterns',
      'Analyze menu performance by time of day, day of week, and member segment',
      'Identify the gap between reservation intent and actual spend per cover',
    ],
    automations: [
      "Alert chef when today's reservation volume exceeds ingredient prep levels",
      'Auto-suggest menu pricing adjustments based on item profitability and popularity',
      'Trigger "open table" notifications to frequent diners when last-minute cancellations occur',
    ],
    example: 'Thursday prix fixe drives 2x the per-cover spend of regular service — but only 40% of members know about it.',
  },
  {
    key: 'accounting+pos',
    title: 'Financial Intelligence Dashboard',
    insights: [
      'Reconcile POS transactions against GL entries automatically — catch discrepancies in real-time',
      'Break down departmental profitability with granular, transaction-level detail',
      'Forecast monthly revenue with unprecedented accuracy by combining real-time sales with budget',
    ],
    automations: [
      'Alert controller when daily revenue deviates more than 15% from budget pace',
      'Auto-generate month-end revenue reconciliation reports',
      'Flag unusual transaction patterns that may indicate waste, comps, or discounting issues',
    ],
    example: 'Grill Room is running 8% under budget this month — but it\'s entirely driven by 3 rainy weekends. Per-cover spend is actually up 12%.',
  },
  {
    key: 'crm+teesheet',
    title: 'Engagement & Retention Radar',
    insights: [
      'Map every member\'s engagement trajectory — are they ramping up or fading out?',
      'Identify at-risk members before they resign based on booking frequency decline',
      'Understand which member personas (Weekend Warrior, Social Diner, etc.) are most loyal',
    ],
    automations: [
      'Auto-tag members as "at-risk" when round frequency drops below their personal baseline',
      'Trigger a personal call from the pro when a daily golfer misses two consecutive weeks',
      'Generate monthly "Member Health" scorecards for the GM with trending retention metrics',
    ],
    example: 'Members who play fewer than 2 rounds in any 30-day window are 4x more likely to resign within 6–8 weeks.',
  },
  {
    key: 'teesheet+weather',
    title: 'Operational Weather Intelligence',
    insights: [
      'Know exactly how weather forecasts impact booking rates — by hour, day, and season',
      'Predict no-show probability based on deteriorating weather between booking and tee time',
      'Optimize maintenance scheduling around weather windows',
    ],
    automations: [
      'Auto-text waitlisted members when weather-driven cancellations open prime tee times',
      'Pre-position cart staging and starter staffing based on weather-adjusted booking predictions',
      'Alert superintendent when freeze/thaw conditions require course protection protocols',
    ],
    example: 'When rain probability exceeds 60%, our no-show rate jumps to 34%. That\'s 12 empty slots per day we could fill from the waitlist.',
  },
  {
    key: 'staffing+teesheet',
    title: 'Smart Labor Optimization',
    insights: [
      'See real-time staffing gaps — are we over- or under-staffed for today\'s bookings?',
      'Correlate service complaints with understaffed shifts across the entire operation',
      'Benchmark labor cost per round, per cover, and per member interaction',
    ],
    automations: [
      "Auto-generate shift recommendations based on tomorrow's tee sheet density",
      'Alert ops manager when a staffing gap overlaps with peak booking hours',
      'Flag shifts where labor cost exceeds revenue threshold before they happen',
    ],
    example: 'January 16th was 22% understaffed for the booking volume. Service times spiked 40 minutes. One complaint became one resignation — $18K/year lost.',
  },
  {
    key: 'crm+weather',
    title: 'Personalized Member Outreach',
    insights: [
      'Know which members are weather-sensitive and which play through anything',
      'Identify optimal communication windows based on weather + member activity patterns',
      'Predict which members will be at the club this weekend based on forecast',
    ],
    automations: [
      'Send personalized "great weather this weekend" messages to fair-weather members',
      'Auto-schedule pro outreach to daily golfers during extended bad weather stretches',
      'Trigger re-engagement campaigns during the first good weather window after a lull',
    ],
    example: '23 of your at-risk members are fair-weather players. Saturday\'s forecast is perfect — it\'s the best day for personal outreach in 3 weeks.',
  },
  {
    key: 'crm+dining',
    title: 'Member Experience Personalization',
    insights: [
      'Build complete member preference profiles — dietary needs, favorite tables, celebration dates',
      'Identify members hitting F&B minimums vs. those enjoying dining as a lifestyle',
      'Track dining frequency as a leading indicator of overall club engagement',
    ],
    automations: [
      'Auto-remind F&B staff of member preferences and allergies before their reservation',
      'Trigger "minimum spend" alerts with gentle dining invitations 6 weeks before quarter-end',
      'Celebrate member milestones — anniversaries, birthdays — with personalized dining offers',
    ],
    example: 'Members who dine 3+ times/month have a 94% retention rate. Those at exactly minimum spend have a 61% rate. The gap is your opportunity.',
  },
  {
    key: 'crm+email',
    title: 'Intelligent Member Communications',
    insights: [
      'Map engagement signals across email opens, clicks, and actual club visits',
      'Identify which communication styles resonate with different member segments',
      'Detect "digitally disengaged" members — those who stop opening emails before they stop visiting',
    ],
    automations: [
      'Auto-personalize email content based on member activity and preferences',
      'Trigger a phone call when a high-value member stops engaging with emails',
      'Shift communication channels when email engagement drops — switch to SMS or direct mail',
    ],
    example: 'Members who stop opening emails are 3.2x more likely to resign within 90 days. You have 14 members in this pattern right now.',
  },
  {
    key: 'staffing+weather',
    title: 'Predictive Workforce Planning',
    insights: [
      'Model optimal staffing based on weather-driven demand fluctuations',
      'Reduce overtime costs by anticipating slow days before they happen',
      'Understand the true cost of weather disruptions to your labor budget',
    ],
    automations: [
      'Auto-suggest shift reductions when weather forecast predicts low-traffic day',
      'Pre-approve overtime requests when forecast predicts surge demand',
      'Generate weekly labor plans adjusted for the 7-day weather outlook',
    ],
    example: 'Last month we overstaffed by 14% on rainy days — $4,200 in unnecessary labor. A weather-adjusted schedule would have saved $3,800.',
  },
  {
    key: 'dining+staffing',
    title: 'Front-of-House Optimization',
    insights: [
      'Match server staffing to reservation density in real-time',
      'Identify the perfect staff-to-cover ratio for maintaining service quality',
      'Predict when banquet events will strain regular dining staff',
    ],
    automations: [
      'Auto-adjust server schedule when reservation volume changes 48 hours out',
      'Alert FOH manager when a private event overlaps with peak dining and creates a staffing gap',
      'Track service scores by staffing level to find the efficiency sweet spot',
    ],
    example: 'When we run 4+ servers on Saturday night, member satisfaction scores jump 28% — but 5+ doesn\'t improve them further. Four is the magic number.',
  },
];

// Build lookup with both orderings
export const combinations = {};
raw.forEach(combo => {
  combinations[combo.key] = combo;
  const [a, b] = combo.key.split('+');
  combinations[`${b}+${a}`] = combo;
});

export const allCombinations = raw;
