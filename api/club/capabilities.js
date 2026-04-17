/**
 * GET  /api/club/capabilities  — list all capability toggles for the club
 * PATCH /api/club/capabilities  — update a capability toggle (GM only)
 *
 * Body for PATCH: { capability: string, enabled: boolean }
 */
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { sql } from '@vercel/postgres';

const ALL_CAPABILITIES = [
  'tee_time_booking',
  'dining_reservations',
  'event_rsvp',
  'membership_services',
  'service_recovery',
  'pro_shop_operations',
  'financial_services',
];

async function capabilitiesHandler(req, res) {
  const clubId = getReadClubId(req);

  if (req.method === 'GET') {
    const result = await sql`
      SELECT capability, enabled, updated_at, updated_by
      FROM club_capability_config
      WHERE club_id = ${clubId}
    `;

    const configMap = {};
    for (const row of result.rows) {
      configMap[row.capability] = row.enabled;
    }

    // Return all capabilities with their effective state (default = enabled)
    const capabilities = ALL_CAPABILITIES.map(cap => ({
      capability: cap,
      enabled: configMap[cap] ?? true,
      configured: cap in configMap,
    }));

    return res.status(200).json({ capabilities });
  }

  if (req.method === 'PATCH') {
    // GM-only write
    const { role } = req.auth;
    if (!['gm', 'assistant_gm', 'swoop_admin'].includes(role)) {
      return res.status(403).json({ error: 'GM access required to change club capabilities.' });
    }

    const { capability, enabled } = req.body;
    const { user_id } = req.auth;

    if (!capability) return res.status(400).json({ error: 'capability is required' });
    if (!ALL_CAPABILITIES.includes(capability)) {
      return res.status(400).json({ error: `Unknown capability. Valid: ${ALL_CAPABILITIES.join(', ')}` });
    }
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be a boolean' });

    await sql`
      INSERT INTO club_capability_config (club_id, capability, enabled, updated_at, updated_by)
      VALUES (${clubId}, ${capability}, ${enabled}, NOW(), ${user_id})
      ON CONFLICT (club_id, capability)
      DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW(), updated_by = EXCLUDED.updated_by
    `;

    return res.status(200).json({ club_id: clubId, capability, enabled });
  }

  return res.status(405).json({ error: 'GET or PATCH only' });
}

export default withAuth(capabilitiesHandler, {
  roles: ['gm', 'assistant_gm', 'fb_director', 'head_pro', 'membership_director', 'controller', 'staff'],
});
