// briefingService.js — Phase 1 static · Phase 2 /api/briefing

import { apiFetch } from './apiClient';
import { getMonthlyRevenueSummary, getRevenueByDay } from './operationsService';
import { getAtRiskMembers }                          from './memberService';
import { getStaffingSummary, getComplaintCorrelation } from './staffingService';
import { getCancellationSummary, getWaitlistSummary }  from './waitlistService';
import { cancellationProbabilities } from '../data/pipeline';
import { isAuthenticatedClub } from '@/config/constants';

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

export const getDailyBriefing = (date = '2026-01-17') => {
  if (_d) return _d;
  return EMPTY_BRIEFING;

  // Phase 1 static fallback — unreachable, kept for reference
  const revData    = getRevenueByDay();
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
  const revenueVsLastWeek = ((yesterday.total - lastSaturday.total) / lastSaturday.total * 100).toFixed(1);
  
  return {
    currentDate: date,
    yesterdayRecap: {
      date:           yesterday.date,
      revenue:        yesterday.total,
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
      weather:    'perfect', tempHigh: 72, wind: 18,
      forecast:   'Wind advisory — 18 mph gusts expected by noon',
      atRiskTeetimes: [
        { memberId: 'mbr_089', name: 'Anne Jordan',  archetype: 'Weekend Warrior', time: '9:14 AM', score: 28,
          topRisk: 'Declining — golf visits dropped Oct→Nov→Dec' },
        { memberId: 'mbr_271', name: 'Robert Callahan',   archetype: 'Declining',       time: '10:02 AM', score: 27,
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
};

export const sourceSystems = ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Analytics'];
