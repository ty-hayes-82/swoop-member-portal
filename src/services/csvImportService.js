// Vendor-specific column aliases for CSV column auto-mapping. Consumed by csvImportService.test.js
// to lock the contract for the most-used vendor exports (Jonas, ForeTees, Toast, ADP).
export const VENDOR_COLUMN_ALIASES = {
  'ForeTees':    { 'Booking Time': 'tee_time', 'Player Name': 'member_id', 'Tee Date': 'date', 'Course Name': 'course' },
  'Toast':       { 'Check #': 'transaction_id', 'Opened': 'date', 'Server Name': 'server', 'Total Due': 'total' },
  'ADP':         { 'Employee': 'employee_name', 'Dept': 'department', 'Sched Hrs': 'scheduled_hours', 'Act Hrs': 'actual_hours' },
  'Jonas':       {
    // Members (JCM_Members_F9)
    'Member #': 'member_id', 'Member Number': 'external_id', 'Given Name': 'first_name',
    'Surname': 'last_name', 'Email': 'email', 'Phone #': 'phone', 'Birthday': 'birthday',
    'Sex': 'sex', 'Membership Type': 'membership_tier', 'Status': 'status',
    'Date Joined': 'join_date', 'Date Resigned': 'date_resigned', 'Household ID': 'household_id',
    'Annual Fee': 'annual_dues', 'Current Balance': 'current_balance', 'Handicap #': 'handicap',
    'Mailings': 'communication_preference', 'Acct Balance': 'annual_dues', 'Join Dt': 'join_date',
    'Last Name': 'last_name',
    // Membership Types (JCM_Membership_Types_F9)
    'Type Code': 'type_code', 'Description': 'description', 'F&B Minimum': 'fnb_minimum',
    'Golf Eligible': 'golf_eligible',
    // Dependents (JCM_Dependents_F9)
    'Primary Member #': 'primary_member_id', 'Dependent Count': 'dependent_count',
    'Home Address': 'home_address',
    // Club Profile (JCM_Club_Profile)
    'Club Name': 'club_name', 'City': 'city', 'State': 'state', 'ZIP': 'zip',
    'Founded Year': 'founded_year', 'Member Count': 'member_count',
    'Course Count': 'course_count', 'Outlet Count': 'outlet_count',
    // Tee Sheet (TTM_Tee_Sheet_SV)
    'Reservation ID': 'reservation_id', 'Course': 'course', 'Date': 'date',
    'Tee Time': 'tee_time', 'Players': 'players', 'Guest Flag': 'guest_flag',
    'Transportation': 'transportation', 'Caddie': 'caddie', 'Holes': 'holes',
    'Check-In Time': 'check_in_time', 'Round Start': 'round_start',
    'Round End': 'round_end', 'Duration (min)': 'duration_min',
    // Tee Sheet Players (TTM_Tee_Sheet_Players_SV)
    'Player ID': 'player_id', 'Guest Name': 'guest_name', 'Position': 'position',
    // Course Setup (TTM_Course_Setup_F9)
    'Course Code': 'course_code', 'Course Name': 'course_name', 'Par': 'par',
    'Interval (min)': 'interval_min', 'Start Time': 'start_time', 'End Time': 'end_time',
    // POS Sales (POS_Sales_Detail_SV)
    'Chk#': 'transaction_id', 'Sales Area': 'outlet', 'Open Time': 'open_time',
    'Close Time': 'close_time', 'First Fire': 'first_fire', 'Last Fulfilled': 'last_fulfilled',
    'Net Amount': 'total', 'Tax': 'tax', 'Gratuity': 'tip', 'Comp': 'comp',
    'Discount': 'discount', 'Void': 'void', 'Total Due': 'total_due',
    'Settlement Method': 'settlement_method',
    // POS Line Items (POS_Line_Items_SV)
    'Line Item ID': 'line_item_id', 'Item Description': 'item_description',
    'Sales Category': 'sales_category', 'Regular Price': 'regular_price',
    'Qty': 'qty', 'Line Total': 'line_total', 'Fire Time': 'fire_time',
    // POS Sales Areas (POS_Sales_Areas_F9)
    'Sales Area ID': 'sales_area_id', 'Sales Area Description': 'description',
    'Type': 'type', 'Operating Hours': 'operating_hours',
    'Weekday Covers': 'weekday_covers', 'Weekend Covers': 'weekend_covers',
    // POS Daily Close (POS_Daily_Close_SV)
    'Close ID': 'close_id', 'Golf Revenue': 'golf_revenue', 'F&B Revenue': 'fb_revenue',
    'Total Revenue': 'total_revenue', 'Rounds Played': 'rounds_played',
    'Covers': 'covers', 'Weather': 'weather',
    // Communications (JCM_Communications_RG)
    'Communication ID': 'feedback_id', 'Happometer Score': 'severity',
    'Subject': 'description', 'Complete': 'status', 'Resolution Date': 'resolution_date',
    // Service Requests (JCM_Service_Requests_RG)
    'Request ID': 'request_id', 'Booking Ref': 'booking_ref',
    'Response Time (min)': 'response_time_min', 'Notes': 'notes',
    // Events (JAM_Event_List_SV)
    'Event Number': 'event_id', 'Event Name': 'event_name', 'Event Type': 'event_type',
    'Start Date': 'start_date', 'Capacity': 'capacity', 'Pricing Category': 'pricing_category',
    // Registrations (JAM_Registrations_SV)
    'Registration ID': 'registration_id', 'Client Code': 'member_id',
    'Guest Count': 'guest_count', 'Fee Paid': 'fee_paid', 'Registration Date': 'registration_date',
    // Email Campaigns (CHO_Campaigns_SV)
    'Campaign ID': 'campaign_id', 'Campaign': 'campaign_id',
    'Campaign Type': 'campaign_type', 'Send Date': 'send_date', 'Audience Count': 'audience_count',
    // Email Events (CHO_Email_Events_SV)
    'Event ID': 'event_id', 'Event Type': 'event_type', 'Timestamp': 'timestamp',
    'Link Clicked': 'link_clicked', 'Device': 'device',
    // Aged Receivables (JCM_Aged_Receivables_SV)
    'Invoice #': 'invoice_id', 'Statement Date': 'statement_date', 'Due Date': 'due_date',
    'Billing Code Type': 'billing_code_type', 'Aging Bucket': 'aging_bucket',
    'Last Payment': 'last_payment', 'Payment Amount': 'payment_amount',
    'Days Past Due': 'days_past_due', 'Late Fee': 'late_fee',
    // Staff (ADP_Staff_Roster)
    'Employee ID': 'employee_id', 'First Name': 'first_name',
    'Dept': 'department', 'Job Title': 'job_title', 'Hire Date': 'hire_date',
    'Hourly Rate': 'hourly_rate', 'FT/PT': 'ft_pt',
  },
  'Mailchimp':   { 'Campaign Name': 'campaign_id', 'Email Address': 'email', 'Opens': 'opened', 'Clicks': 'clicked' },
  'Lightspeed':  { 'Receipt #': 'transaction_id', 'Sale Total': 'total', 'Tender': 'payment_method', 'Sale Date': 'date' },
  'Square':      { 'Transaction ID': 'transaction_id', 'Net Total': 'total', 'Tip Amount': 'tip', 'Date': 'date' },
  'Chronogolf':  { 'Reservation Time': 'tee_time', 'Player': 'member_id', 'Course': 'course' },
  'ForeUP':      { 'Tee Time': 'tee_time', 'Golfer': 'member_id', 'Holes': 'holes_played' },
  '7shifts':     { 'Shift ID': 'shift_id', 'Employee ID': 'employee_id', 'Staff': 'employee_name', 'Role': 'role', 'Date': 'date', 'Location': 'location', 'Shift Start': 'shift_start', 'Shift End': 'shift_end', 'Act Hrs': 'actual_hours', 'Notes': 'notes' },
};
