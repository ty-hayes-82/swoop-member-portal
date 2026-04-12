// Generate a small, linked fixture set for E2E iteration.
//
// Picks 100 members from JCM_Members_F9.csv (preferring the most active ones
// by tee-sheet booking count) and filters every other data file to only
// include rows that reference those members.
//
// Why the most-active bias: a purely random 100 may contain mostly members
// with zero tee sheet / POS activity, which would produce empty child files
// and invalidate the cross-domain test. Top-active gives meaningful joins.
//
// Output: tests/fixtures/small/*.csv — commit-safe, deterministic (same pick
// every run because we sort by activity count, not PRNG).
//
// Usage: node scripts/generate-small-fixtures.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SRC = path.join(REPO, 'docs', 'jonas-exports');
const OUT = path.join(REPO, 'tests', 'fixtures', 'small');

const TARGET_MEMBER_COUNT = 100;

// --- Simple CSV parse/serialize (handles quoted fields with commas) -------

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = [];
  let cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (q && text[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === '\n' && !q) { if (cur.trim()) lines.push(cur); cur = ''; }
    else if (c === '\r' && !q) { /* skip */ }
    else cur += c;
  }
  if (cur.trim()) lines.push(cur);
  if (lines.length < 2) return { headers: [], rows: [] };
  const splitRow = (line) => {
    const out = [];
    let f = '', q2 = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q2 && line[i + 1] === '"') { f += '"'; i++; } else q2 = !q2; }
      else if (c === ',' && !q2) { out.push(f.trim()); f = ''; }
      else f += c;
    }
    out.push(f.trim());
    return out;
  };
  let header = lines[0];
  if (header.charCodeAt(0) === 0xFEFF) header = header.slice(1);
  const headers = splitRow(header);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }
  return { headers, rows };
}

function escapeCell(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function serializeCSV(headers, rows) {
  const header = headers.map(escapeCell).join(',');
  const body = rows.map(r => headers.map(h => escapeCell(r[h])).join(',')).join('\n');
  return header + '\n' + body + '\n';
}

// --- Load source files -----------------------------------------------------

function load(name) {
  const p = path.join(SRC, name);
  console.log(`  reading ${name}...`);
  return parseCSV(readFileSync(p, 'utf8'));
}

const members     = load('JCM_Members_F9.csv');
const teePlayers  = load('TTM_Tee_Sheet_Players_SV.csv');
const teeSheet    = load('TTM_Tee_Sheet_SV.csv');
const posDetail   = load('POS_Sales_Detail_SV.csv');
const comms       = load('JCM_Communications_RG.csv');

console.log(`  source counts: members=${members.rows.length}, tee-players=${teePlayers.rows.length}, bookings=${teeSheet.rows.length}, pos=${posDetail.rows.length}, comms=${comms.rows.length}`);

// --- Pick 100 most-active members ----------------------------------------

// Count tee-sheet bookings per member via the players file.
const activityByMember = new Map();
for (const p of teePlayers.rows) {
  const memNum = p['Member #'];
  if (!memNum) continue;
  activityByMember.set(memNum, (activityByMember.get(memNum) || 0) + 1);
}

// Join key is `Member #` (e.g. mbr_001), NOT `Member Number` (the numeric 1).
// Child files (players, POS, communications) all reference `Member #`.
const scored = members.rows.map(m => ({
  row: m,
  memberNum: m['Member #'] || '',
  activity: activityByMember.get(m['Member #']) || 0,
}));

// Sort by activity desc. Tie-break by member number for determinism.
scored.sort((a, b) => b.activity - a.activity || String(a.memberNum).localeCompare(String(b.memberNum)));

const picked = scored.slice(0, TARGET_MEMBER_COUNT);
const memberIds = new Set(picked.map(p => p.memberNum).filter(Boolean));

console.log(`  picked ${picked.length} members (top-${TARGET_MEMBER_COUNT} by tee-sheet activity)`);
console.log(`  activity range: ${picked[0]?.activity || 0} → ${picked[picked.length - 1]?.activity || 0} bookings`);

// --- Filter child datasets ------------------------------------------------

const pickedMemberRows = picked.map(p => p.row);

// Tee-sheet players: keep rows whose Member # is in our picked set
const filteredPlayers = teePlayers.rows.filter(p => memberIds.has(p['Member #']));
const reservationIds = new Set(filteredPlayers.map(p => p['Reservation ID']));

// Tee-sheet bookings: keep rows whose Reservation ID is referenced by a kept player
const filteredBookings = teeSheet.rows.filter(b => reservationIds.has(b['Reservation ID']));

// POS: keep by Member #
const filteredPos = posDetail.rows.filter(t => memberIds.has(t['Member #']));

// Communications (complaints): keep by Member #
const filteredComms = comms.rows.filter(c => memberIds.has(c['Member #']));

console.log(`  filtered counts: players=${filteredPlayers.length}, bookings=${filteredBookings.length}, pos=${filteredPos.length}, comms=${filteredComms.length}`);

// --- Write output ---------------------------------------------------------

mkdirSync(OUT, { recursive: true });

function write(name, headers, rows) {
  const p = path.join(OUT, name);
  writeFileSync(p, serializeCSV(headers, rows));
  console.log(`  wrote ${name} (${rows.length} rows)`);
}

write('JCM_Members_F9.csv', members.headers, pickedMemberRows);
write('TTM_Tee_Sheet_Players_SV.csv', teePlayers.headers, filteredPlayers);
write('TTM_Tee_Sheet_SV.csv', teeSheet.headers, filteredBookings);
write('POS_Sales_Detail_SV.csv', posDetail.headers, filteredPos);
write('JCM_Communications_RG.csv', comms.headers, filteredComms);

// Write a manifest so the test + plan know what's in here
const manifest = {
  generatedAt: new Date().toISOString(),
  targetMemberCount: TARGET_MEMBER_COUNT,
  actualMemberCount: pickedMemberRows.length,
  counts: {
    members: pickedMemberRows.length,
    tee_sheet_players: filteredPlayers.length,
    tee_sheet_bookings: filteredBookings.length,
    pos_sales_detail: filteredPos.length,
    communications: filteredComms.length,
  },
  activityRange: {
    topBookings: picked[0]?.activity || 0,
    bottomBookings: picked[picked.length - 1]?.activity || 0,
  },
};
writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`  wrote manifest.json`);
console.log('\nDone.');
