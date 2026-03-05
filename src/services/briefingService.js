// briefingService.js — aggregates across all domains for Daily Briefing
import { getMonthlyRevenueSummary, getRevenueByDay } from './operationsService';
import { getAtRiskMembers } from './memberService';
import { getStaffingSummary, getComplaintCorrelation } from './staffingService';

export const getDailyBriefing = (date = '2026-01-17') => {
  const revData = getRevenueByDay();
  const yesterday = revData.find(d => d.date === '2026-01-16') ?? revData[15];
  const atRisk = getAtRiskMembers();
  const staffing = getStaffingSummary();
  const complaints = getComplaintCorrelation().filter(c => c.status !== 'resolved');

  return {
    currentDate: date,
    yesterdayRecap: {
      date: yesterday.date,
      revenue: yesterday.total,
      revenueVsPlan: -0.12,   // -12% vs avg — was revenueVsAvg (NaN bug fix)
      rounds: 82,
      incidents: ['Grill Room understaffed — 2 service speed complaints', 'James Whitfield filed a slow-service complaint — left unhappy, no follow-up'],
      weather: yesterday.weather,
      isUnderstaffed: yesterday.isUnderstaffed,
    },
    todayRisks: {
      weather: 'perfect',
      tempHigh: 72,
      wind: 8,
      forecast: 'Clear, 72°F — high demand expected',
      atRiskTeetimes: [
        { memberId: 'mbr_089', name: 'Anne Jordan', archetype: 'Weekend Warrior', time: '9:14 AM', score: 28, topRisk: 'Declining — golf visits dropped Oct→Nov→Dec' },
        { memberId: 'mbr_271', name: 'Member 271',  archetype: 'Declining',       time: '10:02 AM', score: 22, topRisk: 'Hitting F&B minimum only — obligation spending pattern' },
      ],
      staffingGaps: [],
      fullyStaffed: true,
    },
    pendingActions: [
      { playbookId: 'service-save',  title: 'Service Save Protocol',       status: 'recommended', urgency: 'high',
        reason: 'James Whitfield complaint unresolved — at risk of resignation' },
      { playbookId: 'slow-saturday', title: 'Slow Saturday Recovery',      status: 'available',   urgency: 'medium',
        reason: '28% slow round rate — weekend pace deteriorating' },
      { playbookId: 'engagement-decay', title: 'Engagement Decay Intervention', status: 'available', urgency: 'medium',
        reason: '5 members showing accelerated email decay' },
    ],
    keyMetrics: {
      monthlyRevenue: 218400,
      revenueVsPlan: +4.2,
      atRiskMembers: atRisk.length,
      openComplaints: complaints.length,
      understaffedDays: staffing.understaffedDaysCount,
    },
  };
};

// Data provenance — which vendor systems this service simulates
export const sourceSystems = ["ForeTees", "Jonas POS", "Northstar", "ClubReady", "Club Prophet"];
