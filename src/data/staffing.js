// Staffing & feedback data — Pinetree CC, January 2026

export const understaffedDays = [
  {
    date: '2026-01-09', outlet: 'Grill Room',
    ticketTimeIncrease: 0.20, complaintMultiplier: 2.1,
    revenueLoss: 1140, scheduledStaff: 2, requiredStaff: 4,
    derivation: 'Avg Friday F&B $3,300; actual $2,900; base gap $400 + 20% ticket-time slowdown lost 8 covers × $92.50 avg = $1,140',
  },
  {
    date: '2026-01-16', outlet: 'Grill Room',
    ticketTimeIncrease: 0.22, complaintMultiplier: 2.3,
    revenueLoss: 1280, scheduledStaff: 2, requiredStaff: 4,
    derivation: 'Avg Friday F&B $3,300; actual $2,600; base gap $700 + 22% ticket-time slowdown lost 6 covers × $96.67 avg = $1,280',
  },
  {
    date: '2026-01-28', outlet: 'Grill Room',
    ticketTimeIncrease: 0.18, complaintMultiplier: 1.9,
    revenueLoss: 980, scheduledStaff: 3, requiredStaff: 4,
    derivation: 'Avg Wednesday F&B $2,267; actual $2,100; base gap $167 + 18% ticket-time slowdown lost 9 covers × $90.33 avg = $980',
  },
];

export const feedbackRecords = [
  { id: 'fb_001', memberId: 'mbr_t01', memberName: 'James Whitfield', date: '2026-01-16', category: 'Service Speed',
    sentiment: -0.80, status: 'acknowledged', isUnderstaffedDay: false,
    resolved_date: null, resolved_by: null },
  { id: 'fb_002', memberId: 'mbr_142', memberName: 'Patricia Nguyen', date: '2026-01-09', category: 'Service Speed',
    sentiment: -0.64, status: 'resolved', isUnderstaffedDay: true,
    resolved_date: '2026-01-10', resolved_by: 'F&B Director' },
  { id: 'fb_003', memberId: 'mbr_088', memberName: 'Michael Torres', date: '2026-01-09', category: 'Service Speed',
    sentiment: -0.72, status: 'resolved', isUnderstaffedDay: true,
    resolved_date: '2026-01-11', resolved_by: 'F&B Director' },
  { id: 'fb_004', memberId: 'mbr_211', memberName: 'Karen Sullivan', date: '2026-01-16', category: 'Food Quality',
    sentiment: -0.48, status: 'resolved', isUnderstaffedDay: true,
    resolved_date: '2026-01-17', resolved_by: 'Executive Chef' },
  { id: 'fb_005', memberId: 'mbr_055', memberName: 'David Kowalski', date: '2026-01-16', category: 'Service Speed',
    sentiment: -0.66, status: 'in_progress', isUnderstaffedDay: true,
    resolved_date: null, resolved_by: null },
  { id: 'fb_006', memberId: 'mbr_177', memberName: 'Sandra Park', date: '2026-01-17', category: 'Course Condition',
    sentiment: -0.32, status: 'resolved', isUnderstaffedDay: false,
    resolved_date: '2026-01-18', resolved_by: 'Head Superintendent' },
  { id: 'fb_007', memberId: 'mbr_099', memberName: 'Robert Chen', date: '2026-01-22', category: 'Pace of Play',
    sentiment: -0.55, status: 'in_progress', isUnderstaffedDay: false,
    resolved_date: null, resolved_by: null },
  { id: 'fb_008', memberId: 'mbr_134', memberName: 'Catherine Mercer', date: '2026-01-28', category: 'Service Speed',
    sentiment: -0.70, status: 'escalated', isUnderstaffedDay: true,
    resolved_date: null, resolved_by: null },
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
