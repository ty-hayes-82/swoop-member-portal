#!/usr/bin/env node
/**
 * Dry Run: Bowling Green CC — Synthetic Data
 *
 * Creates a realistic club with ~300 members, rounds, transactions,
 * and complaints matching the Bowling Green CC profile.
 *
 * Usage:
 *   node scripts/dry-run-bowling-green.mjs [base-url]
 */

const BASE_URL = process.argv[2] || 'https://swoop-member-portal-production-readiness.vercel.app';
const TIMESTAMP = Date.now();
const CLUB_NAME = `Bowling Green CC (Dry Run ${TIMESTAMP})`;
const ADMIN_EMAIL = `bgcc-dryrun-${TIMESTAMP}@swoopgolf.com`;
const ADMIN_PASSWORD = 'BowlingGreen2026!';

let token = null;
let clubId = null;
let passed = 0;
let failed = 0;

function log(icon, msg) { console.log(`${icon} ${msg}`); }

async function api(method, path, body = null, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

// ── Data Generators ──────────────────────────────────────────────

const FIRST_NAMES = ['James','Robert','Michael','David','William','Richard','Joseph','Thomas','Charles','Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Andrew','Paul','Joshua','Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel','Raymond','Gregory','Frank','Alexander','Patrick','Jack','Dennis','Jerry','Tyler'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter'];
const MEMBERSHIP_TYPES = ['Full Golf', 'Full Golf', 'Full Golf', 'Social', 'Social', 'Junior Executive', 'Legacy', 'Corporate'];
const OUTLETS = ['The Grill Room', 'The Terrace', 'Pool Bar', 'Main Dining Room', 'Pro Shop Cafe'];
const COMPLAINT_CATEGORIES = ['Pace of Play', 'Food Quality', 'Staff Service', 'Course Maintenance', 'Facility Cleanliness', 'Billing', 'Communication'];
const COMPLAINT_DESCS = {
  'Pace of Play': ['Slow play on back nine, 5+ hour round', 'Group ahead not keeping pace', 'Fivesome not broken up by marshal'],
  'Food Quality': ['Burger arrived cold at The Grill Room', 'Salad was wilted at lunch', 'Wait time for food was 45 minutes'],
  'Staff Service': ['Bartender was inattentive at Pool Bar', 'Pro shop staff unhelpful with fitting', 'Valet service very slow after event'],
  'Course Maintenance': ['Bunkers not raked on holes 4, 7, 12', 'Cart path damage near hole 9', 'Tee boxes need divot repair'],
  'Facility Cleanliness': ['Locker room needs attention', 'Pool area had debris Saturday morning', 'Restroom on 5th hole out of supplies'],
  'Billing': ['Incorrect charge on monthly statement', 'Guest fee applied incorrectly', 'F&B minimum not credited properly'],
  'Communication': ['Didnt receive event invitation email', 'Website calendar not updated', 'No notification about course closure'],
};

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randomDate(daysBack) {
  const d = new Date(Date.now() - randomBetween(0, daysBack) * 86400000);
  return d.toISOString().split('T')[0];
}

function generateMembers(count) {
  const members = [];
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let first, last, fullName;
    do {
      first = randomFrom(FIRST_NAMES);
      last = randomFrom(LAST_NAMES);
      fullName = `${first} ${last}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const joinYearsAgo = randomBetween(0, 15);
    const joinDate = new Date(Date.now() - joinYearsAgo * 365.25 * 86400000);
    const type = randomFrom(MEMBERSHIP_TYPES);
    const dues = type === 'Full Golf' ? randomBetween(10000, 18000)
      : type === 'Social' ? randomBetween(4000, 8000)
      : type === 'Junior Executive' ? randomBetween(6000, 10000)
      : type === 'Legacy' ? randomBetween(12000, 20000)
      : randomBetween(15000, 25000);

    members.push({
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@bgcc-test.com`,
      phone: `502-${randomBetween(200, 999)}-${String(randomBetween(1000, 9999))}`,
      membership_type: type,
      annual_dues: dues,
      join_date: joinDate.toISOString().split('T')[0],
      status: Math.random() > 0.03 ? 'active' : 'inactive',
      birthday: `${randomBetween(1950, 2000)}-${String(randomBetween(1, 12)).padStart(2, '0')}-${String(randomBetween(1, 28)).padStart(2, '0')}`,
      sex: Math.random() > 0.35 ? 'M' : 'F',
      handicap: type.includes('Golf') ? randomBetween(2, 28) : null,
    });
  }
  return members;
}

function generateRounds(memberCount, roundsCount) {
  const rounds = [];
  for (let i = 0; i < roundsCount; i++) {
    const memberIdx = randomBetween(0, Math.min(memberCount - 1, Math.floor(memberCount * 0.7)));
    const hour = randomBetween(7, 15);
    const minute = [0, 8, 16, 24, 32, 40, 48][randomBetween(0, 6)];
    rounds.push({
      member_id: `mbr_${TIMESTAMP}_${memberIdx}`,
      round_date: randomDate(90),
      tee_time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      duration_minutes: randomBetween(200, 280),
      players: randomBetween(1, 4),
      cancelled: Math.random() < 0.05,
      no_show: Math.random() < 0.02,
    });
  }
  return rounds;
}

function generateTransactions(memberCount, txCount) {
  const txns = [];
  for (let i = 0; i < txCount; i++) {
    const memberIdx = randomBetween(0, memberCount - 1);
    const outlet = randomFrom(OUTLETS);
    const isProShop = outlet === 'Pro Shop Cafe';
    txns.push({
      member_id: `mbr_${TIMESTAMP}_${memberIdx}`,
      transaction_date: randomDate(90),
      total_amount: isProShop ? randomBetween(5, 25) : randomBetween(15, 120),
      outlet_name: outlet,
      category: isProShop ? 'beverage' : (Math.random() > 0.4 ? 'food' : 'beverage'),
      item_count: randomBetween(1, 5),
      is_post_round: Math.random() < 0.3,
    });
  }
  return txns;
}

function generateComplaints(count) {
  const complaints = [];
  for (let i = 0; i < count; i++) {
    const cat = randomFrom(COMPLAINT_CATEGORIES);
    complaints.push({
      category: cat,
      description: randomFrom(COMPLAINT_DESCS[cat]),
      priority: Math.random() < 0.3 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low',
      status: Math.random() < 0.4 ? 'resolved' : 'open',
      reported_at: randomDate(60),
    });
  }
  return complaints;
}

// ── Main Flow ────────────────────────────────────────────────────

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log(' Bowling Green CC — Dry Run Onboarding');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Base URL:  ${BASE_URL}`);
  console.log(`Club:      ${CLUB_NAME}`);
  console.log(`Admin:     ${ADMIN_EMAIL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Step 1: Create club
  log('📋', 'Step 1: Creating club...');
  const r1 = await api('POST', '/api/onboard-club', {
    clubName: CLUB_NAME, city: 'Bowling Green', state: 'KY', zip: '42101',
    memberCount: 300, courseCount: 1, outletCount: 5,
    adminEmail: ADMIN_EMAIL, adminName: 'Daniel Soehren', adminPassword: ADMIN_PASSWORD,
  });
  if (!r1.ok) { log('❌', `Create club failed: ${JSON.stringify(r1.data)}`); process.exit(1); }
  clubId = r1.data.clubId;
  log('✅', `Club created: ${clubId}`);

  // Step 2: Login
  log('🔑', 'Step 2: Logging in...');
  const r2 = await api('POST', '/api/auth', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!r2.ok) { log('❌', `Login failed: ${JSON.stringify(r2.data)}`); process.exit(1); }
  token = r2.data.token;
  log('✅', `Logged in as ${r2.data.user.name}`);

  const authHeader = { Authorization: `Bearer ${token}` };

  // Step 3: Generate and import members (300)
  log('👥', 'Step 3: Generating 300 members...');
  const members = generateMembers(300);
  const r3 = await api('POST', '/api/import-csv', { importType: 'members', rows: members }, authHeader);
  log(r3.ok ? '✅' : '❌', `Members: ${r3.data?.success || 0}/${r3.data?.totalRows || 0} imported`);

  // Step 4: Import rounds (1200 = ~90 days of data)
  log('⛳', 'Step 4: Generating 1,200 rounds (90 days)...');
  const rounds = generateRounds(300, 1200);
  // Import in batches of 200
  let roundsImported = 0;
  for (let i = 0; i < rounds.length; i += 200) {
    const batch = rounds.slice(i, i + 200);
    const r = await api('POST', '/api/import-csv', { importType: 'rounds', rows: batch }, authHeader);
    roundsImported += r.data?.success || 0;
  }
  log('✅', `Rounds: ${roundsImported}/${rounds.length} imported`);

  // Step 5: Import transactions (3000 = ~90 days of F&B)
  log('🍽️', 'Step 5: Generating 3,000 transactions (90 days)...');
  const transactions = generateTransactions(300, 3000);
  let txImported = 0;
  for (let i = 0; i < transactions.length; i += 200) {
    const batch = transactions.slice(i, i + 200);
    const r = await api('POST', '/api/import-csv', { importType: 'transactions', rows: batch }, authHeader);
    txImported += r.data?.success || 0;
  }
  log('✅', `Transactions: ${txImported}/${transactions.length} imported`);

  // Step 6: Import complaints (15)
  log('📝', 'Step 6: Generating 15 complaints...');
  const complaints = generateComplaints(15);
  const r6 = await api('POST', '/api/import-csv', { importType: 'complaints', rows: complaints }, authHeader);
  log(r6.ok ? '✅' : '❌', `Complaints: ${r6.data?.success || 0}/${r6.data?.totalRows || 0} imported`);

  // Step 7: Compute health scores
  log('🧮', 'Step 7: Computing health scores...');
  const r7 = await api('POST', `/api/compute-health-scores?clubId=${clubId}`, null, authHeader);
  if (r7.ok) {
    log('✅', `Health scores: ${r7.data.computed} computed, ${r7.data.alerts || 0} alerts`);
  } else {
    log('❌', `Health scores failed: ${JSON.stringify(r7.data)}`);
  }

  // Step 8: Validate — fetch members and check distribution
  log('🔍', 'Step 8: Validating health score distribution...');
  const r8 = await api('GET', `/api/members?clubId=${clubId}`, null, authHeader);
  const memberList = r8.data?.memberRoster || r8.data?.members || [];
  const withScores = memberList.filter(m => m.healthScore != null || m.health_score != null);
  const tiers = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
  withScores.forEach(m => {
    const score = m.healthScore || m.health_score || 0;
    if (score >= 67) tiers.Healthy++;
    else if (score >= 45) tiers.Watch++;
    else if (score >= 25) tiers['At Risk']++;
    else tiers.Critical++;
  });

  log('📊', `Distribution: Healthy=${tiers.Healthy}, Watch=${tiers.Watch}, At Risk=${tiers['At Risk']}, Critical=${tiers.Critical}`);
  log('📊', `Total with scores: ${withScores.length}/${memberList.length}`);

  // Validate percentages
  const total = withScores.length || 1;
  const healthyPct = Math.round(tiers.Healthy / total * 100);
  const watchPct = Math.round(tiers.Watch / total * 100);
  const atRiskPct = Math.round(tiers['At Risk'] / total * 100);
  const critPct = Math.round(tiers.Critical / total * 100);

  log('📊', `Percentages: Healthy=${healthyPct}%, Watch=${watchPct}%, At Risk=${atRiskPct}%, Critical=${critPct}%`);

  if (healthyPct >= 40 && healthyPct <= 80) {
    log('✅', 'Health distribution looks reasonable');
    passed++;
  } else {
    log('⚠️', `Health distribution may be skewed — ${healthyPct}% healthy`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log(' DRY RUN COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Club ID:      ${clubId}`);
  console.log(`Admin Email:  ${ADMIN_EMAIL}`);
  console.log(`Admin Pass:   ${ADMIN_PASSWORD}`);
  console.log(`Members:      ${r3.data?.success || 0}`);
  console.log(`Rounds:       ${roundsImported}`);
  console.log(`Transactions: ${txImported}`);
  console.log(`Complaints:   ${r6.data?.success || 0}`);
  console.log(`Health Scores: ${r7.data?.computed || 0}`);
  console.log(`\nLogin URL: ${BASE_URL}/#/login`);
  console.log(`\nTo clean up: node scripts/test-onboarding-e2e.mjs  (see cleanup SQL at bottom)`);
  console.log('═══════════════════════════════════════════════════\n');
}

run().catch(err => { console.error('Dry run error:', err); process.exit(1); });
