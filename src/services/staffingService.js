// staffingService.js — Phase 1 static · Phase 2 /api/staffing

import { understaffedDays, feedbackRecords, feedbackSummary, shiftCoverage } from '@/data/staffing';

let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/staffing');
    if (res.ok) _d = await res.json();
  } catch { /* keep static fallback */ }
};

export const getUnderstaffedDays  = () => _d ? _d.understaffedDays  : understaffedDays;
export const getShiftCoverage     = () => _d ? _d.shiftCoverage     : shiftCoverage;
export const getFeedbackSummary   = () => _d ? _d.feedbackSummary   : feedbackSummary;

export const getComplaintCorrelation = () => {
  const src = _d ? _d.feedbackRecords : feedbackRecords;
  return src.map(f => ({
    date:         f.date ?? f.submitted_at,
    sentiment:    f.sentiment,
    status:       f.status,
    category:     f.category,
    memberId:     f.memberId ?? f.member_id,
    isUnderstaffed: f.isUnderstaffed ?? f.is_understaffed_day,
  }));
};

export const getStaffingSummary = () => {
  if (_d) return _d.staffingSummary;
  return {
    understaffedDaysCount: understaffedDays.length,
    totalRevenueLoss:      understaffedDays.reduce((s, d) => s + d.revenueLoss, 0),
    annualizedLoss:        understaffedDays.reduce((s, d) => s + d.revenueLoss, 0) * 12,
    unresolvedComplaints:  feedbackRecords.filter(f => f.status !== 'resolved').length,
  };
};

export const sourceSystems = ['Scheduling', 'POS', 'Member CRM'];
