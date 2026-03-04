// staffingService.js
import { understaffedDays, feedbackRecords, feedbackSummary, shiftCoverage } from '@/data/staffing';

export const getUnderstaffedDays = () => understaffedDays;
export const getComplaintCorrelation = () =>
  feedbackRecords.map(f => ({
    date: f.date,
    sentiment: f.sentiment,
    status: f.status,
    category: f.category,
    memberId: f.memberId,
    isUnderstaffed: f.isUnderstaffedDay,
  }));
export const getShiftCoverage = () => shiftCoverage;
export const getFeedbackSummary = () => feedbackSummary;
export const getStaffingSummary = () => ({
  understaffedDaysCount: understaffedDays.length,
  totalRevenueLoss: understaffedDays.reduce((s, d) => s + d.revenueLoss, 0),
  annualizedLoss: understaffedDays.reduce((s, d) => s + d.revenueLoss, 0) * 12,
  unresolvedComplaints: feedbackRecords.filter(f => f.status !== 'resolved').length,
});
