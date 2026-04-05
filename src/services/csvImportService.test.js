import { describe, it, expect } from 'vitest';
import { VENDOR_COLUMN_ALIASES } from './csvImportService';

describe('Jonas CSV Column Aliases', () => {
  const jonas = VENDOR_COLUMN_ALIASES['Jonas'];

  it('maps all required member fields from Jonas export headers', () => {
    // Jonas JCM_Members_F9 export columns
    expect(jonas['Given Name']).toBe('first_name');
    expect(jonas['Surname']).toBe('last_name');
    expect(jonas['Last Name']).toBe('last_name');
    expect(jonas['Member #']).toBe('member_id');
    expect(jonas['Member Number']).toBe('external_id');
    expect(jonas['Email']).toBe('email');
    expect(jonas['Phone #']).toBe('phone');
    expect(jonas['Date Joined']).toBe('join_date');
    expect(jonas['Join Dt']).toBe('join_date');
    expect(jonas['Membership Type']).toBe('membership_tier');
    expect(jonas['Annual Fee']).toBe('annual_dues');
    expect(jonas['Acct Balance']).toBe('annual_dues');
    expect(jonas['Birthday']).toBe('birthday');
    expect(jonas['Sex']).toBe('sex');
    expect(jonas['Handicap #']).toBe('handicap');
    expect(jonas['Status']).toBe('status');
    expect(jonas['Household ID']).toBe('household_id');
    expect(jonas['Current Balance']).toBe('current_balance');
    expect(jonas['Date Resigned']).toBe('date_resigned');
  });

  it('maps Jonas tee sheet columns', () => {
    expect(jonas['Reservation ID']).toBe('reservation_id');
    expect(jonas['Course']).toBe('course');
    expect(jonas['Date']).toBe('date');
    expect(jonas['Tee Time']).toBe('tee_time');
    expect(jonas['Players']).toBe('players');
    expect(jonas['Guest Flag']).toBe('guest_flag');
    expect(jonas['Transportation']).toBe('transportation');
    expect(jonas['Caddie']).toBe('caddie');
    expect(jonas['Duration (min)']).toBe('duration_min');
    expect(jonas['Check-In Time']).toBe('check_in_time');
    expect(jonas['Round Start']).toBe('round_start');
    expect(jonas['Round End']).toBe('round_end');
  });

  it('maps Jonas POS columns', () => {
    expect(jonas['Chk#']).toBe('transaction_id');
    expect(jonas['Sales Area']).toBe('outlet');
    expect(jonas['Net Amount']).toBe('total');
    expect(jonas['Tax']).toBe('tax');
    expect(jonas['Gratuity']).toBe('tip');
    expect(jonas['Comp']).toBe('comp');
    expect(jonas['Discount']).toBe('discount');
    expect(jonas['Settlement Method']).toBe('settlement_method');
    expect(jonas['Open Time']).toBe('open_time');
    expect(jonas['Close Time']).toBe('close_time');
  });

  it('maps Jonas event columns', () => {
    expect(jonas['Event Number']).toBe('event_id');
    expect(jonas['Event Name']).toBe('event_name');
    expect(jonas['Event Type']).toBe('event_type');
    expect(jonas['Start Date']).toBe('start_date');
    expect(jonas['Capacity']).toBe('capacity');
    expect(jonas['Registration ID']).toBe('registration_id');
    expect(jonas['Client Code']).toBe('member_id');
    expect(jonas['Guest Count']).toBe('guest_count');
    expect(jonas['Fee Paid']).toBe('fee_paid');
  });

  it('maps Jonas complaint/feedback columns', () => {
    expect(jonas['Communication ID']).toBe('feedback_id');
    expect(jonas['Happometer Score']).toBe('severity');
    expect(jonas['Subject']).toBe('description');
    expect(jonas['Complete']).toBe('status');
    expect(jonas['Resolution Date']).toBe('resolution_date');
  });

  it('has no undefined mappings (all values are strings)', () => {
    for (const [key, value] of Object.entries(jonas)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('covers all major Jonas data domains', () => {
    const values = Object.values(jonas);
    // Members
    expect(values).toContain('first_name');
    expect(values).toContain('last_name');
    expect(values).toContain('email');
    // Tee sheet
    expect(values).toContain('tee_time');
    expect(values).toContain('reservation_id');
    // POS
    expect(values).toContain('transaction_id');
    expect(values).toContain('outlet');
    // Events
    expect(values).toContain('event_id');
    expect(values).toContain('registration_id');
    // Complaints
    expect(values).toContain('feedback_id');
  });
});

describe('Vendor Column Aliases Coverage', () => {
  it('has aliases for all 4 major vendors', () => {
    expect(VENDOR_COLUMN_ALIASES).toHaveProperty('Jonas');
    expect(VENDOR_COLUMN_ALIASES).toHaveProperty('ForeTees');
    expect(VENDOR_COLUMN_ALIASES).toHaveProperty('Toast');
    expect(VENDOR_COLUMN_ALIASES).toHaveProperty('ADP');
  });

  it('Jonas has the most comprehensive mapping (50+ aliases)', () => {
    const jonasCount = Object.keys(VENDOR_COLUMN_ALIASES['Jonas']).length;
    expect(jonasCount).toBeGreaterThanOrEqual(50);
  });
});
