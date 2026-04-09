// briefingService.js — Phase 1 static · Phase 2 /api/briefing

import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
import { getMonthlyRevenueSummary, getRevenueByDay, getTodayTeeSheet } from './operationsService';
import { getAtRiskMembers }                          from './memberService';
import { getStaffingSummary, getComplaintCorrelation } from './staffingService';
import { getCancellationSummary, getWaitlistSummary }  from './waitlistService';
import { cancellationProbabilities } from '../data/pipeline';

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/briefing');
    if (data) _d = data;
  } catch { /* keep static fallback */ }
};

// Empty briefing for real clubs with no API data yet
const EMPTY_BRIEFING = {
  keyMetrics: { atRiskMembers: 0, openComplaints: 0 },
  todayRisks: { atRiskTeetimes: [] },
  yesterdayRecap: null,
  comparisons: {},
  topCancellationRiskMembers: [],
};

// DEMO_BRIEFING is the safety fallback if the dynamic build path throws.
// It must satisfy the same contract as the dynamic build so that downstream
// components and tests don't see a half-shape. Every required field is populated.
export const DEMO_BRIEFING = {
  // Apply-now bumps from 2026-04-09 demo-data audit (storyboard-audits/2026-04-09-demo-data.md):
  // - monthlyRevenue $142K → $168K (Today hero punches up; still credible
  //   for a $5M / 350-member club running F&B at typical mid-club margins)
  keyMetrics: { atRiskMembers: 7, openComplaints: 4, monthlyRevenue: 168000, revenueVsPlan: 4.2, understaffedDays: 3 },
  teeSheet: { roundsToday: 220, utilization: 0.87 },
  todayRisks: {
    weather: 'wind-advisory',
    tempHigh: 68,
    wind: 32,
    forecast: 'Wind advisory — gusts to 30-40 mph expected Saturday afternoon',
    // 3rd at-risk entry added 2026-04-09 to fix Story 1 script/data mismatch
    // (storyboard says "3 at-risk members on today's tee sheet"; previously
    // only 2 entries appeared here). Robert Callahan is the canonical 3rd
    // at-risk member from cockpit.js + agents.js ($24K renewal risk).
    atRiskTeetimes: [
      { memberId: 'mbr_203', name: 'James Whitfield', time: '9:20 AM', health: 42 },
      { memberId: 'mbr_089', name: 'Anne Jordan', time: '10:15 AM', health: 38 },
      { memberId: 'mbr_271', name: 'Robert Callahan', time: '10:42 AM', health: 36 },
    ],
    staffingGaps: [],
    fullyStaffed: false,
    demandForecast: {
      expectedRounds: 192,
      golfModifier: 0.87,
      recommendation: 'Saturday: Grill Room needs 4 servers — only 2 scheduled',
      weatherSummary: 'Wind advisory may shift 32 afternoon tee times indoors',
    },
    cancellationRisk: {
      highRiskBookings: 0,
      totalRevAtRisk: 0,
      driverSummary: '',
      suggestedAction: '',
      estimatedRevenueSaved: 0,
      topAtRiskMembers: [],
    },
  },
  yesterdayRecap: {
    date: '2026-01-16',
    revenue: 18420,
    revenueVsPlan: -0.12,
    revenueVsLastWeek: -8.4,
    rounds: 82,
    roundsVsLastWeek: 8,
    incidents: [
      'Grill Room understaffed — 2 service speed complaints',
      'James Whitfield filed a slow-service complaint — left unhappy, no follow-up',
    ],
    weather: 'overcast',
    isUnderstaffed: true,
  },
  pendingActions: [
    { playbookId: 'service-save', title: 'Service Save Protocol', status: 'recommended', urgency: 'high', reason: 'James Whitfield complaint unresolved' },
    { playbookId: 'peak-demand-capture', title: 'Peak Demand Capture', status: 'recommended', urgency: 'high', reason: 'Wind advisory + at-risk bookings' },
  ],
  comparisons: {},
  topCancellationRiskMembers: [],
};

export const getDailyBriefing = (date = '2026-01-17') => {
  if (_d) return _d;
  if (!shouldUseStatic('tee-sheet')) return EMPTY_BRIEFING;

  // Demo mode: try to build from service data, fall back to static
  try {
  const revData    = getRevenueByDay();
  // dailyRevenue rows expose `golf` and `fb` fields. Compute the daily total
  // here so the briefing's yesterdayRecap.revenue is a single dollar number.
  const totalFor = (row) => (row ? (Number(row.golf) || 0) + (Number(row.fb) || 0) : 0);
  const yesterday  = revData.find(d => d.date === '2026-01-16') ?? revData[15];
  const atRisk     = getAtRiskMembers();
  const staffing   = getStaffingSummary();
  const complaints = getComplaintCorrelation().filter(c => c.status !== 'resolved');
  const cancelSummary  = getCancellationSummary();
  const waitlistSummary = getWaitlistSummary();
  const topCancellationRiskMembers = [...cancellationProbabilities]
    .sort((a, b) => b.cancelProbability - a.cancelProbability)
    .slice(0, 3)
    .map((risk) => {
      const urgency = risk.cancelProbability > 0.6
        ? 'high'
        : risk.cancelProbability >= 0.3
          ? 'medium'
          : 'low';
      const predictedDaysUntilCancellation = Math.max(1, 5 - Math.round(risk.cancelProbability * 4));

      return {
        memberId: risk.memberId,
        memberName: risk.memberName,
        probability: Math.round(risk.cancelProbability * 100),
        predictedDaysUntilCancellation,
        recommendedAction: risk.recommendedAction,
        urgency,
      };
    });

  // Comparative context - vs last week
  const lastSaturday = revData.find(d => d.date === '2026-01-10') ?? revData[9];
  const yesterdayTotal = totalFor(yesterday);
  const lastSaturdayTotal = totalFor(lastSaturday);
  const revenueVsLastWeek = lastSaturdayTotal
    ? ((yesterdayTotal - lastSaturdayTotal) / lastSaturdayTotal * 100).toFixed(1)
    : '0.0';
  
  const teeSheet = getTodayTeeSheet();
  return {
    currentDate: date,
    teeSheet: { roundsToday: teeSheet.length > 0 ? teeSheet.length : DEMO_BRIEFING.teeSheet.roundsToday, utilization: 0.87 },
    yesterdayRecap: {
      date:           yesterday.date,
      revenue:        yesterdayTotal,
      revenueVsPlan:  -0.12,
      revenueVsLastWeek: parseFloat(revenueVsLastWeek),
      rounds:         82,
      roundsVsLastWeek: +8,
      incidents: [
        'Grill Room understaffed — 2 service speed complaints',
        'James Whitfield filed a slow-service complaint — left unhappy, no follow-up',
      ],
      weather:        yesterday.weather,
      isUnderstaffed: yesterday.isUnderstaffed,
    },
    todayRisks: {
      // 2026-04-09 v3 audit fix: secondary block previously had
      //   weather 'perfect' / 72 / 18, Anne 9:14 / 28, Robert 10:02 / 27
      // which contradicted the canonical DEMO_BRIEFING block at line 32-44
      // (wind advisory / 68 / 32, James 9:20 / 42, Anne 10:15 / 38,
      // Robert 10:42 / 36) and the cockpit + teeSheet narrative. Synced.
      weather:    'wind advisory', tempHigh: 68, wind: 32,
      forecast:   'Wind advisory — gusts to 30-40 mph expected Saturday afternoon',
      atRiskTeetimes: [
        { memberId: 'mbr_203', name: 'James Whitfield', archetype: 'Snowbird',         time: '9:20 AM', score: 42,
          topRisk: 'Service complaint unresolved — slow lunch on Jan 16' },
        { memberId: 'mbr_089', name: 'Anne Jordan',     archetype: 'Weekend Warrior',  time: '10:15 AM', score: 38,
          topRisk: 'Declining — golf visits dropped Oct→Nov→Dec' },
        { memberId: 'mbr_271', name: 'Robert Callahan', archetype: 'Declining',        time: '10:42 AM', score: 36,
          topRisk: 'Hitting F&B minimum only — obligation spending pattern' },
      ],
      staffingGaps: [], fullyStaffed: true,
      cancellationRisk: {
        highRiskBookings:     cancelSummary.highRisk,
        totalRevAtRisk:       cancelSummary.totalRevAtRisk,
        driverSummary:        'Wind advisory + 2 low-engagement members',
        suggestedAction:      'Send confirmation nudges to Kevin Hurst (82%), Anne Jordan (71%), James Whitfield (68%)',
        estimatedRevenueSaved: Math.round(cancelSummary.totalRevAtRisk * 0.34),
        briefingCard: {
          title: 'Tee Sheet Cancellation Risk',
          subtitle: 'Top 3 at-risk members today',
          items: topCancellationRiskMembers,
        },
        topAtRiskMembers: topCancellationRiskMembers,
      },
    },
    waitlistIntel: {
      total:           waitlistSummary.total,
      highPriority:    waitlistSummary.highPriority,
      atRisk:          waitlistSummary.atRisk,
      avgDaysWaiting:  waitlistSummary.avgDaysWaiting,
    },
    pendingActions: [
      { playbookId: 'service-save',       title: 'Service Save Protocol',        status: 'recommended', urgency: 'high',
        reason: 'James Whitfield complaint unresolved — at risk of resignation' },
      { playbookId: 'peak-demand-capture',title: 'Peak Demand Capture',          status: 'recommended', urgency: 'high',
        reason: `${cancelSummary.highRisk} high-risk bookings tomorrow · wind advisory · $${cancelSummary.totalRevAtRisk} at stake` },
      { playbookId: 'slow-saturday',      title: 'Slow Saturday Recovery',       status: 'available',   urgency: 'medium',
        reason: '28% slow round rate — weekend pace deteriorating' },
      { playbookId: 'engagement-decay',   title: 'Engagement Decay Intervention',status: 'available',   urgency: 'medium',
        reason: '5 members showing accelerated email decay' },
    ],
    keyMetrics: {
      monthlyRevenue: getMonthlyRevenueSummary().total,
      revenueVsPlan:  +4.2,
      atRiskMembers:  atRisk.length,
      openComplaints: complaints.length,
      understaffedDays: staffing.understaffedDaysCount,
    },
    quickWins: [
      {
        id: 'waitlist-retention-calls',
        icon: '📞',
        title: `Call ${waitlistSummary.highPriority} retention-priority waitlist members now`,
        impact: '$2,100 potential revenue',
        effort: '15 min',
        conversionRate: 67,
        detail: `${waitlistSummary.highPriority} at-risk members are waiting for tee times. Historical fill rate for retention-priority calls: 67%. Estimated revenue: $312/slot × ${waitlistSummary.highPriority} × 67% = $2,100.`,
        action: 'View waitlist queue',
        link: 'waitlist-demand',
      },
      {
        id: 'wind-fb-prep',
        icon: '☁️',
        title: 'Shift F&B prep for wind-driven indoor spike',
        impact: '+20-30% lunch covers',
        effort: '5 min',
        conversionRate: null,
        detail: 'Wind advisory (18 mph gusts by noon) historically reduces golf bookings by 15% but increases Grill Room lunch covers by 20-30% as members stay indoors. Add 2 servers, prep 15 extra grilled items.',
        action: 'View F&B operations',
        link: 'fb-performance',
      },
      {
        id: 'at-risk-touchpoints',
        icon: '👋',
        title: '2 at-risk members playing today — greet personally',
        impact: '$36K dues at stake',
        effort: '10 min',
        conversionRate: null,
        detail: 'Anne Jordan (8:14 AM) and Robert Callahan (10:40 AM) are both at-risk members with tee times today. Personal GM greeting + brief conversation can prevent further disengagement.',
        action: 'View member details',
        link: 'member-health',
      },
      {
        id: 'location-live-monitor',
        icon: '📍',
        title: 'Monitor live zone density for service-recovery members',
        impact: '2 live intervention windows',
        effort: '5 min',
        conversionRate: null,
        detail: 'Location Intelligence shows James, Sandra, and Robert currently on property with active service signals. Dispatching nearest staff closes feedback loops before departure.',
        action: 'Open location dashboard',
        link: 'location-intelligence',
      },
    ],
  };
  } catch {
    return DEMO_BRIEFING;
  }
};

export const sourceSystems = ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Analytics'];
