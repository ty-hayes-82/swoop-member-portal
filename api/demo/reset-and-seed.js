/**
 * POST /api/demo/reset-and-seed
 *
 * Nuclear option: TRUNCATE all tables and reseed with fresh test data.
 * This gives the concierge a completely clean, consistent dataset.
 */
import { sql } from '@vercel/postgres';
import { rateLimit } from '../lib/rateLimit.js';

export default async function handler(req, res) {
  // Block in production — demo endpoints are dev/staging only
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { limited, retryAfter } = rateLimit(req, { maxAttempts: 3, windowMs: 60 * 60 * 1000 });
  if (limited) {
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
  }

  const CLUB_ID = 'seed_pinetree';
  const results = {};

  try {
    // Phase 1: Truncate all tables (cascade to handle FK constraints)
    const tables = [
      'activity_log', 'agent_activity', 'agent_actions', 'playbook_steps', 'playbook_runs',
      'member_concierge_sessions', 'member_proactive_log', 'coordination_logs',
      'booking_confirmations', 'slot_reassignments',
      'event_registrations', 'email_events', 'email_campaigns', 'event_definitions',
      'pos_line_items', 'pos_payments', 'close_outs', 'pos_checks',
      'booking_players', 'bookings',
      'feedback', 'service_requests', 'complaints',
      'staff_shifts', 'staff',
      'health_scores', 'member_engagement_weekly', 'member_engagement_daily',
      'member_sentiment_ratings', 'member_waitlist', 'member_invoices',
      'households', 'members', 'membership_types', 'courses', 'dining_outlets',
      'weather_daily', 'weather_forecasts', 'weather_daily_log',
      'agent_definitions', 'agent_configs',
      'club',
    ];

    for (const t of tables) {
      try {
        await sql.query(`TRUNCATE TABLE ${t} CASCADE`);
        results[`truncate_${t}`] = 'ok';
      } catch (e) {
        results[`truncate_${t}`] = e.message?.includes('does not exist') ? 'skip' : e.message;
      }
    }

    // Phase 2: Seed fresh data
    // Club
    await sql`INSERT INTO club (club_id, name) VALUES (${CLUB_ID}, 'Pinetree Country Club') ON CONFLICT DO NOTHING`;

    // Courses
    await sql`INSERT INTO courses (course_id, club_id, name, par, holes) VALUES
      ('north', ${CLUB_ID}, 'North Course', 72, 18),
      ('south', ${CLUB_ID}, 'South Course', 71, 18)
      ON CONFLICT DO NOTHING`;

    // Membership types
    await sql`INSERT INTO membership_types (type_code, club_id, name, annual_dues) VALUES
      ('FG', ${CLUB_ID}, 'Full Golf', 18000),
      ('CORP', ${CLUB_ID}, 'Corporate', 18000),
      ('SPT', ${CLUB_ID}, 'Social Plus Tennis', 12000),
      ('SOC', ${CLUB_ID}, 'Social', 9000),
      ('JR', ${CLUB_ID}, 'Junior', 2000)
      ON CONFLICT DO NOTHING`;

    // Households
    await sql`INSERT INTO households (household_id, club_id, address) VALUES
      ('hh_t01', ${CLUB_ID}, '4821 N Scottsdale Rd, Scottsdale AZ'),
      ('hh_t04', ${CLUB_ID}, '7340 E Camelback Rd, Scottsdale AZ'),
      ('hh_t07', ${CLUB_ID}, '9102 E Via Linda, Scottsdale AZ')
      ON CONFLICT DO NOTHING`;

    // Members (5 primary + 3 household)
    const memberResult = await sql`INSERT INTO members (member_id, club_id, member_number, first_name, last_name, email, phone, date_of_birth, gender, membership_type, membership_status, join_date, resigned_date, household_id, annual_dues, health_score, archetype) VALUES
      ('mbr_t01', ${CLUB_ID}, 501, 'James', 'Whitfield', 'james.whitfield@example.com', '(480) 555-0101', '1978-06-15', 'M', 'FG', 'active', '2019-04-12', NULL, 'hh_t01', 18000, 42, 'Balanced Active'),
      ('mbr_t01b', ${CLUB_ID}, 502, 'Erin', 'Whitfield', 'erin.whitfield@example.com', '(480) 555-0102', '1980-03-22', 'F', 'SOC', 'active', '2019-04-12', NULL, 'hh_t01', 9000, 78, 'Social Butterfly'),
      ('mbr_t01c', ${CLUB_ID}, 503, 'Logan', 'Whitfield', 'logan.whitfield@example.com', NULL, '2010-08-14', 'M', 'JR', 'active', '2022-06-01', NULL, 'hh_t01', 2000, 65, 'New Member'),
      ('mbr_t04', ${CLUB_ID}, 504, 'Anne', 'Jordan', 'anne.j@email.com', '(480) 555-0104', '1972-09-18', 'F', 'FG', 'active', '2016-03-15', NULL, 'hh_t04', 14000, 28, 'Weekend Warrior'),
      ('mbr_t04b', ${CLUB_ID}, 505, 'Marcus', 'Jordan', 'marcus.j@email.com', '(480) 555-0140', '1970-11-05', 'M', 'FG', 'active', '2016-03-15', NULL, 'hh_t04', 14000, 72, 'Die-Hard Golfer'),
      ('mbr_t05', ${CLUB_ID}, 506, 'Robert', 'Callahan', 'robert.c@email.com', '(480) 555-0105', '1965-02-28', 'M', 'CORP', 'active', '2021-06-01', NULL, NULL, 18000, 22, 'Declining'),
      ('mbr_t06', ${CLUB_ID}, 507, 'Sandra', 'Chen', 'sandra.c@email.com', '(480) 555-0146', '1984-12-10', 'F', 'SOC', 'active', '2020-09-15', NULL, NULL, 9000, 36, 'Social Butterfly'),
      ('mbr_t07', ${CLUB_ID}, 508, 'Linda', 'Leonard', 'linda.l@email.com', '(480) 555-0107', '1974-08-22', 'F', 'FG', 'resigned', '2019-05-20', '2026-01-15', 'hh_t07', 18000, 12, 'Ghost')
      ON CONFLICT (member_id, club_id) DO UPDATE SET health_score = EXCLUDED.health_score, archetype = EXCLUDED.archetype
      RETURNING member_id`;
    results.members = memberResult.rowCount;

    // Events (4 upcoming)
    await sql`INSERT INTO event_definitions (event_id, club_id, title, event_date, start_time, end_time, location, capacity, event_type, description) VALUES
      ('evt_wine', ${CLUB_ID}, 'Wine Dinner — Spring Pairing Menu', '2026-04-18', '18:00', '21:00', 'Main Dining Room', 48, 'social', 'Five-course wine pairing with seasonal menu. Smart casual.'),
      ('evt_shotgun', ${CLUB_ID}, 'Saturday Morning Shotgun — Member-Guest', '2026-04-19', '08:00', '13:00', 'North Course', 72, 'golf_tournament', 'Competitive shotgun format. Invite a guest for $45.'),
      ('evt_trivia', ${CLUB_ID}, 'Trivia Night', '2026-04-22', '17:30', '20:00', 'Grill Room', 40, 'social', 'Teams of 4. Appetizer spread + 2 drink tickets per person.'),
      ('evt_junior', ${CLUB_ID}, 'Junior Golf Clinic', '2026-04-20', '10:00', '12:00', 'Practice Range', 24, 'golf_lesson', 'Ages 8-16. Led by Coach Davis.')
      ON CONFLICT DO NOTHING`;
    results.events = 4;

    // Bookings (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await sql`INSERT INTO bookings (booking_id, club_id, course_id, booking_date, tee_time, status, booked_at) VALUES
      ('bkg_test_001', ${CLUB_ID}, 'north', ${tomorrowStr}, '07:00', 'confirmed', NOW()),
      ('bkg_test_002', ${CLUB_ID}, 'north', ${tomorrowStr}, '07:08', 'confirmed', NOW()),
      ('bkg_test_003', ${CLUB_ID}, 'south', ${tomorrowStr}, '09:00', 'confirmed', NOW())
      ON CONFLICT DO NOTHING`;

    await sql`INSERT INTO booking_players (booking_id, member_id, is_guest, guest_name) VALUES
      ('bkg_test_001', 'mbr_t01', false, NULL),
      ('bkg_test_001', 'mbr_t01b', false, NULL),
      ('bkg_test_002', 'mbr_t04', false, NULL),
      ('bkg_test_002', 'mbr_t04b', false, NULL),
      ('bkg_test_003', 'mbr_t05', false, NULL),
      ('bkg_test_003', 'mbr_t05', true, 'Client Guest')
      ON CONFLICT DO NOTHING`;
    results.bookings = 3;

    // Feedback (complaints)
    await sql`INSERT INTO feedback (id, club_id, member_id, category, description, status, priority, sentiment_score, created_at) VALUES
      ('fb_test_001', ${CLUB_ID}, 'mbr_t01', 'food_and_beverage', 'Waited 42 minutes for lunch at the Grill Room. Nobody checked on me. Left feeling ignored. This used to be my favorite spot.', 'acknowledged', 'high', -0.85, '2026-01-16 13:12:00'),
      ('fb_test_002', ${CLUB_ID}, 'mbr_t05', 'billing', 'I was double-charged on my December statement. Called twice, no callback. Still unresolved after 9 days.', 'acknowledged', 'high', -0.72, '2026-01-20 09:30:00')
      ON CONFLICT DO NOTHING`;
    results.feedback = 2;

    // Concierge sessions with preferences
    await sql`INSERT INTO member_concierge_sessions (session_id, club_id, member_id, last_active, preferences_cache, conversation_summary) VALUES
      ('csess_t01', ${CLUB_ID}, 'mbr_t01', NOW(), ${{ teeWindows: 'Thu/Fri 7:00-8:30 AM, Saturday 7:00 AM with regular foursome', dining: 'Grill Room booth 12, Arnold Palmer + Club Sandwich, slow mornings with coffee refills', favoriteSpots: 'North Course back nine, Grill Room booth 12', channel: 'Call' }}::jsonb, NULL),
      ('csess_t04', ${CLUB_ID}, 'mbr_t04', NOW(), ${{ teeWindows: 'Saturday morning 7-8 AM, always with Marcus', dining: 'Terrace for lunch after golf, likes the chicken Caesar', favoriteSpots: 'North Course, Terrace patio', channel: 'SMS' }}::jsonb, NULL),
      ('csess_t05', ${CLUB_ID}, 'mbr_t05', NOW(), ${{ teeWindows: 'Weekday mornings when available', dining: 'Main Dining Room, quiet corner table. Steak and red wine.', favoriteSpots: 'South Course, Main Dining Room', channel: 'Email' }}::jsonb, NULL),
      ('csess_t06', ${CLUB_ID}, 'mbr_t06', NOW(), ${{ teeWindows: 'N/A — social member', dining: 'Grill Room casual lunches, Main Dining for events. Wine tastings.', favoriteSpots: 'Grill Room, Event lawn, Wine cellar', channel: 'SMS' }}::jsonb, NULL),
      ('csess_t07', ${CLUB_ID}, 'mbr_t07', NOW(), ${{ teeWindows: 'N/A — social member', dining: 'Wine dinners, always table with Diane Prescott', favoriteSpots: 'Wine cellar dining room, Event lawn', channel: 'Call', notes: 'Joined after husband Richard passed. Bridge partner Diane Prescott. Zero visits since October.' }}::jsonb, NULL)
      ON CONFLICT (session_id) DO UPDATE SET preferences_cache = EXCLUDED.preferences_cache`;
    results.sessions = 5;

    // Dining outlets
    await sql`INSERT INTO dining_outlets (outlet_id, club_id, name, type) VALUES
      ('outlet_grill', ${CLUB_ID}, 'Grill Room', 'casual'),
      ('outlet_main', ${CLUB_ID}, 'Main Dining Room', 'formal'),
      ('outlet_terrace', ${CLUB_ID}, 'Terrace', 'casual'),
      ('outlet_bar', ${CLUB_ID}, 'Bar & Lounge', 'bar'),
      ('outlet_pool', ${CLUB_ID}, 'Pool Bar', 'casual')
      ON CONFLICT DO NOTHING`;
    results.outlets = 5;

    // Some POS checks for spending patterns
    await sql`INSERT INTO pos_checks (check_id, club_id, outlet_id, member_id, check_date, subtotal, tax, tip, total, payment_method) VALUES
      ('chk_t01_001', ${CLUB_ID}, 'outlet_grill', 'mbr_t01', '2026-01-10', 34.50, 2.76, 6.90, 44.16, 'member_charge'),
      ('chk_t01_002', ${CLUB_ID}, 'outlet_grill', 'mbr_t01', '2026-01-17', 28.00, 2.24, 5.60, 35.84, 'member_charge'),
      ('chk_t01_003', ${CLUB_ID}, 'outlet_grill', 'mbr_t01', '2025-12-20', 42.00, 3.36, 8.40, 53.76, 'member_charge'),
      ('chk_t05_001', ${CLUB_ID}, 'outlet_main', 'mbr_t05', '2026-01-05', 3020.00, 0, 0, 3020.00, 'member_charge'),
      ('chk_t06_001', ${CLUB_ID}, 'outlet_grill', 'mbr_t06', '2026-01-08', 18.00, 1.44, 3.60, 23.04, 'member_charge'),
      ('chk_t06_002', ${CLUB_ID}, 'outlet_grill', 'mbr_t06', '2025-11-15', 142.00, 11.36, 28.40, 181.76, 'member_charge')
      ON CONFLICT DO NOTHING`;
    results.pos_checks = 6;

    // Demo staff users — required for resolveTargetSessions() in agent harness
    // and for seeding persona session history via seed-demo-personas.mjs.
    // Roles match Swoop role slugs used throughout the agent infrastructure.
    try {
      await sql`
        INSERT INTO users (user_id, club_id, email, name, role, title, active)
        VALUES
          ('usr_sarah_gm',        ${CLUB_ID}, 'sarah.mitchell@pinetree.demo', 'Sarah Mitchell', 'gm',                  'General Manager',        TRUE),
          ('usr_maya_fb',         ${CLUB_ID}, 'maya.chen@pinetree.demo',      'Maya Chen',      'fb_director',         'F&B Director',           TRUE),
          ('usr_headpro',         ${CLUB_ID}, 'head.pro@pinetree.demo',       'Alex Torres',    'head_pro',            'Head Golf Professional', TRUE),
          ('usr_membership_dir',  ${CLUB_ID}, 'membership@pinetree.demo',     'Diane Park',     'membership_director', 'Membership Director',    TRUE)
        ON CONFLICT (user_id) DO UPDATE SET
          club_id = EXCLUDED.club_id,
          name    = EXCLUDED.name,
          role    = EXCLUDED.role,
          active  = TRUE
      `;
      results.demo_users = 4;
    } catch (e) {
      results.demo_users = e.message?.includes('does not exist') ? 'skip' : e.message;
    }

    return res.status(200).json({
      success: true,
      club_id: CLUB_ID,
      results,
      message: 'Database cleared and reseeded with 5 test members + 4 demo staff users',
    });
  } catch (err) {
    console.error('reset-and-seed error:', err);
    return res.status(500).json({ error: err.message, results });
  }
}
