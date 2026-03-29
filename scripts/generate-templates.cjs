/**
 * Generate XLSX templates with realistic mock data for Swoop onboarding.
 *
 * Templates:
 *   A — Members Only (20 members)
 *   B — Members + Rounds (25 members, 80 rounds)
 *   C — Members + Rounds + F&B (30 members, 100 rounds, 150 transactions)
 *   D — Full Dataset (40 members, 120 rounds, 200 transactions, 15 complaints)
 *
 * Run: node scripts/generate-templates.js
 * Output: public/templates/swoop-template-*.xlsx
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Name pools ───
const FIRST = ['James','Sarah','Michael','Patricia','Robert','Jennifer','David','Linda','William','Elizabeth','Thomas','Margaret','Richard','Susan','Charles','Dorothy','Daniel','Karen','Matthew','Nancy','Andrew','Lisa','Christopher','Betty','Joseph','Sandra','Brian','Ashley','Kevin','Donna','Mark','Carol','Steven','Ruth','Edward','Sharon','George','Laura','Timothy','Cynthia'];
const LAST = ['Anderson','Mitchell','Crawford','Santos','Chen','Whitfield','Torres','Park','Kim','Brooks','Henderson','Bell','Liu','Simmons','Richardson','Murphy','Stewart','Cooper','Morgan','Bailey','Reed','Price','Ward','Russell','Hart','Wells','Fox','Stone','Lane','Coleman'];
const TIERS = ['Full Golf','Social','Sports','Junior','Non-Resident'];
const TIER_DUES = { 'Full Golf': [15000,25000], 'Social': [8000,12000], 'Sports': [10000,18000], 'Junior': [5000,8000], 'Non-Resident': [6000,10000] };
const OUTLETS = ['Grill Room','The Bar','Halfway House','Banquet Hall','Pool Cafe'];
const FB_CATS = ['dining','dining','dining','beverage','beverage','retail'];
const COMPLAINT_CATS = ['Service Speed','Course Condition','Food Quality','Staff','Billing'];
const COMPLAINT_DESCS = {
  'Service Speed': ['Waited 45 minutes for lunch during Saturday rush','Server never checked back after appetizer','Drink order took 30 minutes at the turn','Food arrived cold after long wait','Slow service during member-guest event'],
  'Course Condition': ['Bunkers not raked on holes 4 and 7','Greens were patchy and inconsistent','Cart path damage near hole 12'],
  'Food Quality': ['Steak was overcooked, sent back twice','Salad was wilted and brown','Burger was raw in the center'],
  'Staff': ['Pro shop staff was dismissive when asking about lessons','Starter was rude to my guest'],
  'Billing': ['Charged twice for same round','F&B minimum not applied correctly to my account'],
};

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function dateStr(d) { return d.toISOString().split('T')[0]; }
function timeStr(h, m) { return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }

function randomDate(startDays, endDays) {
  const now = new Date('2026-03-15');
  const d = new Date(now);
  d.setDate(d.getDate() - rand(startDays, endDays));
  return d;
}

function generateMembers(count) {
  const members = [];
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let first, last;
    do {
      first = pick(FIRST);
      last = pick(LAST);
    } while (usedNames.has(`${first} ${last}`));
    usedNames.add(`${first} ${last}`);

    const tier = pick(TIERS);
    const [duesMin, duesMax] = TIER_DUES[tier];
    const joinDate = randomDate(180, 2920); // 6 months to 8 years ago
    members.push({
      member_id: `mbr_${String(i + 1).padStart(3, '0')}`,
      first_name: first,
      last_name: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
      phone: `(${rand(200,999)}) ${rand(200,999)}-${rand(1000,9999)}`,
      membership_type: tier,
      status: i < count - 2 ? 'active' : (i === count - 2 ? 'active' : 'active'),
      join_date: dateStr(joinDate),
      annual_dues: rand(duesMin, duesMax),
    });
  }
  return members;
}

function generateRounds(members, count) {
  const rounds = [];
  // Give some members many rounds, some few, some zero
  const activeIds = members.slice(0, Math.ceil(members.length * 0.7)).map(m => m.member_id);
  const heavyIds = activeIds.slice(0, Math.ceil(activeIds.length * 0.3));

  for (let i = 0; i < count; i++) {
    const isHeavy = i < count * 0.4;
    const memberId = isHeavy ? pick(heavyIds) : pick(activeIds);
    const roundDate = randomDate(1, 90);
    const hour = rand(6, 14);
    const minute = [0, 8, 16, 24, 32, 40, 48, 56][rand(0, 7)];
    const cancelled = i < 3; // first 3 are cancellations
    const noShow = !cancelled && i >= 3 && i < 5; // 2 no-shows

    rounds.push({
      member_id: memberId,
      round_date: dateStr(roundDate),
      tee_time: timeStr(hour, minute),
      course_id: 'course_main',
      duration_minutes: cancelled || noShow ? '' : rand(180, 300),
      cancelled: cancelled ? 'true' : 'false',
      no_show: noShow ? 'true' : 'false',
    });
  }
  return rounds;
}

function generateTransactions(members, count) {
  const txns = [];
  const activeIds = members.slice(0, Math.ceil(members.length * 0.8)).map(m => m.member_id);

  for (let i = 0; i < count; i++) {
    const txnDate = randomDate(1, 90);
    const category = pick(FB_CATS);
    const amount = category === 'dining' ? rand(18, 180) : category === 'beverage' ? rand(8, 45) : rand(12, 95);

    txns.push({
      transaction_date: dateStr(txnDate),
      total_amount: amount + (rand(0, 99) / 100),
      member_id: pick(activeIds),
      outlet_name: pick(OUTLETS),
      category,
    });
  }
  return txns;
}

function generateComplaints(members, count) {
  const complaints = [];
  const memberIds = members.slice(0, Math.ceil(members.length * 0.5)).map(m => m.member_id);
  const priorities = ['high','high','high','high','medium','medium','medium','medium','medium','medium','low','low','low','low','low'];

  for (let i = 0; i < count; i++) {
    const category = COMPLAINT_CATS[i % COMPLAINT_CATS.length];
    const descs = COMPLAINT_DESCS[category];
    const desc = descs[i % descs.length];
    const reportedDate = randomDate(5, 60);
    const isOpen = i < 5; // 5 open, rest resolved
    const isOverdue = isOpen && i < 3; // 3 of the open are >30 days
    const resolvedDate = isOpen ? '' : new Date(reportedDate.getTime() + rand(1, 14) * 86400000);

    if (isOverdue) {
      reportedDate.setDate(reportedDate.getDate() - 35); // push back to be overdue
    }

    complaints.push({
      category,
      description: desc,
      member_id: pick(memberIds),
      status: isOpen ? 'open' : 'resolved',
      priority: priorities[i] || 'medium',
      reported_at: dateStr(reportedDate),
      resolved_at: resolvedDate ? dateStr(resolvedDate) : '',
    });
  }
  return complaints;
}

function writeXlsx(filename, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String(r[key] || '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const filepath = path.join(OUT_DIR, filename);
  XLSX.writeFile(wb, filepath);
  console.log(`  Created: ${filepath}`);
}

// ─── Generate all 4 templates ───
console.log('Generating Swoop onboarding templates...\n');

// Template A: Members Only
const membersA = generateMembers(20);
writeXlsx('swoop-template-members-only.xlsx', { 'Members': membersA });

// Template B: Members + Rounds
const membersB = generateMembers(25);
const roundsB = generateRounds(membersB, 80);
writeXlsx('swoop-template-members-rounds.xlsx', { 'Members': membersB, 'Rounds': roundsB });

// Template C: Members + Rounds + F&B
const membersC = generateMembers(30);
const roundsC = generateRounds(membersC, 100);
const txnsC = generateTransactions(membersC, 150);
writeXlsx('swoop-template-members-rounds-fb.xlsx', { 'Members': membersC, 'Rounds': roundsC, 'Transactions': txnsC });

// Template D: Full Dataset
const membersD = generateMembers(40);
const roundsD = generateRounds(membersD, 120);
const txnsD = generateTransactions(membersD, 200);
const complaintsD = generateComplaints(membersD, 15);
writeXlsx('swoop-template-full.xlsx', { 'Members': membersD, 'Rounds': roundsD, 'Transactions': txnsD, 'Complaints': complaintsD });

console.log('\nDone! 4 templates generated in public/templates/');
console.log('\nTemplate summary:');
console.log('  A: Members Only         — 20 members');
console.log('  B: Members + Rounds     — 25 members, 80 rounds');
console.log('  C: Members + Rounds + FB — 30 members, 100 rounds, 150 transactions');
console.log('  D: Full Dataset         — 40 members, 120 rounds, 200 transactions, 15 complaints');
