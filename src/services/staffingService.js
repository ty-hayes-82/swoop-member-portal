// staffingService.js — Phase 1 static · Phase 2 /api/staffing

import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
import { isAuthenticatedClub } from '@/config/constants';
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

const toString = (value, fallback = '') => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

export const _init = async () => {
  try {
    const data = await apiFetch('/api/staffing');
    if (data) _d = data;
  } catch {
    /* keep static fallback */
  }
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

const sanitizeShiftCoverage = (source) => {
  if (!Array.isArray(source) || source.length === 0) return [];
  return source.map((shift) => {
    const scheduled = Math.max(0, Math.round(toNumber(shift?.scheduled)));
    const required = Math.max(0, Math.round(toNumber(shift?.required)));
    const calculatedGap = Math.max(0, required - scheduled);
    return {
      date: shift?.date ?? 'N/A',
      department: toString(shift?.department, 'Staffing'),
      scheduled,
      required,
      gap: Math.max(0, Math.round(toNumber(shift?.gap, calculatedGap))),
    };
  });
};

const sanitizeFeedbackSummary = (source) => {
  if (!Array.isArray(source) || source.length === 0) return [];
  return source.map((row) => ({
    category: toString(row?.category, 'General'),
    count: Math.max(0, Math.round(toNumber(row?.count))),
    avgSentiment: Math.max(-1, Math.min(1, toNumber(row?.avgSentiment))),
    unresolvedCount: Math.max(0, Math.round(toNumber(row?.unresolvedCount))),
  }));
};

const sanitizeFeedbackRecords = (source) => {
  if (!Array.isArray(source) || source.length === 0) return [];
  return source.map((record) => ({
    date: record?.date ?? (record?.submitted_at ? String(record.submitted_at).split('T')[0] : 'Unknown date'),
    sentiment: toNumber(record?.sentiment, -0.15),
    status: toString(record?.status, 'acknowledged'),
    category: toString(record?.category, 'Service'),
    memberId: toString(record?.memberId ?? record?.member_id ?? 'unknown'),
    memberName: toString(record?.memberName ?? record?.member_name ?? ''),
    isUnderstaffed: Boolean(record?.isUnderstaffed ?? record?.is_understaffed_day ?? record?.isUnderstaffedDay),
    isUnderstaffedDay: Boolean(record?.isUnderstaffed ?? record?.is_understaffed_day ?? record?.isUnderstaffedDay),
  }));
};

export const getUnderstaffedDays = () => {
  const real = _d?.understaffedDays;
  if (Array.isArray(real) && real.length) return sanitizeUnderstaffedDays(real);
  // Understaffed days correlate complaints with staffing — require both gates
  if (!shouldUseStatic('complaints') || !shouldUseStatic('members')) return [];
  return sanitizeUnderstaffedDays(understaffedDays);
};
export const getShiftCoverage = () => {
  const real = _d?.shiftCoverage;
  if (Array.isArray(real) && real.length) return sanitizeShiftCoverage(real);
  if (!shouldUseStatic('complaints')) return [];
  return sanitizeShiftCoverage(shiftCoverage);
};
export const getFeedbackSummary = () => {
  const real = _d?.feedbackSummary;
  if (Array.isArray(real) && real.length) return sanitizeFeedbackSummary(real);
  // Complaints reference members — require both gates
  if (!shouldUseStatic('complaints') || !shouldUseStatic('members')) return [];
  return sanitizeFeedbackSummary(feedbackSummary);
};
export const getComplaintCorrelation = () => {
  const real = _d?.feedbackRecords;
  if (Array.isArray(real) && real.length) return sanitizeFeedbackRecords(real);
  // Complaints reference members — require both gates
  if (!shouldUseStatic('complaints') || !shouldUseStatic('members')) return [];
  return sanitizeFeedbackRecords(feedbackRecords);
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
  const complaints = [];
  return {
    understaffedDaysCount: days.length,
    totalRevenueLoss: days.reduce((s, d) => s + d.revenueLoss, 0),
    annualizedLoss: days.reduce((s, d) => s + d.revenueLoss, 0) * 12,
    unresolvedComplaints: complaints.filter((f) => f.status !== 'resolved').length,
  };
};

export const sourceSystems = ['Scheduling', 'POS', 'Member CRM'];
