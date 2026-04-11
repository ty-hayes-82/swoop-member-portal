/**
 * Data Onboarding Agent — 14 Tool Functions
 *
 * 8 new tools + 6 wrappers around existing services.
 * All functions are async named exports.
 */
import { sql } from '@vercel/postgres';
import { VENDOR_COLUMN_ALIASES } from '../../src/services/csvImportService.js';
import {
  autoMapColumns as _autoMapColumns,
  JONAS_IMPORT_TYPES,
  getImportTypeConfig,
} from '../../src/config/jonasMapping.js';

// ---------------------------------------------------------------------------
// Inline CSV parser (no external deps)
// ---------------------------------------------------------------------------
function parseCSVLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === '\t') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function parseCSV(text) {
  // Strip BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  return lines.map(l => parseCSVLine(l));
}

// ---------------------------------------------------------------------------
// 1. inspectFile
// ---------------------------------------------------------------------------
export async function inspectFile(fileData) {
  const rows = parseCSV(fileData);
  if (rows.length === 0) {
    return { rowCount: 0, columnCount: 0, headers: [], sampleRows: [], encoding: 'utf-8', hasMetadataRows: false, metadataRowCount: 0 };
  }

  // Detect metadata rows: rows at the top with fewer columns than the mode
  const colCounts = rows.map(r => r.length);
  const mode = colCounts.sort((a, b) => a - b)[Math.floor(colCounts.length / 2)];
  let metadataRowCount = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length < mode * 0.5) {
      metadataRowCount++;
    } else {
      break;
    }
  }

  const headerIdx = metadataRowCount;
  const headers = rows[headerIdx] || [];
  const dataRows = rows.slice(headerIdx + 1);

  // Sample: first 5 + last 2
  const first5 = dataRows.slice(0, 5);
  const last2 = dataRows.length > 5 ? dataRows.slice(-2) : [];
  const sampleRows = [...first5, ...last2];

  return {
    rowCount: dataRows.length,
    columnCount: headers.length,
    headers,
    sampleRows,
    encoding: 'utf-8',
    hasMetadataRows: metadataRowCount > 0,
    metadataRowCount,
  };
}

// ---------------------------------------------------------------------------
// 2. identifySourceVendor
// ---------------------------------------------------------------------------
export async function identifySourceVendor(headers, sampleRows) {
  const lowerHeaders = headers.map(h => h.trim().toLowerCase());

  // Vendor-specific fingerprint patterns
  const vendorPatterns = {
    Jonas: ['member #', 'acct balance', 'join dt', 'given name', 'surname', 'membership type', 'member number'],
    ForeTees: ['booking time', 'tee date', 'player name', 'course name'],
    Toast: ['check #', 'check amt', 'server name', 'total due'],
    '7shifts': ['shift id', '7shifts', 'act hrs'],
    ADP: ['employee', 'dept', 'sched hrs', 'act hrs'],
    Mailchimp: ['campaign name', 'email address', 'opens', 'clicks'],
    Lightspeed: ['receipt #', 'sale total', 'tender', 'sale date'],
    Square: ['transaction id', 'net total', 'tip amount'],
    Chronogolf: ['reservation time', 'player'],
    ForeUP: ['tee time', 'golfer', 'holes played'],
  };

  let bestVendor = 'unknown';
  let bestScore = 0;
  let bestMatches = [];

  for (const [vendor, patterns] of Object.entries(vendorPatterns)) {
    const matches = patterns.filter(p => lowerHeaders.includes(p));
    const score = matches.length / patterns.length;
    if (score > bestScore) {
      bestScore = score;
      bestVendor = vendor;
      bestMatches = matches;
    }
  }

  // Also score against VENDOR_COLUMN_ALIASES keys
  for (const [vendor, aliasMap] of Object.entries(VENDOR_COLUMN_ALIASES)) {
    const aliasKeys = Object.keys(aliasMap).map(k => k.toLowerCase());
    const matches = aliasKeys.filter(k => lowerHeaders.includes(k));
    const score = aliasKeys.length > 0 ? matches.length / aliasKeys.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestVendor = vendor;
      bestMatches = matches;
    }
  }

  // Infer data category from matched alias values
  let dataCategory = 'unknown';
  if (bestVendor !== 'unknown' && VENDOR_COLUMN_ALIASES[bestVendor]) {
    const aliasMap = VENDOR_COLUMN_ALIASES[bestVendor];
    const mappedFields = bestMatches.map(m => {
      const key = Object.keys(aliasMap).find(k => k.toLowerCase() === m);
      return key ? aliasMap[key] : null;
    }).filter(Boolean);
    if (mappedFields.some(f => /member|first_name|last_name/.test(f))) dataCategory = 'members';
    else if (mappedFields.some(f => /tee_time|booking|course/.test(f))) dataCategory = 'tee_times';
    else if (mappedFields.some(f => /transaction|total|outlet/.test(f))) dataCategory = 'transactions';
    else if (mappedFields.some(f => /shift|employee/.test(f))) dataCategory = 'shifts';
    else if (mappedFields.some(f => /campaign|email/.test(f))) dataCategory = 'email';
    else if (mappedFields.some(f => /event|registration/.test(f))) dataCategory = 'events';
  }

  return {
    vendor: bestVendor,
    confidence: Math.round(bestScore * 100) / 100,
    dataCategory,
    reasoning: bestScore > 0
      ? `Matched ${bestMatches.length} header(s) to ${bestVendor}: ${bestMatches.join(', ')}`
      : 'No vendor-specific headers detected',
  };
}

// ---------------------------------------------------------------------------
// 3. fixDataIssues
// ---------------------------------------------------------------------------

const MONTH_NAMES = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

function convertDate(val) {
  if (!val || typeof val !== 'string') return val;
  const s = val.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // MM/DD/YYYY or M/D/YYYY
  let m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  // M/D/YY
  m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})$/);
  if (m) {
    const yr = Number(m[3]);
    const full = yr >= 50 ? 1900 + yr : 2000 + yr;
    return `${full}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  // DD-Mon-YY (e.g. 15-Jan-23)
  m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (m) {
    const mon = MONTH_NAMES[m[2].toLowerCase()];
    if (mon) {
      let yr = m[3];
      if (yr.length === 2) yr = (Number(yr) >= 50 ? '19' : '20') + yr;
      return `${yr}-${mon}-${m[1].padStart(2, '0')}`;
    }
  }
  return val;
}

function cleanNumber(val) {
  if (val === null || val === undefined || val === '') return val;
  let s = String(val).trim();
  // Parentheses mean negative: (123.45) -> -123.45
  const isNeg = /^\(.*\)$/.test(s);
  s = s.replace(/[$,()]/g, '');
  if (isNeg) s = '-' + s;
  const n = Number(s);
  return isNaN(n) ? val : n;
}

function cleanPhone(val) {
  if (!val) return val;
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits[0] === '1') return digits.slice(1);
  return digits;
}

function splitName(val) {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim();
  // "Last, First" format
  if (s.includes(',')) {
    const parts = s.split(',').map(p => p.trim());
    return { last_name: parts[0], first_name: parts.slice(1).join(' ') };
  }
  return null;
}

export async function fixDataIssues(issues, parsedData) {
  const changes = [];
  let fixed = 0;
  let unfixable = 0;
  const issueSet = new Set(issues.map(i => i.type || i));

  for (let r = 0; r < parsedData.length; r++) {
    const row = parsedData[r];
    for (const field of Object.keys(row)) {
      const before = row[field];

      // Whitespace / BOM
      if (issueSet.has('whitespace') && typeof row[field] === 'string') {
        row[field] = row[field].replace(/^\uFEFF/, '').trim();
        if (row[field] !== before) {
          changes.push({ row: r, field, before, after: row[field] });
          fixed++;
        }
      }

      // Date format
      if (issueSet.has('dateFormat') && /date|time|birthday|join|resigned/i.test(field)) {
        const after = convertDate(row[field]);
        if (after !== row[field]) {
          changes.push({ row: r, field, before: row[field], after });
          row[field] = after;
          fixed++;
        }
      }

      // Number cleanup
      if (issueSet.has('numberCleanup') && /amount|dues|balance|fee|rate|total|tax|gratuity|comp|discount|hours|price/i.test(field)) {
        const after = cleanNumber(row[field]);
        if (after !== row[field]) {
          changes.push({ row: r, field, before: row[field], after });
          row[field] = after;
          fixed++;
        }
      }

      // Enum normalize
      if (issueSet.has('enumNormalize') && /status|type|category|priority/i.test(field)) {
        if (typeof row[field] === 'string') {
          const after = row[field].toLowerCase().trim();
          if (after !== row[field]) {
            changes.push({ row: r, field, before: row[field], after });
            row[field] = after;
            fixed++;
          }
        }
      }

      // Phone cleanup
      if (issueSet.has('phone') && /phone|cell|mobile|telephone/i.test(field)) {
        const after = cleanPhone(row[field]);
        if (after !== row[field]) {
          changes.push({ row: r, field, before: row[field], after });
          row[field] = after;
          fixed++;
        }
      }
    }

    // Name split
    if (issueSet.has('nameSplit')) {
      for (const nameField of ['name', 'member_name', 'full_name', 'player_name']) {
        if (row[nameField]) {
          const split = splitName(row[nameField]);
          if (split) {
            changes.push({ row: r, field: nameField, before: row[nameField], after: `${split.first_name} ${split.last_name}` });
            row.first_name = split.first_name;
            row.last_name = split.last_name;
            fixed++;
          }
        }
      }
    }
  }

  return { fixed, unfixable, changes };
}

// ---------------------------------------------------------------------------
// 4. checkSchemaCompatibility
// ---------------------------------------------------------------------------

// Re-create IMPORT_TYPES locally (mirrors api/import-csv.js) for schema checks
const IMPORT_TYPES = {
  members: { requiredFields: ['first_name', 'last_name'], optionalFields: ['email', 'phone', 'membership_type', 'annual_dues', 'join_date', 'external_id', 'household_id', 'birthday', 'sex', 'handicap', 'current_balance', 'status', 'date_resigned'] },
  tee_times: { requiredFields: ['reservation_id', 'course', 'date', 'tee_time'], optionalFields: ['member_id', 'players', 'guest_flag', 'transportation', 'caddie', 'status', 'check_in_time', 'round_start', 'round_end', 'duration_min'] },
  transactions: { requiredFields: ['transaction_date', 'total_amount'], optionalFields: ['member_id', 'outlet_name', 'category', 'item_count', 'is_post_round', 'tax', 'gratuity', 'comp', 'discount', 'void', 'settlement_method', 'open_time', 'close_time'] },
  complaints: { requiredFields: ['category', 'description'], optionalFields: ['member_id', 'status', 'priority', 'reported_at', 'resolved_at', 'severity'] },
  events: { requiredFields: ['event_id', 'event_name'], optionalFields: ['event_type', 'start_date', 'capacity', 'registration_fee', 'description'] },
  event_registrations: { requiredFields: ['registration_id', 'event_id'], optionalFields: ['member_id', 'status', 'guest_count', 'fee_paid', 'registration_date', 'check_in_time'] },
  email_campaigns: { requiredFields: ['campaign_id', 'subject'], optionalFields: ['campaign_type', 'send_date', 'audience_count'] },
  email_events: { requiredFields: ['campaign_id', 'member_id', 'event_type'], optionalFields: ['timestamp', 'link_clicked', 'device'] },
  staff: { requiredFields: ['employee_id', 'first_name', 'last_name'], optionalFields: ['department', 'job_title', 'hire_date', 'hourly_rate', 'ft_pt'] },
  shifts: { requiredFields: ['shift_id', 'employee_id', 'date'], optionalFields: ['location', 'shift_start', 'shift_end', 'actual_hours', 'notes'] },
};

export async function checkSchemaCompatibility(mappedData, importType, clubId) {
  const config = IMPORT_TYPES[importType];
  if (!config) return { compatible: false, issues: [{ type: 'error', field: null, detail: `Unknown import type "${importType}"` }] };

  const issues = [];
  const allFields = [...config.requiredFields, ...(config.optionalFields || [])];
  const presentFields = mappedData.length > 0 ? Object.keys(mappedData[0]) : [];

  // Missing required
  for (const req of config.requiredFields) {
    if (!presentFields.includes(req)) {
      issues.push({ type: 'missing_required', field: req, detail: `Required field "${req}" is missing from the data` });
    }
  }

  // Unknown columns
  for (const col of presentFields) {
    if (!allFields.includes(col)) {
      issues.push({ type: 'unknown_column', field: col, detail: `Column "${col}" is not recognized for import type "${importType}"` });
    }
  }

  // Check a sample of rows for data quality
  const sample = mappedData.slice(0, 50);
  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    // Date fields parseable
    for (const key of Object.keys(row)) {
      if (/date|time|birthday/i.test(key) && !/_min$|_minutes$/i.test(key) && row[key]) {
        const d = new Date(row[key]);
        if (isNaN(d.getTime()) && !/^\d{4}-\d{2}-\d{2}/.test(String(row[key]))) {
          issues.push({ type: 'invalid_date', field: key, detail: `Row ${i + 1}: "${row[key]}" is not a valid date` });
          break; // one example is enough
        }
      }
    }
    // Numeric fields
    for (const key of Object.keys(row)) {
      if (/amount|dues|balance|fee|rate|total|tax|count|hours|price/i.test(key) && row[key] !== null && row[key] !== undefined && row[key] !== '') {
        if (isNaN(Number(row[key]))) {
          issues.push({ type: 'invalid_number', field: key, detail: `Row ${i + 1}: "${row[key]}" is not a valid number` });
          break;
        }
      }
    }
  }

  // Check member_id references for transaction-like types
  if (clubId && ['transactions', 'tee_times', 'complaints', 'event_registrations', 'email_events'].includes(importType)) {
    const memberIds = [...new Set(mappedData.map(r => r.member_id).filter(Boolean))];
    if (memberIds.length > 0) {
      try {
        const result = await sql`SELECT external_id FROM members WHERE club_id = ${clubId} AND external_id = ANY(${memberIds})`;
        const foundIds = new Set(result.rows.map(r => r.external_id));
        const missing = memberIds.filter(id => !foundIds.has(id));
        if (missing.length > 0) {
          issues.push({
            type: 'missing_member_refs',
            field: 'member_id',
            detail: `${missing.length} member ID(s) not found in members table (e.g. ${missing.slice(0, 3).join(', ')})`,
          });
        }
      } catch (err) {
        issues.push({ type: 'db_error', field: 'member_id', detail: `Could not verify member IDs: ${err.message}` });
      }
    }
  }

  const hasBlockers = issues.some(i => i.type === 'missing_required' || i.type === 'error');
  return { compatible: !hasBlockers, issues };
}

// ---------------------------------------------------------------------------
// 5. detectDuplicates
// ---------------------------------------------------------------------------
export async function detectDuplicates(data, importType, clubId) {
  const matches = [];

  try {
    if (importType === 'members') {
      const result = await sql`SELECT member_id, email, first_name, last_name, external_id FROM members WHERE club_id = ${clubId}`;
      const existing = result.rows;
      const emailMap = new Map();
      const extIdMap = new Map();
      for (const row of existing) {
        if (row.email) emailMap.set(row.email.toLowerCase(), row.member_id);
        if (row.external_id) extIdMap.set(String(row.external_id), row.member_id);
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row.external_id && extIdMap.has(String(row.external_id))) {
          matches.push({ row: i, existingId: extIdMap.get(String(row.external_id)), matchField: 'external_id' });
        } else if (row.email && emailMap.has(row.email.toLowerCase())) {
          matches.push({ row: i, existingId: emailMap.get(row.email.toLowerCase()), matchField: 'email' });
        }
      }
    } else if (['transactions', 'tee_times', 'complaints'].includes(importType)) {
      // For transactions match on date + amount + member
      const table = importType === 'transactions' ? 'transactions'
        : importType === 'tee_times' ? 'bookings'
        : 'complaints';

      if (importType === 'transactions') {
        const result = await sql`SELECT id, transaction_date, total_amount, member_id FROM transactions WHERE club_id = ${clubId}`;
        const existingSet = new Set(result.rows.map(r => `${r.transaction_date}|${r.total_amount}|${r.member_id}`));
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const key = `${row.transaction_date}|${row.total_amount}|${row.member_id}`;
          if (existingSet.has(key)) {
            matches.push({ row: i, existingId: null, matchField: 'date+amount+member' });
          }
        }
      }
    }
  } catch (err) {
    return { duplicates: 0, matches: [], action: 'ask_user', error: err.message };
  }

  const action = matches.length === 0 ? 'skip'
    : matches.length < data.length * 0.5 ? 'update'
    : 'ask_user';

  return { duplicates: matches.length, matches, action };
}

// ---------------------------------------------------------------------------
// 6. previewImport
// ---------------------------------------------------------------------------
export async function previewImport(data, importType, mapping, clubId) {
  // Detect duplicates to separate inserts vs updates
  const dupResult = await detectDuplicates(data, importType, clubId);
  const dupRows = new Set(dupResult.matches.map(m => m.row));

  let toInsert = 0;
  let toUpdate = 0;
  let toSkip = 0;

  const config = IMPORT_TYPES[importType];
  for (let i = 0; i < data.length; i++) {
    if (dupRows.has(i)) {
      toUpdate++;
      continue;
    }
    // Validate required fields
    if (config) {
      const missing = config.requiredFields.some(f => !data[i][f] || String(data[i][f]).trim() === '');
      if (missing) {
        toSkip++;
        continue;
      }
    }
    toInsert++;
  }

  const tableMap = {
    members: ['members'], tee_times: ['bookings'], transactions: ['transactions'],
    complaints: ['complaints'], events: ['event_definitions'], event_registrations: ['event_registrations'],
    email_campaigns: ['email_campaigns'], email_events: ['email_events'],
    staff: ['staff'], shifts: ['staff_shifts'],
  };

  return {
    toInsert,
    toUpdate,
    toSkip,
    tables: tableMap[importType] || [importType],
    estimatedTimeSeconds: Math.ceil(data.length / 500),
    totalRows: data.length,
  };
}

// ---------------------------------------------------------------------------
// 7. suggestMissingFields
// ---------------------------------------------------------------------------

const FIELD_DEFAULTS = {
  health_score: 'Computed automatically within 24 hours',
  archetype: 'Assigned after first tee time + F&B import',
  household_id: 'Can be detected by matching addresses',
  current_balance: 'Defaults to $0; updated on next AR import',
  handicap: 'Optional — imported from GHIN data if available',
  birthday: 'Optional — used for birthday engagement triggers',
  sex: 'Optional — used for demographic analytics',
  date_resigned: 'Only applies to resigned members; leave blank for active',
  is_post_round: 'Calculated automatically by correlating tee times with F&B checks',
  duration_min: 'Calculated from round_start and round_end if both are present',
  check_in_time: 'Optional — used for pace-of-play analytics',
};

export async function suggestMissingFields(mapping, importType) {
  const config = getImportTypeConfig(importType);
  if (!config) return { mapped: 0, total: 0, missing: [] };

  const mappedFieldValues = new Set(Object.values(mapping).filter(Boolean));
  const allFields = config.fields;
  const missing = [];

  for (const field of allFields) {
    if (!mappedFieldValues.has(field.swoop)) {
      missing.push({
        field: field.swoop,
        label: field.label,
        required: field.required,
        defaultBehavior: FIELD_DEFAULTS[field.swoop] || (field.required ? 'REQUIRED — must be mapped before import' : 'Optional — can be imported later or left blank'),
      });
    }
  }

  return {
    mapped: mappedFieldValues.size,
    total: allFields.length,
    missing,
  };
}

// ---------------------------------------------------------------------------
// 8. detectHouseholds
// ---------------------------------------------------------------------------
function normalizeAddress(addr) {
  if (!addr) return '';
  return addr.toLowerCase().replace(/[.,#\-]/g, '').replace(/\s+/g, ' ').trim()
    .replace(/\b(street|st|avenue|ave|drive|dr|road|rd|lane|ln|court|ct|boulevard|blvd|way|place|pl)\b/g, match => {
      const abbrevs = { street: 'st', avenue: 'ave', drive: 'dr', road: 'rd', lane: 'ln', court: 'ct', boulevard: 'blvd', place: 'pl' };
      return abbrevs[match] || match;
    });
}

export async function detectHouseholds(memberData) {
  const groups = [];
  const assigned = new Set();

  // Pass 1: group by normalized address
  const addressMap = new Map();
  for (let i = 0; i < memberData.length; i++) {
    const row = memberData[i];
    const addr = normalizeAddress(row.address || row.home_address || '');
    if (addr && addr.length > 5) {
      if (!addressMap.has(addr)) addressMap.set(addr, []);
      addressMap.get(addr).push(i);
    }
  }
  for (const [addr, indices] of addressMap) {
    if (indices.length > 1) {
      groups.push({
        members: indices.map(i => {
          const r = memberData[i];
          return `${r.first_name || ''} ${r.last_name || ''}`.trim();
        }),
        matchedOn: 'address',
      });
      indices.forEach(i => assigned.add(i));
    }
  }

  // Pass 2: last_name + zip for unassigned members
  const nameZipMap = new Map();
  for (let i = 0; i < memberData.length; i++) {
    if (assigned.has(i)) continue;
    const row = memberData[i];
    const zip = (row.zip || row.postal_code || '').toString().trim().slice(0, 5);
    const ln = (row.last_name || '').toLowerCase().trim();
    if (ln && zip) {
      const key = `${ln}|${zip}`;
      if (!nameZipMap.has(key)) nameZipMap.set(key, []);
      nameZipMap.get(key).push(i);
    }
  }
  for (const [key, indices] of nameZipMap) {
    if (indices.length > 1) {
      groups.push({
        members: indices.map(i => {
          const r = memberData[i];
          return `${r.first_name || ''} ${r.last_name || ''}`.trim();
        }),
        matchedOn: 'last_name+zip',
      });
    }
  }

  return {
    households: groups.length,
    groups,
  };
}

// ---------------------------------------------------------------------------
// 9. autoMapColumnsWrapper
// ---------------------------------------------------------------------------
export async function autoMapColumnsWrapper(headers, sampleData, vendor, importType) {
  const mapping = _autoMapColumns(headers, importType);

  // Build explanation
  const mapped = Object.entries(mapping).filter(([, v]) => v !== null);
  const unmapped = Object.entries(mapping).filter(([, v]) => v === null).map(([k]) => k);

  const explanation = [
    `Auto-mapped ${mapped.length} of ${headers.length} columns for "${importType}" import:`,
    ...mapped.map(([csv, swoop]) => `  "${csv}" -> ${swoop}`),
    unmapped.length > 0 ? `\n${unmapped.length} unmapped column(s): ${unmapped.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  return { mapping, explanation, mappedCount: mapped.length, unmappedCount: unmapped.length };
}

// ---------------------------------------------------------------------------
// 10. validateDataQuality
// ---------------------------------------------------------------------------
export async function validateDataQuality(parsedData, mapping, importType) {
  const config = IMPORT_TYPES[importType];
  if (!config) return { ready: false, warnings: 1, errors: 1, patterns: [{ issue: `Unknown import type "${importType}"`, count: 1, fixable: false }] };

  const errorBuckets = {};
  const warnBuckets = {};
  let totalErrors = 0;
  let totalWarnings = 0;

  for (let i = 0; i < parsedData.length; i++) {
    const row = parsedData[i];

    // Required field checks
    for (const field of config.requiredFields) {
      if (!row[field] || String(row[field]).trim() === '') {
        const key = `missing_required:${field}`;
        errorBuckets[key] = (errorBuckets[key] || 0) + 1;
        totalErrors++;
      }
    }

    // Date format checks
    for (const key of Object.keys(row)) {
      if (/date|time|birthday/i.test(key) && !/_min$|_minutes$/i.test(key) && row[key]) {
        const v = String(row[key]).trim();
        if (v && !/^\d{4}-\d{2}-\d{2}/.test(v)) {
          const bKey = `dateFormat:${key}`;
          warnBuckets[bKey] = (warnBuckets[bKey] || 0) + 1;
          totalWarnings++;
        }
      }
    }

    // Number format checks
    for (const key of Object.keys(row)) {
      if (/amount|dues|balance|fee|rate|total|tax|count|hours|price/i.test(key) && row[key] !== null && row[key] !== undefined && row[key] !== '') {
        if (isNaN(Number(row[key])) && /[$,()]/.test(String(row[key]))) {
          const bKey = `numberFormat:${key}`;
          warnBuckets[bKey] = (warnBuckets[bKey] || 0) + 1;
          totalWarnings++;
        }
      }
    }
  }

  const patterns = [];
  for (const [key, count] of Object.entries(errorBuckets)) {
    const [type, field] = key.split(':');
    patterns.push({ issue: `${count} rows have ${type} for "${field}"`, count, fixable: false });
  }
  for (const [key, count] of Object.entries(warnBuckets)) {
    const [type, field] = key.split(':');
    patterns.push({ issue: `${count} rows have ${type} issues in "${field}"`, count, fixable: true });
  }

  return {
    ready: totalErrors === 0,
    warnings: totalWarnings,
    errors: totalErrors,
    patterns,
  };
}

// ---------------------------------------------------------------------------
// 11. executeImportWrapper
// ---------------------------------------------------------------------------
export async function executeImportWrapper(data, mapping, importType, clubId, userId) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clubId,
        importType,
        rows: data,
        uploadedBy: userId,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, imported: 0, errors: [result.error || response.statusText], importId: null };
    }

    return {
      success: true,
      imported: result.imported || result.count || data.length,
      errors: result.errors || [],
      importId: result.importId || null,
    };
  } catch (err) {
    return { success: false, imported: 0, errors: [err.message], importId: null };
  }
}

// ---------------------------------------------------------------------------
// 12. getExtractionGuide
// ---------------------------------------------------------------------------
export async function getExtractionGuide(vendor, dataCategory) {
  try {
    const { extractionGuides } = await import('./extraction-guides.js');
    if (!extractionGuides) return { found: false, vendor, dataCategory, guide: null };

    const guide = extractionGuides?.[vendor]?.[dataCategory]
      || extractionGuides?.[vendor]?.['default']
      || null;

    return { found: !!guide, vendor, dataCategory, guide };
  } catch (err) {
    return { found: false, vendor, dataCategory, guide: null, error: `extraction-guides.js not found: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// 13. getImportHistory
// ---------------------------------------------------------------------------
export async function getImportHistory(clubId) {
  try {
    const result = await sql`
      SELECT id, import_type, file_name, row_count, error_count, status, imported_at, uploaded_by
      FROM csv_imports
      WHERE club_id = ${clubId}
      ORDER BY imported_at DESC
      LIMIT 10
    `;
    return {
      imports: result.rows,
      total: result.rows.length,
    };
  } catch (err) {
    return { imports: [], total: 0, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// 14. getDataGaps
// ---------------------------------------------------------------------------
const DATA_DOMAINS = ['CRM', 'TEE_SHEET', 'POS', 'LABOR', 'EMAIL', 'EVENTS', 'COMPLAINTS', 'WEATHER'];

const DOMAIN_IMPORT_MAP = {
  CRM: ['members'],
  TEE_SHEET: ['tee_times'],
  POS: ['transactions'],
  LABOR: ['staff', 'shifts'],
  EMAIL: ['email_campaigns', 'email_events'],
  EVENTS: ['events', 'event_registrations'],
  COMPLAINTS: ['complaints'],
  WEATHER: [],
};

const DOMAIN_NEXT_STEPS = {
  CRM: 'Import your member roster CSV — this is the foundation for all analytics.',
  TEE_SHEET: 'Import tee sheet / booking data to unlock golf engagement scores.',
  POS: 'Import F&B transaction data to unlock dining engagement and revenue analytics.',
  LABOR: 'Import staff roster and shift schedules for staffing intelligence.',
  EMAIL: 'Import email campaigns and events for email engagement dimension.',
  EVENTS: 'Import event definitions and registrations for event engagement.',
  COMPLAINTS: 'Import complaints/feedback to enable service quality tracking.',
  WEATHER: 'Weather data is auto-sourced — no import needed. Will activate once location is set.',
};

export async function getDataGaps(clubId) {
  const connected = [];
  const missing = [];

  try {
    // Check data_source_status if it exists
    try {
      const result = await sql`SELECT domain, status, last_import_at FROM data_source_status WHERE club_id = ${clubId}`;
      const statusMap = new Map(result.rows.map(r => [r.domain, r]));
      for (const domain of DATA_DOMAINS) {
        if (statusMap.has(domain) && statusMap.get(domain).status === 'connected') {
          connected.push({ domain, lastImport: statusMap.get(domain).last_import_at });
        } else {
          missing.push({ domain, importTypes: DOMAIN_IMPORT_MAP[domain], nextStep: DOMAIN_NEXT_STEPS[domain] });
        }
      }
    } catch {
      // Table may not exist; fall back to checking csv_imports
      const result = await sql`SELECT DISTINCT import_type FROM csv_imports WHERE club_id = ${clubId}`;
      const importedTypes = new Set(result.rows.map(r => r.import_type));

      for (const domain of DATA_DOMAINS) {
        const types = DOMAIN_IMPORT_MAP[domain];
        const hasAny = types.some(t => importedTypes.has(t));
        if (hasAny) {
          connected.push({ domain, lastImport: null });
        } else {
          missing.push({ domain, importTypes: types, nextStep: DOMAIN_NEXT_STEPS[domain] });
        }
      }
    }
  } catch (err) {
    // DB completely unavailable — report all as missing
    for (const domain of DATA_DOMAINS) {
      missing.push({ domain, importTypes: DOMAIN_IMPORT_MAP[domain], nextStep: DOMAIN_NEXT_STEPS[domain] });
    }
  }

  return {
    connected,
    missing,
    completionPct: Math.round((connected.length / DATA_DOMAINS.length) * 100),
    nextRecommendation: missing[0]?.nextStep || 'All data domains are connected!',
  };
}
