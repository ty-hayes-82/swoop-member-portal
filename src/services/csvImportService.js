import * as XLSX from 'xlsx';

const templateLibrary = [
  {
    key: 'members',
    label: 'Members',
    icon: '👥',
    color: '#F3922D',
    description: 'Full member roster including household context and preferences.',
    instructions: 'Provide one row per member. Use stable member_id values. Dates must be ISO (YYYY-MM-DD). Spouses and family members can be comma-separated.',
    fields: [
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'first_name', label: 'First Name', required: true },
      { key: 'last_name', label: 'Last Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'phone', label: 'Phone', required: false },
      { key: 'membership_tier', label: 'Membership Tier', required: true, type: 'enum', options: ['Full Golf', 'House', 'Corporate', 'Junior', 'Social'] },
      { key: 'status', label: 'Status', required: true, type: 'enum', options: ['Active', 'Waitlist', 'Prospect', 'Resigned'] },
      { key: 'join_date', label: 'Join Date', required: true, type: 'date' },
      { key: 'annual_dues', label: 'Annual Dues', required: false, type: 'number' },
      { key: 'address', label: 'Address', required: false },
      { key: 'city', label: 'City', required: false },
      { key: 'state', label: 'State', required: false },
      { key: 'postal_code', label: 'Postal Code', required: false },
      { key: 'spouse_name', label: 'Spouse Name', required: false },
      { key: 'family_members', label: 'Family Members', required: false },
      { key: 'birthday', label: 'Birthday', required: false, type: 'date' },
      { key: 'communication_preference', label: 'Communication Preference', required: false, type: 'enum', options: ['Call', 'SMS', 'Email'] },
    ],
    sampleRows: [
      {
        member_id: 'mbr_450', first_name: 'Lena', last_name: 'Avery', email: 'lena.avery@example.com', phone: '(602) 555-0145',
        membership_tier: 'Full Golf', status: 'Active', join_date: '2018-03-19', annual_dues: 18000, address: '8721 Desert Bloom Trl',
        city: 'Scottsdale', state: 'AZ', postal_code: '85255', spouse_name: 'Mason Avery', family_members: 'Mason Avery; Drew Avery',
        birthday: '1984-07-06', communication_preference: 'Call',
      },
      {
        member_id: 'mbr_612', first_name: 'Devon', last_name: 'Ross', email: 'devon.ross@example.com', phone: '(480) 555-0199',
        membership_tier: 'House', status: 'Active', join_date: '2021-09-02', annual_dues: 9200, address: '41 W Bellflower Rd',
        city: 'Phoenix', state: 'AZ', postal_code: '85054', spouse_name: '', family_members: 'Riley Ross', birthday: '1990-11-18',
        communication_preference: 'Email',
      },
      {
        member_id: 'mbr_731', first_name: 'Karen', last_name: 'Lopez', email: 'karen.lopez@example.com', phone: '(520) 555-0135',
        membership_tier: 'Corporate', status: 'Waitlist', join_date: '2026-01-05', annual_dues: 21000, address: '18 S Arroyo Vista',
        city: 'Tucson', state: 'AZ', postal_code: '85735', spouse_name: 'N/A', family_members: '', birthday: '1978-02-02',
        communication_preference: 'SMS',
      },
    ],
  },
  {
    key: 'tee-times',
    label: 'Tee Times',
    icon: '⛳',
    color: '#F5B97A',
    description: 'Bookings, cancellations, and provenance across courses.',
    instructions: 'Include confirmed and cancelled tee times. Use 24-hour time (HH:MM) and UTC ISO timestamps for cancellations.',
    fields: [
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'time', label: 'Time', required: true },
      { key: 'course', label: 'Course', required: true },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'player_count', label: 'Player Count', required: true, type: 'number' },
      { key: 'booking_source', label: 'Booking Source', required: false },
      { key: 'status', label: 'Status', required: true, type: 'enum', options: ['Booked', 'Cancelled', 'No Show', 'Completed'] },
      { key: 'cancellation_time', label: 'Cancellation Time', required: false },
      { key: 'weather_conditions', label: 'Weather Notes', required: false },
    ],
    sampleRows: [
      {
        date: '2026-01-17', time: '07:12', course: 'North Course', member_id: 'mbr_089', player_count: 4, booking_source: 'ForeTees',
        status: 'Booked', cancellation_time: '', weather_conditions: 'Calm 52°F',
      },
      {
        date: '2026-01-17', time: '08:04', course: 'North Course', member_id: 'mbr_203', player_count: 3, booking_source: 'Concierge',
        status: 'Booked', cancellation_time: '', weather_conditions: 'Wind advisory',
      },
      {
        date: '2026-01-15', time: '10:20', course: 'South Course', member_id: 'mbr_271', player_count: 2, booking_source: 'Noteefy Export',
        status: 'Cancelled', cancellation_time: '2026-01-14T15:42:00Z', weather_conditions: 'Rain delay',
      },
    ],
  },
  {
    key: 'fnb-transactions',
    label: 'F&B Transactions',
    icon: '🍽',
    color: '#D97706',
    description: 'Post-round conversion, check details, and staff attribution.',
    instructions: 'Record each check as a transaction. Totals should be inclusive of tax. Use 2 decimal places for currency.',
    fields: [
      { key: 'transaction_id', label: 'Transaction ID', required: true },
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'time', label: 'Time', required: true },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'outlet', label: 'Outlet', required: true },
      { key: 'items', label: 'Items', required: false },
      { key: 'total', label: 'Total', required: true, type: 'number' },
      { key: 'tip', label: 'Tip', required: false, type: 'number' },
      { key: 'server', label: 'Server', required: false },
      { key: 'party_size', label: 'Party Size', required: false, type: 'number' },
    ],
    sampleRows: [
      {
        transaction_id: 'chk_8321', date: '2026-01-16', time: '12:42', member_id: 'mbr_203', outlet: 'Grill Room',
        items: '2 burgers; 2 iced tea', total: 68.50, tip: 12.00, server: 'Elena', party_size: 2,
      },
      {
        transaction_id: 'chk_8354', date: '2026-01-16', time: '19:05', member_id: 'mbr_146', outlet: 'Wine Dinner',
        items: 'Chef tasting menu', total: 214.00, tip: 40.00, server: 'Marco', party_size: 2,
      },
      {
        transaction_id: 'chk_8401', date: '2026-01-17', time: '07:55', member_id: 'mbr_312', outlet: 'Halfway House',
        items: 'Breakfast burrito; cold brew', total: 21.75, tip: 4.00, server: 'Self Serve', party_size: 1,
      },
    ],
  },
  {
    key: 'reservations',
    label: 'Reservations',
    icon: '📋',
    color: '#F3922D',
    description: 'Dining, spa, and on-property reservations beyond tee sheet.',
    instructions: 'Reservation times must be local in HH:MM. Use special_requests to capture seating notes or dietary needs.',
    fields: [
      { key: 'reservation_id', label: 'Reservation ID', required: true },
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'time', label: 'Time', required: true },
      { key: 'outlet', label: 'Outlet / Location', required: true },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'party_size', label: 'Party Size', required: true, type: 'number' },
      { key: 'status', label: 'Status', required: true, type: 'enum', options: ['Confirmed', 'Waitlist', 'Cancelled', 'No Show', 'Completed'] },
      { key: 'special_requests', label: 'Special Requests', required: false },
    ],
    sampleRows: [
      {
        reservation_id: 'res_9101', date: '2026-01-19', time: '18:30', outlet: 'Main Dining', member_id: 'mbr_146',
        party_size: 4, status: 'Confirmed', special_requests: 'Booth 6, pescatarian menu',
      },
      {
        reservation_id: 'res_9102', date: '2026-01-20', time: '12:15', outlet: 'Grill Room', member_id: 'mbr_271',
        party_size: 2, status: 'Completed', special_requests: 'Quiet corner table',
      },
      {
        reservation_id: 'res_9103', date: '2026-01-22', time: '10:00', outlet: 'Spa', member_id: 'mbr_055',
        party_size: 1, status: 'Cancelled', special_requests: 'Massage therapist preference',
      },
    ],
  },
  {
    key: 'staffing',
    label: 'Staffing',
    icon: '🧑‍🍳',
    color: '#D97706',
    description: 'Scheduled coverage, actual hours, and overtime tracking.',
    instructions: 'Use 24-hour time for shifts. Overtime should be decimal hours (e.g., 1.5).',
    fields: [
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'shift_start', label: 'Shift Start', required: true },
      { key: 'shift_end', label: 'Shift End', required: true },
      { key: 'employee_name', label: 'Employee Name', required: true },
      { key: 'department', label: 'Department', required: true },
      { key: 'role', label: 'Role', required: true },
      { key: 'scheduled_hours', label: 'Scheduled Hours', required: true, type: 'number' },
      { key: 'actual_hours', label: 'Actual Hours', required: true, type: 'number' },
      { key: 'overtime', label: 'Overtime Hours', required: false, type: 'number' },
    ],
    sampleRows: [
      {
        date: '2026-01-16', shift_start: '10:00', shift_end: '18:00', employee_name: 'Elena Parson', department: 'F&B', role: 'Server',
        scheduled_hours: 8, actual_hours: 9.2, overtime: 1.2,
      },
      {
        date: '2026-01-16', shift_start: '09:00', shift_end: '17:00', employee_name: 'Marco Ruiz', department: 'F&B', role: 'Floor Captain',
        scheduled_hours: 8, actual_hours: 7.5, overtime: 0,
      },
      {
        date: '2026-01-17', shift_start: '05:30', shift_end: '14:00', employee_name: 'Chris Ward', department: 'Golf', role: 'Starter',
        scheduled_hours: 8.5, actual_hours: 8.5, overtime: 0,
      },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    icon: '🎟',
    color: '#F5B97A',
    description: 'Club events, attendance, and departmental attribution.',
    instructions: 'Revenue should include ancillary sales tied to the event. Attendance counts should be numeric.',
    fields: [
      { key: 'event_id', label: 'Event ID', required: true },
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'name', label: 'Event Name', required: true },
      { key: 'type', label: 'Event Type', required: true },
      { key: 'member_attendees', label: 'Member Attendees', required: true, type: 'number' },
      { key: 'non_member_attendees', label: 'Guest Attendees', required: false, type: 'number' },
      { key: 'revenue', label: 'Revenue', required: false, type: 'number' },
      { key: 'department', label: 'Department', required: false },
    ],
    sampleRows: [
      {
        event_id: 'evt_301', date: '2026-01-12', name: 'Wine Dinner: Coastal Pairings', type: 'Dining',
        member_attendees: 32, non_member_attendees: 12, revenue: 12400, department: 'F&B',
      },
      {
        event_id: 'evt_302', date: '2026-01-19', name: 'Nine & Dine', type: 'Golf', member_attendees: 24, non_member_attendees: 8,
        revenue: 6800, department: 'Golf / F&B',
      },
      {
        event_id: 'evt_303', date: '2026-01-25', name: 'Board Reception', type: 'Membership', member_attendees: 14, non_member_attendees: 0,
        revenue: 0, department: 'Membership',
      },
    ],
  },
  {
    key: 'complaints',
    label: 'Complaints & Feedback',
    icon: '🛎',
    color: '#B45309',
    description: 'Service recovery workflow with ownership and sentiment.',
    instructions: 'Severity is on a 1-5 scale. Resolution dates should be blank until closed.',
    fields: [
      { key: 'feedback_id', label: 'Feedback ID', required: true },
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'category', label: 'Category', required: true },
      { key: 'severity', label: 'Severity (1-5)', required: true, type: 'number' },
      { key: 'description', label: 'Description', required: true },
      { key: 'assigned_to', label: 'Assigned To', required: false },
      { key: 'status', label: 'Status', required: true, type: 'enum', options: ['Logged', 'Acknowledged', 'In Progress', 'Resolved', 'Escalated'] },
      { key: 'resolution_date', label: 'Resolution Date', required: false, type: 'date' },
    ],
    sampleRows: [
      {
        feedback_id: 'fb_910', date: '2026-01-16', member_id: 'mbr_203', category: 'Service Speed', severity: 5,
        description: '40 min lunch ticket and no apology.', assigned_to: 'F&B Director', status: 'Escalated', resolution_date: '',
      },
      {
        feedback_id: 'fb_911', date: '2026-01-16', member_id: 'mbr_271', category: 'Service Speed', severity: 4,
        description: 'Lunch pacing inconsistent with corporate guests.', assigned_to: 'Service Recovery', status: 'In Progress', resolution_date: '',
      },
      {
        feedback_id: 'fb_912', date: '2026-01-09', member_id: 'mbr_055', category: 'Experience', severity: 2,
        description: 'Loved the new lounge set-up.', assigned_to: 'Membership', status: 'Resolved', resolution_date: '2026-01-10',
      },
    ],
  },
  {
    key: 'email-engagement',
    label: 'Email Engagement',
    icon: '✉️',
    color: '#3F3F46',
    description: 'Campaign-level signals for opens, clicks, and unsubscribes.',
    instructions: 'Boolean fields should be 1 (true) or 0 (false). Date is send date.',
    fields: [
      { key: 'campaign_id', label: 'Campaign ID', required: true },
      { key: 'date', label: 'Send Date', required: true, type: 'date' },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'sent', label: 'Sent', required: true, type: 'boolean' },
      { key: 'opened', label: 'Opened', required: false, type: 'boolean' },
      { key: 'clicked', label: 'Clicked', required: false, type: 'boolean' },
      { key: 'unsubscribed', label: 'Unsubscribed', required: false, type: 'boolean' },
    ],
    sampleRows: [
      {
        campaign_id: 'cmp_newyear', date: '2026-01-02', member_id: 'mbr_271', sent: 1, opened: 0, clicked: 0, unsubscribed: 0,
      },
      {
        campaign_id: 'cmp_winedinner', date: '2026-01-14', member_id: 'mbr_146', sent: 1, opened: 1, clicked: 1, unsubscribed: 0,
      },
      {
        campaign_id: 'cmp_coursework', date: '2026-01-06', member_id: 'mbr_203', sent: 1, opened: 1, clicked: 0, unsubscribed: 0,
      },
    ],
  },
  {
    key: 'golf-rounds',
    label: 'Golf Rounds',
    icon: '🏌️',
    color: '#F5B97A',
    description: 'Per-round detail for pace, score, and ancillary behavior.',
    instructions: 'Score can be blank for practice rounds. Pace is in minutes.',
    fields: [
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'course', label: 'Course', required: true },
      { key: 'tee_time', label: 'Tee Time', required: true },
      { key: 'holes_played', label: 'Holes Played', required: true, type: 'number' },
      { key: 'score', label: 'Score', required: false, type: 'number' },
      { key: 'pace_of_play_minutes', label: 'Pace (minutes)', required: false, type: 'number' },
      { key: 'cart_rental', label: 'Cart Rental (Y/N)', required: false },
    ],
    sampleRows: [
      {
        date: '2026-01-14', member_id: 'mbr_203', course: 'North Course', tee_time: '08:00', holes_played: 18, score: 78,
        pace_of_play_minutes: 268, cart_rental: 'Y',
      },
      {
        date: '2026-01-12', member_id: 'mbr_089', course: 'North Course', tee_time: '07:10', holes_played: 9, score: 43,
        pace_of_play_minutes: 142, cart_rental: 'N',
      },
      {
        date: '2026-01-09', member_id: 'mbr_271', course: 'South Course', tee_time: '10:30', holes_played: 18, score: '',
        pace_of_play_minutes: 291, cart_rental: 'Y',
      },
    ],
  },
  {
    key: 'fitness-pool',
    label: 'Fitness & Pool Usage',
    icon: '🏊',
    color: '#3F3F46',
    description: 'Facility utilization for wellness spaces.',
    instructions: 'Use local time for check in/out. Activity type can be free text (e.g., Lap Swim, Pilates, Yoga).',
    fields: [
      { key: 'date', label: 'Date', required: true, type: 'date' },
      { key: 'member_id', label: 'Member ID', required: true },
      { key: 'facility', label: 'Facility', required: true },
      { key: 'check_in_time', label: 'Check-in Time', required: true },
      { key: 'check_out_time', label: 'Check-out Time', required: false },
      { key: 'activity_type', label: 'Activity Type', required: false },
    ],
    sampleRows: [
      {
        date: '2026-01-15', member_id: 'mbr_234', facility: 'Fitness Center', check_in_time: '06:35', check_out_time: '07:40', activity_type: 'Spin Class',
      },
      {
        date: '2026-01-16', member_id: 'mbr_146', facility: 'Pool', check_in_time: '15:05', check_out_time: '16:20', activity_type: 'Lap Swim',
      },
      {
        date: '2026-01-17', member_id: 'mbr_089', facility: 'Fitness Center', check_in_time: '05:55', check_out_time: '06:45', activity_type: 'Strength Circuit',
      },
    ],
  },
];

const initialHistory = [
  {
    id: 'hist_members',
    fileName: 'members_january.csv',
    category: 'Members',
    recordCount: 300,
    status: 'Complete',
    uploadedAt: '2026-01-08T18:15:00Z',
    uploadedBy: 'GM · Alice Monroe',
  },
  {
    id: 'hist_tee',
    fileName: 'tee-times_week3.xlsx',
    category: 'Tee Times',
    recordCount: 184,
    status: 'Partial',
    uploadedAt: '2026-01-12T04:12:00Z',
    uploadedBy: 'Golf Ops · Rafael Nunez',
  },
  {
    id: 'hist_fnb',
    fileName: 'grill-room_checks.csv',
    category: 'F&B Transactions',
    recordCount: 412,
    status: 'Failed',
    uploadedAt: '2026-01-14T02:45:00Z',
    uploadedBy: 'F&B Analyst · Maya Chen',
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scoreMatch = (header, field) => {
  if (!header) return 0;
  const normalizedHeader = header.toLowerCase().trim();
  const tokens = normalizedHeader.replace(/[_-]/g, ' ');
  if (tokens === field.key.toLowerCase()) return 1;
  if (tokens === field.label.toLowerCase()) return 0.95;
  if (tokens.includes(field.key.toLowerCase())) return 0.8;
  if (tokens.includes(field.label.toLowerCase())) return 0.75;
  if (field.key.includes(tokens)) return 0.7;
  return 0;
};

export const getTemplates = () => templateLibrary;
export const getTemplateByKey = (key) => templateLibrary.find((tpl) => tpl.key === key) ?? templateLibrary[0];
export const getImportHistory = () => [...initialHistory];

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '0 KB';
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
};

const buildCsvContent = (template) => {
  const headers = template.fields.map((field) => field.key);
  const rows = template.sampleRows.map((row) => headers.map((key) => row[key] ?? ''));
  const instructionsRow = [
    'instructions',
    template.instructions.replace(/\n/g, ' '),
    ...Array(Math.max(0, headers.length - 2)).fill(''),
  ];
  return [headers, ...rows, instructionsRow]
    .map((columns) => columns.map((value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(','))
    .join('\n');
};

export const generateTemplate = (key) => {
  const template = getTemplateByKey(key);
  const content = buildCsvContent(template);
  return {
    fileName: `${template.label.toLowerCase().replace(/\s+/g, '-')}-template.csv`,
    content,
  };
};

export const parseCSV = async (file) => {
  const extension = (file.name.split('.').pop() ?? '').toLowerCase();
  let workbook;
  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array' });
  } else {
    const text = await file.text();
    workbook = XLSX.read(text, { type: 'string' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })[0] ?? [];
  const headers = headerRow.map((header) => (typeof header === 'string' ? header.trim() : String(header)));

  return {
    headers,
    rows,
    sheetName,
  };
};

export const autoMapFields = (headers = [], template) => {
  if (!template) return [];
  return headers.map((header) => {
    const bestMatch = template.fields.reduce((acc, field) => {
      const score = scoreMatch(header, field);
      return score > acc.score ? { field, score } : acc;
    }, { field: null, score: 0 });

    if (!bestMatch.field || bestMatch.score < 0.55) {
      return {
        source: header,
        target: null,
        confidence: 0,
        status: 'unmapped',
      };
    }

    return {
      source: header,
      target: bestMatch.field.key,
      confidence: bestMatch.score,
      status: 'auto',
    };
  });
};

const parseBoolean = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).toLowerCase();
  return ['1', 'true', 'yes', 'y'].includes(normalized);
};

const validateFieldValue = (value, field) => {
  if (value === null || value === undefined || value === '') return null;

  if (field.type === 'date') {
    const date = Date.parse(value);
    return Number.isNaN(date) ? 'Expected ISO date (YYYY-MM-DD)' : null;
  }

  if (field.type === 'number') {
    return Number.isNaN(Number(value)) ? 'Expected numeric value' : null;
  }

  if (field.type === 'enum') {
    return field.options && !field.options.includes(value)
      ? `Value must be one of: ${field.options.join(', ')}`
      : null;
  }

  if (field.type === 'boolean') {
    return parseBoolean(value) === null ? 'Use 1/0 or true/false' : null;
  }

  return null;
};

export const validateRows = (rows = [], mappings = [], template) => {
  if (!rows.length || !template) {
    return {
      totals: { ready: 0, warnings: 0, errors: 0 },
      issues: { structural: [], warnings: [], errors: [] },
      previewRows: [],
      status: 'idle',
    };
  }

  const targetFieldMap = new Map(template.fields.map((field) => [field.key, field]));
  const requiredFields = template.fields.filter((field) => field.required);
  const targetBySource = new Map(mappings.filter((mapping) => mapping.target).map((mapping) => [mapping.source, mapping.target]));
  const structural = [];

  requiredFields.forEach((field) => {
    const mapped = mappings.some((mapping) => mapping.target === field.key);
    if (!mapped) {
      structural.push(`Map the required field “${field.label}”.`);
    }
  });

  let ready = 0;
  let warnings = 0;
  let errors = 0;
  const warningIssues = [];
  const errorIssues = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for header, +1 for 1-based display
    let rowHasError = false;
    let rowHasWarning = false;

    mappings.forEach((mapping) => {
      if (!mapping.target) return;
      const field = targetFieldMap.get(mapping.target);
      if (!field) return;
      const value = row[mapping.source];

      if (field.required && (value === null || value === undefined || value === '')) {
        rowHasError = true;
        errorIssues.push(`Row ${rowNumber}: “${field.label}” is required.`);
        return;
      }

      const validationMessage = validateFieldValue(value, field);
      if (validationMessage) {
        if (field.required) {
          rowHasError = true;
          errorIssues.push(`Row ${rowNumber}: ${validationMessage} for “${field.label}”.`);
        } else {
          rowHasWarning = true;
          warningIssues.push(`Row ${rowNumber}: ${validationMessage} for “${field.label}”.`);
        }
      }
    });

    if (rowHasError) {
      errors += 1;
    } else if (rowHasWarning) {
      warnings += 1;
    } else {
      ready += 1;
    }
  });

  const status = structural.length > 0 || errors > 0 ? 'blocked' : warnings > 0 ? 'warnings' : 'ready';

  return {
    totals: { ready, warnings, errors },
    issues: {
      structural,
      warnings: warningIssues.slice(0, 12),
      errors: errorIssues.slice(0, 12),
    },
    previewRows: rows.slice(0, 5),
    status,
  };
};

export const importData = async ({
  templateKey,
  fileMeta,
  validation,
  mappings,
  uploadedBy = 'GM Console',
}) => {
  await sleep(900);
  const template = getTemplateByKey(templateKey);
  const status = validation?.totals.errors > 0
    ? 'Failed'
    : validation?.totals.warnings > 0
      ? 'Partial'
      : 'Complete';

  const newEntry = {
    id: `hist_${Date.now()}`,
    fileName: fileMeta?.name ?? `${template.label.toLowerCase()}_import.csv`,
    category: template.label,
    recordCount: validation?.totals.ready ?? 0,
    status,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };

  return newEntry;
};

export const getDataArchitectPlaybook = () => {
  return templateLibrary.map((template) => ({
    templateKey: template.key,
    templateLabel: template.label,
    requiredFieldKeys: template.fields.filter((field) => field.required).map((field) => field.key),
    optionalFieldKeys: template.fields.filter((field) => !field.required).map((field) => field.key),
    validationRules: template.fields
      .filter((field) => field.type)
      .map((field) => ({
        field: field.key,
        type: field.type,
        options: field.options ?? null,
      })),
  }));
};
