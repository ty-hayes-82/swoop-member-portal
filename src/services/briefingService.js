// briefingService.js — Phase 1 static · Phase 2 /api/briefing

import { apiFetch } from './apiClient';
import { isGateOpen, getDataMode } from './demoGate';
import { getMonthlyRevenueSummary, getRevenueByDay, getTodayTeeSheet, getTeeSheetSummary } from './operationsService';
import { getAtRiskMembers }                          from './memberService';
import { getStaffingSummary, getComplaintCorrelation } from './staffingService';
import { getCancellationSummary, getWaitlistSummary }  from './waitlistService';
import { cancellationProbabilities as staticCancellationProbabilities } from '../data/pipeline';

/**
 * @typedef {Object} AtRiskTeetime
 * @property {string} memberId
 * @property {string} name
 * @property {string} time                     Display time "9:20 AM"
 * @property {number} [score]                  0-100 (DEMO_BRIEFING uses `health`)
 * @property {number} [health]                 DEMO_BRIEFING fallback field (score equivalent)
 * @property {string} [archetype]
 * @property {string} [topRisk]
 */

/**
 * @typedef {Object} TopCancellationRiskMember
 * @property {string} memberId
 * @property {string} memberName
 * @property {number} probability              0-100 (integer %)
 * @property {number} predictedDaysUntilCancellation
 * @property {string} recommendedAction
 * @property {'high'|'medium'|'low'} urgency
 */

/**
 * @typedef {Object} CancellationRiskBlock
 * @property {number} highRiskBookings
 * @property {number} totalRevAtRisk
 * @property {string} driverSummary
 * @property {string} suggestedAction
 * @property {number} estimatedRevenueSaved
 * @property {TopCancellationRiskMember[]} topAtRiskMembers
 * @property {{title:string,subtitle:string,items:TopCancellationRiskMember[]}} [briefingCard]
 */

/**
 * @typedef {Object} KeyMetrics
 * @property {number} atRiskMembers
 * @property {number} openComplaints
 * @property {number} [monthlyRevenue]
 * @property {number} [revenueVsPlan]
 * @property {number} [understaffedDays]
 */

/**
 * @typedef {Object} YesterdayRecap
 * @property {string} date
 * @property {number} revenue
 * @property {number} revenueVsPlan
 * @property {number} revenueVsLastWeek
 * @property {number} rounds
 * @property {number} roundsVsLastWeek
 * @property {string[]} incidents
 * @property {string} weather
 * @property {boolean} isUnderstaffed
 */

/**
 * @typedef {Object} TodayRisks
 * @property {string} weather
 * @property {number} tempHigh
 * @property {number} wind
 * @property {string} forecast
 * @property {AtRiskTeetime[]} atRiskTeetimes
 * @property {Array<Object>} staffingGaps
 * @property {boolean} fullyStaffed
 * @property {CancellationRiskBlock} [cancellationRisk]
 * @property {Object} [demandForecast]
 */

/**
 * @typedef {Object} DailyBriefing
 * @property {string} [currentDate]
 * @property {{roundsToday:number,utilization:number}} [teeSheet]
 * @property {YesterdayRecap|null} yesterdayRecap
 * @property {TodayRisks} todayRisks
 * @property {Array<{playbookId:string,title:string,status:string,urgency:string,reason:string}>} [pendingActions]
 * @property {KeyMetrics} keyMetrics
 * @property {Object} comparisons
 * @property {TopCancellationRiskMember[]} topCancellationRiskMembers
 * @property {Array<Object>} [quickWins]
 * @property {Object} [waitlistIntel]
 */

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
  keyMetrics: { atRiskMembers: 7, openComplaints: 4, monthlyRevenue: 375200, revenueVsPlan: 4.2, understaffedDays: 3 },
  teeSheet: { roundsToday: 220, utilization: 0.87 },
  todayRisks: {
    weather: 'clear',
    tempHigh: 82,
    wind: 8,
    forecast: 'Clear skies, 82°F — afternoon gusts to 30-40 mph possible',
    // Must stay at 3 entries — Story 1 narration says "3 at-risk members on today's tee sheet". Locked by briefingService.demo.test.js.
    atRiskTeetimes: [
      { memberId: 'mbr_t01', name: 'James Whitfield', time: '8:00 AM', health: 42, topRisk: 'Unresolved complaint Jan 16 — 42-min Grill Room wait, felt ignored. $18K dues at risk' },
      { memberId: 'mbr_t04', name: 'Anne Jordan', time: '7:08 AM', health: 28, topRisk: 'Missed 3 Saturday waitlists, walked off Jan 7 after slow pace — zero rounds since. 10-year member' },
      { memberId: 'mbr_t05', name: 'Robert Callahan', time: '9:00 AM', health: 22, topRisk: 'Hitting exact $3,020 F&B minimum then stopping. 9-day complaint unresolved. No golf since Nov' },
    ],
    staffingGaps: [],
    fullyStaffed: false,
    demandForecast: {
      expectedRounds: 192,
      golfModifier: 0.87,
      recommendation: 'Saturday: Grill Room needs 4 servers — only 2 scheduled',
      weatherSummary: 'Afternoon wind advisory may shift 32 tee times indoors',
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
    weather: 'sunny',
    isUnderstaffed: true,
  },
  pendingActions: [
    { playbookId: 'service-save', title: 'Service Save Protocol', status: 'recommended', urgency: 'high', reason: 'James Whitfield complaint unresolved' },
    { playbookId: 'peak-demand-capture', title: 'Peak Demand Capture', status: 'recommended', urgency: 'high', reason: 'Wind advisory + at-risk bookings' },
  ],
  comparisons: {},
  topCancellationRiskMembers: [],
};

/**
 * @param {string} [date]
 * @returns {DailyBriefing}
 */
export const getDailyBriefing = (date = '2026-01-17') => {
  if (_d) return _d;
  if (!isGateOpen('tee-sheet')) return EMPTY_BRIEFING;

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
  const pipelineData = _d?.cancellationProbabilities ?? (getDataMode() === 'demo' ? staticCancellationProbabilities : []);
  const hasPipelineData = isGateOpen('pipeline');
  const topCancellationRiskMembers = !hasPipelineData ? [] : [...pipelineData]
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
  const summary = getTeeSheetSummary();
  return {
    currentDate: date,
    teeSheet: { roundsToday: summary.totalRounds || DEMO_BRIEFING.teeSheet.roundsToday, utilization: 0.87 },
    yesterdayRecap: {
      date:           yesterday.date,
      revenue:        yesterdayTotal,
      revenueVsPlan:  -0.12,
      revenueVsLastWeek: parseFloat(revenueVsLastWeek),
      rounds:         82,
      roundsVsLastWeek: +8,
      incidents: [
        ...(isGateOpen('fb') ? ['Grill Room understaffed — 2 service speed complaints'] : []),
        ...(isGateOpen('complaints') ? ['James Whitfield filed a slow-service complaint — left unhappy, no follow-up'] : []),
      ],
      weather:        yesterday.weather,
      isUnderstaffed: yesterday.isUnderstaffed,
    },
    todayRisks: {
      // Must match the canonical DEMO_BRIEFING block above and the cockpit / teeSheet narrative.
      weather:    'clear', tempHigh: 82, wind: 8,
      forecast:   'Clear skies, 82°F — afternoon gusts to 30-40 mph possible',
      atRiskTeetimes: [
        { memberId: 'mbr_t01', name: 'James Whitfield', archetype: 'Balanced Active',   time: '8:00 AM', score: 42,
          topRisk: 'Unresolved complaint Jan 16 — 42-min Grill Room wait, felt ignored. $18K dues at risk' },
        { memberId: 'mbr_t04', name: 'Anne Jordan',     archetype: 'Weekend Warrior',  time: '7:08 AM', score: 28,
          topRisk: 'Missed 3 Saturday waitlists, walked off Jan 7 after slow pace — zero rounds since. 10-year member' },
        { memberId: 'mbr_t05', name: 'Robert Callahan', archetype: 'Declining',        time: '9:00 AM', score: 22,
          topRisk: 'Hitting exact $3,020 F&B minimum then stopping. 9-day complaint unresolved. No golf since Nov' },
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
        reason: isGateOpen('email') ? '5 members showing accelerated email decay' : 'Multiple members showing declining engagement signals' },
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
      ...(isGateOpen('fb') ? [{
        id: 'wind-fb-prep',
        icon: '💨',
        title: 'Shift F&B prep for afternoon wind-driven indoor spike',
        impact: '+20-30% lunch covers',
        effort: '5 min',
        conversionRate: null,
        detail: 'Afternoon wind advisory (gusts to 30-40 mph) historically reduces golf bookings by 15% but increases Grill Room lunch covers by 20-30% as members stay indoors. Add 2 servers, prep 15 extra grilled items.',
        action: 'View F&B operations',
        link: 'fb-performance',
      }] : []),
      {
        id: 'at-risk-touchpoints',
        icon: '👋',
        title: '3 at-risk members playing today — greet personally',
        impact: '$60K dues at stake',
        effort: '15 min',
        conversionRate: null,
        detail: 'James Whitfield (8:00 AM), Anne Jordan (7:08 AM), and Robert Callahan (9:00 AM) are all at-risk members with tee times today. Personal GM greeting + brief conversation can prevent further disengagement.',
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
    return EMPTY_BRIEFING;
  }
};

export const sourceSystems = ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Analytics'];
