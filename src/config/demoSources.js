/**
 * Demo Source Definitions — individual Jonas CSV files for guided demo mode.
 * Each file is independently importable, and unlocks app features progressively.
 * The `gateId` maps to the service-level gate that controls data availability.
 */

export const DEMO_FILES = [
  // ── MEMBER DATA ──────────────────────────────────────
  { id: 'JCM_Members_F9', file: 'JCM_Members_F9.csv', name: 'Members', system: 'Jonas Club Management', icon: '👥', gateId: 'members', rows: 250, description: 'Member profiles, contact info, dues, status', unlocks: ['Member Health page', 'Health score distribution', 'Member profile drawers'] },
  { id: 'JCM_Dependents_F9', file: 'JCM_Dependents_F9.csv', name: 'Dependents / Family', system: 'Jonas Club Management', icon: '👨‍👩‍👧', gateId: 'members', rows: 180, description: 'Household members, family relationships', unlocks: ['Family member details in profiles'] },
  { id: 'JCM_Membership_Types_F9', file: 'JCM_Membership_Types_F9.csv', name: 'Membership Types', system: 'Jonas Club Management', icon: '🏷', gateId: 'members', rows: 5, description: 'Membership tier definitions and annual fees', unlocks: ['Membership tier badges', 'Dues-at-risk calculations'] },

  // ── TEE SHEET ────────────────────────────────────────
  { id: 'TTM_Tee_Sheet_SV', file: 'TTM_Tee_Sheet_SV.csv', name: 'Tee Sheet Reservations', system: 'Jonas Tee Time Manager', icon: '⛳', gateId: 'tee-sheet', rows: 4200, description: 'Tee time bookings, dates, courses, player count', unlocks: ['Tee Sheet page', 'Rounds booked count', 'Cancel risk predictions'] },
  { id: 'TTM_Tee_Sheet_Players_SV', file: 'TTM_Tee_Sheet_Players_SV.csv', name: 'Tee Sheet Players', system: 'Jonas Tee Time Manager', icon: '🏌', gateId: 'tee-sheet', rows: 3800, description: 'Individual player details per reservation', unlocks: ['At-risk members on course', 'Cart prep recommendations', 'GM greeting alerts'] },
  { id: 'TTM_Course_Setup_F9', file: 'TTM_Course_Setup_F9.csv', name: 'Course Setup', system: 'Jonas Tee Time Manager', icon: '🗺', gateId: 'tee-sheet', rows: 2, description: 'Course definitions, holes, par', unlocks: ['Course selection in tee sheet'] },

  // ── POINT OF SALE / F&B ──────────────────────────────
  { id: 'POS_Sales_Detail_SV', file: 'POS_Sales_Detail_SV.csv', name: 'Sales Detail', system: 'Jonas POS', icon: '🧾', gateId: 'fb', rows: 2400, description: 'Check-level sales transactions with member, outlet, totals', unlocks: ['F&B revenue section', 'Post-round dining conversion'] },
  { id: 'POS_Line_Items_SV', file: 'POS_Line_Items_SV.csv', name: 'Line Items', system: 'Jonas POS', icon: '📝', gateId: 'fb', rows: 8500, description: 'Individual menu items per check', unlocks: ['Menu item analytics', 'Avg check breakdown'] },
  { id: 'POS_Payments_SV', file: 'POS_Payments_SV.csv', name: 'Payments', system: 'Jonas POS', icon: '💳', gateId: 'fb', rows: 2100, description: 'Payment methods and settlement details', unlocks: ['Payment method distribution'] },
  { id: 'POS_Daily_Close_SV', file: 'POS_Daily_Close_SV.csv', name: 'Daily Close Summary', system: 'Jonas POS', icon: '📊', gateId: 'fb', rows: 60, description: 'Daily revenue totals by outlet', unlocks: ['Revenue trends', 'Outlet performance comparison'] },
  { id: 'POS_Sales_Areas_F9', file: 'POS_Sales_Areas_F9.csv', name: 'Sales Areas / Outlets', system: 'Jonas POS', icon: '🍽', gateId: 'fb', rows: 6, description: 'Outlet definitions (Grill Room, Terrace, etc.)', unlocks: ['Outlet names in reports'] },

  // ── SERVICE REQUESTS ─────────────────────────────────
  { id: 'JCM_Service_Requests_RG', file: 'JCM_Service_Requests_RG.csv', name: 'Service Requests', system: 'Jonas Club Management', icon: '📋', gateId: 'complaints', rows: 320, description: 'Member complaints, maintenance requests, resolution tracking', unlocks: ['Service page complaints tab', 'Complaint patterns', 'Service quality metrics'] },
  { id: 'JCM_Communications_RG', file: 'JCM_Communications_RG.csv', name: 'Member Communications', system: 'Jonas Club Management', icon: '💬', gateId: 'complaints', rows: 85, description: 'Outbound communications log', unlocks: ['Communication history in profiles'] },
  { id: 'JCM_Aged_Receivables_SV', file: 'JCM_Aged_Receivables_SV.csv', name: 'Aged Receivables', system: 'Jonas Club Management', icon: '💰', gateId: 'complaints', rows: 250, description: 'Outstanding balances, aging buckets', unlocks: ['Financial risk signals', 'Dues-at-risk alerts'] },

  // ── EMAIL & EVENTS ───────────────────────────────────
  { id: 'CHO_Email_Events_SV', file: 'CHO_Email_Events_SV.csv', name: 'Email Open/Click Events', system: 'Clubhouse Online', icon: '📧', gateId: 'email', rows: 12000, description: 'Individual email open and click events per member', unlocks: ['Email engagement section', 'Decaying member alerts'] },
  { id: 'CHO_Campaigns_SV', file: 'CHO_Campaigns_SV.csv', name: 'Email Campaigns', system: 'Clubhouse Online', icon: '📨', gateId: 'email', rows: 8, description: 'Campaign definitions, send dates, audience counts', unlocks: ['Campaign effectiveness metrics'] },
  { id: 'JAM_Event_List_SV', file: 'JAM_Event_List_SV.csv', name: 'Event List', system: 'Jonas Activity Manager', icon: '🎉', gateId: 'email', rows: 12, description: 'Club events, dates, capacities', unlocks: ['Event attendance tracking'] },
  { id: 'JAM_Registrations_SV', file: 'JAM_Registrations_SV.csv', name: 'Event Registrations', system: 'Jonas Activity Manager', icon: '✅', gateId: 'email', rows: 1800, description: 'Member event registrations and attendance', unlocks: ['Event participation in health scores'] },

  // ── STAFFING & WEATHER ───────────────────────────────
  { id: '7shifts_Staff_Shifts', file: '7shifts_Staff_Shifts.csv', name: 'Staff Shifts', system: '7shifts', icon: '📅', gateId: 'weather', rows: 450, description: 'Scheduled shifts, locations, actual hours', unlocks: ['Staffing vs demand', 'Understaffed day flags'] },
  { id: 'ADP_Staff_Roster', file: 'ADP_Staff_Roster.csv', name: 'Staff Roster', system: 'ADP', icon: '🪪', gateId: 'weather', rows: 35, description: 'Employee names, roles, departments', unlocks: ['Staff names in assignments'] },

  // ── CLUB PROFILE ─────────────────────────────────────
  { id: 'JCM_Club_Profile', file: 'JCM_Club_Profile.csv', name: 'Club Profile', system: 'Jonas Club Management', icon: '🏌️‍♂️', gateId: 'pipeline', rows: 1, description: 'Club name, location, membership capacity, weather connection', unlocks: ['Board report', 'Industry benchmarks', 'Club profile overview', 'Live weather feed'] },
];

// Group files by gateId for display
export const FILE_GROUPS = [
  { gateId: 'members', label: 'Member Data', icon: '👥' },
  { gateId: 'tee-sheet', label: 'Tee Sheet', icon: '⛳' },
  { gateId: 'fb', label: 'F&B / Point of Sale', icon: '🍽' },
  { gateId: 'complaints', label: 'Service & Financials', icon: '📋' },
  { gateId: 'email', label: 'Email & Events', icon: '✉' },
  { gateId: 'weather', label: 'Staffing', icon: '📅' },
  { gateId: 'pipeline', label: 'Club Profile', icon: '🏌️‍♂️' },
];

// All unique gate IDs (for "load all" and agent activation)
export const ALL_SOURCE_IDS = [...new Set(DEMO_FILES.map(f => f.gateId)), 'agents'];

// All file IDs
export const ALL_FILE_IDS = DEMO_FILES.map(f => f.id);
