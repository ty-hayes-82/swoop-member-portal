/**
 * Jonas Club Software → Swoop field mapping configuration
 *
 * Each import type has:
 *   - jonasFile: the typical Jonas export filename
 *   - jonasExportMethod: how to extract from Jonas (F9/SV/RG)
 *   - description: what this data unlocks
 *   - fields: array of { swoop, label, required, aliases[] }
 *     - swoop: the Swoop DB field name (matches api/import-csv.js)
 *     - label: human-readable label shown in mapping UI
 *     - required: whether this field must be mapped
 *     - aliases: array of known Jonas column header names that auto-map
 */

export const JONAS_IMPORT_TYPES = [
  {
    key: 'members',
    label: 'Members',
    icon: '👥',
    jonasFile: 'JCM_Members_F9.csv',
    jonasModule: 'Club Management',
    jonasExportMethod: 'F9 Lister on Member entity',
    description: 'Member profiles, contact info, membership types, dues. The foundation — every other feature builds on knowing your members.',
    unlocks: ['Member roster & search', 'Membership tier breakdown', 'Dues at Risk calculations', 'Board Report KPIs'],
    stepNumber: 1,
    fields: [
      { swoop: 'first_name', label: 'First Name', required: true, aliases: ['Given Name', 'First Name', 'FirstName', 'First', 'Familiar Name', 'fname'] },
      { swoop: 'last_name', label: 'Last Name', required: true, aliases: ['Surname', 'Last Name', 'LastName', 'Last', 'lname'] },
      { swoop: 'external_id', label: 'Member ID / External ID', required: false, aliases: ['Member #', 'Member Number', 'Member Code', 'Member ID', 'MemberID', 'Mbr #', 'member_id', 'MemberNo'] },
      { swoop: 'email', label: 'Email', required: false, aliases: ['Email', 'Email Address', 'E-mail', 'email'] },
      { swoop: 'phone', label: 'Phone', required: false, aliases: ['Phone #', 'Phone', 'Cell', 'Mobile #', 'Cell #', 'Telephone', 'phone'] },
      { swoop: 'membership_type', label: 'Membership Type', required: false, aliases: ['Membership Type', 'Mem Type', 'Type', 'MembershipType', 'Mbr Type', 'membership_type'] },
      { swoop: 'annual_dues', label: 'Annual Dues', required: false, aliases: ['Annual Fee', 'Annual Dues', 'Dues', 'Fee Amount', 'annual_dues'] },
      { swoop: 'join_date', label: 'Join Date', required: false, aliases: ['Date Joined', 'Join Date', 'Join Dt', 'JoinDate', 'Member Since', 'join_date'] },
      { swoop: 'status', label: 'Status', required: false, aliases: ['Status', 'Member Status', 'Mbr Status', 'status'] },
      { swoop: 'household_id', label: 'Household ID', required: false, aliases: ['Household ID', 'Member to Bill', 'Master #', 'HouseholdID', 'household_id'] },
      { swoop: 'birthday', label: 'Birthday', required: false, aliases: ['Birthday', 'Birthdate', 'Birth Date', 'DOB', 'Date of Birth', 'birthday'] },
      { swoop: 'sex', label: 'Gender', required: false, aliases: ['Sex', 'Gender', 'sex'] },
      { swoop: 'handicap', label: 'Handicap / GHIN #', required: false, aliases: ['Handicap #', 'Handicap', 'GHIN', 'GHIN #', 'handicap'] },
      { swoop: 'current_balance', label: 'Account Balance', required: false, aliases: ['Current Balance', 'ACCT BALANCE', 'Balance', 'Acct Balance', 'current_balance'] },
      { swoop: 'date_resigned', label: 'Date Resigned', required: false, aliases: ['Date Resigned', 'Resigned Date', 'Resignation Date', 'date_resigned'] },
    ],
  },
  {
    key: 'tee_times',
    label: 'Tee Times / Bookings',
    icon: '⛳',
    jonasFile: 'TTM_Tee_Sheet_SV.csv',
    jonasModule: 'Tee Time Management',
    jonasExportMethod: 'Smart Viewer export from Tee Sheet',
    description: 'Tee sheet reservations and round data. Unlocks golf engagement scores — see who plays and who doesn\'t.',
    unlocks: ['Golf engagement dimension (30% of health score)', 'Die-Hard Golfer / Ghost archetypes', 'Rounds per member analytics', 'At-risk detection for inactive golfers'],
    stepNumber: 2,
    fields: [
      { swoop: 'reservation_id', label: 'Reservation ID', required: true, aliases: ['Reservation ID', 'Confirmation #', 'Reservation Confirmation #', 'Booking ID', 'reservation_id'] },
      { swoop: 'course', label: 'Course', required: true, aliases: ['Course', 'Golf Course', 'Course Code', 'course'] },
      { swoop: 'date', label: 'Date', required: true, aliases: ['Date', 'Tee Sheet Date', 'Play Date', 'Round Date', 'date'] },
      { swoop: 'tee_time', label: 'Tee Time', required: true, aliases: ['Tee Time', 'Time', 'Start Time', 'tee_time'] },
      { swoop: 'players', label: 'Players', required: false, aliases: ['Players', 'Number of Players', 'Player Count', 'Num Players', 'players'] },
      { swoop: 'guest_flag', label: 'Guest Flag', required: false, aliases: ['Guest Flag', 'Guest', 'Is Guest', 'guest_flag'] },
      { swoop: 'transportation', label: 'Transportation', required: false, aliases: ['Transportation', 'Trans', 'Cart/Walk', 'transportation'] },
      { swoop: 'caddie', label: 'Caddie', required: false, aliases: ['Caddie', 'caddie'] },
      { swoop: 'holes', label: 'Holes', required: false, aliases: ['Holes', '9/18', 'holes'] },
      { swoop: 'status', label: 'Status', required: false, aliases: ['Status', 'Reservation Status', 'status'] },
      { swoop: 'check_in_time', label: 'Check-In Time', required: false, aliases: ['Check-In Time', 'Check In Time', 'CheckIn', 'check_in_time'] },
      { swoop: 'round_start', label: 'Round Start', required: false, aliases: ['Round Start', 'Start', 'round_start'] },
      { swoop: 'round_end', label: 'Round End', required: false, aliases: ['Round End', 'End', 'round_end'] },
      { swoop: 'duration_min', label: 'Duration (min)', required: false, aliases: ['Duration (min)', 'Duration', 'Duration Min', 'Round Duration', 'duration_min'] },
    ],
  },
  {
    key: 'transactions',
    label: 'F&B Transactions',
    icon: '🍽️',
    jonasFile: 'POS_Sales_Detail_SV.csv',
    jonasModule: 'Point of Sale',
    jonasExportMethod: 'Smart Viewer export from Sales Detail report',
    description: 'POS transactions, checks, and spending data. Unlocks dining engagement and revenue analytics.',
    unlocks: ['Dining engagement dimension (25% of health score)', 'Social Butterfly archetype', 'F&B revenue per member', 'Post-round dining correlation'],
    stepNumber: 3,
    fields: [
      { swoop: 'transaction_date', label: 'Transaction Date', required: true, aliases: ['Open Time', 'Close Time', 'Date', 'Transaction Date', 'Chit Date', 'transaction_date'] },
      { swoop: 'total_amount', label: 'Total Amount', required: true, aliases: ['Net Amount', 'Total Due', 'Total Amount', 'Total', 'Amount', 'Chit Total', 'total_amount'] },
      { swoop: 'member_id', label: 'Member #', required: false, aliases: ['Member #', 'Member', 'Member ID', 'MemberID', 'member_id'] },
      { swoop: 'outlet_name', label: 'Outlet / Sales Area', required: false, aliases: ['Sales Area', 'Outlet', 'Outlet Name', 'Location', 'outlet_name'] },
      { swoop: 'category', label: 'Category', required: false, aliases: ['Category', 'Sales Category', 'Item Group', 'Reporting Group', 'category'] },
      { swoop: 'item_count', label: 'Item Count', required: false, aliases: ['Item Count', 'Items', 'Line Items', 'item_count'] },
      { swoop: 'tax', label: 'Tax', required: false, aliases: ['Tax', 'Tax Amount', 'tax'] },
      { swoop: 'gratuity', label: 'Gratuity', required: false, aliases: ['Gratuity', 'Tip', 'Service Charge', 'gratuity'] },
      { swoop: 'comp', label: 'Comp', required: false, aliases: ['Comp', 'Comps', 'comp'] },
      { swoop: 'discount', label: 'Discount', required: false, aliases: ['Discount', 'Discounts', 'discount'] },
      { swoop: 'void', label: 'Void', required: false, aliases: ['Void', 'Voided', 'void'] },
      { swoop: 'settlement_method', label: 'Settlement Method', required: false, aliases: ['Settlement Method', 'Payment Method', 'Payment Type', 'settlement_method'] },
      { swoop: 'open_time', label: 'Open Time', required: false, aliases: ['Opened At', 'open_time'] },
      { swoop: 'close_time', label: 'Close Time', required: false, aliases: ['Close Time', 'Closed At', 'close_time'] },
      { swoop: 'is_post_round', label: 'Post-Round Dining', required: false, aliases: ['Post Round', 'Is Post Round', 'is_post_round'] },
    ],
  },
  {
    key: 'complaints',
    label: 'Complaints / Feedback',
    icon: '📋',
    jonasFile: 'JCM_Communications_RG.csv',
    jonasModule: 'Club Management / MemberInsight',
    jonasExportMethod: 'Report Generator on Communications entity',
    description: 'Member complaints, feedback, and survey responses. Unlocks service quality tracking.',
    unlocks: ['Complaint resolution tracking', 'Service Quality Score', 'At-risk priority boost for members with open complaints', 'Staffing-complaint correlation'],
    stepNumber: 4,
    fields: [
      { swoop: 'category', label: 'Category / Type', required: true, aliases: ['Type', 'Category', 'Department', 'Location', 'Subject', 'category'] },
      { swoop: 'description', label: 'Description', required: true, aliases: ['Description', 'Subject', 'Comment', 'Notes', 'Detail', 'description'] },
      { swoop: 'member_id', label: 'Member #', required: false, aliases: ['Member #', 'Member', 'Member ID', 'member_id'] },
      { swoop: 'status', label: 'Status', required: false, aliases: ['Status', 'Complete', 'Resolution Status', 'status'] },
      { swoop: 'priority', label: 'Priority / Severity', required: false, aliases: ['Priority', 'Severity', 'Happometer Score', 'priority'] },
      { swoop: 'reported_at', label: 'Date Reported', required: false, aliases: ['Date', 'Reported At', 'Created Date', 'reported_at'] },
      { swoop: 'resolved_at', label: 'Date Resolved', required: false, aliases: ['Resolution Date', 'Resolved At', 'Resolved Date', 'resolved_at'] },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    icon: '🎉',
    jonasFile: 'JAM_Event_List_SV.csv',
    jonasModule: 'Event Management (JAM)',
    jonasExportMethod: 'Smart Viewer export from Event List',
    description: 'Event definitions — golf tournaments, social events, dining events. Needed before importing registrations.',
    unlocks: ['Event catalog for registration matching', 'Event type analytics', 'Capacity tracking'],
    stepNumber: 5,
    fields: [
      { swoop: 'event_id', label: 'Event ID / Number', required: true, aliases: ['Event Number', 'Event ID', 'Event #', 'EventID', 'event_id'] },
      { swoop: 'event_name', label: 'Event Name', required: true, aliases: ['Event Name', 'Name', 'Title', 'event_name'] },
      { swoop: 'event_type', label: 'Event Type', required: false, aliases: ['Event Type', 'Type', 'Category', 'event_type'] },
      { swoop: 'start_date', label: 'Start Date', required: false, aliases: ['Start Date', 'Event Date', 'Date', 'start_date'] },
      { swoop: 'capacity', label: 'Capacity', required: false, aliases: ['Capacity', 'Max Attendees', 'Max', 'capacity'] },
      { swoop: 'registration_fee', label: 'Registration Fee', required: false, aliases: ['Registration Fee', 'Fee', 'Member Price', 'Pricing Category', 'Price', 'registration_fee'] },
      { swoop: 'description', label: 'Description', required: false, aliases: ['Description', 'Details', 'Notes', 'description'] },
    ],
  },
  {
    key: 'event_registrations',
    label: 'Event Registrations',
    icon: '✅',
    jonasFile: 'JAM_Registrations_SV.csv',
    jonasModule: 'Event Management (JAM)',
    jonasExportMethod: 'Smart Viewer export from Event Registrations report',
    description: 'Member sign-ups for events. Links members to events for engagement scoring.',
    unlocks: ['Event engagement dimension (20% of health score)', 'First 90 Days milestones', 'Balanced Active archetype'],
    stepNumber: 5,
    fields: [
      { swoop: 'registration_id', label: 'Registration ID', required: true, aliases: ['Registration ID', 'Reg ID', 'registration_id'] },
      { swoop: 'event_id', label: 'Event ID / Number', required: true, aliases: ['Event Number', 'Event ID', 'Event #', 'Event Booking Number', 'event_id'] },
      { swoop: 'member_id', label: 'Member / Client Code', required: false, aliases: ['Client Code', 'Member #', 'Member ID', 'Member', 'member_id'] },
      { swoop: 'status', label: 'Status', required: false, aliases: ['Status', 'Event Registrant Status', 'status'] },
      { swoop: 'guest_count', label: 'Guest Count', required: false, aliases: ['Guest Count', 'Guests', 'Party Size', 'guest_count'] },
      { swoop: 'fee_paid', label: 'Fee Paid', required: false, aliases: ['Fee Paid', 'Amount Paid', 'Fee', 'fee_paid'] },
      { swoop: 'registration_date', label: 'Registration Date', required: false, aliases: ['Registration Date', 'Registered At', 'Date', 'registration_date'] },
      { swoop: 'check_in_time', label: 'Check-In Time', required: false, aliases: ['Check-In Time', 'Check In', 'Checked In', 'check_in_time'] },
    ],
  },
  {
    key: 'email_campaigns',
    label: 'Email Campaigns',
    icon: '📧',
    jonasFile: 'CHO_Campaigns_SV.csv',
    jonasModule: 'ClubHouse Online (CHO)',
    jonasExportMethod: 'Smart Viewer export from Email Marketing Campaigns',
    description: 'Email campaign definitions — newsletters, promotions, operational emails. Needed before importing email events.',
    unlocks: ['Campaign catalog for email event matching', 'Send frequency analytics'],
    stepNumber: 6,
    fields: [
      { swoop: 'campaign_id', label: 'Campaign ID', required: true, aliases: ['Campaign ID', 'Campaign', 'CampaignID', 'campaign_id'] },
      { swoop: 'subject', label: 'Subject Line', required: true, aliases: ['Subject', 'Email Subject', 'subject'] },
      { swoop: 'campaign_type', label: 'Campaign Type', required: false, aliases: ['Campaign Type', 'Type', 'campaign_type'] },
      { swoop: 'send_date', label: 'Send Date', required: false, aliases: ['Send Date', 'Sent Date', 'Date', 'send_date'] },
      { swoop: 'audience_count', label: 'Audience / Recipients', required: false, aliases: ['Audience Count', 'Recipient Count', 'Recipients', 'Audience', 'audience_count'] },
    ],
  },
  {
    key: 'email_events',
    label: 'Email Events',
    icon: '📬',
    jonasFile: 'CHO_Email_Events_SV.csv',
    jonasModule: 'ClubHouse Online (CHO)',
    jonasExportMethod: 'Smart Viewer export from Email Response/Insights',
    description: 'Email opens, clicks, bounces, unsubscribes. Completes the email engagement dimension.',
    unlocks: ['Email engagement dimension (25% of health score)', 'Full 4-dimension health scores', 'Early churn warning (email decay precedes resignation 4-6 weeks)'],
    stepNumber: 6,
    fields: [
      { swoop: 'campaign_id', label: 'Campaign ID', required: true, aliases: ['Campaign', 'Campaign ID', 'CampaignID', 'campaign_id'] },
      { swoop: 'member_id', label: 'Member #', required: true, aliases: ['Member #', 'Member', 'Member ID', 'member_id'] },
      { swoop: 'event_type', label: 'Event Type', required: true, aliases: ['Event Type', 'Type', 'Action', 'event_type'] },
      { swoop: 'timestamp', label: 'Timestamp', required: false, aliases: ['Timestamp', 'Date', 'Occurred At', 'Event Date', 'timestamp'] },
      { swoop: 'link_clicked', label: 'Link Clicked', required: false, aliases: ['Link Clicked', 'Link', 'URL', 'link_clicked'] },
      { swoop: 'device', label: 'Device', required: false, aliases: ['Device', 'Device Type', 'device'] },
    ],
  },
  {
    key: 'staff',
    label: 'Staff Roster',
    icon: '👔',
    jonasFile: 'ADP_Staff_Roster.csv',
    jonasModule: 'Time Keeper / Payroll',
    jonasExportMethod: 'F9 Lister on Staff entity, or ADP/payroll export',
    description: 'Employee profiles — names, departments, roles, pay rates. Needed before importing shift schedules.',
    unlocks: ['Staff directory', 'Department breakdown', 'Staffing analytics foundation'],
    stepNumber: 7,
    fields: [
      { swoop: 'employee_id', label: 'Employee ID', required: true, aliases: ['Employee ID', 'Staff Code', 'Employee Code', 'EmpID', 'employee_id'] },
      { swoop: 'first_name', label: 'First Name', required: true, aliases: ['First Name', 'Given Name', 'Name', 'first_name'] },
      { swoop: 'last_name', label: 'Last Name', required: true, aliases: ['Last Name', 'Surname', 'last_name'] },
      { swoop: 'department', label: 'Department', required: false, aliases: ['Dept', 'Department', 'Preferred Department', 'department'] },
      { swoop: 'job_title', label: 'Job Title / Role', required: false, aliases: ['Job Title', 'Role', 'Job', 'Preferred Job', 'Function', 'job_title'] },
      { swoop: 'hire_date', label: 'Hire Date', required: false, aliases: ['Hire Date', 'Start Date', 'Date Hired', 'hire_date'] },
      { swoop: 'hourly_rate', label: 'Hourly Rate', required: false, aliases: ['Hourly Rate', 'Pay Rate', 'Rate', 'hourly_rate'] },
      { swoop: 'ft_pt', label: 'Full-Time / Part-Time', required: false, aliases: ['FT/PT', 'FT_PT', 'Full Time', 'Employment Type', 'ft_pt'] },
    ],
  },
  {
    key: 'shifts',
    label: 'Staff Shifts',
    icon: '📅',
    jonasFile: '7shifts_Staff_Shifts.csv',
    jonasModule: 'Time Keeper / 7shifts',
    jonasExportMethod: 'Time Keeper Labor Schedule export, or 7shifts CSV export',
    description: 'Shift schedules, hours worked, outlet assignments. Unlocks staffing intelligence.',
    unlocks: ['Staffing vs. demand analysis', 'Understaffed day detection', 'Complaint-staffing correlation', '100% platform value'],
    stepNumber: 7,
    fields: [
      { swoop: 'shift_id', label: 'Shift ID', required: true, aliases: ['Shift ID', 'ShiftID', 'Record ID', 'shift_id'] },
      { swoop: 'employee_id', label: 'Employee ID', required: true, aliases: ['Employee ID', 'Staff Code', 'EmpID', 'employee_id'] },
      { swoop: 'date', label: 'Shift Date', required: true, aliases: ['Date', 'Shift Date', 'date'] },
      { swoop: 'location', label: 'Location / Outlet', required: false, aliases: ['Location', 'Outlet', 'Facility', 'Department', 'location'] },
      { swoop: 'shift_start', label: 'Shift Start', required: false, aliases: ['Shift Start', 'Start Time', 'Clock In', 'shift_start'] },
      { swoop: 'shift_end', label: 'Shift End', required: false, aliases: ['Shift End', 'End Time', 'Clock Out', 'shift_end'] },
      { swoop: 'actual_hours', label: 'Actual Hours', required: false, aliases: ['Act Hrs', 'Actual Hours', 'Hours Worked', 'Hours', 'actual_hours'] },
      { swoop: 'notes', label: 'Notes', required: false, aliases: ['Notes', 'Comments', 'notes'] },
    ],
  },
];

/**
 * Build a flat lookup: lowercase alias → { importType, swoopField }
 * Used for auto-detecting column mappings from CSV headers
 */
export function buildAliasLookup(importTypeKey) {
  const config = JONAS_IMPORT_TYPES.find(t => t.key === importTypeKey);
  if (!config) return {};
  const lookup = {};
  for (const field of config.fields) {
    // Add the swoop field name itself as an alias
    lookup[field.swoop.toLowerCase()] = field.swoop;
    for (const alias of field.aliases) {
      lookup[alias.toLowerCase()] = field.swoop;
    }
  }
  return lookup;
}

/**
 * Auto-map CSV headers to Swoop fields using alias lookup
 * Returns { csvHeader: swoopField | null }
 */
export function autoMapColumns(csvHeaders, importTypeKey) {
  const aliasLookup = buildAliasLookup(importTypeKey);
  const mapping = {};
  const usedSwoopFields = new Set();

  for (const header of csvHeaders) {
    const normalized = header.trim().toLowerCase();
    // Try exact match first
    if (aliasLookup[normalized] && !usedSwoopFields.has(aliasLookup[normalized])) {
      mapping[header] = aliasLookup[normalized];
      usedSwoopFields.add(aliasLookup[normalized]);
      continue;
    }
    // Try without special chars
    const cleaned = normalized.replace(/[#_\-/\\()]/g, ' ').replace(/\s+/g, ' ').trim();
    for (const [alias, swoopField] of Object.entries(aliasLookup)) {
      if (usedSwoopFields.has(swoopField)) continue;
      const cleanedAlias = alias.replace(/[#_\-/\\()]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned === cleanedAlias) {
        mapping[header] = swoopField;
        usedSwoopFields.add(swoopField);
        break;
      }
    }
    // If still no match, leave unmapped
    if (!mapping[header]) {
      mapping[header] = null;
    }
  }
  return mapping;
}

/** Get the import type config */
export function getImportTypeConfig(key) {
  return JONAS_IMPORT_TYPES.find(t => t.key === key) || null;
}

/** Supported vendors for future expansion */
export const SUPPORTED_VENDORS = [
  { id: 'jonas', name: 'Jonas Club Software', logo: null, description: 'Full integration with JCM, POS, TTM, JAM, and CHO modules', supported: true },
  { id: 'clubessential', name: 'Club Essential', logo: null, description: 'Coming soon', supported: false },
  { id: 'northstar', name: 'Northstar', logo: null, description: 'Coming soon', supported: false },
  { id: 'foreup', name: 'foreUP', logo: null, description: 'Coming soon', supported: false },
  { id: 'generic', name: 'Other / Generic CSV', logo: null, description: 'Manual column mapping for any CSV file', supported: true },
];
