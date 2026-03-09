// Location Intelligence demo data — Pinetree Country Club, Kennesaw GA
// 47 members on property with real GPS coordinates

export const locationMembers = [
  // Course — 22 members spread across holes
  { memberId: 'mbr_101', name: 'James Whitfield', lat: 34.0420, lng: -84.5998, zone: 'Course - Hole 14', zoneId: 'course', status: 'at-risk', healthScore: 42, timeInZone: '2h 10m', needsAttention: true, recommendedAction: 'F&B manager should greet him at Grill Room when he finishes. His usual order: club sandwich + Arnold Palmer. Has not dined in 6 weeks.' },
  { memberId: 'mbr_205', name: 'Sandra Chen', lat: 34.0398, lng: -84.5977, zone: 'Grill Room', zoneId: 'grill-room', status: 'at-risk', healthScore: 48, timeInZone: '35m', needsAttention: true, recommendedAction: 'Filed complaint last week about slow service. Currently dining. GM should stop by table for personal check-in.' },
  { memberId: 'mbr_188', name: 'Robert Mills', lat: 34.0407, lng: -84.5982, zone: 'Driving Range', zoneId: 'driving-range', status: 'at-risk', healthScore: 51, timeInZone: '45m', needsAttention: true, recommendedAction: 'First visit in 3 weeks. Pro shop staff should engage and offer complimentary lesson.' },
  { memberId: 'mbr_102', name: 'Anne Jordan', lat: 34.0430, lng: -84.5990, zone: 'Course - Hole 7', zoneId: 'course', status: 'healthy', healthScore: 91, timeInZone: '1h 45m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_103', name: 'David Thompson', lat: 34.0435, lng: -84.5970, zone: 'Course - Hole 3', zoneId: 'course', status: 'healthy', healthScore: 88, timeInZone: '50m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_104', name: 'Patricia Nguyen', lat: 34.0440, lng: -84.5985, zone: 'Course - Hole 1', zoneId: 'course', status: 'healthy', healthScore: 85, timeInZone: '25m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_105', name: 'Michael Barrett', lat: 34.0415, lng: -84.6010, zone: 'Course - Hole 16', zoneId: 'course', status: 'watch', healthScore: 65, timeInZone: '3h 05m', needsAttention: false, recommendedAction: 'Engagement trending down. Monitor.' },
  { memberId: 'mbr_106', name: 'Lisa Kowalski', lat: 34.0405, lng: -84.6015, zone: 'Course - Hole 18', zoneId: 'course', status: 'healthy', healthScore: 79, timeInZone: '3h 50m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_107', name: 'Richard Gomez', lat: 34.0438, lng: -84.5995, zone: 'Course - Hole 5', zoneId: 'course', status: 'healthy', healthScore: 92, timeInZone: '1h 20m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_108', name: 'Karen Patel', lat: 34.0428, lng: -84.6005, zone: 'Course - Hole 9', zoneId: 'course', status: 'healthy', healthScore: 83, timeInZone: '2h 00m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_109', name: 'Brian Foster', lat: 34.0410, lng: -84.6018, zone: 'Course - Hole 17', zoneId: 'course', status: 'watch', healthScore: 62, timeInZone: '3h 30m', needsAttention: false, recommendedAction: 'Pace slowing. Consider check-in.' },
  { memberId: 'mbr_110', name: 'Jennifer Walsh', lat: 34.0442, lng: -84.5978, zone: 'Course - Hole 2', zoneId: 'course', status: 'healthy', healthScore: 90, timeInZone: '35m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_111', name: 'Thomas Rivera', lat: 34.0425, lng: -84.5965, zone: 'Course - Hole 11', zoneId: 'course', status: 'healthy', healthScore: 87, timeInZone: '2h 25m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_112', name: 'Susan Harper', lat: 34.0436, lng: -84.5960, zone: 'Course - Hole 4', zoneId: 'course', status: 'healthy', healthScore: 76, timeInZone: '1h 05m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_113', name: 'Daniel Kim', lat: 34.0418, lng: -84.5958, zone: 'Course - Hole 12', zoneId: 'course', status: 'healthy', healthScore: 81, timeInZone: '2h 40m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_114', name: 'Emily Dawson', lat: 34.0412, lng: -84.5955, zone: 'Course - Hole 13', zoneId: 'course', status: 'healthy', healthScore: 94, timeInZone: '2h 55m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_115', name: 'George Martinez', lat: 34.0408, lng: -84.5952, zone: 'Course - Hole 15', zoneId: 'course', status: 'healthy', healthScore: 72, timeInZone: '3h 15m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_116', name: 'Nancy Cho', lat: 34.0432, lng: -84.5950, zone: 'Course - Hole 6', zoneId: 'course', status: 'healthy', healthScore: 86, timeInZone: '1h 35m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_117', name: 'William Drake', lat: 34.0422, lng: -84.5948, zone: 'Course - Hole 10', zoneId: 'course', status: 'watch', healthScore: 58, timeInZone: '2h 15m', needsAttention: false, recommendedAction: 'Rounds frequency declining. Soft touch recommended.' },
  { memberId: 'mbr_118', name: 'Carol Simmons', lat: 34.0415, lng: -84.5955, zone: 'Course - Hole 14', zoneId: 'course', status: 'healthy', healthScore: 80, timeInZone: '2h 50m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_119', name: 'Paul Anderson', lat: 34.0405, lng: -84.5960, zone: 'Course - Hole 15', zoneId: 'course', status: 'healthy', healthScore: 77, timeInZone: '3h 10m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_120', name: 'Maria Santos', lat: 34.0445, lng: -84.5988, zone: 'Course - Hole 1', zoneId: 'course', status: 'healthy', healthScore: 89, timeInZone: '15m', needsAttention: false, recommendedAction: 'No action needed.' },
  // Clubhouse / Dining — 11 members
  { memberId: 'mbr_201', name: 'Charles Webb', lat: 34.0398, lng: -84.5978, zone: 'Grill Room', zoneId: 'grill-room', status: 'healthy', healthScore: 85, timeInZone: '40m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_202', name: 'Dorothy Lane', lat: 34.0397, lng: -84.5976, zone: 'Grill Room', zoneId: 'grill-room', status: 'healthy', healthScore: 91, timeInZone: '25m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_203', name: 'Raymond Hughes', lat: 34.0398, lng: -84.5972, zone: 'Main Dining', zoneId: 'main-dining', status: 'healthy', healthScore: 78, timeInZone: '1h 10m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_204', name: 'Betty Carlson', lat: 34.0397, lng: -84.5971, zone: 'Main Dining', zoneId: 'main-dining', status: 'watch', healthScore: 64, timeInZone: '55m', needsAttention: false, recommendedAction: 'Spend trending down. Monitor.' },
  { memberId: 'mbr_206', name: 'Frank Morales', lat: 34.0397, lng: -84.5979, zone: 'Grill Room', zoneId: 'grill-room', status: 'healthy', healthScore: 82, timeInZone: '30m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_207', name: 'Helen Park', lat: 34.0396, lng: -84.5973, zone: 'Main Dining', zoneId: 'main-dining', status: 'healthy', healthScore: 88, timeInZone: '45m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_208', name: 'Jack Stevens', lat: 34.0397, lng: -84.5981, zone: 'Clubhouse Lounge', zoneId: 'clubhouse', status: 'healthy', healthScore: 75, timeInZone: '1h 20m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_209', name: 'Gloria Reeves', lat: 34.0395, lng: -84.5980, zone: 'Clubhouse Lounge', zoneId: 'clubhouse', status: 'healthy', healthScore: 93, timeInZone: '50m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_210', name: 'Victor Dunn', lat: 34.0396, lng: -84.5969, zone: 'Main Dining', zoneId: 'main-dining', status: 'healthy', healthScore: 70, timeInZone: '1h 05m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_211', name: 'Irene Coleman', lat: 34.0398, lng: -84.5974, zone: 'Main Dining', zoneId: 'main-dining', status: 'healthy', healthScore: 84, timeInZone: '35m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_212', name: 'Oscar Fleming', lat: 34.0394, lng: -84.5975, zone: 'Clubhouse', zoneId: 'clubhouse', status: 'healthy', healthScore: 87, timeInZone: '20m', needsAttention: false, recommendedAction: 'No action needed.' },
  // Pool / Fitness — 6 members
  { memberId: 'mbr_301', name: 'Angela Price', lat: 34.0391, lng: -84.5983, zone: 'Pool', zoneId: 'pool', status: 'healthy', healthScore: 90, timeInZone: '1h 15m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_302', name: 'Dennis Ross', lat: 34.0390, lng: -84.5981, zone: 'Pool', zoneId: 'pool', status: 'healthy', healthScore: 82, timeInZone: '45m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_303', name: 'Laura Bell', lat: 34.0391, lng: -84.5980, zone: 'Fitness Center', zoneId: 'pool', status: 'healthy', healthScore: 95, timeInZone: '1h 30m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_304', name: 'Henry Grant', lat: 34.0389, lng: -84.5982, zone: 'Pool', zoneId: 'pool', status: 'watch', healthScore: 60, timeInZone: '30m', needsAttention: false, recommendedAction: 'Low engagement. Pool visit is positive signal.' },
  { memberId: 'mbr_305', name: 'Cynthia Meyer', lat: 34.0390, lng: -84.5979, zone: 'Fitness Center', zoneId: 'pool', status: 'healthy', healthScore: 88, timeInZone: '55m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_306', name: 'Roy Patterson', lat: 34.0389, lng: -84.5984, zone: 'Pool', zoneId: 'pool', status: 'healthy', healthScore: 74, timeInZone: '1h 00m', needsAttention: false, recommendedAction: 'No action needed.' },
  // Pro Shop — 3 members
  { memberId: 'mbr_401', name: 'Deborah Ellis', lat: 34.0401, lng: -84.5976, zone: 'Pro Shop', zoneId: 'pro-shop', status: 'healthy', healthScore: 86, timeInZone: '15m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_402', name: 'Kenneth Shaw', lat: 34.0401, lng: -84.5974, zone: 'Pro Shop', zoneId: 'pro-shop', status: 'healthy', healthScore: 79, timeInZone: '10m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_403', name: 'Ruth Dixon', lat: 34.0401, lng: -84.5973, zone: 'Pro Shop', zoneId: 'pro-shop', status: 'healthy', healthScore: 91, timeInZone: '20m', needsAttention: false, recommendedAction: 'No action needed.' },
  // Driving Range — 4 members (including Robert Mills above)
  { memberId: 'mbr_501', name: 'Albert Cruz', lat: 34.0408, lng: -84.5985, zone: 'Driving Range', zoneId: 'driving-range', status: 'healthy', healthScore: 83, timeInZone: '35m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_502', name: 'Sharon Hoffman', lat: 34.0407, lng: -84.5978, zone: 'Driving Range', zoneId: 'driving-range', status: 'healthy', healthScore: 77, timeInZone: '50m', needsAttention: false, recommendedAction: 'No action needed.' },
  { memberId: 'mbr_503', name: 'Fred Murray', lat: 34.0406, lng: -84.5983, zone: 'Driving Range', zoneId: 'driving-range', status: 'healthy', healthScore: 85, timeInZone: '25m', needsAttention: false, recommendedAction: 'No action needed.' },
];

export const zoneAnalytics = [
  { id: 'course', label: 'Course', count: 22, dwell: 'Avg 2h 15m', peak: '7:00-9:30 AM' },
  { id: 'grill-room', label: 'Grill Room', count: 5, dwell: 'Avg 38m', peak: '11:30 AM-1:00 PM' },
  { id: 'main-dining', label: 'Main Dining', count: 5, dwell: 'Avg 52m', peak: '6:00-8:00 PM' },
  { id: 'clubhouse', label: 'Clubhouse / Lounge', count: 3, dwell: 'Avg 50m', peak: '4:00-6:00 PM' },
  { id: 'pool', label: 'Pool & Fitness', count: 6, dwell: 'Avg 55m', peak: '10:00 AM-12:00 PM' },
  { id: 'pro-shop', label: 'Pro Shop', count: 3, dwell: 'Avg 15m', peak: '6:30-8:00 AM' },
  { id: 'driving-range', label: 'Driving Range', count: 4, dwell: 'Avg 40m', peak: '6:00-7:30 AM' },
];

export const alertsFeed = [
  { id: 'a1', timestamp: '7:42 AM', severity: 'high', title: 'James Whitfield on Hole 14', detail: 'At-risk member (score 42). Has not dined in 6 weeks. When he finishes, have F&B manager greet at Grill Room with his usual order.', memberId: 'mbr_101' },
  { id: 'a2', timestamp: '7:38 AM', severity: 'high', title: 'Sandra Chen in Grill Room', detail: 'Filed complaint last week about slow service. Currently dining. GM should stop by for personal recovery check-in.', memberId: 'mbr_205' },
  { id: 'a3', timestamp: '7:25 AM', severity: 'medium', title: 'Robert Mills at Driving Range', detail: 'First visit in 3 weeks. Positive re-engagement signal. Pro shop should offer complimentary lesson.', memberId: 'mbr_188' },
  { id: 'a4', timestamp: '7:15 AM', severity: 'low', title: '4 board members on property', detail: 'Charles Webb, Dorothy Lane, Gloria Reeves, Ruth Dixon all checked in. VIP cluster in clubhouse area.', memberId: null },
  { id: 'a5', timestamp: '7:02 AM', severity: 'info', title: 'Post-round dining conversion: 73%', detail: 'Above average. 8 of 11 early golfers went to Grill Room after finishing.', memberId: null },
  { id: 'a6', timestamp: '6:48 AM', severity: 'info', title: '47 members checked in', detail: '16% of membership on property. Typical Tuesday morning. Course at 61% capacity.', memberId: null },
];
