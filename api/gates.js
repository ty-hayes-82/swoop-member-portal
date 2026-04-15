/**
 * GET /api/gates — returns which data domains have been imported for this club.
 * Used by demoGate.isGateOpen() to determine which live-data views to unlock.
 *
 * Response: { members, fb, tee-sheet, complaints, email, pace }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const clubId = getReadClubId(req);

  const [mem, tee, pos, posAlt, svc, svcAlt, email, pace] = await Promise.allSettled([
    sql`SELECT 1 FROM members WHERE club_id = ${clubId} LIMIT 1`,
    sql`SELECT 1 FROM bookings WHERE club_id = ${clubId} LIMIT 1`,
    // POS data may be in pos_checks (legacy) or transactions (newer imports)
    sql`SELECT 1 FROM pos_checks WHERE club_id = ${clubId} LIMIT 1`,
    sql`SELECT 1 FROM transactions WHERE club_id = ${clubId} LIMIT 1`,
    // Complaints data may be in service_requests or complaints table
    sql`SELECT 1 FROM service_requests WHERE club_id = ${clubId} LIMIT 1`,
    sql`SELECT 1 FROM complaints WHERE club_id = ${clubId} LIMIT 1`,
    sql`SELECT 1 FROM email_events LIMIT 1`,
    sql`SELECT 1 FROM pace_of_play WHERE club_id = ${clubId} LIMIT 1`,
  ]);

  const has = (result) =>
    result.status === 'fulfilled' && (result.value?.rows?.length ?? 0) > 0;

  res.status(200).json({
    members:        has(mem),
    'tee-sheet':    has(tee),
    fb:             has(pos) || has(posAlt),
    complaints:     has(svc) || has(svcAlt),
    email:          has(email),
    pace:           has(pace),
  });
}, { allowDemo: false });
