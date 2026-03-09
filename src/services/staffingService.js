// staffingService.js — Phase 1 static · Phase 2 /api/staffing

import { understaffedDays, feedbackRecords, feedbackSummary, shiftCoverage } from '@/data/staffing';

let _d = null;
const FALLBACK_UNDERSTAFFED_DAYS = [
  {
    date: '2026-01-09',
    outlet: 'Grill Room',
    revenueLoss: 1140,
    scheduledStaff: 4,
    requiredStaff: 6,
    ticketTimeIncrease: 0.23,
    complaintMultiplier: 1.8,
  },
  {
    date: '2026-01-16',
    outlet: 'Grill Room',
    revenueLoss: 1320,
    scheduledStaff: 3,
    requiredStaff: 6,
    ticketTimeIncrease: 0.34,
    complaintMultiplier: 2.2,
  },
  {
    date: '2026-01-28',
    outlet: 'Grill Room',
    revenueLoss: 980,
    scheduledStaff: 4,
    requiredStaff: 6,
    ticketTimeIncrease: 0.18,
    complaintMultiplier: 1.5,
  },
];

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

export const _init = async () => {
  try {
    const res = await fetch('/api/staffing');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

const sanitizeUnderstaffedDays = (source) => {
  const list = Array.isArray(source) && source.length ? source : FALLBACK_UNDERSTAFFED_DAYS;
  return list.map((day, index) => {
    const fallback = FALLBACK_UNDERSTAFFED_DAYS[index % FALLBACK_UNDERSTAFFED_DAYS.length];
    return {
      date: day?.date ?? fallback.date,
      outlet: day?.outlet ?? fallback.outlet,
      revenueLoss: Math.max(0, toNumber(day?.revenueLoss, fallback.revenueLoss)),
      scheduledStaff: Math.max(0, Math.round(toNumber(day?.scheduledStaff, fallback.scheduledStaff))),
      requiredStaff: Math.max(0, Math.round(toNumber(day?.requiredStaff, fallback.requiredStaff))),
      ticketTimeIncrease: Math.max(0, toNumber(day?.ticketTimeIncrease, fallback.ticketTimeIncrease)),
      complaintMultiplier: Math.max(0, toNumber(day?.complaintMultiplier, fallback.complaintMultiplier)),
    };
  });
};

export const getUnderstaffedDays = () => sanitizeUnderstaffedDays(_d ? _d.understaffedDays : understaffedDays);
export const getShiftCoverage     = () => (_d ? _d.shiftCoverage   : shiftCoverage);
export const getFeedbackSummary   = () => (_d ? _d.feedbackSummary : feedbackSummary);

export const getComplaintCorrelation = () => {
  const src = _d ? _d.feedbackRecords : feedbackRecords;
  const arr = Array.isArray(src) ? src : feedbackRecords;
  return arr.map((f) => ({
    date:         f.date ?? f.submitted_at,
    sentiment:    f.sentiment,
    status:       f.status,
    category:     f.category,
    memberId:     f.memberId ?? f.member_id,
    isUnderstaffed: f.isUnderstaffed ?? f.is_understaffed_day ?? f.isUnderstaffedDay,
  }));
};

export const getStaffingSummary = () => {
  if (_d?.staffingSummary) {
    const days = getUnderstaffedDays();
    const totalRevenueLoss = days.reduce((sum, day) => sum + day.revenueLoss, 0);
    return {
      understaffedDaysCount: Math.max(0, Math.round(toNumber(_d.staffingSummary.understaffedDaysCount, days.length))),
      totalRevenueLoss: Math.max(0, toNumber(_d.staffingSummary.totalRevenueLoss, totalRevenueLoss)),
      annualizedLoss: Math.max(0, toNumber(_d.staffingSummary.annualizedLoss, totalRevenueLoss * 12)),
      unresolvedComplaints: Math.max(0, Math.round(toNumber(_d.staffingSummary.unresolvedComplaints, 0))),
    };
  }
  const days = getUnderstaffedDays();
  return {
    understaffedDaysCount: days.length,
    totalRevenueLoss:      days.reduce((s, d) => s + d.revenueLoss, 0),
    annualizedLoss:        days.reduce((s, d) => s + d.revenueLoss, 0) * 12,
    unresolvedComplaints:  feedbackRecords.filter((f) => f.status !== 'resolved').length,
  };
};

export const sourceSystems = ['Scheduling', 'POS', 'Member CRM'];
