/**
 * Static extraction guides for vendor data exports.
 *
 * Each guide provides step-by-step instructions for exporting data
 * from a specific vendor system, along with tips and common issues.
 */

export const EXTRACTION_GUIDES = {
  'jonas:members': {
    steps: [
      'Log in to Jonas Club Software.',
      'Navigate to Club Management → Member Information → Member Maintenance.',
      'Press F9 to open the F9 Lister.',
      'Select the columns you need: Member #, Name, Address, Phone, Email, Membership Type, Status, Join Date, Billing Class.',
      'Click "Select All" to include all members, or use Filter to narrow by status (A = Active).',
      'Click Export → choose "Excel" or "CSV" format.',
      'Save the file and upload it to Swoop.',
    ],
    tips: [
      'Member IDs are zero-prefixed (e.g. "007542"). Export as text/CSV to preserve leading zeros — Excel will strip them.',
      'If you only need active members, filter Status = "A" before exporting to reduce cleanup.',
      'The F9 Lister remembers your last column selection. Double-check that all required columns are included.',
      'Export from Member Maintenance, not AR — the AR module has a different column set and may include sub-accounts.',
    ],
    commonIssues: [
      'Leading zeros stripped from Member IDs when opened in Excel. Re-export as CSV and upload directly without opening in Excel.',
      '1-3 metadata rows above the header (report title, date, filters). Swoop will auto-detect and skip these.',
      'Spouse/dependent records mixed in with primary members. Filter on "Relation" = "Primary" or "Member" if you only want primary accounts.',
      'Date columns in mixed formats (MM/DD/YYYY in some rows, M/D/YY in others). Swoop normalizes these automatically.',
    ],
  },

  'jonas:tee_times': {
    steps: [
      'Navigate to Golf → Tee Sheet → Tee Sheet Reports.',
      'Select "Tee Time Detail" report.',
      'Set the date range for the period you want to export.',
      'Press F9 to open the Lister with all columns.',
      'Include: Date, Time, Member #, Player Name, Guests, Holes, Cart, Rate Code.',
      'Export to CSV.',
    ],
    tips: [
      'Export in monthly batches for large date ranges — exports over 50,000 rows may time out.',
      'The "Holes" column may say "18" or "9". Swoop uses this to calculate total rounds.',
      'Guest rounds are linked to the booking member via the Member # column.',
    ],
    commonIssues: [
      'Cancelled tee times may still appear with a "Status" = "C". Filter these out or Swoop will flag them during validation.',
      'Times are in 12-hour format without AM/PM in some Jonas versions. Verify that 1:00 means 1 PM, not 1 AM.',
      'Rain-out dates show bookings that never happened. Cross-reference with actual play records if available.',
    ],
  },

  'jonas:transactions': {
    steps: [
      'Navigate to POS → Reports → Sales Analysis → Detail Sales Report.',
      'Set the date range. For initial import, go back at least 12 months.',
      'Press F9 and select: Check #, Date, Member #, Activity Code, Description, Amount, Tax, Tip, Server.',
      'Uncheck "Include Subtotals" in the report options.',
      'Export to CSV.',
    ],
    tips: [
      'Uncheck "Include Subtotals" or Swoop will count them as separate line items and inflate revenue.',
      'Activity codes are your best friend: GF = green fee, FC = food, BC = bar, PR = pro shop. Swoop maps these automatically.',
      'If you have multiple POS outlets (Grill, Bar, Pro Shop), you can export each separately or all at once — Swoop uses the Activity Code to categorize.',
    ],
    commonIssues: [
      'Subtotal and grand-total rows imported as transactions. Always uncheck "Include Subtotals" before exporting.',
      'Voided checks still appear in the export. Look for negative amounts or "VOID" in the description.',
      'Member charges and cash/credit payments are separate rows for the same check. Swoop reconciles them by Check #.',
    ],
  },

  'jonas:complaints': {
    steps: [
      'Navigate to Club Management → Member Relations → Comment Tracking.',
      'Set the date range and optionally filter by category (Complaint, Suggestion, Compliment).',
      'Press F9 and include: Date, Member #, Category, Department, Subject, Description, Status, Resolved Date.',
      'Export to CSV.',
    ],
    tips: [
      'If your club does not use Jonas Comment Tracking, complaints may be in email threads or a separate system. Ask staff where complaints are logged.',
      'The "Department" field maps to Swoop complaint categories (F&B, Golf, Facilities, etc.).',
    ],
    commonIssues: [
      'Free-text Description field may contain commas and line breaks that break CSV parsing. Swoop handles quoted fields, but verify the export uses proper quoting.',
      'Older complaints may have no Member # if they were logged anonymously. Swoop will import them as unlinked complaints.',
    ],
  },

  'jonas:events': {
    steps: [
      'Navigate to Club Management → Event Management → Event List.',
      'Set the date range to cover all events you want to import.',
      'Press F9 and include: Event Name, Date, Start Time, End Time, Location, Category, Max Attendees, Registered Count, Price.',
      'Export to CSV.',
      'For attendee lists: open each event → Registrants tab → F9 → Export.',
    ],
    tips: [
      'Event attendees are a separate export from event definitions. Import events first, then attendees.',
      'If events have multiple price tiers (Member, Guest, Child), each tier may export as a separate row. Swoop groups them by Event Name + Date.',
    ],
    commonIssues: [
      'Recurring events (e.g. "Friday Fish Fry") export as one row with a recurrence rule, not individual dates. Swoop needs individual occurrences — ask staff to expand recurrences before exporting.',
      'Past events with zero registrations are still useful for historical analysis. Do not filter them out.',
    ],
  },

  'jonas:email': {
    steps: [
      'Navigate to Club Management → Communication → Email Blast History.',
      'Set the date range.',
      'Press F9 and include: Send Date, Subject, Recipients Count, Open Count, Click Count, Campaign Type.',
      'Export to CSV.',
      'For per-member engagement, go to Member Communication Log and export by member.',
    ],
    tips: [
      'Jonas email tracking is limited compared to Mailchimp/Constant Contact. If the club uses a third-party email platform, import from there instead.',
      'Campaign-level metrics (opens, clicks) are more reliable than per-member metrics in Jonas.',
    ],
    commonIssues: [
      'Open/click counts may be inflated by email preview panes. This is normal across all email platforms.',
      'If the club switched email platforms mid-year, you will need exports from both systems to get full coverage.',
    ],
  },

  'foretees:tee_times': {
    steps: [
      'Log in to ForeTees as an administrator.',
      'Navigate to Admin → Reports → Tee Sheet Reports → Booking Report.',
      'Set the date range. Use "Custom Range" for historical exports.',
      'Select output format: CSV.',
      'Check all player detail columns: Booking Time, Player Name, Member #, Email, Type, Slots, Course.',
      'Click "Run Report" then "Download CSV".',
    ],
    tips: [
      'The column is named "Booking Time", not "Tee Time". Swoop maps this automatically.',
      'Dates are YYYY-MM-DD by default. Do not reformat them.',
      'Player count is per slot. A foursome booked as one group shows as 1 row with Slots = 4.',
      'If the club has multiple courses, export each course separately or include the "Course" column to distinguish them.',
    ],
    commonIssues: [
      'Lottery/ballot tee times may appear with a "Pending" status before assignment. Filter to "Confirmed" only for accurate booking data.',
      'Guest names may be blank or "Guest of [Member]". Swoop links these to the booking member.',
      'Crossover bookings (9-hole players starting on back nine) may have non-standard times. They are valid.',
    ],
  },

  'toast:transactions': {
    steps: [
      'Log in to Toast as a restaurant admin.',
      'Navigate to Reports → Sales → Payments → click "Export" in the top right.',
      'Set the date range. Toast allows up to 1 year at a time.',
      'Choose "All Locations" if the club has multiple Toast outlets, or filter to one.',
      'Click "Export CSV". Toast will email the file — check your inbox.',
      'For line-item detail: go to Reports → Sales → Menu Item Sales → Export CSV.',
    ],
    tips: [
      '"Check #" is the primary identifier. Use it to link payment-level and item-level exports.',
      'Tip Amount and Auto Gratuity are separate columns. Swoop sums both for total gratuity.',
      'Toast exports are emailed, not downloaded directly. Check spam if you do not see it within 5 minutes.',
      'For member-charge matching, you need the "Customer" or "Table Name" column. Some clubs put the member number in Table Name.',
    ],
    commonIssues: [
      'Voids and refunds appear as rows with negative amounts. Swoop flags these during validation — do not delete them.',
      'Tax is included in the "Amount" on some Toast configurations. Check if "Tax" is a separate column or if amounts are tax-inclusive.',
      'Large exports (>100k rows) may be split into multiple emails. Combine them before uploading.',
      'Auto-gratuity on large parties appears in a separate column from voluntary tips. Both should be imported.',
    ],
  },

  'adp:staff': {
    steps: [
      'Log in to ADP Workforce Now.',
      'Navigate to Reports → Report Library → Custom Reports.',
      'Create or select a report with fields: File Number, First Name, Last Name, Home Department, Job Title, Hire Date, Status, Pay Rate, Email.',
      'Run the report for all employees.',
      'Click "Export" → choose CSV format.',
      'Remove any columns containing SSN, bank account, or routing numbers before uploading.',
    ],
    tips: [
      'CRITICAL: Strip all PII columns (SSN, bank info, direct deposit details) before uploading to Swoop. Swoop will reject files containing SSN patterns.',
      '"File Number" is the employee ID in ADP. Map it to Swoop staff_id.',
      '"Home Department" maps to Swoop department (F&B, Golf, Admin, Facilities, etc.).',
      'If you need shift/schedule data and ADP does not have it, check if the club uses 7shifts, HotSchedules, or a paper schedule.',
    ],
    commonIssues: [
      'SSN or partial SSN columns included in export. These MUST be removed before upload.',
      'Terminated employees included with Status = "Terminated". Keep them — Swoop uses historical staff data for trend analysis.',
      'Multiple job records per employee (e.g. someone who is both a server and bartender). Swoop uses the primary (Home Department) record.',
      'Pay Rate column may be blank for salaried employees. This is expected.',
    ],
  },

  '7shifts:shifts': {
    steps: [
      'Log in to 7shifts as an admin.',
      'Navigate to Reports → Shift Data → Export.',
      'Set the date range. For initial import, go back 12 months.',
      'Select all locations if the club has multiple (e.g. Clubhouse, Pool Bar, Event Center).',
      'Choose CSV format and click "Export".',
    ],
    tips: [
      'The "Location" column is critical for multi-department clubs. It maps to Swoop department.',
      'Shift times are in the club\'s local timezone. Verify no UTC conversion has been applied.',
      'If the club has both 7shifts and ADP, use 7shifts for shift data and ADP for employee master data.',
      'Published vs. actual shift times may differ. The export shows scheduled shifts, not clock-in/out times unless you export from the "Timesheets" section.',
    ],
    commonIssues: [
      'Shifts spanning multiple locations appear as separate rows. This is correct — each location-shift is one record.',
      'Wage column may be absent for salaried staff. Do not treat this as an error.',
      'Open shifts (not assigned to an employee) may appear with a blank employee name. Swoop skips these.',
      'Daylight saving time transitions may cause one shift per year to appear 1 hour off. Swoop handles this.',
    ],
  },

  'mailchimp:email': {
    steps: [
      'Log in to Mailchimp.',
      'To export campaign history: go to Campaigns → All Campaigns → click a campaign → View Report → click "Export as CSV" under Activity.',
      'To export all contacts: go to Audience → All Contacts → Export Audience (top right) → Export as CSV.',
      'To export aggregate campaign metrics: go to Reports → select date range → Export.',
      'Upload the contacts export first (for email matching), then campaign exports.',
    ],
    tips: [
      '"Email Address" is the join key. Swoop matches contacts to members by email (case-insensitive).',
      'Export the full audience, including unsubscribed contacts. Swoop tracks opt-out status.',
      'Campaign exports include open/click timestamps per subscriber. This is the richest engagement data available.',
      'If the club uses Mailchimp tags or segments, include the "Tags" column — Swoop can map these to member interests.',
    ],
    commonIssues: [
      'Mailchimp audience export may include non-member emails (vendors, staff, prospects). Swoop will flag unmatched emails during import.',
      'Open tracking is unreliable since Apple Mail Privacy Protection (Sept 2021). Click data is more reliable for engagement scoring.',
      'Duplicate email addresses across audiences. Deduplicate before uploading or Swoop will flag them.',
      'Campaign names may be cryptic ("Feb Newsletter v2 FINAL"). Add a "Category" column manually if you want Swoop to categorize them.',
    ],
  },

  'lightspeed:transactions': {
    steps: [
      'Log in to Lightspeed Restaurant (or Retail) back office.',
      'Navigate to Reports → Sales History.',
      'Set the date range. Use "Custom" for historical exports.',
      'Click "Export" → choose CSV.',
      'For line-item detail: go to Reports → Product Sales → Export CSV.',
      'Upload both the Sales History and Product Sales files.',
    ],
    tips: [
      '"Sale ID" links the sales-level and line-item-level exports together.',
      'Tax is broken out per line item, not per sale. Swoop sums line-item tax for the sale total.',
      '"Employee" column maps to Swoop staff. Matching is by name since Lightspeed does not use a staff ID that cross-references to other systems.',
      'If the club uses Lightspeed for both retail (pro shop) and restaurant, these are separate exports. Upload each one.',
    ],
    commonIssues: [
      'Lightspeed Retail and Lightspeed Restaurant are different products with different export formats. Confirm which one the club uses.',
      'Refunds may appear as separate transactions with negative amounts rather than adjustments to the original sale.',
      'Gift card activations/redemptions appear as line items. Swoop categorizes them separately from revenue.',
      'Employee names may vary ("Mike S." vs "Michael Smith"). Provide a name-mapping if needed.',
    ],
  },

  'square:transactions': {
    steps: [
      'Log in to Square Dashboard.',
      'Navigate to Transactions (in the left sidebar).',
      'Set the date range using the date picker at the top.',
      'Click "Export" (top right) → choose CSV.',
      'For item-level detail: go to Items → Reports → Item Sales → Export.',
      'Upload both the transactions file and item sales file.',
    ],
    tips: [
      '"Transaction ID" is the primary key. "Receipt Number" is the customer-facing identifier.',
      'One transaction can have multiple items. The Item Sales CSV provides line-item detail.',
      'Discounts and refunds appear as negative amounts. Do not remove them — Swoop needs them for accurate revenue calculation.',
      'If the club uses Square for multiple departments (bar, grill, pro shop), the "Location" column distinguishes them.',
    ],
    commonIssues: [
      'Square does not have a built-in member ID. If the club links members to Square, it is usually via the "Customer" name or email field. Ask staff how they identify members in Square.',
      'Card-present vs. card-not-present transactions may export differently. Both are valid.',
      'Partial refunds create a new row rather than modifying the original transaction. Swoop links them by Transaction ID.',
      'Tips may be in a separate "Tip" column or combined into "Total". Check the column headers.',
    ],
  },

  'clubessential:members': {
    steps: [
      'Log in to Clubessential admin portal.',
      'Navigate to People → Member Directory → Advanced Search.',
      'Leave all filters blank to get all members, or set Status = "Active" for current members only.',
      'Click "Search" to load results.',
      'Click "Export" (top right) → choose "CSV Export".',
      'Select fields: Member Number, First Name, Last Name, Email, Phone, Membership Type, Status, Join Date, Address, Household ID.',
    ],
    tips: [
      'Export all members (Active, Inactive, Resigned) for full historical analysis. Swoop uses status to filter.',
      'Status codes: A = Active, I = Inactive, S = Suspended, R = Resigned.',
      '"Household ID" or "Family ID" links family members together. Include this column for household analysis.',
      'If the club uses Clubessential CMS + CMA together, member data lives in CMA (Club Management Application).',
    ],
    commonIssues: [
      'Duplicate rows for members with multiple membership types (Social + Golf). Swoop deduplicates by Member Number.',
      'Email addresses may be blank for older/legacy members. Swoop imports them but flags them as "no email on file".',
      'Join Date may be the original join date or the most recent reinstatement date depending on club configuration. Ask staff which it is.',
      'Address fields may be split (Address1, Address2, City, State, Zip) or combined. Both formats are accepted.',
    ],
  },

  'northstar:members': {
    steps: [
      'Log in to Northstar Club Management.',
      'Navigate to Reports → Member Reports → Member Detail Report.',
      'Set filters as needed (Status, Class, etc.) or leave blank for all members.',
      'Click "Generate Report".',
      'Click "Export" → choose "CSV".',
      'Include fields: Member Number, Name, Email, Phone, Billing Class, Status, Join Date, Mailing Address.',
    ],
    tips: [
      'The CSV is encoded as Windows-1252, not UTF-8. If you see garbled characters (accents, special characters), Swoop will auto-detect and convert the encoding.',
      'Member numbers may be alphanumeric (e.g. "G-1042"). Preserve them as-is.',
      '"Billing Class" maps to Swoop membership_type. Common values: Full Golf, Social, Junior, Legacy, etc.',
      'If you need dependent/family member data, run the "Family Members" report separately.',
    ],
    commonIssues: [
      'Character encoding issues with accented names (e.g. "Ren\u00e9" appears as "Ren\u00c3\u00a9"). Swoop auto-converts from Windows-1252.',
      'Status field uses Y/N or Active/Inactive depending on the Northstar version. Both are accepted.',
      'Some fields have trailing whitespace. Swoop trims all fields automatically.',
      'If the club recently migrated to Northstar from another system, older records may have incomplete data. This is normal.',
    ],
  },
};

/**
 * Look up an extraction guide by vendor and data category.
 *
 * @param {string} vendor - Vendor name (case-insensitive): jonas, foretees, toast, etc.
 * @param {string} dataCategory - Data type: members, tee_times, transactions, etc.
 * @returns {{ steps: string[], tips: string[], commonIssues: string[] } | null}
 */
export function getExtractionGuide(vendor, dataCategory) {
  if (!vendor || !dataCategory) return null;
  const key = `${vendor.toLowerCase().trim()}:${dataCategory.toLowerCase().trim()}`;
  return EXTRACTION_GUIDES[key] || null;
}
