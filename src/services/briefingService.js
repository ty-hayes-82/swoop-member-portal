// briefingService.js — Phase 1 static · Phase 2 /api/briefing

import { getMonthlyRevenueSummary, getRevenueByDay } from './operationsService';
import { getAtRiskMembers }                          from './memberService';
import { getStaffingSummary, getComplaintCorrelation } from './staffingService';
import { getCancellationSummary, getWaitlistSummary }  from './waitlistService';
import { cancellationProbabilities } from '../data/pipeline';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/briefing');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getDailyBriefing = (date = '2026-01-17') => {
  if (_d) return _d;

  // Phase 1 static fallback — identical shape to API response
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

  return {
    currentDate: date,
    yesterdayRecap: {
      date:           yesterday.date,
      revenue:        yesterday.total,
      revenueVsPlan:  -0.12,
      rounds:         82,
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
        { memberId: 'mbr_271', name: 'Member 271',   archetype: 'Declining',       time: '10:02 AM', score: 22,
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
  };
};

export const sourceSystems = ['ForeTees', 'Jonas POS', 'Northstar', 'ClubReady', 'Club Prophet'];
