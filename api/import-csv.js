/**
 * CSV Import API — Sprint 1
 * POST /api/import-csv
 * Body: { clubId, importType, rows: [...], uploadedBy }
 *
 * Accepts pre-parsed CSV rows (frontend handles file parsing)
 * and imports them into the appropriate table with validation.
 */
import { sql } from '@vercel/postgres';

const IMPORT_TYPES = {
  members: {
    requiredFields: ['first_name', 'last_name'],
    optionalFields: ['email', 'phone', 'membership_type', 'annual_dues', 'join_date', 'external_id', 'household_id'],
    table: 'members',
  },
  rounds: {
    requiredFields: ['member_id', 'round_date'],
    optionalFields: ['tee_time', 'course_id', 'duration_minutes', 'pace_rating', 'players', 'cancelled', 'no_show'],
    table: 'rounds',
  },
  transactions: {
    requiredFields: ['transaction_date', 'total_amount'],
    optionalFields: ['member_id', 'outlet_name', 'category', 'item_count', 'is_post_round'],
    table: 'transactions',
  },
  complaints: {
    requiredFields: ['category', 'description'],
    optionalFields: ['member_id', 'status', 'priority', 'reported_at', 'resolved_at'],
    table: 'complaints',
  },
};

function validateRow(row, config, rowIndex) {
  const errors = [];
  for (const field of config.requiredFields) {
    if (!row[field] || String(row[field]).trim() === '') {
      errors.push({ row: rowIndex + 1, field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (row.annual_dues && isNaN(Number(row.annual_dues))) {
    errors.push({ row: rowIndex + 1, field: 'annual_dues', message: 'annual_dues must be a number' });
  }
  if (row.total_amount && isNaN(Number(row.total_amount))) {
    errors.push({ row: rowIndex + 1, field: 'total_amount', message: 'total_amount must be a number' });
  }
  return errors;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { clubId, importType, rows, uploadedBy } = req.body;

  if (!clubId || !importType || !rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Missing required fields: clubId, importType, rows[]' });
  }

  const config = IMPORT_TYPES[importType];
  if (!config) {
    return res.status(400).json({ error: `Unknown import type: ${importType}. Valid types: ${Object.keys(IMPORT_TYPES).join(', ')}` });
  }

  // Create import tracking record
  const importId = `imp_${Date.now()}`;
  await sql`
    INSERT INTO csv_imports (import_id, club_id, uploaded_by, import_type, status, total_rows)
    VALUES (${importId}, ${clubId}, ${uploadedBy || 'system'}, ${importType}, 'processing', ${rows.length})
  `;

  let successCount = 0;
  let errorCount = 0;
  const allErrors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors = validateRow(row, config, i);

    if (rowErrors.length > 0) {
      allErrors.push(...rowErrors);
      errorCount++;
      continue;
    }

    try {
      if (importType === 'members') {
        const memberId = row.external_id || `mbr_${Date.now()}_${i}`;
        await sql`
          INSERT INTO members (member_id, club_id, external_id, first_name, last_name, email, phone, membership_type, annual_dues, join_date, household_id, data_source, status)
          VALUES (${memberId}, ${clubId}, ${row.external_id || null}, ${row.first_name}, ${row.last_name}, ${row.email || null}, ${row.phone || null}, ${row.membership_type || null}, ${row.annual_dues ? Number(row.annual_dues) : null}, ${row.join_date || null}, ${row.household_id || null}, 'csv_import', 'active')
          ON CONFLICT (member_id) DO UPDATE SET
            first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
            email = COALESCE(EXCLUDED.email, members.email),
            phone = COALESCE(EXCLUDED.phone, members.phone),
            membership_type = COALESCE(EXCLUDED.membership_type, members.membership_type),
            annual_dues = COALESCE(EXCLUDED.annual_dues, members.annual_dues),
            updated_at = NOW()
        `;
      } else if (importType === 'rounds') {
        await sql`
          INSERT INTO rounds (club_id, member_id, round_date, tee_time, course_id, duration_minutes, pace_rating, players, cancelled, no_show, data_source)
          VALUES (${clubId}, ${row.member_id}, ${row.round_date}, ${row.tee_time || null}, ${row.course_id || null}, ${row.duration_minutes ? Number(row.duration_minutes) : null}, ${row.pace_rating || null}, ${row.players ? Number(row.players) : 1}, ${row.cancelled === 'true' || row.cancelled === '1' || false}, ${row.no_show === 'true' || row.no_show === '1' || false}, 'csv_import')
        `;
      } else if (importType === 'transactions') {
        await sql`
          INSERT INTO transactions (club_id, member_id, transaction_date, total_amount, outlet_name, category, item_count, is_post_round, data_source)
          VALUES (${clubId}, ${row.member_id || null}, ${row.transaction_date}, ${Number(row.total_amount)}, ${row.outlet_name || null}, ${row.category || null}, ${row.item_count ? Number(row.item_count) : null}, ${row.is_post_round === 'true' || row.is_post_round === '1' || false}, 'csv_import')
        `;
      } else if (importType === 'complaints') {
        await sql`
          INSERT INTO complaints (club_id, member_id, category, description, status, priority, reported_at, data_source)
          VALUES (${clubId}, ${row.member_id || null}, ${row.category}, ${row.description}, ${row.status || 'open'}, ${row.priority || 'medium'}, ${row.reported_at || new Date().toISOString()}, 'csv_import')
        `;
      }
      successCount++;
    } catch (e) {
      allErrors.push({ row: i + 1, field: 'database', message: e.message });
      errorCount++;
    }
  }

  // Update import record
  await sql`
    UPDATE csv_imports
    SET status = ${errorCount === rows.length ? 'failed' : errorCount > 0 ? 'partial' : 'completed'},
        success_rows = ${successCount}, error_rows = ${errorCount},
        errors = ${JSON.stringify(allErrors.slice(0, 50))}::jsonb,
        completed_at = NOW()
    WHERE import_id = ${importId}
  `;

  res.status(200).json({
    importId,
    importType,
    totalRows: rows.length,
    success: successCount,
    errors: errorCount,
    errorDetails: allErrors.slice(0, 20),
    status: errorCount === rows.length ? 'failed' : errorCount > 0 ? 'partial' : 'completed',
  });
}
