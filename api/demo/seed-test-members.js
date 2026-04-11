/**
 * Seed Test Members — Direct INSERT
 * POST /api/demo/seed-test-members
 *
 * Directly inserts the 5 test members and associated data (households,
 * courses, events, bookings, complaints, concierge sessions) into the
 * Neon database. Bypasses the seed_pinetree copy pattern entirely.
 *
 * Idempotent — uses ON CONFLICT for every insert.
 * No auth required (demo endpoint).
 */
import { db } from '@vercel/postgres';
import { logError, logInfo } from '../lib/logger.js';

const CLUB_ID = 'seed_pinetree';
const CLUB_NAME = 'Pinetree Country Club';

// Tomorrow's date in ISO format for bookings
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Insert functions
// ---------------------------------------------------------------------------

async function insertClub(client) {
  const r = await client.query(`
    INSERT INTO club (club_id, name, city, state, zip, founded_year, member_count, course_count, outlet_count, brand_voice, timezone)
    VALUES ($1, $2, 'Scottsdale', 'AZ', '85255', 1972, 300, 2, 4, 'warm-professional', 'America/Phoenix')
    ON CONFLICT (club_id) DO UPDATE SET name = EXCLUDED.name
  `, [CLUB_ID, CLUB_NAME]);
  return r.rowCount;
}

async function insertCourses(client) {
  const r = await client.query(`
    INSERT INTO courses (course_id, club_id, name, holes, par, tee_interval_min, first_tee, last_tee)
    VALUES
      ('crs_north', $1, 'North Course', 18, 72, 8, '06:30', '14:00'),
      ('crs_south', $1, 'South Course', 18, 71, 8, '06:30', '14:00')
    ON CONFLICT (course_id) DO NOTHING
  `, [CLUB_ID]);
  return r.rowCount;
}

async function insertMembershipTypes(client) {
  const r = await client.query(`
    INSERT INTO membership_types (type_code, club_id, name, annual_dues, fb_minimum, golf_eligible)
    VALUES
      ('FG',   $1, 'Full Golf',  18000, 3000, 1),
      ('CORP', $1, 'Corporate',  18000, 3000, 1),
      ('SPT',  $1, 'Social',      9000, 1500, 0),
      ('SOC',  $1, 'Social',      9000, 1500, 0),
      ('JR',   $1, 'Junior',      4500,    0, 1)
    ON CONFLICT (type_code) DO NOTHING
  `, [CLUB_ID]);
  return r.rowCount;
}

async function insertHouseholds(client) {
  const r = await client.query(`
    INSERT INTO households (household_id, club_id, primary_member_id, member_count, address, is_multi_member)
    VALUES
      ('hh_t01', $1, 'mbr_t01', 3, '4821 E Pinnacle Vista Dr, Scottsdale AZ 85255', 1),
      ('hh_t04', $1, 'mbr_t04', 2, '7340 N Via Paseo del Sur, Scottsdale AZ 85258', 1),
      ('hh_t07', $1, 'mbr_t07', 1, '9102 E Mountain Spring Rd, Scottsdale AZ 85255', 0)
    ON CONFLICT (household_id) DO NOTHING
  `, [CLUB_ID]);
  return r.rowCount;
}

async function insertMembers(client) {
  // Primary 5 test members
  const r1 = await client.query(`
    INSERT INTO members (
      member_id, member_number, club_id, first_name, last_name, email, phone,
      membership_type, join_date, membership_status, household_id, archetype,
      annual_dues, account_balance, health_score, preferred_channel, data_source
    ) VALUES
      ('mbr_t01', 1001, $1, 'James',   'Whitfield', 'james.whitfield@example.com', '(480) 555-0101',
       'FG', '2019-04-12', 'active',   'hh_t01', 'Engaged Regular', 18000, 0, 42, 'phone', 'seed'),
      ('mbr_t04', 1004, $1, 'Anne',    'Jordan',    'anne.j@email.com',            '(480) 555-0104',
       'FG', '2016-03-15', 'active',   'hh_t04', 'Weekend Warrior', 14000, 0, 28, 'sms', 'seed'),
      ('mbr_t05', 1005, $1, 'Robert',  'Callahan',  'robert.c@email.com',          '(480) 555-0105',
       'CORP', '2021-06-01', 'active',  NULL,     'Declining',       18000, 0, 22, 'email', 'seed'),
      ('mbr_146', 1146, $1, 'Sandra',  'Chen',      'sandra.c@email.com',          '(480) 555-0146',
       'SPT', '2020-09-15', 'active',   NULL,     'Social Butterfly', 9000, 0, 36, 'sms', 'seed'),
      ('mbr_t07', 1007, $1, 'Linda',   'Leonard',   'linda.l@email.com',           '(480) 555-0107',
       'FG', '2019-05-20', 'resigned', 'hh_t07', 'Ghost',           18000, 0, 12, 'phone', 'seed')
    ON CONFLICT (member_id) DO UPDATE SET
      health_score = EXCLUDED.health_score,
      membership_status = EXCLUDED.membership_status
  `, [CLUB_ID]);

  // Household members
  const r2 = await client.query(`
    INSERT INTO members (
      member_id, member_number, club_id, first_name, last_name, email, phone,
      membership_type, join_date, membership_status, household_id, archetype,
      annual_dues, account_balance, health_score, preferred_channel, data_source
    ) VALUES
      ('mbr_t01b', 1002, $1, 'Erin',   'Whitfield', 'erin.w@example.com',   '(480) 555-0102',
       'SOC', '2019-04-12', 'active', 'hh_t01', 'Social', 9000, 0, 55, 'email', 'seed'),
      ('mbr_t01c', 1003, $1, 'Logan',  'Whitfield', 'logan.w@example.com',  '(480) 555-0103',
       'JR',  '2022-06-01', 'active', 'hh_t01', 'Junior', 4500, 0, 60, 'sms', 'seed'),
      ('mbr_t04b', 1008, $1, 'Marcus', 'Jordan',    'marcus.j@email.com',   '(480) 555-0108',
       'FG',  '2016-03-15', 'active', 'hh_t04', 'Weekend Warrior', 18000, 0, 30, 'sms', 'seed')
    ON CONFLICT (member_id) DO UPDATE SET
      health_score = EXCLUDED.health_score
  `, [CLUB_ID]);

  return r1.rowCount + r2.rowCount;
}

async function insertEvents(client) {
  const tmrw = tomorrow();
  // Dates spread across next 2 weeks
  const d2 = new Date(); d2.setDate(d2.getDate() + 5);
  const d3 = new Date(); d3.setDate(d3.getDate() + 10);
  const d4 = new Date(); d4.setDate(d4.getDate() + 14);

  const r = await client.query(`
    INSERT INTO event_definitions (event_id, club_id, name, type, event_date, capacity, registration_fee, description)
    VALUES
      ('evt_wine01',    $1, 'Wine Dinner — Spring Reserve Tasting', 'dining',          $2, 48, 125, 'Five-course wine dinner featuring spring reserves from Napa Valley'),
      ('evt_shotgun01', $1, 'Saturday Shotgun Tournament',          'golf_tournament',  $3, 72,  75, 'Member shotgun tournament with prizes and post-round BBQ'),
      ('evt_trivia01',  $1, 'Trivia Night at the Grill Room',      'social',           $4,  0,   0, 'Monthly trivia night — teams of 4, complimentary appetizers'),
      ('evt_junior01',  $1, 'Junior Golf Clinic',                   'golf_tournament',  $5, 24,  30, 'Half-day clinic for junior members ages 8-16')
    ON CONFLICT (event_id) DO NOTHING
  `, [CLUB_ID, d2.toISOString().slice(0, 10), d3.toISOString().slice(0, 10), d4.toISOString().slice(0, 10), tmrw]);
  return r.rowCount;
}

async function insertBookings(client) {
  const tmrw = tomorrow();

  const b = await client.query(`
    INSERT INTO bookings (booking_id, club_id, course_id, booking_date, tee_time, player_count, has_guest, transportation, has_caddie, round_type, status)
    VALUES
      ('bkg_t001', $1, 'crs_north', $2, '07:00', 4, 0, 'cart',  0, '18', 'confirmed'),
      ('bkg_t002', $1, 'crs_north', $2, '07:08', 2, 0, 'cart',  0, '18', 'confirmed'),
      ('bkg_t003', $1, 'crs_south', $2, '09:00', 2, 1, 'cart',  0, '18', 'confirmed')
    ON CONFLICT (booking_id) DO NOTHING
  `, [CLUB_ID, tmrw]);

  const bp = await client.query(`
    INSERT INTO booking_players (player_id, booking_id, member_id, guest_name, is_guest, is_warm_lead, position_in_group)
    VALUES
      ('bp_t001', 'bkg_t001', 'mbr_t01',  NULL,           0, 0, 1),
      ('bp_t002', 'bkg_t001', 'mbr_t01b', NULL,           0, 0, 2),
      ('bp_t003', 'bkg_t001', 'mbr_t01c', NULL,           0, 0, 3),
      ('bp_t004', 'bkg_t002', 'mbr_t04',  NULL,           0, 0, 1),
      ('bp_t005', 'bkg_t002', 'mbr_t04b', NULL,           0, 0, 2),
      ('bp_t006', 'bkg_t003', 'mbr_t05',  NULL,           0, 0, 1),
      ('bp_t007', 'bkg_t003', NULL,        'Tom Reynolds', 1, 1, 2)
    ON CONFLICT (player_id) DO NOTHING
  `);

  return { bookings: b.rowCount, booking_players: bp.rowCount };
}

async function insertFeedback(client) {
  const r = await client.query(`
    INSERT INTO feedback (feedback_id, member_id, club_id, submitted_at, category, sentiment_score, description, status, resolved_at, is_understaffed_day)
    VALUES
      ('fb_t001', 'mbr_t01', $1, '2026-03-28T19:30:00', 'Service Speed', -0.6,
       'Waited 25 minutes for our entrees in the Grill Room on a Thursday evening. Server seemed overwhelmed — only two staff covering the whole dining room. Food was fine once it arrived but the wait was unacceptable for a $200 dinner.',
       'in_progress', NULL, 1),
      ('fb_t002', 'mbr_t05', $1, '2026-04-01T10:15:00', 'Billing', -0.8,
       'I was charged twice for my March F&B minimum — $3,020 appeared on both my March and April statements. Called the office 9 days ago and still no resolution. This is basic accounting.',
       'acknowledged', NULL, 0)
    ON CONFLICT (feedback_id) DO NOTHING
  `, [CLUB_ID]);
  return r.rowCount;
}

async function insertConciergeSessions(client) {
  // Ensure table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS member_concierge_sessions (
      session_id          TEXT PRIMARY KEY,
      club_id             TEXT NOT NULL,
      member_id           TEXT NOT NULL,
      last_active         TIMESTAMPTZ DEFAULT NOW(),
      preferences_cache   JSONB,
      conversation_summary TEXT,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(club_id, member_id)
    )
  `);

  const prefs = {
    mbr_t01: {
      teeWindows: 'Thu/Fri 7:00-8:30 AM, Saturday 7:00 AM with regular foursome',
      dining: 'Grill Room booth 12, Arnold Palmer + Club Sandwich, slow mornings with coffee refills',
      favoriteSpots: 'North Course back nine, Grill Room booth 12',
      household: [
        { member_id: 'mbr_t01b', name: 'Erin Whitfield', membership_type: 'Social' },
        { member_id: 'mbr_t01c', name: 'Logan Whitfield', membership_type: 'Junior' },
      ],
      channel: 'Call',
    },
    mbr_t04: {
      teeWindows: 'Saturday morning 7-8 AM, always with Marcus',
      dining: 'Terrace for lunch after golf, likes the chicken Caesar',
      favoriteSpots: 'North Course, Terrace patio',
      channel: 'SMS',
      notes: '10-year member, Weekend Warrior. Missed 3 Saturday waitlists recently — walked off Jan 7 after slow pace. Zero rounds since. Health score 28.',
    },
    mbr_t05: {
      teeWindows: 'Weekday mornings when available',
      dining: 'Main Dining Room, prefers quiet corner table. Orders steak and red wine.',
      favoriteSpots: 'South Course, Main Dining Room',
      channel: 'Email',
      notes: 'Declining member. Hitting exact $3,020 F&B minimum then stopping — dining to fulfill obligation only. 9-day complaint unresolved about billing. No golf since November. Health score 22. $18K dues.',
    },
    mbr_146: {
      teeWindows: 'N/A — social member, does not golf',
      dining: 'Grill Room for casual lunches, Main Dining for events. Used to spend $142/visit, now $18. Loves wine tastings and social events.',
      favoriteSpots: 'Grill Room, Event lawn, Wine cellar',
      channel: 'SMS',
      notes: 'Social Butterfly archetype. Dining cliff from $142 to $18 per visit — 87% drop. Declined 3 consecutive event invites. Health score 36. $9K dues.',
    },
    mbr_t07: {
      teeWindows: 'N/A — social member',
      dining: 'Wine dinners, always table with Diane Prescott. Enjoys the social atmosphere.',
      favoriteSpots: 'Wine cellar dining room, Event lawn',
      channel: 'Call',
      notes: 'Joined after her husband Richard passed away. Friends encouraged her to join for the social calendar. Bridge partner is Diane Prescott. Zero visits since October — 6 months dark. Needs personal, warm outreach — not transactional.',
    },
  };

  const memberIds = Object.keys(prefs);
  let count = 0;

  for (const mid of memberIds) {
    const r = await client.query(`
      INSERT INTO member_concierge_sessions (session_id, club_id, member_id, preferences_cache, last_active)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (club_id, member_id) DO UPDATE SET
        preferences_cache = EXCLUDED.preferences_cache,
        last_active = NOW()
    `, [`sess_${mid}`, CLUB_ID, mid, JSON.stringify(prefs[mid])]);
    count += r.rowCount;
  }

  return count;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const start = Date.now();
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const club             = await insertClub(client);
    const courses          = await insertCourses(client);
    const membership_types = await insertMembershipTypes(client);
    const households       = await insertHouseholds(client);
    const members          = await insertMembers(client);
    const events           = await insertEvents(client);
    const bookingResult    = await insertBookings(client);
    const feedback         = await insertFeedback(client);
    const sessions         = await insertConciergeSessions(client);

    await client.query('COMMIT');

    const duration_ms = Date.now() - start;
    const summary = {
      club,
      courses,
      membership_types,
      households,
      members,
      event_definitions: events,
      bookings: bookingResult.bookings,
      booking_players: bookingResult.booking_players,
      feedback,
      member_concierge_sessions: sessions,
    };

    logInfo('/api/demo/seed-test-members', 'Direct seed complete', { summary, duration_ms });

    return res.status(200).json({
      success: true,
      club_id: CLUB_ID,
      club_name: CLUB_NAME,
      rows_inserted: summary,
      duration_ms,
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    logError('/api/demo/seed-test-members', e, { phase: 'seed' });
    return res.status(500).json({ error: `Failed to seed test members: ${e.message}` });
  } finally {
    client.release();
  }
}
