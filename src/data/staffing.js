// Staffing & feedback data — Oakmont Hills CC, January 2026

export const understaffedDays = [
  {
    date: '2026-01-09', outlet: 'Grill Room',
    ticketTimeIncrease: 0.20, complaintMultiplier: 2.1,
    revenueLoss: 1140, scheduledStaff: 2, requiredStaff: 4,
  },
  {
    date: '2026-01-16', outlet: 'Grill Room',
    ticketTimeIncrease: 0.22, complaintMultiplier: 2.3,
    revenueLoss: 1280, scheduledStaff: 2, requiredStaff: 4,
  },
  {
    date: '2026-01-28', outlet: 'Grill Room',
    ticketTimeIncrease: 0.18, complaintMultiplier: 1.9,
    revenueLoss: 980, scheduledStaff: 3, requiredStaff: 4,
  },
];

export const feedbackRecords = [
  { id: 'fb_001', memberId: 'mbr_203', memberName: 'James Whitfield', date: '2026-01-18', category: 'Service Speed',
    sentiment: -0.80, status: 'acknowledged', isUnderstaffedDay: false },
  { id: 'fb_002', memberId: 'mbr_142', date: '2026-01-09', category: 'Service Speed',
    sentiment: -0.64, status: 'resolved', isUnderstaffedDay: true },
  { id: 'fb_003', memberId: 'mbr_088', date: '2026-01-09', category: 'Service Speed',
    sentiment: -0.72, status: 'resolved', isUnderstaffedDay: true },
  { id: 'fb_004', memberId: 'mbr_211', date: '2026-01-16', category: 'Food Quality',
    sentiment: -0.48, status: 'resolved', isUnderstaffedDay: true },
  { id: 'fb_005', memberId: 'mbr_055', date: '2026-01-16', category: 'Service Speed',
    sentiment: -0.66, status: 'in_progress', isUnderstaffedDay: true },
  { id: 'fb_006', memberId: 'mbr_177', date: '2026-01-17', category: 'Course Condition',
    sentiment: -0.32, status: 'resolved', isUnderstaffedDay: false },
  { id: 'fb_007', memberId: 'mbr_099', date: '2026-01-22', category: 'Pace of Play',
    sentiment: -0.55, status: 'in_progress', isUnderstaffedDay: false },
  { id: 'fb_008', memberId: 'mbr_134', date: '2026-01-28', category: 'Service Speed',
    sentiment: -0.70, status: 'escalated', isUnderstaffedDay: true },
];

export const feedbackSummary = [
  { category: 'Service Speed',    count: 14, avgSentiment: -0.62, unresolvedCount: 4 },
  { category: 'Food Quality',     count: 7,  avgSentiment: -0.44, unresolvedCount: 1 },
  { category: 'Pace of Play',     count: 6,  avgSentiment: -0.51, unresolvedCount: 2 },
  { category: 'Course Condition', count: 4,  avgSentiment: -0.38, unresolvedCount: 1 },
  { category: 'Staff',            count: 2,  avgSentiment: -0.55, unresolvedCount: 1 },
  { category: 'Facility',         count: 1,  avgSentiment: -0.28, unresolvedCount: 0 },
];

export const shiftCoverage = [
  { date: '2026-01-09', department: 'F&B Service', scheduled: 2, required: 4, gap: 2 },
  { date: '2026-01-16', department: 'F&B Service', scheduled: 2, required: 4, gap: 2 },
  { date: '2026-01-28', department: 'F&B Service', scheduled: 3, required: 4, gap: 1 },
];
