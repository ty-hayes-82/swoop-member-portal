/**
 * Migration 008: Add columns needed for Jonas CSV import
 *
 * All target tables already exist in schema.sql. This migration adds
 * columns that Jonas CSVs provide but the original schema didn't include,
 * plus ensures data_source and club_id exist on import target tables.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const errors = [];

  // Columns to add for Jonas import compatibility
  const alterations = [
    // Members: Jonas-specific fields
    { table: 'members', column: 'birthday', type: 'DATE' },
    { table: 'members', column: 'sex', type: 'TEXT' },
    { table: 'members', column: 'handicap', type: 'TEXT' },
    { table: 'members', column: 'current_balance', type: 'NUMERIC(10,2)' },
    { table: 'members', column: 'date_resigned', type: 'DATE' },
    { table: 'members', column: 'mailings', type: 'BOOLEAN' },
    // Bookings: Jonas tee sheet fields
    { table: 'bookings', column: 'transportation', type: 'TEXT' },
    { table: 'bookings', column: 'caddie', type: 'BOOLEAN' },
    { table: 'bookings', column: 'check_in_time', type: 'TIMESTAMPTZ' },
    { table: 'bookings', column: 'round_start', type: 'TIMESTAMPTZ' },
    { table: 'bookings', column: 'round_end', type: 'TIMESTAMPTZ' },
    { table: 'bookings', column: 'duration_min', type: 'INTEGER' },
    // POS: extended Jonas fields
    { table: 'pos_checks', column: 'first_fire', type: 'TIMESTAMPTZ' },
    { table: 'pos_checks', column: 'last_fulfilled', type: 'TIMESTAMPTZ' },
    { table: 'pos_checks', column: 'comp', type: 'NUMERIC(10,2)' },
    { table: 'pos_checks', column: 'discount', type: 'NUMERIC(10,2)' },
    { table: 'pos_checks', column: 'void', type: 'NUMERIC(10,2)' },
    // Dining outlets: operating hours
    { table: 'dining_outlets', column: 'operating_hours', type: 'TEXT' },
    // Ensure data_source on all import target tables
    { table: 'bookings', column: 'data_source', type: 'TEXT' },
    { table: 'booking_players', column: 'data_source', type: 'TEXT' },
    { table: 'pos_checks', column: 'data_source', type: 'TEXT' },
    { table: 'pos_line_items', column: 'data_source', type: 'TEXT' },
    { table: 'pos_payments', column: 'data_source', type: 'TEXT' },
    { table: 'close_outs', column: 'data_source', type: 'TEXT' },
    { table: 'feedback', column: 'data_source', type: 'TEXT' },
    { table: 'service_requests', column: 'data_source', type: 'TEXT' },
    { table: 'event_definitions', column: 'data_source', type: 'TEXT' },
    { table: 'event_registrations', column: 'data_source', type: 'TEXT' },
    { table: 'email_campaigns', column: 'data_source', type: 'TEXT' },
    { table: 'email_events', column: 'data_source', type: 'TEXT' },
    { table: 'staff', column: 'data_source', type: 'TEXT' },
    { table: 'staff_shifts', column: 'data_source', type: 'TEXT' },
    { table: 'member_invoices', column: 'data_source', type: 'TEXT' },
    { table: 'dining_outlets', column: 'data_source', type: 'TEXT' },
    { table: 'courses', column: 'data_source', type: 'TEXT' },
    { table: 'membership_types', column: 'data_source', type: 'TEXT' },
    { table: 'households', column: 'data_source', type: 'TEXT' },
  ];

  for (const { table, column, type } of alterations) {
    try {
      await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
      results.push(`${table}.${column}: added`);
    } catch (e) {
      if (e.message.includes('already exists')) {
        results.push(`${table}.${column}: already exists`);
      } else {
        errors.push(`${table}.${column}: ${e.message}`);
      }
    }
  }

  res.status(200).json({
    migration: '008-jonas-import-columns',
    results,
    errors,
    summary: `${results.length} columns processed, ${errors.length} errors`,
  });
}
