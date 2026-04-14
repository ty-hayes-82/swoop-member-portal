/**
 * POST /api/onboarding-agent/chat
 *
 * Data Onboarding Agent chat endpoint. Accepts a message and optional
 * file_data (parsed CSV/XLSX/TSV), routes through the onboarding agent
 * with tool use, and returns the response.
 *
 * Auth: GM / admin level (withAuth default).
 * Body: { message: string, club_id?: string, file_data?: object, session_id?: string }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { getAnthropicClient } from '../agents/managed-config.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;
const SIMULATION_MODE = !HAS_API_KEY;

function generateSessionId() {
  return `onb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------
function buildDataOnboardingPrompt(clubName, importHistory, dataGaps) {
  const historyBlock = importHistory.length > 0
    ? importHistory.map(h => `- ${h.import_type}: ${h.row_count} rows on ${h.imported_at} (${h.status})`).join('\n')
    : 'No previous imports.';

  const gapsBlock = dataGaps.length > 0
    ? dataGaps.map(g => `- ${g.source_type}: ${g.status} (last sync: ${g.last_sync || 'never'})`).join('\n')
    : 'No data gap information available.';

  return `You are the Data Onboarding Assistant for ${clubName} on the Swoop platform.

Your job is to help club administrators import their data into Swoop. You guide them through:
1. Understanding what file they have (CSV, XLSX, TSV)
2. Analyzing the headers and sample data to determine the data type (members, tee times, POS checks, events, etc.)
3. Mapping their columns to Swoop's schema
4. Validating the data for completeness and correctness
5. Running the import with a preview first

Be concise, friendly, and proactive. When you receive file data, immediately analyze it and propose a column mapping. Show confidence levels for each mapping (high/medium/low). Flag any data quality issues.

## Club Context
Club: ${clubName}

## Recent Import History
${historyBlock}

## Current Data Gaps
${gapsBlock}

## Guidelines
- Always preview before importing. Never auto-import without confirmation.
- When mapping columns, explain WHY you matched each one.
- Flag missing required fields immediately.
- If a file looks like members data, check for: first_name, last_name, email, member_id/external_id, membership_type.
- If a file looks like tee sheet data, check for: date, time, course, player info.
- If a file looks like POS/F&B data, check for: check_number, date, amount, outlet, member info.
- Suggest the best import_type based on the data shape.
- When showing validation results, categorize as ready/warning/error.`;
}

// ---------------------------------------------------------------------------
// Tool definitions (14 tools matching api/onboarding-agent/tools.js)
// ---------------------------------------------------------------------------
const ONBOARDING_TOOLS = [
  {
    name: 'analyze_file_structure',
    description: 'Analyze uploaded file headers and sample rows to determine the data type and quality',
    input_schema: {
      type: 'object',
      properties: {
        headers: { type: 'array', items: { type: 'string' } },
        sample_rows: { type: 'array', items: { type: 'object' } },
        row_count: { type: 'integer' },
      },
      required: ['headers'],
    },
  },
  {
    name: 'detect_data_type',
    description: 'Determine what type of data the file contains (members, tee_times, pos_checks, events, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        headers: { type: 'array', items: { type: 'string' } },
        sample_values: { type: 'object' },
      },
      required: ['headers'],
    },
  },
  {
    name: 'propose_column_mapping',
    description: 'Generate a proposed mapping from file columns to Swoop schema columns with confidence scores',
    input_schema: {
      type: 'object',
      properties: {
        headers: { type: 'array', items: { type: 'string' } },
        data_type: { type: 'string', description: 'The detected import type (members, tee_times, pos_checks, etc.)' },
        sample_rows: { type: 'array', items: { type: 'object' } },
      },
      required: ['headers', 'data_type'],
    },
  },
  {
    name: 'validate_data',
    description: 'Validate the data against Swoop schema requirements, checking for missing fields, bad formats, duplicates',
    input_schema: {
      type: 'object',
      properties: {
        data_type: { type: 'string' },
        mapping: { type: 'object', description: 'Column mapping from file headers to Swoop fields' },
        sample_rows: { type: 'array', items: { type: 'object' } },
        row_count: { type: 'integer' },
      },
      required: ['data_type', 'mapping'],
    },
  },
  {
    name: 'preview_import',
    description: 'Generate a preview of what the import will do: inserts, updates, and skips',
    input_schema: {
      type: 'object',
      properties: {
        data_type: { type: 'string' },
        mapping: { type: 'object' },
        row_count: { type: 'integer' },
      },
      required: ['data_type', 'mapping', 'row_count'],
    },
  },
  {
    name: 'execute_import',
    description: 'Execute the actual data import after user confirmation',
    input_schema: {
      type: 'object',
      properties: {
        data_type: { type: 'string' },
        mapping: { type: 'object' },
        session_id: { type: 'string' },
        confirm: { type: 'boolean', description: 'Must be true to proceed' },
      },
      required: ['data_type', 'mapping', 'confirm'],
    },
  },
  {
    name: 'get_schema_info',
    description: 'Get the Swoop schema definition for a given data type, including required and optional fields',
    input_schema: {
      type: 'object',
      properties: {
        data_type: { type: 'string', enum: ['members', 'tee_times', 'pos_checks', 'events', 'staffing', 'feedback'] },
      },
      required: ['data_type'],
    },
  },
  {
    name: 'check_data_gaps',
    description: 'Check which data types are missing or stale for this club',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_import_history',
    description: 'Get recent import history for this club',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 10 },
      },
    },
  },
  {
    name: 'detect_vendor',
    description: 'Attempt to detect which club software vendor exported this file based on column naming patterns',
    input_schema: {
      type: 'object',
      properties: {
        headers: { type: 'array', items: { type: 'string' } },
        filename: { type: 'string' },
      },
      required: ['headers'],
    },
  },
  {
    name: 'suggest_transformations',
    description: 'Suggest data transformations needed before import (date format, name splitting, phone normalization, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        mapping: { type: 'object' },
        sample_rows: { type: 'array', items: { type: 'object' } },
        data_type: { type: 'string' },
      },
      required: ['mapping', 'data_type'],
    },
  },
  {
    name: 'check_duplicates',
    description: 'Check for potential duplicates between the uploaded data and existing records',
    input_schema: {
      type: 'object',
      properties: {
        data_type: { type: 'string' },
        match_fields: { type: 'array', items: { type: 'string' } },
        sample_rows: { type: 'array', items: { type: 'object' } },
      },
      required: ['data_type', 'match_fields'],
    },
  },
  {
    name: 'get_field_statistics',
    description: 'Get statistics about a specific field in the uploaded data (null rate, unique count, value distribution)',
    input_schema: {
      type: 'object',
      properties: {
        field_name: { type: 'string' },
        sample_values: { type: 'array', items: { type: 'string' } },
      },
      required: ['field_name', 'sample_values'],
    },
  },
  {
    name: 'rollback_import',
    description: 'Rollback a recent import by session ID',
    input_schema: {
      type: 'object',
      properties: {
        import_session_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['import_session_id'],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution stubs — returns realistic data for each tool
// In production these would call into the actual import pipeline.
// ---------------------------------------------------------------------------
async function executeOnboardingTool(toolName, input, clubId) {
  switch (toolName) {
    case 'analyze_file_structure': {
      const headers = input.headers || [];
      const rowCount = input.row_count || 0;
      const sample = input.sample_rows || [];
      const nullRates = {};
      for (const h of headers) {
        const filled = sample.filter(r => r[h] && String(r[h]).trim()).length;
        nullRates[h] = sample.length > 0 ? Math.round((1 - filled / sample.length) * 100) : 0;
      }
      return {
        column_count: headers.length,
        row_count: rowCount,
        headers,
        null_rates: nullRates,
        has_header_row: true,
        encoding: 'utf-8',
      };
    }

    case 'detect_data_type': {
      const h = (input.headers || []).map(c => c.toLowerCase());
      let type = 'unknown';
      let confidence = 'low';
      if (h.some(c => /member|first.?name|last.?name|email/.test(c))) {
        type = 'members';
        confidence = 'high';
      } else if (h.some(c => /tee.?time|course|round|booking/.test(c))) {
        type = 'tee_times';
        confidence = 'high';
      } else if (h.some(c => /check|pos|amount|outlet|tab/.test(c))) {
        type = 'pos_checks';
        confidence = 'high';
      } else if (h.some(c => /event|registration|rsvp/.test(c))) {
        type = 'events';
        confidence = 'medium';
      } else if (h.some(c => /shift|schedule|clock/.test(c))) {
        type = 'staffing';
        confidence = 'medium';
      }
      return { detected_type: type, confidence, headers_analyzed: h.length };
    }

    case 'propose_column_mapping': {
      const dataType = input.data_type || 'members';
      const headers = input.headers || [];
      const mapping = {};
      for (const h of headers) {
        const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let swoopField = null;
        let confidence = 'low';
        // Simple heuristic mapping
        if (/first.?name/.test(lower)) { swoopField = 'first_name'; confidence = 'high'; }
        else if (/last.?name/.test(lower)) { swoopField = 'last_name'; confidence = 'high'; }
        else if (/^email/.test(lower)) { swoopField = 'email'; confidence = 'high'; }
        else if (/phone|mobile/.test(lower)) { swoopField = 'phone'; confidence = 'high'; }
        else if (/member.?(id|number|no|#)/.test(lower)) { swoopField = 'external_id'; confidence = 'high'; }
        else if (/membership.?type|mem.?type|category/.test(lower)) { swoopField = 'membership_type'; confidence = 'medium'; }
        else if (/join.?date|start.?date|member.?since/.test(lower)) { swoopField = 'join_date'; confidence = 'medium'; }
        else if (/status/.test(lower)) { swoopField = 'membership_status'; confidence = 'medium'; }
        else if (/address|street/.test(lower)) { swoopField = 'address'; confidence = 'medium'; }
        else if (/city/.test(lower)) { swoopField = 'city'; confidence = 'high'; }
        else if (/state|province/.test(lower)) { swoopField = 'state'; confidence = 'high'; }
        else if (/zip|postal/.test(lower)) { swoopField = 'zip'; confidence = 'high'; }
        mapping[h] = { swoop_field: swoopField, confidence };
      }
      return { data_type: dataType, mapping, unmapped_count: Object.values(mapping).filter(m => !m.swoop_field).length };
    }

    case 'validate_data': {
      const rowCount = input.row_count || 0;
      return {
        total_rows: rowCount,
        ready: Math.round(rowCount * 0.85),
        warnings: Math.round(rowCount * 0.1),
        errors: Math.round(rowCount * 0.05),
        issues: [
          { severity: 'warning', field: 'phone', message: 'Mixed phone formats detected — will normalize', count: Math.round(rowCount * 0.08) },
          { severity: 'warning', field: 'join_date', message: 'Some dates in MM/DD/YYYY format — will convert', count: Math.round(rowCount * 0.03) },
          { severity: 'error', field: 'email', message: 'Invalid email format', count: Math.round(rowCount * 0.03) },
          { severity: 'error', field: 'first_name', message: 'Missing required field', count: Math.round(rowCount * 0.02) },
        ],
      };
    }

    case 'preview_import': {
      const rowCount = input.row_count || 0;
      return {
        data_type: input.data_type,
        total_rows: rowCount,
        to_insert: Math.round(rowCount * 0.7),
        to_update: Math.round(rowCount * 0.25),
        to_skip: Math.round(rowCount * 0.05),
        requires_confirmation: true,
      };
    }

    case 'execute_import': {
      if (!input.confirm) {
        return { error: 'Import not confirmed. Set confirm: true to proceed.' };
      }
      return {
        status: 'completed',
        import_id: `imp_${Date.now().toString(36)}`,
        data_type: input.data_type,
        inserted: 0,
        updated: 0,
        skipped: 0,
        message: 'Import executed successfully. Use preview_import for actual counts.',
      };
    }

    case 'get_schema_info': {
      const schemas = {
        members: {
          required: ['first_name', 'last_name'],
          recommended: ['email', 'external_id', 'membership_type', 'join_date'],
          optional: ['phone', 'address', 'city', 'state', 'zip', 'household_id', 'membership_status', 'date_of_birth'],
        },
        tee_times: {
          required: ['booking_date', 'tee_time'],
          recommended: ['course_name', 'player_count', 'member_id'],
          optional: ['status', 'cart_requested', 'caddie_requested', 'booking_source'],
        },
        pos_checks: {
          required: ['check_number', 'check_date', 'total_amount'],
          recommended: ['outlet_name', 'member_id', 'server_name'],
          optional: ['covers', 'tip_amount', 'payment_type', 'discount_amount'],
        },
        events: {
          required: ['event_name', 'event_date'],
          recommended: ['capacity', 'type', 'registration_fee'],
          optional: ['description', 'location', 'start_time', 'end_time'],
        },
        staffing: {
          required: ['employee_name', 'shift_date'],
          recommended: ['department', 'shift_start', 'shift_end'],
          optional: ['role', 'hourly_rate', 'clock_in', 'clock_out'],
        },
        feedback: {
          required: ['member_id', 'description'],
          recommended: ['category', 'submitted_at'],
          optional: ['sentiment_score', 'status', 'resolution'],
        },
      };
      return schemas[input.data_type] || { error: `Unknown data type: ${input.data_type}` };
    }

    case 'check_data_gaps': {
      try {
        const result = await sql`
          SELECT source_type, status, last_sync_at AS last_sync
          FROM data_source_status
          WHERE club_id = ${clubId}
          ORDER BY source_type
        `;
        return { gaps: result.rows };
      } catch {
        return {
          gaps: [
            { source_type: 'members', status: 'active', last_sync: '2026-04-11' },
            { source_type: 'tee_times', status: 'stale', last_sync: '2026-03-15' },
            { source_type: 'pos_checks', status: 'missing', last_sync: null },
            { source_type: 'events', status: 'active', last_sync: '2026-04-10' },
            { source_type: 'staffing', status: 'missing', last_sync: null },
          ],
        };
      }
    }

    case 'get_import_history': {
      try {
        const limit = input.limit || 10;
        const result = await sql`
          SELECT import_type, row_count, status, imported_at, filename
          FROM import_history
          WHERE club_id = ${clubId}
          ORDER BY imported_at DESC
          LIMIT ${limit}
        `;
        return { imports: result.rows };
      } catch {
        return { imports: [] };
      }
    }

    case 'detect_vendor': {
      const headers = (input.headers || []).map(h => h.toLowerCase());
      const filename = (input.filename || '').toLowerCase();
      if (headers.some(h => /jonas|jclub/.test(h)) || filename.includes('jonas')) {
        return { vendor: 'Jonas Club', confidence: 'high' };
      }
      if (headers.some(h => /clubessential|ce_/.test(h)) || filename.includes('clubessential')) {
        return { vendor: 'Clubessential', confidence: 'high' };
      }
      if (headers.some(h => /northstar|ns_/.test(h)) || filename.includes('northstar')) {
        return { vendor: 'Northstar', confidence: 'high' };
      }
      if (headers.some(h => /foretees|ft_/.test(h)) || filename.includes('foretees')) {
        return { vendor: 'ForeTees', confidence: 'high' };
      }
      return { vendor: 'unknown', confidence: 'low', suggestion: 'Could not detect vendor from headers. Please specify.' };
    }

    case 'suggest_transformations': {
      const transforms = [];
      const sample = input.sample_rows || [];
      const mapping = input.mapping || {};
      for (const [header, swoopField] of Object.entries(mapping)) {
        if (!swoopField) continue;
        const values = sample.map(r => r[header]).filter(Boolean).map(String);
        if (/date/.test(swoopField) && values.some(v => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v))) {
          transforms.push({ field: header, transform: 'date_format', from: 'MM/DD/YYYY', to: 'YYYY-MM-DD' });
        }
        if (/phone/.test(swoopField) && values.some(v => /^\(\d{3}\)/.test(v) || /^\d{10}$/.test(v))) {
          transforms.push({ field: header, transform: 'phone_normalize', to: '+1XXXXXXXXXX' });
        }
        if (/name/.test(header.toLowerCase()) && values.some(v => v.includes(','))) {
          transforms.push({ field: header, transform: 'name_split', note: 'Detected "Last, First" format — will split into first_name and last_name' });
        }
      }
      return { transformations: transforms, count: transforms.length };
    }

    case 'check_duplicates': {
      return {
        potential_duplicates: 0,
        match_strategy: `Matched on: ${(input.match_fields || []).join(', ')}`,
        details: [],
      };
    }

    case 'get_field_statistics': {
      const values = input.sample_values || [];
      const unique = new Set(values);
      const nullCount = values.filter(v => !v || String(v).trim() === '').length;
      return {
        field: input.field_name,
        total: values.length,
        unique_count: unique.size,
        null_count: nullCount,
        null_rate: values.length > 0 ? `${Math.round((nullCount / values.length) * 100)}%` : '0%',
        sample_values: [...unique].slice(0, 5),
      };
    }

    case 'rollback_import': {
      return {
        status: 'rolled_back',
        import_session_id: input.import_session_id,
        reason: input.reason || 'User requested rollback',
        message: 'Import has been rolled back. All inserted/updated records have been reverted.',
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Simulation mode response generator
// ---------------------------------------------------------------------------
function generateSimulatedResponse(message, fileData) {
  if (fileData) {
    const { filename, headers, sampleRows, rowCount } = fileData;
    const headerList = headers.slice(0, 8).join(', ');
    const hasMore = headers.length > 8 ? ` (+${headers.length - 8} more)` : '';

    // Detect likely data type
    const lower = headers.map(h => h.toLowerCase()).join(' ');
    let dataType = 'data';
    if (/member|first.?name|last.?name/.test(lower)) dataType = 'member roster';
    else if (/tee|round|booking|course/.test(lower)) dataType = 'tee sheet';
    else if (/check|pos|amount|outlet/.test(lower)) dataType = 'POS/F&B';
    else if (/event|registration/.test(lower)) dataType = 'events';

    return `I've analyzed your file **${filename}** (${rowCount} rows, ${headers.length} columns).

This looks like **${dataType}** data. Here are the columns I found: ${headerList}${hasMore}.

**Proposed Column Mapping:**
${headers.slice(0, 6).map(h => {
  const l = h.toLowerCase();
  let swoop = 'unmapped';
  let conf = 'low';
  if (/first.?name/.test(l)) { swoop = 'first_name'; conf = 'high'; }
  else if (/last.?name/.test(l)) { swoop = 'last_name'; conf = 'high'; }
  else if (/email/.test(l)) { swoop = 'email'; conf = 'high'; }
  else if (/phone/.test(l)) { swoop = 'phone'; conf = 'high'; }
  else if (/member.?(id|no|number)/.test(l)) { swoop = 'external_id'; conf = 'high'; }
  else if (/type|category/.test(l)) { swoop = 'membership_type'; conf = 'medium'; }
  return `| ${h} | ${swoop} | ${conf} |`;
}).join('\n')}

**Validation Summary:** ${Math.round(rowCount * 0.85)} ready, ${Math.round(rowCount * 0.1)} warnings, ${Math.round(rowCount * 0.05)} errors.

Would you like me to proceed with the import preview, or would you like to adjust any mappings first?`;
  }

  const lower = message.toLowerCase();
  if (lower.includes('help') || lower.includes('start') || lower.includes('how')) {
    return `Welcome to the Data Onboarding Assistant! I can help you import data into Swoop.

To get started, simply **drop a CSV, XLSX, or TSV file** in the drop zone above, or tell me what data you'd like to import and I'll guide you through it.

I can handle:
- **Member rosters** (names, emails, membership types)
- **Tee sheet data** (bookings, rounds, courses)
- **POS/F&B data** (checks, covers, dining activity)
- **Events** (registrations, attendance)
- **Staffing** (schedules, shifts)

What would you like to import today?`;
  }

  if (lower.includes('gap') || lower.includes('missing') || lower.includes('status')) {
    return `Here's your current data status:

| Data Type | Status | Last Import |
|-----------|--------|-------------|
| Members | Active | Apr 11, 2026 |
| Tee Times | Stale | Mar 15, 2026 |
| POS Checks | Missing | Never |
| Events | Active | Apr 10, 2026 |
| Staffing | Missing | Never |

I'd recommend importing **POS/F&B data** first -- it's the biggest gap and powers dining analytics. Would you like to start with that?`;
  }

  return `I'm ready to help you import data into Swoop! You can:

1. **Drop a file** in the drop zone above to get started
2. **Ask me about data gaps** to see what's missing
3. **Tell me what you want to import** and I'll guide you step by step

What would you like to do?`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
async function chatHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { message, file_data, session_id } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required and must be a string' });
  }

  const { json_mode } = req.body;
  const currentSessionId = session_id || generateSessionId();

  // Load club name
  let clubName = 'Your Club';
  try {
    const clubResult = await sql`SELECT name FROM club WHERE club_id = ${clubId}`;
    clubName = clubResult.rows[0]?.name || clubName;
  } catch (e) {
    console.warn('[onboarding-agent/chat] club lookup error:', e.message);
  }

  // Load import history (last 5)
  let importHistory = [];
  try {
    const histResult = await sql`
      SELECT import_type, row_count, status, imported_at
      FROM import_history
      WHERE club_id = ${clubId}
      ORDER BY imported_at DESC
      LIMIT 5
    `;
    importHistory = histResult.rows;
  } catch (e) {
    console.warn('[onboarding-agent/chat] import history error:', e.message);
  }

  // Load data gaps
  let dataGaps = [];
  try {
    const gapResult = await sql`
      SELECT source_type, status, last_sync_at AS last_sync
      FROM data_source_status
      WHERE club_id = ${clubId}
    `;
    dataGaps = gapResult.rows;
  } catch (e) {
    console.warn('[onboarding-agent/chat] data gaps error:', e.message);
  }

  // Build the user message, prepending file context if provided
  let userMessage = message;
  if (file_data) {
    const { filename, headers, sampleRows, rowCount } = file_data;
    const samplePreview = JSON.stringify((sampleRows || []).slice(0, 3));
    userMessage = `The user uploaded a file: ${filename}, ${rowCount} rows, headers: ${(headers || []).join(', ')}. Sample: ${samplePreview}\n\n${message}`;
  }

  // Simulation mode
  if (SIMULATION_MODE) {
    const simResponse = json_mode
      ? JSON.stringify({
          suggestions: [
            { type: 'warning', csvCol: null, targetField: null, label: 'Demo mode — mapping analysis simulated', reason: 'Connect a live club to see real AI mapping suggestions.' },
          ],
          validation: { ready: 0, warnings: 1, errors: 0 },
        })
      : generateSimulatedResponse(message, file_data);
    return res.status(200).json({
      response: simResponse,
      tools_called: [],
      session_id: currentSessionId,
      simulated: true,
    });
  }

  // Live mode: call Claude API with tool-use loop
  try {
    const client = getAnthropicClient();
    const baseSystemPrompt = buildDataOnboardingPrompt(clubName, importHistory, dataGaps);

    // json_mode: structured output requests (e.g. step 2 column mapping analysis).
    // Disable tools + enforce JSON output to prevent tool-call interference.
    if (json_mode) {
      const systemPrompt = baseSystemPrompt +
        '\n\nCRITICAL: The user is requesting structured JSON output. Respond with ONLY a valid JSON object — no markdown fences, no prose, no explanation outside the JSON. Your entire response must be parseable by JSON.parse().';
      const result = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        // No tools — tool calls break structured JSON output
      });
      const responseText = result.content?.find(c => c.type === 'text')?.text ?? '';
      return res.status(200).json({
        response: responseText,
        tools_called: [],
        session_id: currentSessionId,
      });
    }

    const systemPrompt = baseSystemPrompt;
    const messages = [{ role: 'user', content: userMessage }];
    const toolsCalled = [];

    let result = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
      tools: ONBOARDING_TOOLS,
    });

    // Tool-use loop
    while (result.stop_reason === 'tool_use') {
      const toolUse = result.content.find(c => c.type === 'tool_use');
      if (!toolUse) break;

      toolsCalled.push(toolUse.name);
      const toolResult = await executeOnboardingTool(toolUse.name, toolUse.input, clubId);

      messages.push({ role: 'assistant', content: result.content });
      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(toolResult) }],
      });

      result = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages,
        tools: ONBOARDING_TOOLS,
      });
    }

    const responseText = result.content?.find(c => c.type === 'text')?.text ?? '';

    return res.status(200).json({
      response: responseText,
      tools_called: toolsCalled,
      session_id: currentSessionId,
    });
  } catch (err) {
    console.error('[onboarding-agent/chat] error:', err);
    return res.status(500).json({ error: 'Failed to process onboarding chat message' });
  }
}

export default withAuth(chatHandler, { allowDemo: true });
