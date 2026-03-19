import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Seed booking_confirmations
    await sql`INSERT INTO booking_confirmations (confirmation_id, member_id, member_name, booking_id, tee_time, cancel_probability, outreach_status, outreach_channel, staff_notes, created_at)
      VALUES
        ('conf_001', 'mbr_203', 'James Whitfield', 'bkg_sat_0920', 'Sat 9:20 AM', 0.42, 'pending', NULL, NULL, NOW()),
        ('conf_002', 'mbr_089', 'Anne Jordan', 'bkg_sat_0700', 'Sat 7:00 AM', 0.28, 'contacted', 'sms', NULL, NOW()),
        ('conf_003', 'mbr_271', 'Robert Callahan', 'bkg_sat_1040', 'Sat 10:40 AM', 0.35, 'pending', NULL, NULL, NOW()),
        ('conf_004', 'mbr_146', 'David Chen', 'bkg_sat_0800', 'Sat 8:00 AM', 0.15, 'confirmed', NULL, NULL, NOW())
      ON CONFLICT (confirmation_id) DO NOTHING`;

    // Seed slot_reassignments
    await sql`INSERT INTO slot_reassignments (reassignment_id, source_booking_id, source_slot, source_member_id, source_member_name, recommended_fill_member_id, recommended_fill_member_name, status, revenue_recovered, health_before, health_after)
      VALUES
        ('rea_001', 'bkg_sat_0700', 'Sat 7:00 AM', 'mbr_089', 'Anne Jordan', 'mbr_312', 'David Chen', 'pending', 312, 54, 62),
        ('rea_002', 'bkg_sat_1400', 'Sat 2:00 PM (cancelled)', 'mbr_xxx', 'Cancelled Member', 'mbr_089', 'Anne Jordan', 'pending', 312, 71, 74)
      ON CONFLICT (reassignment_id) DO NOTHING`;

    // Seed waitlist_config
    await sql`INSERT INTO waitlist_config (club_id, hold_time_minutes, auto_offer_threshold, max_offers, notification_limit)
      VALUES
        ('oakmont', 30, 0.80, 3, 2)
      ON CONFLICT (club_id) DO NOTHING`;

    res.status(200).json({ ok: true, message: 'Tee sheet ops seed data inserted.' });
  } catch (err) {
    console.error('/api/seed-tee-sheet-ops error:', err);
    res.status(500).json({ error: err.message });
  }
}
