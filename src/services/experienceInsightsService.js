// experienceInsightsService.js — correlation calculations from existing data
import { memberArchetypes } from '@/data/members';
import { feedbackRecords } from '@/data/staffing';

// Touchpoint correlations with retention — derived from cross-domain analysis
export const touchpointCorrelations = [
  { touchpoint: 'Round Frequency', retentionImpact: 0.89, category: 'golf', description: 'Strongest predictor. Members playing 3+ rounds/month have 94% renewal rate vs. 61% for <1 round/month.' },
  { touchpoint: 'Post-Round Dining', retentionImpact: 0.78, category: 'dining', description: 'Members who dine after rounds have 2.3x higher renewal rates. The round-to-dining connection is the strongest cross-domain signal.' },
  { touchpoint: 'Event Attendance', retentionImpact: 0.72, category: 'events', description: '2nd strongest predictor of retention after round frequency. Members attending 2+ events/quarter renew at 91%.' },
  { touchpoint: 'Email Engagement', retentionImpact: 0.64, category: 'email', description: 'Newsletter open rate above 40% correlates with 85% renewal. Drop below 15% is an early warning signal.' },
  { touchpoint: 'Pro Shop Visits', retentionImpact: 0.58, category: 'proshop', description: 'Equipment purchases signal commitment. Members with $500+/yr pro shop spend renew at 88%.' },
  { touchpoint: 'Staff Interactions', retentionImpact: 0.55, category: 'service', description: 'Members who are greeted by name by staff have 22% higher satisfaction scores.' },
  { touchpoint: 'Course Condition Rating', retentionImpact: 0.51, category: 'course', description: 'Course quality is table stakes. Members rating conditions below 3/5 are 3x more likely to resign.' },
  { touchpoint: 'Complaint Resolution', retentionImpact: 0.82, category: 'service', description: 'Each complaint resolved within 24hrs improves renewal probability by 18%. Unresolved complaints are the #1 resignation accelerator.' },
];

// At-risk member touchpoint correlations — reordered for recovery context
export const touchpointCorrelationsAtRisk = [
  { touchpoint: 'Complaint Resolution', retentionImpact: 0.91, category: 'service', description: 'The #1 recovery lever. At-risk members whose complaints are resolved same-day recover at 74% vs. 31% for delayed resolution.' },
  { touchpoint: 'Round Frequency', retentionImpact: 0.85, category: 'golf', description: 'Re-engaging at-risk members with even 1 round/month improves recovery probability by 40%.' },
  { touchpoint: 'Staff Interactions', retentionImpact: 0.79, category: 'service', description: 'Personal GM outreach is 3.4x more effective than email for at-risk members. Name recognition matters most when members feel invisible.' },
  { touchpoint: 'Event Attendance', retentionImpact: 0.74, category: 'events', description: 'A single event attendance can reset a declining member. Social reconnection breaks the isolation-resignation cycle.' },
  { touchpoint: 'Post-Round Dining', retentionImpact: 0.68, category: 'dining', description: 'At-risk members who dine post-round are signaling they still value the club experience. Protect this behavior.' },
  { touchpoint: 'Email Engagement', retentionImpact: 0.52, category: 'email', description: 'Email re-engagement is a weak recovery signal for at-risk members — by the time they stop opening emails, the decline is advanced.' },
  { touchpoint: 'Pro Shop Visits', retentionImpact: 0.41, category: 'proshop', description: 'Pro shop spend drops last in the decay sequence. Low predictive value for at-risk recovery.' },
  { touchpoint: 'Course Condition Rating', retentionImpact: 0.38, category: 'course', description: 'Course conditions are a hygiene factor, not a recovery lever. Fixing conditions alone won\'t save an at-risk member.' },
];

// Experience-to-outcome correlation cards
export const correlationInsights = [
  {
    id: 'dining-after-rounds',
    headline: 'Members who dine after rounds have 2.3x higher renewal rates',
    detail: 'Of 182 members who regularly dine post-round, 168 renewed (92%). Of 118 who never dine after golf, only 72 renewed (61%). The round-to-dining connection is the strongest cross-domain retention signal.',
    domains: ['Golf', 'Dining'],
    impact: 'high',
    metric: { value: '2.3x', label: 'renewal rate multiplier' },
  },
  {
    id: 'complaint-resolution',
    headline: 'Complaints resolved within 24hrs improve renewal probability by 18%',
    detail: 'Across all 47 complaints this quarter, members whose issues were resolved same-day renewed at 89% vs. 71% for delayed resolution. James Whitfield is the proof case: unresolved complaint led to resignation within 4 days.',
    domains: ['Service', 'Retention'],
    impact: 'high',
    metric: { value: '+18%', label: 'renewal improvement' },
  },
  {
    id: 'event-retention',
    headline: 'Event attendance is the 2nd strongest predictor of retention after round frequency',
    detail: 'Members attending 2+ events per quarter renew at 91% vs. 67% for non-attendees. Social Butterflies who attend events but rarely golf still renew at 84% — events create emotional attachment independent of golf.',
    domains: ['Events', 'Retention'],
    impact: 'high',
    metric: { value: '91%', label: 'renewal rate (2+ events/qtr)' },
  },
  {
    id: 'email-decay-warning',
    headline: 'Email open rate below 15% precedes resignation by 6-8 weeks',
    detail: 'In 9 of 11 resignations this year, email engagement dropped below 15% at least 6 weeks before the member left. This makes email decay the earliest detectable disengagement signal across all touchpoints.',
    domains: ['Email', 'Retention'],
    impact: 'medium',
    metric: { value: '6-8 wks', label: 'early warning window' },
  },
  {
    id: 'staffing-experience',
    headline: 'Understaffed days generate 2.1x more complaints and cost $1,133/day in lost revenue',
    detail: 'On 3 understaffed Fridays in January, complaint rates doubled and F&B revenue ran 8% below normal. The compounding effect: staffing gaps create service failures, which create complaints, which accelerate disengagement.',
    domains: ['Staffing', 'F&B', 'Service'],
    impact: 'high',
    metric: { value: '2.1x', label: 'complaint rate on understaffed days' },
  },
  {
    id: 'multi-domain-decay',
    headline: 'Members declining in 3+ domains resign within 60 days without intervention',
    detail: 'When golf, dining, AND email all decline simultaneously, the member is in a resignation spiral. Swoop detected this pattern in Kevin Hurst (Oct: golf dropped, Nov: dining stopped, Dec: email went dark, Jan: resigned).',
    domains: ['Golf', 'Dining', 'Email'],
    impact: 'high',
    metric: { value: '60 days', label: 'avg time to resignation' },
  },
];

// Event ROI data
export const eventROI = [
  { type: 'Member-Guest Tournament', attendance: 48, retentionRate: 96, avgSpend: 285, roi: 4.2, frequency: 'Quarterly' },
  { type: 'Wine Dinner', attendance: 32, retentionRate: 94, avgSpend: 125, roi: 3.8, frequency: 'Monthly' },
  { type: 'Family Pool Day', attendance: 28, retentionRate: 92, avgSpend: 85, roi: 3.1, frequency: 'Weekly (summer)' },
  { type: 'Golf Clinic', attendance: 22, retentionRate: 90, avgSpend: 65, roi: 2.7, frequency: 'Bi-weekly' },
  { type: "Chef's Table", attendance: 12, retentionRate: 98, avgSpend: 195, roi: 5.1, frequency: 'Monthly' },
  { type: 'Holiday Gala', attendance: 120, retentionRate: 93, avgSpend: 175, roi: 3.5, frequency: 'Annual' },
];

// Complaint-to-loyalty statistics
export const complaintLoyaltyStats = {
  totalComplaints: 47,
  resolvedWithin24h: 31,
  renewalRateResolved: 89,
  renewalRateUnresolved: 71,
  avgResolutionTime: '18 hours',
  topCategories: [
    { category: 'Service Speed', count: 18, resolvedPct: 72, retentionImpact: -12 },
    { category: 'Course Condition', count: 11, resolvedPct: 91, retentionImpact: -4 },
    { category: 'Food Quality', count: 8, resolvedPct: 88, retentionImpact: -6 },
    { category: 'Pace of Play', count: 6, resolvedPct: 67, retentionImpact: -8 },
    { category: 'Billing', count: 4, resolvedPct: 100, retentionImpact: -2 },
  ],
};

// Archetype spend patterns for spend potential analysis
export const getArchetypeSpendPatterns = () => {
  return memberArchetypes.map(a => ({
    archetype: a.archetype,
    count: a.count,
    engagement: { golf: a.golf, dining: a.dining, events: a.events, email: a.email },
    trend: a.trend,
    avgAnnualSpend: Math.round((a.golf * 120 + a.dining * 80 + a.events * 45) / 100),
    spendPotential: Math.round(((100 - a.dining) * 80 + (100 - a.events) * 45) / 100),
  }));
};

export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Scheduling', 'Email', 'Complaints'];

// Archetype spend gap analysis — dollar value of untapped potential
export const archetypeSpendGaps = [
  {
    archetype: 'Balanced Active',
    count: 64,
    currentDining: 62,
    potentialDining: 100,
    currentEvents: 54,
    potentialEvents: 100,
    avgAnnualSpend: 4800,
    untappedDining: 3264,
    untappedEvents: 2944,
    totalUntapped: 6208,
    campaign: 'Invite to themed dinner series + wine pairing events. These members are already engaged in golf — dining is the natural cross-sell.',
  },
  {
    archetype: 'Social Butterfly',
    count: 38,
    currentDining: 78,
    potentialDining: 100,
    currentEvents: 85,
    potentialEvents: 100,
    avgAnnualSpend: 5200,
    untappedDining: 1672,
    untappedEvents: 1140,
    totalUntapped: 2812,
    campaign: 'Already strong in events and dining. Offer golf clinic invites + member-guest tournament slots to deepen cross-domain engagement.',
  },
  {
    archetype: 'Die-Hard Golfer',
    count: 52,
    currentDining: 34,
    potentialDining: 100,
    currentEvents: 22,
    potentialEvents: 100,
    avgAnnualSpend: 3600,
    untappedDining: 6864,
    untappedEvents: 8112,
    totalUntapped: 14976,
    campaign: 'Biggest opportunity. Post-round dining incentive: "Your round includes a $15 Grill Room credit today." Event hook: 19th hole tournaments with dining built in.',
  },
  {
    archetype: 'Weekend Warrior',
    count: 45,
    currentDining: 41,
    potentialDining: 100,
    currentEvents: 28,
    potentialEvents: 100,
    avgAnnualSpend: 3200,
    untappedDining: 5310,
    untappedEvents: 6480,
    totalUntapped: 11790,
    campaign: 'Time-constrained members. Weekend brunch after golf, family-friendly events on Saturday afternoons. Make the club a weekend destination, not just a tee time.',
  },
  {
    archetype: 'Declining',
    count: 26,
    currentDining: 18,
    potentialDining: 100,
    currentEvents: 12,
    potentialEvents: 100,
    avgAnnualSpend: 1800,
    untappedDining: 4284,
    untappedEvents: 4576,
    totalUntapped: 8860,
    campaign: 'Re-engagement priority. Personal GM outreach + exclusive "welcome back" event invitation. Focus on reversing decline before revenue capture.',
  },
  {
    archetype: 'New Member',
    count: 18,
    currentDining: 45,
    potentialDining: 100,
    currentEvents: 35,
    potentialEvents: 100,
    avgAnnualSpend: 2400,
    untappedDining: 1980,
    untappedEvents: 2340,
    totalUntapped: 4320,
    campaign: '90-day onboarding program: intro golf clinic, new member mixer, dining tour. Set cross-domain habits early.',
  },
];
