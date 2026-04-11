/**
 * Data Onboarding Agent — unit tests for the 14 import/analysis tools.
 *
 * Tests the logic that will live in api/onboarding-agent/tools.js,
 * currently implemented across src/config/jonasMapping.js,
 * src/config/dataOnboardingPrompt.js, and api/import-csv.js.
 *
 * Mocks: @vercel/postgres (sql), withAuth middleware, managed-config, logger.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

const sqlMock = vi.fn(() => Promise.resolve({ rows: [] }));

vi.mock('@vercel/postgres', () => ({ sql: sqlMock }));

vi.mock('../../api/lib/withAuth.js', () => ({
  withAuth: (handler) => handler,
  getWriteClubId: (req) => req.auth?.clubId ?? 'club_test',
  getReadClubId: (req) => req.auth?.clubId ?? 'club_test',
  getClubId: (req) => req.auth?.clubId ?? 'club_test',
}));

vi.mock('../../api/agents/managed-config.js', () => ({
  MANAGED_AGENT_ID: '',
  MANAGED_ENV_ID: '',
  getAnthropicClient: () => ({}),
  createManagedSession: vi.fn().mockResolvedValue({ id: 'sim_test_session' }),
  sendSessionEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/lib/logger.js', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queueSqlResults(...results) {
  const q = [...results];
  sqlMock.mockImplementation(() => Promise.resolve(q.shift() ?? { rows: [] }));
}

/**
 * Parse a CSV string into { headers, rows, rowCount, columnCount }.
 * Mirrors the inspectFile tool logic.
 */
function inspectFile(csvString, { metadataRows = 0 } = {}) {
  const lines = csvString.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [], rowCount: 0, columnCount: 0, metadataRowCount: 0 };

  // Auto-detect metadata rows: rows with fewer columns than the majority
  let detectedMetadataRows = metadataRows;
  if (metadataRows === 0 && lines.length > 2) {
    const columnCounts = lines.map(l => l.split(',').length);
    const maxCols = Math.max(...columnCounts);
    detectedMetadataRows = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      if (columnCounts[i] < maxCols * 0.5) {
        detectedMetadataRows++;
      } else {
        break;
      }
    }
  }

  const headerLine = lines[detectedMetadataRows];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const dataLines = lines.slice(detectedMetadataRows + 1);
  const rows = dataLines.map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
    metadataRowCount: detectedMetadataRows,
  };
}

/**
 * Identify the source vendor from CSV headers.
 */
function identifySourceVendor(headers) {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));

  const signatures = [
    {
      vendor: 'Jonas',
      markers: ['member #', 'given name', 'surname', 'join dt', 'date joined', 'membership type', 'annual fee', 'household id'],
      minMatch: 3,
    },
    {
      vendor: 'Toast',
      markers: ['check #', 'opened', 'server name', 'closed', 'tab name', 'auto gratuity', 'tip amount'],
      minMatch: 3,
    },
    {
      vendor: 'ForeTees',
      markers: ['booking time', 'player name', 'course', 'type', 'slot'],
      minMatch: 2,
    },
    {
      vendor: 'Clubessential',
      markers: ['household id', 'family id', 'people id', 'member type'],
      minMatch: 2,
    },
    {
      vendor: 'ADP',
      markers: ['file number', 'home department', 'pay class', 'employee id'],
      minMatch: 2,
    },
    {
      vendor: 'Mailchimp',
      markers: ['email address', 'first name', 'last name', 'tags', 'member rating'],
      minMatch: 2,
    },
  ];

  let bestVendor = 'Unknown';
  let bestConfidence = 0;

  for (const sig of signatures) {
    const matched = sig.markers.filter(m => headerSet.has(m)).length;
    const confidence = matched / sig.minMatch;
    if (confidence > bestConfidence) {
      bestConfidence = Math.min(confidence, 1.0);
      bestVendor = sig.vendor;
    }
  }

  return { vendor: bestVendor, confidence: bestConfidence };
}

/**
 * Fix common data issues in imported rows.
 */
function fixDataIssues(rows, fixType, options = {}) {
  if (fixType === 'dateFormat') {
    // Convert MM/DD/YYYY to YYYY-MM-DD
    const { columns } = options;
    return rows.map(row => {
      const fixed = { ...row };
      for (const col of (columns || Object.keys(row))) {
        const val = fixed[col];
        if (val && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
          const [m, d, y] = val.split('/');
          fixed[col] = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
      return fixed;
    });
  }

  if (fixType === 'nameSplit') {
    // Split "Last, First" into separate fields
    const { column = 'name' } = options;
    return rows.map(row => {
      const fixed = { ...row };
      const val = fixed[column];
      if (val && val.includes(',')) {
        const parts = val.split(',').map(s => s.trim());
        fixed.last_name = parts[0];
        fixed.first_name = parts[1] || '';
        delete fixed[column];
      }
      return fixed;
    });
  }

  if (fixType === 'numberCleanup') {
    // Remove $, commas from numeric strings
    const { columns } = options;
    return rows.map(row => {
      const fixed = { ...row };
      for (const col of (columns || Object.keys(row))) {
        const val = fixed[col];
        if (typeof val === 'string' && /^[\$\s]*[\d,]+\.?\d*$/.test(val)) {
          fixed[col] = parseFloat(val.replace(/[\$,\s]/g, ''));
        }
      }
      return fixed;
    });
  }

  return rows;
}

/**
 * Suggest missing fields given a partial mapping.
 */
function suggestMissingFields(mapping, importType, allFields) {
  const mappedSwoopFields = new Set(Object.values(mapping).filter(Boolean));
  const missing = allFields.filter(f => !mappedSwoopFields.has(f.swoop));
  return missing.map(f => ({
    field: f.swoop,
    label: f.label,
    required: f.required,
    defaultBehavior: f.required ? 'BLOCK — must be mapped before import' : 'SKIP — will be left empty',
  }));
}

/**
 * Detect households by shared address.
 */
function detectHouseholds(members) {
  const addressGroups = {};
  for (const m of members) {
    const addr = (m.address || '').trim().toLowerCase();
    if (!addr) continue;
    if (!addressGroups[addr]) addressGroups[addr] = [];
    addressGroups[addr].push(m);
  }
  const households = Object.entries(addressGroups)
    .filter(([, group]) => group.length > 1)
    .map(([address, members]) => ({
      address,
      members: members.map(m => m.member_id || m.name),
      count: members.length,
    }));
  return { households, totalDetected: households.length };
}

/**
 * Validate data quality across rows.
 */
function validateDataQuality(rows, requiredFields) {
  const errors = [];
  const errorPatterns = {};

  rows.forEach((row, idx) => {
    for (const field of requiredFields) {
      if (!row[field] || String(row[field]).trim() === '') {
        const pattern = `missing_${field}`;
        if (!errorPatterns[pattern]) {
          errorPatterns[pattern] = { field, type: 'missing_required', rows: [], count: 0 };
        }
        errorPatterns[pattern].rows.push(idx + 1);
        errorPatterns[pattern].count++;
      }
    }
  });

  return {
    totalRows: rows.length,
    errorCount: Object.values(errorPatterns).reduce((sum, p) => sum + p.count, 0),
    errorPatterns: Object.values(errorPatterns),
    isValid: Object.keys(errorPatterns).length === 0,
  };
}

/**
 * Preview import: compare incoming rows against existing DB members.
 */
function previewImport(rows, existingMembers) {
  const existingByEmail = new Map();
  const existingByExtId = new Map();
  for (const m of existingMembers) {
    if (m.email) existingByEmail.set(m.email.toLowerCase(), m);
    if (m.external_id) existingByExtId.set(String(m.external_id).toLowerCase(), m);
  }

  let toInsert = 0;
  let toUpdate = 0;
  for (const row of rows) {
    const emailMatch = row.email && existingByEmail.has(row.email.toLowerCase());
    const extIdMatch = row.external_id && existingByExtId.has(String(row.external_id).toLowerCase());
    if (emailMatch || extIdMatch) {
      toUpdate++;
    } else {
      toInsert++;
    }
  }

  return { totalRows: rows.length, toInsert, toUpdate };
}

/**
 * Detect duplicates against existing DB records.
 */
function detectDuplicates(rows, existingMembers) {
  const existingByEmail = new Map();
  for (const m of existingMembers) {
    if (m.email) existingByEmail.set(m.email.toLowerCase(), m);
  }

  const duplicates = rows.filter(r => r.email && existingByEmail.has(r.email.toLowerCase()));
  return { duplicates: duplicates.length, details: duplicates };
}

/**
 * Identify data gaps from connected sources.
 */
function getDataGaps(connectedDomains) {
  const ALL_DOMAINS = ['CRM', 'TEE_SHEET', 'POS', 'LABOR', 'EMAIL'];
  const connectedSet = new Set(connectedDomains.map(d => d.toUpperCase()));
  const gaps = ALL_DOMAINS.filter(d => !connectedSet.has(d));
  return { connectedCount: connectedDomains.length, gaps, totalDomains: ALL_DOMAINS.length };
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let autoMapColumns;
let getImportTypeConfig;
let JONAS_IMPORT_TYPES;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const mappingMod = await import('../../src/config/jonasMapping.js');
  autoMapColumns = mappingMod.autoMapColumns;
  getImportTypeConfig = mappingMod.getImportTypeConfig;
  JONAS_IMPORT_TYPES = mappingMod.JONAS_IMPORT_TYPES;
});

// ===========================================================================
// 1. inspectFile — basic CSV parsing
// ===========================================================================

describe('inspectFile', () => {
  it('1. parses 5-row CSV and extracts headers correctly', () => {
    const csv = [
      'Member #,Given Name,Surname,Email,Status',
      'mbr_001,Michael,Preston,michael@test.com,active',
      'mbr_002,Charles,Worthington,charles@test.com,active',
      'mbr_003,Paul,Reyes,paul@test.com,active',
      'mbr_004,Timothy,Yamamoto,timothy@test.com,active',
      'mbr_005,Scott,Davis,scott@test.com,active',
    ].join('\n');

    const result = inspectFile(csv);
    expect(result.rowCount).toBe(5);
    expect(result.columnCount).toBe(5);
    expect(result.headers).toEqual(['Member #', 'Given Name', 'Surname', 'Email', 'Status']);
  });

  it('2. detects metadata rows above real headers', () => {
    const csv = [
      'Pine Tree Country Club',
      'Member Export - 2024',
      'Member #,Given Name,Surname,Email,Status',
      'mbr_001,Michael,Preston,michael@test.com,active',
      'mbr_002,Charles,Worthington,charles@test.com,active',
      'mbr_003,Paul,Reyes,paul@test.com,active',
    ].join('\n');

    const result = inspectFile(csv);
    expect(result.metadataRowCount).toBe(2);
    expect(result.headers).toEqual(['Member #', 'Given Name', 'Surname', 'Email', 'Status']);
    expect(result.rowCount).toBe(3);
  });
});

// ===========================================================================
// 2. identifySourceVendor
// ===========================================================================

describe('identifySourceVendor', () => {
  it('3. identifies Jonas-style headers', () => {
    const headers = ['Member #', 'Given Name', 'Surname', 'Join Dt'];
    const result = identifySourceVendor(headers);
    expect(result.vendor).toBe('Jonas');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('4. identifies Toast headers', () => {
    const headers = ['Check #', 'Opened', 'Server Name', 'Tab Name', 'Closed'];
    const result = identifySourceVendor(headers);
    expect(result.vendor).toBe('Toast');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});

// ===========================================================================
// 3. fixDataIssues
// ===========================================================================

describe('fixDataIssues', () => {
  it('5. converts MM/DD/YYYY dates to YYYY-MM-DD', () => {
    const rows = [
      { join_date: '03/15/2021', name: 'Alice' },
      { join_date: '12/01/2020', name: 'Bob' },
    ];
    const fixed = fixDataIssues(rows, 'dateFormat', { columns: ['join_date'] });
    expect(fixed[0].join_date).toBe('2021-03-15');
    expect(fixed[1].join_date).toBe('2020-12-01');
  });

  it('6. splits "Last, First" into first_name/last_name', () => {
    const rows = [{ name: 'Whitfield, James' }];
    const fixed = fixDataIssues(rows, 'nameSplit', { column: 'name' });
    expect(fixed[0].first_name).toBe('James');
    expect(fixed[0].last_name).toBe('Whitfield');
    expect(fixed[0].name).toBeUndefined();
  });

  it('7. cleans currency strings to plain numbers', () => {
    const rows = [{ annual_dues: '$18,000.00' }];
    const fixed = fixDataIssues(rows, 'numberCleanup', { columns: ['annual_dues'] });
    expect(fixed[0].annual_dues).toBe(18000);
  });
});

// ===========================================================================
// 4. autoMapColumnsWrapper (uses jonasMapping.autoMapColumns)
// ===========================================================================

describe('autoMapColumnsWrapper', () => {
  it('8. maps Jonas member headers to correct Swoop fields', () => {
    const csvHeaders = ['Member #', 'Given Name', 'Surname', 'Email', 'Phone #', 'Membership Type', 'Annual Fee', 'Date Joined'];
    const mapping = autoMapColumns(csvHeaders, 'members');

    expect(mapping['Given Name']).toBe('first_name');
    expect(mapping['Surname']).toBe('last_name');
    expect(mapping['Member #']).toBe('external_id');
    expect(mapping['Email']).toBe('email');
    expect(mapping['Phone #']).toBe('phone');
    expect(mapping['Membership Type']).toBe('membership_type');
    expect(mapping['Annual Fee']).toBe('annual_dues');
    expect(mapping['Date Joined']).toBe('join_date');
  });
});

// ===========================================================================
// 5. suggestMissingFields
// ===========================================================================

describe('suggestMissingFields', () => {
  it('9. reports 4 missing fields with defaultBehavior when 14 of 18 are mapped', () => {
    const config = getImportTypeConfig('members');
    const allFields = config.fields; // 15 fields for members

    // Map 11 of the 15 fields, leave 4 unmapped
    const mapping = {
      'Given Name': 'first_name',
      'Surname': 'last_name',
      'Member #': 'external_id',
      'Email': 'email',
      'Phone #': 'phone',
      'Membership Type': 'membership_type',
      'Annual Fee': 'annual_dues',
      'Date Joined': 'join_date',
      'Status': 'status',
      'Household ID': 'household_id',
      'Birthday': 'birthday',
    };

    const missing = suggestMissingFields(mapping, 'members', allFields);
    expect(missing.length).toBe(4); // sex, handicap, current_balance, date_resigned
    expect(missing.every(m => m.defaultBehavior)).toBe(true);
    expect(missing.every(m => m.field && m.label)).toBe(true);
    // All 4 remaining member fields are optional
    expect(missing.every(m => m.defaultBehavior.includes('SKIP'))).toBe(true);
  });
});

// ===========================================================================
// 6. detectHouseholds
// ===========================================================================

describe('detectHouseholds', () => {
  it('10. detects 1 household from 4 members, 2 sharing an address', () => {
    const members = [
      { member_id: 'mbr_001', name: 'Michael Preston', address: '123 Oak Lane' },
      { member_id: 'mbr_002', name: 'Sarah Preston', address: '123 Oak Lane' },
      { member_id: 'mbr_003', name: 'Paul Reyes', address: '456 Elm St' },
      { member_id: 'mbr_004', name: 'Tim Yamamoto', address: '789 Pine Ave' },
    ];

    const result = detectHouseholds(members);
    expect(result.totalDetected).toBe(1);
    expect(result.households[0].count).toBe(2);
    expect(result.households[0].members).toContain('mbr_001');
    expect(result.households[0].members).toContain('mbr_002');
  });
});

// ===========================================================================
// 7. validateDataQuality
// ===========================================================================

describe('validateDataQuality', () => {
  it('11. groups errors by pattern for 10 rows with 2 missing required fields', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      first_name: i < 8 ? `Name${i}` : '',
      last_name: `Last${i}`,
      email: `user${i}@test.com`,
    }));
    // Rows 8 and 9 have empty first_name

    const result = validateDataQuality(rows, ['first_name', 'last_name']);
    expect(result.totalRows).toBe(10);
    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBe(2);
    expect(result.errorPatterns.length).toBe(1); // all same pattern: missing_first_name
    expect(result.errorPatterns[0].field).toBe('first_name');
    expect(result.errorPatterns[0].count).toBe(2);
    expect(result.errorPatterns[0].rows).toEqual([9, 10]);
  });
});

// ===========================================================================
// 8. previewImport
// ===========================================================================

describe('previewImport', () => {
  it('12. correctly splits rows into inserts vs updates', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      first_name: `Name${i}`,
      last_name: `Last${i}`,
      email: `user${i}@test.com`,
      external_id: `mbr_${i}`,
    }));

    // 2 existing members that match by email
    const existingMembers = [
      { email: 'user0@test.com', external_id: 'mbr_0', first_name: 'Name0' },
      { email: 'user1@test.com', external_id: 'mbr_1', first_name: 'Name1' },
    ];

    const result = previewImport(rows, existingMembers);
    expect(result.totalRows).toBe(10);
    expect(result.toInsert).toBe(8);
    expect(result.toUpdate).toBe(2);
  });
});

// ===========================================================================
// 9. detectDuplicates
// ===========================================================================

describe('detectDuplicates', () => {
  it('13. detects 3 duplicates matching by email', () => {
    const rows = [
      { first_name: 'Alice', email: 'alice@test.com' },
      { first_name: 'Bob', email: 'bob@test.com' },
      { first_name: 'Carol', email: 'carol@test.com' },
      { first_name: 'Dave', email: 'dave@test.com' },
      { first_name: 'Eve', email: 'eve@test.com' },
    ];

    const existingMembers = [
      { member_id: 'mbr_1', email: 'alice@test.com' },
      { member_id: 'mbr_2', email: 'bob@test.com' },
      { member_id: 'mbr_3', email: 'carol@test.com' },
    ];

    const result = detectDuplicates(rows, existingMembers);
    expect(result.duplicates).toBe(3);
  });
});

// ===========================================================================
// 10. getDataGaps
// ===========================================================================

describe('getDataGaps', () => {
  it('14. reports POS, LABOR, EMAIL as gaps when only CRM + TEE_SHEET connected', () => {
    const connected = ['CRM', 'TEE_SHEET'];
    const result = getDataGaps(connected);

    expect(result.gaps).toContain('POS');
    expect(result.gaps).toContain('LABOR');
    expect(result.gaps).toContain('EMAIL');
    expect(result.gaps).not.toContain('CRM');
    expect(result.gaps).not.toContain('TEE_SHEET');
    expect(result.connectedCount).toBe(2);
    expect(result.gaps.length).toBe(3);
  });
});

// ===========================================================================
// 11. System Prompt Quality (dataOnboardingPrompt.js)
// ===========================================================================

describe('Data Onboarding Prompt Quality', () => {
  it('prompt includes vendor expertise for Jonas, Toast, and ForeTees', async () => {
    const { buildDataOnboardingPrompt } = await import('../../src/config/dataOnboardingPrompt.js');
    const prompt = buildDataOnboardingPrompt('Pine Tree CC');
    expect(prompt).toContain('Jonas Club Software');
    expect(prompt).toContain('Toast POS');
    expect(prompt).toContain('ForeTees');
    expect(prompt).toContain('Pine Tree CC');
  });

  it('prompt includes import order guidance', async () => {
    const { buildDataOnboardingPrompt } = await import('../../src/config/dataOnboardingPrompt.js');
    const prompt = buildDataOnboardingPrompt();
    expect(prompt).toContain('members');
    expect(prompt).toContain('courses');
    expect(prompt).toContain('tee_times');
    expect(prompt).toContain('complaints');
  });

  it('prompt includes behavioral rules about confirmation', async () => {
    const { buildDataOnboardingPrompt } = await import('../../src/config/dataOnboardingPrompt.js');
    const prompt = buildDataOnboardingPrompt();
    expect(prompt).toContain('Never import without confirmation');
    expect(prompt).toContain('Group errors into patterns');
  });

  it('prompt includes import history when provided', async () => {
    const { buildDataOnboardingPrompt } = await import('../../src/config/dataOnboardingPrompt.js');
    const prompt = buildDataOnboardingPrompt('Test Club', [
      { source: 'Jonas', table: 'members', rowCount: 1247, date: '2024-01-15' },
    ]);
    expect(prompt).toContain('Import History');
    expect(prompt).toContain('Jonas');
    expect(prompt).toContain('1,247');
  });

  it('prompt includes data gaps when provided', async () => {
    const { buildDataOnboardingPrompt } = await import('../../src/config/dataOnboardingPrompt.js');
    const prompt = buildDataOnboardingPrompt('Test Club', [], ['POS transactions', 'Staff schedules']);
    expect(prompt).toContain('Data Gaps');
    expect(prompt).toContain('POS transactions');
    expect(prompt).toContain('Staff schedules');
  });
});

// ===========================================================================
// 12. Jonas Mapping Integration
// ===========================================================================

describe('Jonas Mapping Integration', () => {
  it('JONAS_IMPORT_TYPES covers all expected import categories', () => {
    const keys = JONAS_IMPORT_TYPES.map(t => t.key);
    expect(keys).toContain('members');
    expect(keys).toContain('tee_times');
    expect(keys).toContain('transactions');
    expect(keys).toContain('complaints');
    expect(keys).toContain('events');
    expect(keys).toContain('staff');
    expect(keys).toContain('shifts');
  });

  it('member fields include all critical aliases for Jonas exports', () => {
    const config = getImportTypeConfig('members');
    const firstNameField = config.fields.find(f => f.swoop === 'first_name');
    const lastNameField = config.fields.find(f => f.swoop === 'last_name');
    expect(firstNameField.aliases).toContain('Given Name');
    expect(lastNameField.aliases).toContain('Surname');
  });
});
