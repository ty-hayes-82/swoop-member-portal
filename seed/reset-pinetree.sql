-- reset-pinetree.sql — Delete all seed_pinetree data in reverse FK order
-- Usage: psql $POSTGRES_URL -f seed/reset-pinetree.sql

BEGIN;

-- Leaf tables (no dependents)
DELETE FROM pos_payments    WHERE check_id LIKE 'seed_pinetree_%';
DELETE FROM pos_line_items  WHERE check_id LIKE 'seed_pinetree_%';
DELETE FROM pos_checks      WHERE check_id LIKE 'seed_pinetree_%';
DELETE FROM staff_shifts    WHERE club_id = 'seed_pinetree';
DELETE FROM staff           WHERE club_id = 'seed_pinetree';
DELETE FROM member_invoices WHERE club_id = 'seed_pinetree';
DELETE FROM email_events    WHERE campaign_id LIKE 'seed_pinetree_%';
DELETE FROM email_campaigns WHERE club_id = 'seed_pinetree';
DELETE FROM event_registrations WHERE registration_id LIKE 'seed_pinetree_%';
DELETE FROM event_definitions   WHERE club_id = 'seed_pinetree';
DELETE FROM feedback        WHERE club_id = 'seed_pinetree';
DELETE FROM complaints      WHERE club_id = 'seed_pinetree';
DELETE FROM service_requests WHERE club_id = 'seed_pinetree';
DELETE FROM close_outs      WHERE club_id = 'seed_pinetree';
DELETE FROM booking_players WHERE player_id LIKE 'seed_pinetree_%';
DELETE FROM bookings        WHERE club_id = 'seed_pinetree';
DELETE FROM transactions    WHERE club_id = 'seed_pinetree';
DELETE FROM members         WHERE club_id = 'seed_pinetree';
DELETE FROM households      WHERE club_id = 'seed_pinetree';
DELETE FROM dining_outlets  WHERE club_id = 'seed_pinetree';
DELETE FROM courses         WHERE club_id = 'seed_pinetree';
DELETE FROM membership_types WHERE club_id = 'seed_pinetree';
DELETE FROM club            WHERE club_id = 'seed_pinetree';

-- Derived/metric tables
DELETE FROM data_source_status WHERE club_id = 'seed_pinetree';

COMMIT;
