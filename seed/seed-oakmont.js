/**
 * seed-oakmont.js — Seed Oakmont Country Club (Los Angeles, CA)
 *
 * Generates synthetic but realistic data entirely in code — no CSV files needed.
 * Idempotent: deletes all oakmont_cc data before re-inserting.
 *
 * Usage:
 *   node --env-file=.env.local seed/seed-oakmont.js
 */

import { sql } from '@vercel/postgres';

const CLUB_ID = 'oakmont_cc';

// ─── Deterministic pseudo-random (seeded) ─────────────────────────────────────

let _seed = 42;
function rand(min = 0, max = 1) {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
  const t = ((_seed >>> 0) / 0xffffffff);
  return min + t * (max - min);
}
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickN(arr, n) {
  const copy = [...arr]; const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = randInt(0, 15);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ─── Reference data ────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'James','Robert','John','Michael','David','William','Richard','Joseph','Thomas','Charles',
  'Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Kenneth',
  'Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen',
  'Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily','Donna',
  'Edward','Brian','Kevin','Ronald','Timothy','George','Jason','Jeffrey','Ryan','Gary',
  'Catherine','Helen','Deborah','Stephanie','Sharon','Laura','Amy','Carol','Anna','Christine',
  'Henry','Frank','Scott','Patrick','Alexander','Raymond','Gregory','Samuel','Benjamin','Peter',
  'Virginia','Rebecca','Kathleen','Pamela','Martha','Debra','Amanda','Melissa','Joyce','Frances',
];
const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Anderson',
  'Taylor','Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark',
  'Lewis','Robinson','Walker','Hall','Allen','Young','King','Wright','Scott','Hill',
  'Green','Adams','Baker','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips',
  'Campbell','Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed',
  'Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard',
  'Ward','Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders',
  'Price','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell',
];
const MEMBERSHIP_TYPES_DATA = [
  { code: 'GOLF_FULL',  name: 'Full Golf',       annual_dues: 14500, fb_minimum: 3600, golf_eligible: true },
  { code: 'GOLF_LIMIT', name: 'Limited Golf',    annual_dues: 9800,  fb_minimum: 2400, golf_eligible: true },
  { code: 'SOCIAL',     name: 'Social',          annual_dues: 4200,  fb_minimum: 1800, golf_eligible: false },
  { code: 'JUNIOR',     name: 'Junior Executive',annual_dues: 7200,  fb_minimum: 2400, golf_eligible: true },
  { code: 'SENIOR',     name: 'Senior',          annual_dues: 11000, fb_minimum: 2400, golf_eligible: true },
  { code: 'CORPORATE',  name: 'Corporate',       annual_dues: 22000, fb_minimum: 6000, golf_eligible: true },
];
const DEPARTMENTS = ['Golf Operations','Food & Beverage','Maintenance','Administration','Membership Services'];
const DINING_OUTLETS_DATA = [
  { id: 'GRILLROOM',  name: 'The Grillroom',     type: 'dining' },
  { id: 'TERRACE',    name: 'Terrace Bar',        type: 'bar' },
  { id: 'HALFWAY',    name: 'Halfway House',      type: 'snack_bar' },
  { id: 'BANQUET',    name: 'Banquet / Events',   type: 'banquet' },
];
const MENU_ITEMS = [
  { name: 'Club Burger',        category: 'Lunch',   price: 22 },
  { name: 'Caesar Salad',       category: 'Lunch',   price: 18 },
  { name: 'Grilled Salmon',     category: 'Dinner',  price: 42 },
  { name: 'Filet Mignon',       category: 'Dinner',  price: 58 },
  { name: 'Lobster Bisque',     category: 'Dinner',  price: 16 },
  { name: 'Wagyu Burger',       category: 'Dinner',  price: 38 },
  { name: 'Craft Beer',         category: 'Bar',     price: 9 },
  { name: 'House Wine',         category: 'Bar',     price: 14 },
  { name: 'Scotch (neat)',      category: 'Bar',     price: 22 },
  { name: 'Chicken Sandwich',   category: 'Snack',   price: 16 },
  { name: 'Hot Dog',            category: 'Snack',   price: 8 },
  { name: 'Energy Bar',         category: 'Snack',   price: 5 },
  { name: 'Sparkling Water',    category: 'Beverage',price: 4 },
  { name: 'Iced Tea',           category: 'Beverage',price: 5 },
];

// ─── Staff roster (operational + Swoop users) ──────────────────────────────────

const STAFF_ROSTER = [
  // Swoop users (will also get users table rows)
  { employee_id: 'EMP001', first_name: 'Catherine', last_name: 'Hayward',  dept: 'Administration',      title: 'General Manager',          role: 'gm',                  hourly: null,  ft: true,  swoop_role: 'gm' },
  { employee_id: 'EMP002', first_name: 'Marcus',    last_name: 'Whitfield',dept: 'Golf Operations',     title: 'Head Golf Professional',    role: 'head_pro',             hourly: null,  ft: true,  swoop_role: 'head_pro' },
  { employee_id: 'EMP003', first_name: 'Simone',    last_name: 'Beaumont', dept: 'Food & Beverage',     title: 'F&B Director',              role: 'fb_director',          hourly: null,  ft: true,  swoop_role: 'fb_director' },
  { employee_id: 'EMP004', first_name: 'Jonathan',  last_name: 'Crane',    dept: 'Membership Services', title: 'Director of Membership',    role: 'membership_director',  hourly: null,  ft: true,  swoop_role: 'membership_director' },
  { employee_id: 'EMP005', first_name: 'Rachel',    last_name: 'Torres',   dept: 'Administration',      title: 'Controller',                role: 'controller',           hourly: null,  ft: true,  swoop_role: 'controller' },
  { employee_id: 'EMP006', first_name: 'Derek',     last_name: 'Okafor',   dept: 'Administration',      title: 'Assistant General Manager', role: 'assistant_gm',         hourly: null,  ft: true,  swoop_role: 'assistant_gm' },
  { employee_id: 'EMP007', first_name: 'Alexis',    last_name: 'Fontaine', dept: 'Food & Beverage',     title: 'Dining Room Manager',       role: 'dining_room_manager',  hourly: null,  ft: true,  swoop_role: 'dining_room_manager' },
  // Operational staff (no Swoop login)
  { employee_id: 'EMP008', first_name: 'Tyler',     last_name: 'Murphy',   dept: 'Golf Operations',     title: 'Assistant Golf Pro',        role: 'staff',                hourly: 24,    ft: true,  swoop_role: null },
  { employee_id: 'EMP009', first_name: 'Brianna',   last_name: 'Hayes',    dept: 'Golf Operations',     title: 'Pro Shop Associate',        role: 'staff',                hourly: 18,    ft: false, swoop_role: null },
  { employee_id: 'EMP010', first_name: 'Carlos',    last_name: 'Reyes',    dept: 'Golf Operations',     title: 'Starter / Marshall',        role: 'staff',                hourly: 16,    ft: false, swoop_role: null },
  { employee_id: 'EMP011', first_name: 'Natalie',   last_name: 'Chu',      dept: 'Food & Beverage',     title: 'Lead Server',               role: 'staff',                hourly: 15,    ft: true,  swoop_role: null },
  { employee_id: 'EMP012', first_name: 'Jordan',    last_name: 'Webb',     dept: 'Food & Beverage',     title: 'Bartender',                 role: 'staff',                hourly: 16,    ft: true,  swoop_role: null },
  { employee_id: 'EMP013', first_name: 'Priya',     last_name: 'Nair',     dept: 'Food & Beverage',     title: 'Server',                    role: 'staff',                hourly: 15,    ft: false, swoop_role: null },
  { employee_id: 'EMP014', first_name: 'Marcus',    last_name: 'Bell',     dept: 'Food & Beverage',     title: 'Server',                    role: 'staff',                hourly: 15,    ft: false, swoop_role: null },
  { employee_id: 'EMP015', first_name: 'Hannah',    last_name: 'Kowalski', dept: 'Maintenance',         title: 'Head Superintendent',       role: 'staff',                hourly: 28,    ft: true,  swoop_role: null },
  { employee_id: 'EMP016', first_name: 'Darius',    last_name: 'Stone',    dept: 'Maintenance',         title: 'Grounds Crew Lead',         role: 'staff',                hourly: 20,    ft: true,  swoop_role: null },
  { employee_id: 'EMP017', first_name: 'Sofia',     last_name: 'Mendez',   dept: 'Membership Services', title: 'Membership Coordinator',    role: 'staff',                hourly: 22,    ft: true,  swoop_role: null },
  { employee_id: 'EMP018', first_name: 'Kevin',     last_name: 'Park',     dept: 'Administration',      title: 'Executive Assistant',       role: 'staff',                hourly: 20,    ft: true,  swoop_role: null },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function isoDate(d) { return d.toISOString().slice(0, 10); }
function isoDatetime(d) { return d.toISOString(); }
function addHours(d, h) { return new Date(d.getTime() + h * 3600000); }
function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
function teetime(hour, min = 0) {
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

// ─── Delete ────────────────────────────────────────────────────────────────────

const DELETE_TABLES = [
  'pos_payments','pos_line_items','pos_checks',
  'staff_shifts','staff','users',
  'member_invoices','email_events','email_campaigns',
  'event_registrations','event_definitions',
  'feedback','service_requests','close_outs',
  'booking_players','bookings','members','households',
  'dining_outlets','courses','membership_types','club',
  'transactions','data_source_status',
  'agent_sessions',
];

async function deleteAll(client) {
  for (const t of DELETE_TABLES) {
    try {
      if (t === 'users') {
        await client.query(`DELETE FROM users WHERE club_id = $1`, [CLUB_ID]);
      } else if (['pos_payments','pos_line_items','booking_players'].includes(t)) {
        // No club_id column — cleaned by cascade, skip explicit delete
      } else {
        await client.query(`DELETE FROM ${t} WHERE club_id = $1`, [CLUB_ID]);
      }
    } catch { /* ignore */ }
  }
  // Also clear agent sessions for this club
  try {
    await client.query(`DELETE FROM agent_sessions WHERE club_id = $1`, [CLUB_ID]);
  } catch { /* ignore */ }
  console.log('  Cleared existing oakmont_cc data');
}

// ─── Seed functions ────────────────────────────────────────────────────────────

async function seedClub(client) {
  await client.query(`
    INSERT INTO club (club_id, name, city, state, zip, founded_year, member_count, course_count, outlet_count, timezone, brand_voice)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (club_id) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city
  `, [CLUB_ID, 'Oakmont Country Club', 'Los Angeles', 'CA', '90210',
      1923, 285, 1, 4, 'America/Los_Angeles',
      'warm and understated — classic Southern California club with a storied history']);
  console.log('  Club profile seeded');
}

async function seedMembershipTypes(client) {
  for (const mt of MEMBERSHIP_TYPES_DATA) {
    const typeCode = `${CLUB_ID}_${mt.code}`;
    await client.query(`
      INSERT INTO membership_types (type_code, club_id, name, annual_dues, fb_minimum, golf_eligible)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (type_code) DO NOTHING
    `, [typeCode, CLUB_ID, mt.name, mt.annual_dues, mt.fb_minimum, mt.golf_eligible ? 1 : 0]);
  }
  console.log(`  ${MEMBERSHIP_TYPES_DATA.length} membership types seeded`);
}

async function seedCourses(client) {
  await client.query(`
    INSERT INTO courses (course_id, club_id, name, holes, par, tee_interval_min, first_tee, last_tee)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (course_id) DO NOTHING
  `, [`${CLUB_ID}_MAIN`, CLUB_ID, 'The Oaks Course', 18, 72, 10, '06:30', '15:30']);
  console.log('  1 course seeded');
}

async function seedDiningOutlets(client) {
  for (const o of DINING_OUTLETS_DATA) {
    await client.query(`
      INSERT INTO dining_outlets (outlet_id, club_id, name, type, weekday_covers, weekend_covers, meal_periods)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (outlet_id) DO NOTHING
    `, [`${CLUB_ID}_${o.id}`, CLUB_ID, o.name, o.type,
        o.type === 'dining' ? 80 : 40, o.type === 'dining' ? 120 : 60,
        '[]']);
  }
  console.log(`  ${DINING_OUTLETS_DATA.length} dining outlets seeded`);
}

async function seedStaffAndUsers(client) {
  const hireBase = daysAgo(365 * 5);
  let staffCount = 0;
  let userCount = 0;

  for (const s of STAFF_ROSTER) {
    const staffId = `${CLUB_ID}_${s.employee_id}`;
    const hireDate = isoDate(addDays(hireBase, randInt(0, 365 * 4)));

    await client.query(`
      INSERT INTO staff (staff_id, club_id, first_name, last_name, department, role, hire_date, hourly_rate, is_full_time)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (staff_id) DO NOTHING
    `, [staffId, CLUB_ID, s.first_name, s.last_name,
        s.dept, s.title, hireDate,
        s.hourly ?? (s.ft ? 0 : 18), s.ft ? 1 : 0]);
    staffCount++;

    // Seed Swoop login account for designated staff
    if (s.swoop_role) {
      const email = `${s.first_name.toLowerCase()}.${s.last_name.toLowerCase()}@oakmont-cc.com`;
      await client.query(`
        INSERT INTO users (user_id, club_id, email, name, role, title, active)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (email) DO UPDATE SET club_id=EXCLUDED.club_id, role=EXCLUDED.role, name=EXCLUDED.name
      `, [uuid(), CLUB_ID, email, `${s.first_name} ${s.last_name}`, s.swoop_role, s.title, true]);
      userCount++;
    }
  }

  console.log(`  ${staffCount} staff + ${userCount} Swoop user accounts seeded`);
  return STAFF_ROSTER.filter(s => s.swoop_role).map(s =>
    `    ${s.swoop_role.padEnd(22)} ${s.first_name} ${s.last_name} <${s.first_name.toLowerCase()}.${s.last_name.toLowerCase()}@oakmont-cc.com>`
  );
}

async function seedMembers(client) {
  const memberList = [];
  const totalMembers = 185;

  const types = MEMBERSHIP_TYPES_DATA.map(m => `${CLUB_ID}_${m.code}`);
  const typeWeights = [45, 20, 15, 10, 8, 2]; // % distribution

  let memberNumber = 1001;

  for (let i = 0; i < totalMembers; i++) {
    const memberId = `${CLUB_ID}_MBR${String(i + 1).padStart(4, '0')}`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 0 ? i : ''}@gmail.com`;
    const joinYearsAgo = randInt(0, 25);
    const joinDate = isoDate(daysAgo(joinYearsAgo * 365 + randInt(0, 364)));
    const rand100 = randInt(0, 99);
    let typeIdx = 0, cumulative = 0;
    for (let j = 0; j < typeWeights.length; j++) {
      cumulative += typeWeights[j];
      if (rand100 < cumulative) { typeIdx = j; break; }
    }
    const membershipType = types[typeIdx];
    const resigned = rand() < 0.06; // 6% resigned
    const status = resigned ? 'resigned' : 'active';
    const handicap = rand() < 0.8 ? Math.round(rand(0, 28) * 10) / 10 : null;
    const health_tier = pick(['Green', 'Green', 'Watch', 'Watch', 'Critical']);

    await client.query(`
      INSERT INTO members (member_id, member_number, club_id, first_name, last_name, email, membership_type,
        annual_dues, join_date, membership_status, health_tier, archetype, handicap, data_source)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (member_id) DO NOTHING
    `, [memberId, memberNumber++, CLUB_ID, firstName, lastName, email,
        membershipType,
        MEMBERSHIP_TYPES_DATA[typeIdx].annual_dues,
        joinDate, status, health_tier,
        pick(['golfer','socializer','diner','family','occasional']),
        handicap, 'seed']);

    if (!resigned) memberList.push({ memberId, firstName, lastName });
  }

  console.log(`  ${totalMembers} members seeded (${memberList.length} active)`);
  return memberList;
}

async function seedBookings(client, members) {
  let count = 0;
  const courseId = `${CLUB_ID}_MAIN`;
  const activePlayers = members.slice(0, 120); // most frequent golfers

  // Generate ~90 days of tee sheet history
  for (let daysBack = 90; daysBack >= 1; daysBack--) {
    const date = daysAgo(daysBack);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const slotsPerDay = isWeekend ? 14 : 8;

    for (let slot = 0; slot < slotsPerDay; slot++) {
      const hour = 6 + Math.floor(slot * 0.8);
      const min = (slot % 6) * 10;
      const bookingId = `${CLUB_ID}_BK${String(daysBack).padStart(3, '0')}${String(slot).padStart(2, '0')}`;
      const playerCount = randInt(2, 4);
      const player = pick(activePlayers);
      const bookingDate = isoDate(date);
      const teeTimeStr = teetime(hour, min);

      await client.query(`
        INSERT INTO bookings (booking_id, club_id, course_id, booking_date, tee_time, player_count,
          has_guest, transportation, round_type, status, member_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (booking_id) DO NOTHING
      `, [bookingId, CLUB_ID, courseId, bookingDate, teeTimeStr,
          playerCount, randInt(0, 1), 'cart', '18', 'confirmed', player.memberId]);
      count++;
    }
  }
  console.log(`  ${count} tee time bookings seeded`);
}

async function seedPosChecks(client, members) {
  let checkCount = 0;
  let lineItemCount = 0;
  const outlets = DINING_OUTLETS_DATA.map(o => `${CLUB_ID}_${o.id}`);
  const activeMembers = members.slice(0, 150);

  // ~60 days of dining history
  for (let daysBack = 60; daysBack >= 1; daysBack--) {
    const date = daysAgo(daysBack);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const checksToday = isWeekend ? randInt(25, 45) : randInt(12, 25);

    for (let c = 0; c < checksToday; c++) {
      const checkId = `${CLUB_ID}_CHK${String(daysBack).padStart(3, '0')}${String(c).padStart(3, '0')}`;
      const member = rand() < 0.85 ? pick(activeMembers) : null;
      const outletId = pick(outlets);
      const openedAt = addHours(date, randInt(11, 20));
      const closedAt = addHours(openedAt, rand(0.5, 2.5));

      const items = pickN(MENU_ITEMS, randInt(1, 4));
      const subtotal = items.reduce((s, item) => s + item.price * randInt(1, 2), 0);
      const tax = Math.round(subtotal * 0.095 * 100) / 100;
      const tip = Math.round(subtotal * (rand() < 0.7 ? 0.18 : 0.20) * 100) / 100;
      const total = subtotal + tax + tip;

      await client.query(`
        INSERT INTO pos_checks (check_id, club_id, outlet_id, member_id, opened_at, closed_at,
          subtotal, tax_amount, tip_amount, total, payment_method)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (check_id) DO NOTHING
      `, [checkId, CLUB_ID, outletId, member?.memberId ?? null,
          isoDatetime(openedAt), isoDatetime(closedAt),
          subtotal, tax, tip, total, 'member_charge']);
      checkCount++;

      // Line items
      for (let li = 0; li < items.length; li++) {
        const item = items[li];
        const qty = randInt(1, 2);
        const lineItemId = `${checkId}_LI${li}`;
        await client.query(`
          INSERT INTO pos_line_items (line_item_id, check_id, item_name, category, unit_price, quantity, line_total, is_comp, is_void)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (line_item_id) DO NOTHING
        `, [lineItemId, checkId, item.name, item.category,
            item.price, qty, item.price * qty, 0, 0]);
        lineItemCount++;
      }
    }
  }
  console.log(`  ${checkCount} POS checks + ${lineItemCount} line items seeded`);
}

async function seedComplaints(client, members) {
  const categories = ['Golf Operations','Dining','Maintenance','Billing','Staff','Facilities'];
  const descriptions = [
    'Pace of play was unacceptably slow — nearly 6 hours for 18 holes.',
    'Table reservation was lost, waited 40 minutes for seating.',
    'Bunker on 14 was in poor condition — unraked for days.',
    'Monthly statement had incorrect charges from last weekend.',
    'Staff member was dismissive when I asked about a tee time.',
    'Men\'s locker room shower was out of service for three days.',
    'Food quality at the Grillroom has declined noticeably.',
    'Pro shop did not have my pre-ordered equipment on time.',
  ];

  let count = 0;
  for (let i = 0; i < 22; i++) {
    const member = pick(members);
    const daysBack = randInt(1, 90);
    const feedbackId = `${CLUB_ID}_FB${String(i + 1).padStart(3, '0')}`;
    const isResolved = rand() < 0.65;

    await client.query(`
      INSERT INTO feedback (feedback_id, member_id, club_id, submitted_at, category, sentiment_score, description, status, resolved_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (feedback_id) DO NOTHING
    `, [feedbackId, member.memberId, CLUB_ID,
        isoDatetime(daysAgo(daysBack)),
        pick(categories), randInt(2, 7),
        pick(descriptions), isResolved ? 'resolved' : 'open',
        isResolved ? isoDatetime(daysAgo(randInt(0, daysBack))) : null]);

    // Also insert into complaints (gates.js checks this table)
    const complaintId = `${CLUB_ID}_CMP${String(i + 1).padStart(3, '0')}`;
    await client.query(`
      INSERT INTO complaints (complaint_id, club_id, member_id, category, description, status, reported_at, resolved_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (complaint_id) DO NOTHING
    `, [complaintId, CLUB_ID, member.memberId, pick(categories), pick(descriptions),
        isResolved ? 'resolved' : 'open', isoDatetime(daysAgo(daysBack)),
        isResolved ? isoDatetime(daysAgo(randInt(0, daysBack))) : null]);
    count++;
  }
  console.log(`  ${count} member complaints/feedback seeded`);
}

async function seedEvents(client, members) {
  const eventData = [
    { id: 'MEMBERS_INVITATIONAL', name: 'Members Invitational Tournament', type: 'tournament', fee: 150 },
    { id: 'WINE_DINNER',          name: 'Wine & Dine Evening',             type: 'social',     fee: 95 },
    { id: 'LADIES_GOLF',          name: 'Ladies\' Golf Day',               type: 'golf',       fee: 0 },
    { id: 'MEMBER_MIXER',         name: 'New Member Mixer',                type: 'social',     fee: 0 },
    { id: 'HOLIDAY_GALA',         name: 'Holiday Gala',                    type: 'social',     fee: 125 },
  ];

  for (const ev of eventData) {
    const eventId = `${CLUB_ID}_${ev.id}`;
    const eventDate = isoDate(addDays(new Date(), randInt(-30, 90)));
    await client.query(`
      INSERT INTO event_definitions (event_id, club_id, name, type, event_date, capacity, registration_fee)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (event_id) DO NOTHING
    `, [eventId, CLUB_ID, ev.name, ev.type, eventDate, randInt(60, 200), ev.fee]);

    // Register 30–80% of active members
    const registrants = pickN(members, randInt(Math.floor(members.length * 0.3), Math.floor(members.length * 0.8)));
    for (let i = 0; i < registrants.length; i++) {
      const regId = `${CLUB_ID}_REG_${ev.id}_${i}`;
      await client.query(`
        INSERT INTO event_registrations (registration_id, event_id, member_id, status, guest_count, fee_paid, registered_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (registration_id) DO NOTHING
      `, [regId, eventId, registrants[i].memberId, 'registered',
          rand() < 0.3 ? 1 : 0, ev.fee,
          isoDatetime(daysAgo(randInt(1, 60)))]);
    }
  }
  console.log(`  ${eventData.length} events + registrations seeded`);
}

async function seedDataSourceStatus(client) {
  const domains = [
    { code: 'CRM',       vendor: 'Jonas Club Management' },
    { code: 'TEE_SHEET', vendor: 'ForeTees' },
    { code: 'POS',       vendor: 'Jonas POS' },
    { code: 'EMAIL',     vendor: 'ClubHouse Online' },
    { code: 'LABOR',     vendor: '7shifts' },
  ];
  for (const d of domains) {
    await client.query(`
      INSERT INTO data_source_status (club_id, domain_code, is_connected, source_vendor, health_status, last_sync_at)
      VALUES ($1,$2,$3,$4,$5,NOW())
      ON CONFLICT (club_id, domain_code) DO UPDATE SET is_connected=TRUE, health_status='healthy', last_sync_at=NOW()
    `, [CLUB_ID, d.code, true, d.vendor, 'healthy']);
  }
  console.log(`  ${domains.length} data source connections marked healthy`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nSeeding Oakmont Country Club (Los Angeles, CA)...\n');
  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    console.log('Step 1: Clearing existing oakmont_cc data...');
    await deleteAll(client);

    console.log('\nStep 2: Seeding club structure...');
    await seedClub(client);
    await seedMembershipTypes(client);
    await seedCourses(client);
    await seedDiningOutlets(client);

    console.log('\nStep 3: Seeding staff & Swoop user accounts...');
    const userLines = await seedStaffAndUsers(client);

    console.log('\nStep 4: Seeding members...');
    const members = await seedMembers(client);

    console.log('\nStep 5: Seeding historical activity...');
    await seedBookings(client, members);
    await seedPosChecks(client, members);
    await seedComplaints(client, members);
    await seedEvents(client, members);

    console.log('\nStep 6: Marking data sources as connected...');
    await seedDataSourceStatus(client);

    await client.query('COMMIT');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Oakmont Country Club — Seed Complete');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Club ID   : ${CLUB_ID}`);
    console.log(`  Club Name : Oakmont Country Club`);
    console.log(`  Location  : Los Angeles, CA 90210`);
    console.log('\n  Swoop login accounts created:');
    userLines.forEach(l => console.log(l));
    console.log('\n  NOTE: No passwords are set. Use your auth system to');
    console.log('  issue credentials or set passwords for these users.');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\nTransaction rolled back:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
