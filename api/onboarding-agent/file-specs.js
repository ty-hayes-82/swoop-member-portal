/**
 * File Spec Memory — learns file layouts for instant re-import.
 *
 * After a successful import, the agent saves the file's "spec" — its column
 * layout, vendor, data type, mapping, and any fixes applied. Next time a file
 * with the same layout is uploaded, the agent skips discovery and goes straight
 * to validation + import.
 *
 * Schema: import_file_specs table
 *   spec_id TEXT PK
 *   club_id TEXT
 *   vendor TEXT
 *   import_type TEXT
 *   fingerprint TEXT (hash of sorted column headers — the layout identifier)
 *   column_mapping JSONB (header → swoop field)
 *   auto_fixes JSONB (fixes applied last time: date conversions, name splits, etc.)
 *   validation_notes JSONB (known issues + resolutions)
 *   sample_headers TEXT[] (original headers in order)
 *   times_used INTEGER DEFAULT 1
 *   last_used_at TIMESTAMPTZ DEFAULT NOW()
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 *   UNIQUE(club_id, fingerprint)
 */

import { sql } from '@vercel/postgres';
import { logError } from '../lib/logger.js';

// ---------------------------------------------------------------------------
// Fingerprint: hash sorted lowercase headers to identify a file layout
// ---------------------------------------------------------------------------
function computeFingerprint(headers) {
  const normalized = headers
    .map(h => h.toLowerCase().trim())
    .filter(Boolean)
    .sort()
    .join('|');
  // Simple hash — not cryptographic, just needs to be consistent
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'spec_' + Math.abs(hash).toString(36);
}

// ---------------------------------------------------------------------------
// Ensure table exists
// ---------------------------------------------------------------------------
async function ensureTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS import_file_specs (
        spec_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        club_id TEXT NOT NULL,
        vendor TEXT,
        import_type TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        column_mapping JSONB NOT NULL DEFAULT '{}',
        auto_fixes JSONB DEFAULT '[]',
        validation_notes JSONB DEFAULT '[]',
        sample_headers TEXT[] DEFAULT '{}',
        times_used INTEGER DEFAULT 1,
        last_used_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(club_id, fingerprint)
      )
    `;
  } catch { /* table likely exists */ }
}

// ---------------------------------------------------------------------------
// Look up a saved spec by file headers
// ---------------------------------------------------------------------------
export async function findMatchingSpec(clubId, headers) {
  await ensureTable();
  const fingerprint = computeFingerprint(headers);

  try {
    const result = await sql`
      SELECT * FROM import_file_specs
      WHERE club_id = ${clubId} AND fingerprint = ${fingerprint}
    `;

    if (result.rows.length > 0) {
      // Bump usage counter
      await sql`
        UPDATE import_file_specs
        SET times_used = times_used + 1, last_used_at = NOW()
        WHERE club_id = ${clubId} AND fingerprint = ${fingerprint}
      `;
      return result.rows[0];
    }
    return null;
  } catch (err) {
    logError('file-specs:findMatchingSpec', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Save a file spec after successful import
// ---------------------------------------------------------------------------
export async function saveFileSpec(clubId, { vendor, importType, headers, columnMapping, autoFixes, validationNotes }) {
  await ensureTable();
  const fingerprint = computeFingerprint(headers);

  try {
    await sql`
      INSERT INTO import_file_specs (
        club_id, vendor, import_type, fingerprint, column_mapping,
        auto_fixes, validation_notes, sample_headers
      ) VALUES (
        ${clubId}, ${vendor}, ${importType}, ${fingerprint},
        ${JSON.stringify(columnMapping)}, ${JSON.stringify(autoFixes || [])},
        ${JSON.stringify(validationNotes || [])}, ${headers}
      )
      ON CONFLICT (club_id, fingerprint) DO UPDATE SET
        column_mapping = ${JSON.stringify(columnMapping)},
        auto_fixes = ${JSON.stringify(autoFixes || [])},
        validation_notes = ${JSON.stringify(validationNotes || [])},
        times_used = import_file_specs.times_used + 1,
        last_used_at = NOW()
    `;
    return { saved: true, fingerprint };
  } catch (err) {
    logError('file-specs:saveFileSpec', err);
    return { saved: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// List all saved specs for a club (for UI display)
// ---------------------------------------------------------------------------
export async function listFileSpecs(clubId) {
  await ensureTable();
  try {
    const result = await sql`
      SELECT spec_id, vendor, import_type, sample_headers, times_used, last_used_at, created_at
      FROM import_file_specs
      WHERE club_id = ${clubId}
      ORDER BY last_used_at DESC
      LIMIT 50
    `;
    return result.rows;
  } catch (err) {
    logError('file-specs:listFileSpecs', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Delete a saved spec
// ---------------------------------------------------------------------------
export async function deleteFileSpec(clubId, specId) {
  await ensureTable();
  try {
    await sql`
      DELETE FROM import_file_specs
      WHERE club_id = ${clubId} AND spec_id = ${specId}
    `;
    return { deleted: true };
  } catch (err) {
    logError('file-specs:deleteFileSpec', err);
    return { deleted: false };
  }
}

// ---------------------------------------------------------------------------
// Tool function for the onboarding agent
// ---------------------------------------------------------------------------
export async function checkFileSpecTool(clubId, headers) {
  const spec = await findMatchingSpec(clubId, headers);
  if (!spec) {
    return {
      matched: false,
      message: 'No saved spec for this file layout. Will analyze from scratch.',
    };
  }

  return {
    matched: true,
    vendor: spec.vendor,
    importType: spec.import_type,
    columnMapping: spec.column_mapping,
    autoFixes: spec.auto_fixes,
    validationNotes: spec.validation_notes,
    timesUsed: spec.times_used,
    lastUsed: spec.last_used_at,
    message: `I've seen this file layout before! It's a ${spec.vendor} ${spec.import_type} export — imported ${spec.times_used} time(s), last on ${new Date(spec.last_used_at).toLocaleDateString()}. I'll use the same mapping and apply the same fixes. Ready to validate and import.`,
  };
}
