/**
 * Shared data-availability gate for every agent trigger.
 *
 * Principle: an agent should not be able to call a tool whose required
 * data isn't in the database yet. Crashing on missing tables or null
 * joins is a product bug — the honest answer is "this agent is waiting
 * for X data" and we say so up front, before any SQL runs.
 *
 * Usage from a trigger handler:
 *
 *   import { checkDataAvailable, DOMAINS } from './data-availability-check.js';
 *
 *   const gate = await checkDataAvailable(clubId, [DOMAINS.CRM, DOMAINS.POS]);
 *   if (!gate.ok) {
 *     return res.status(200).json({
 *       triggered: false,
 *       reason: gate.reason,
 *       missing: gate.missing,
 *     });
 *   }
 *
 * The `data_source_status` table is populated on every successful CSV
 * import via api/import-csv.js:~660, so CRM/TEE_SHEET/POS/EMAIL/LABOR
 * domains flip to connected as the user onboards. This function reads
 * that table; no schema change needed.
 */

import { sql } from '@vercel/postgres';

export const DOMAINS = {
  CRM: 'CRM',            // members, households — imported via members / complaints
  TEE_SHEET: 'TEE_SHEET', // bookings, courses — imported via tee_times / rounds
  POS: 'POS',             // transactions, line items, payments
  EMAIL: 'EMAIL',         // email campaigns, events
  LABOR: 'LABOR',         // staff, shifts
};

/**
 * @param {string} clubId
 * @param {string[]} required — array of DOMAINS
 * @returns {Promise<{ok: true} | {ok: false, reason: string, missing: string[]}>}
 */
export async function checkDataAvailable(clubId, required) {
  if (!Array.isArray(required) || required.length === 0) {
    return { ok: true };
  }

  let connected = new Set();
  try {
    const { rows } = await sql`
      SELECT domain_code, is_connected
      FROM data_source_status
      WHERE club_id = ${clubId}
    `;
    for (const r of rows) {
      if (r.is_connected) connected.add(r.domain_code);
    }
  } catch {
    // data_source_status may not exist in very old environments.
    // Fall through to the table-count heuristic below.
  }

  // Fallback / corroboration: count rows in the canonical tenant tables for
  // each domain. If data_source_status is wrong or missing, we still get a
  // true reading. This also handles the case where import-csv wrote data
  // but failed to update data_source_status.
  const missing = [];
  for (const domain of required) {
    if (connected.has(domain)) continue;
    const hasRows = await domainHasRows(clubId, domain);
    if (hasRows) {
      connected.add(domain);
      continue;
    }
    missing.push(domain);
  }

  if (missing.length > 0) {
    const humanNames = {
      CRM: 'member roster',
      TEE_SHEET: 'tee sheet / bookings',
      POS: 'F&B transactions',
      EMAIL: 'email campaigns',
      LABOR: 'staff & shifts',
    };
    const names = missing.map(d => humanNames[d] || d).join(', ');
    return {
      ok: false,
      reason: `This agent needs ${names} before it can run. Import that data first.`,
      missing,
    };
  }
  return { ok: true };
}

async function domainHasRows(clubId, domain) {
  try {
    switch (domain) {
      case DOMAINS.CRM: {
        const r = await sql`SELECT 1 FROM members WHERE club_id = ${clubId} LIMIT 1`;
        return r.rows.length > 0;
      }
      case DOMAINS.TEE_SHEET: {
        const r = await sql`SELECT 1 FROM bookings WHERE club_id = ${clubId} LIMIT 1`;
        return r.rows.length > 0;
      }
      case DOMAINS.POS: {
        const r = await sql`SELECT 1 FROM transactions WHERE club_id = ${clubId} LIMIT 1`;
        return r.rows.length > 0;
      }
      case DOMAINS.EMAIL: {
        const r = await sql`SELECT 1 FROM email_campaigns WHERE club_id = ${clubId} LIMIT 1`;
        return r.rows.length > 0;
      }
      case DOMAINS.LABOR: {
        const r = await sql`SELECT 1 FROM staff WHERE club_id = ${clubId} LIMIT 1`;
        if (r.rows.length > 0) return true;
        const s = await sql`SELECT 1 FROM staff_shifts WHERE club_id = ${clubId} LIMIT 1`;
        return s.rows.length > 0;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Declarative required-sources map per trigger endpoint file name.
 * Used by trigger handlers to look up what they need without duplicating
 * the list.
 */
export const TRIGGER_REQUIREMENTS = {
  'risk-trigger': [DOMAINS.CRM],
  'arrival-trigger': [DOMAINS.CRM, DOMAINS.TEE_SHEET],
  'complaint-trigger': [DOMAINS.CRM],
  'service-save-trigger': [DOMAINS.CRM],
  'fb-trigger': [DOMAINS.CRM, DOMAINS.POS],
  'gameplan-trigger': [DOMAINS.CRM, DOMAINS.TEE_SHEET],
  'staffing-trigger': [DOMAINS.LABOR],
  'board-report-trigger': [DOMAINS.CRM],
  'cos-trigger': [DOMAINS.CRM],
};
