/**
 * Feature Availability API — Partial-Data Resilience
 * GET /api/feature-availability?clubId=xxx — check which features are available
 * POST /api/feature-availability — seed dependency data + update domain status
 *
 * Returns per-feature availability based on connected data domains.
 */
import { sql } from '@vercel/postgres';
import { withAuth } from './lib/withAuth.js';

// Agent dependency matrix from the resilience audit
const AGENT_DEPENDENCIES = [
  { key: 'demand_optimizer', type: 'agent', deps: { CRM: 'hard', TEE_SHEET: 'hard', POS: 'soft', EMAIL: 'none', LABOR: 'soft' } },
  { key: 'engagement_autopilot', type: 'agent', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'hard', LABOR: 'none' } },
  { key: 'labor_optimizer', type: 'agent', deps: { CRM: 'soft', TEE_SHEET: 'hard', POS: 'hard', EMAIL: 'none', LABOR: 'hard' } },
  { key: 'member_pulse', type: 'agent', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'soft', LABOR: 'none' } },
  { key: 'revenue_analyst', type: 'agent', deps: { CRM: 'hard', TEE_SHEET: 'hard', POS: 'hard', EMAIL: 'none', LABOR: 'none' } },
  { key: 'service_recovery', type: 'agent', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'soft', LABOR: 'soft' } },
];

const PLAYBOOK_DEPENDENCIES = [
  { key: 'service-save', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'soft', LABOR: 'none' } },
  { key: 'new-member-90day', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'soft', LABOR: 'none' } },
  { key: 'ghost-reactivation', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'hard', POS: 'hard', EMAIL: 'soft', LABOR: 'none' } },
  { key: 'dining-dormancy', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'hard', EMAIL: 'none', LABOR: 'none' } },
  { key: 'demand-surge', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'hard', POS: 'soft', EMAIL: 'none', LABOR: 'none' } },
  { key: 'staffing-gap', type: 'playbook', deps: { CRM: 'soft', TEE_SHEET: 'hard', POS: 'soft', EMAIL: 'none', LABOR: 'hard' } },
  { key: 'engagement-decay', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'hard', LABOR: 'none' } },
  { key: 'weekend-warrior-weather', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'hard', POS: 'none', EMAIL: 'none', LABOR: 'none' } },
  { key: 'post-event-engagement', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'none', POS: 'soft', EMAIL: 'hard', LABOR: 'none' } },
  { key: 'anniversary-celebration', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'none', POS: 'none', EMAIL: 'none', LABOR: 'none' } },
  { key: 'snowbird-opener', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'hard', POS: 'soft', EMAIL: 'soft', LABOR: 'none' } },
  { key: 'social-butterfly-amplifier', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'hard', LABOR: 'none' } },
  { key: 'declining-member', type: 'playbook', deps: { CRM: 'hard', TEE_SHEET: 'soft', POS: 'soft', EMAIL: 'soft', LABOR: 'none' } },
];

const ALL_FEATURES = [...AGENT_DEPENDENCIES, ...PLAYBOOK_DEPENDENCIES];
const DOMAINS = ['CRM', 'TEE_SHEET', 'POS', 'EMAIL', 'LABOR'];

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    const { clubId } = req.query;
    if (!clubId) return res.status(400).json({ error: 'clubId required' });

    try {
      // Get domain status for this club
      const domainStatus = await sql`
        SELECT domain_code, is_connected, health_status, last_sync_at, row_count, staleness_hours
        FROM data_source_status WHERE club_id = ${clubId}
      `;
      const connected = new Set(domainStatus.rows.filter(d => d.is_connected).map(d => d.domain_code));
      const domainMap = {};
      domainStatus.rows.forEach(d => { domainMap[d.domain_code] = d; });

      // Compute feature availability
      const features = ALL_FEATURES.map(f => {
        const hardDeps = Object.entries(f.deps).filter(([, type]) => type === 'hard').map(([domain]) => domain);
        const softDeps = Object.entries(f.deps).filter(([, type]) => type === 'soft').map(([domain]) => domain);
        const missingHard = hardDeps.filter(d => !connected.has(d));
        const missingSoft = softDeps.filter(d => !connected.has(d));

        let status = 'available';
        let fallback = null;
        if (missingHard.length > 0) {
          status = 'unavailable';
          fallback = `Connect ${missingHard.join(' and ')} to enable this feature.`;
        } else if (missingSoft.length > 0) {
          status = 'degraded';
          fallback = `Running with reduced accuracy. Connect ${missingSoft.join(', ')} for full capability.`;
        }

        return {
          type: f.type,
          key: f.key,
          status,
          missingHard,
          missingSoft,
          fallbackMessage: fallback,
        };
      });

      // Compute value score (0-100)
      const domainWeights = { CRM: 40, TEE_SHEET: 25, POS: 20, EMAIL: 10, LABOR: 5 };
      const valueScore = DOMAINS.reduce((sum, d) => sum + (connected.has(d) ? domainWeights[d] : 0), 0);

      res.status(200).json({
        clubId,
        domains: DOMAINS.map(d => ({
          code: d,
          connected: connected.has(d),
          ...(domainMap[d] || {}),
        })),
        features,
        valueScore,
        availableFeatures: features.filter(f => f.status === 'available').length,
        degradedFeatures: features.filter(f => f.status === 'degraded').length,
        unavailableFeatures: features.filter(f => f.status === 'unavailable').length,
        totalFeatures: features.length,
        nextDomainToConnect: getNextRecommendedDomain(connected, features),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { clubId, action } = req.body;
    if (!clubId) return res.status(400).json({ error: 'clubId required' });

    // Seed initial domain status for a new club
    if (action === 'seed_domains') {
      for (const domain of DOMAINS) {
        await sql`
          INSERT INTO data_source_status (club_id, domain_code, is_connected, health_status)
          VALUES (${clubId}, ${domain}, FALSE, 'unknown')
          ON CONFLICT (club_id, domain_code) DO NOTHING
        `;
      }
      return res.status(200).json({ ok: true, message: 'Domain status seeded' });
    }

    // Update a domain's connection status
    if (action === 'update_domain') {
      const { domainCode, isConnected, sourceVendor, rowCount } = req.body;
      await sql`
        INSERT INTO data_source_status (club_id, domain_code, is_connected, source_vendor, row_count, health_status, last_sync_at, updated_at)
        VALUES (${clubId}, ${domainCode}, ${isConnected}, ${sourceVendor || null}, ${rowCount || 0}, ${isConnected ? 'healthy' : 'disconnected'}, ${isConnected ? new Date().toISOString() : null}, NOW())
        ON CONFLICT (club_id, domain_code) DO UPDATE SET
          is_connected = EXCLUDED.is_connected,
          source_vendor = COALESCE(EXCLUDED.source_vendor, data_source_status.source_vendor),
          row_count = EXCLUDED.row_count,
          health_status = EXCLUDED.health_status,
          last_sync_at = EXCLUDED.last_sync_at,
          updated_at = NOW()
      `;

      // Log state change for affected features
      const connected = new Set();
      const allDomains = await sql`SELECT domain_code, is_connected FROM data_source_status WHERE club_id = ${clubId}`;
      allDomains.rows.forEach(d => { if (d.is_connected) connected.add(d.domain_code); });

      for (const f of ALL_FEATURES) {
        const hardDeps = Object.entries(f.deps).filter(([, type]) => type === 'hard').map(([domain]) => domain);
        const wasAvailable = hardDeps.every(d => d === domainCode ? !isConnected : connected.has(d));
        const isAvailable = hardDeps.every(d => connected.has(d));

        if (wasAvailable !== isAvailable) {
          await sql`
            INSERT INTO feature_state_log (club_id, feature_type, feature_key, previous_state, new_state, reason)
            VALUES (${clubId}, ${f.type}, ${f.key}, ${wasAvailable ? 'available' : 'unavailable'}, ${isAvailable ? 'available' : 'unavailable'}, ${`domain_${domainCode}_${isConnected ? 'connected' : 'disconnected'}`})
          `;
        }
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  res.status(405).json({ error: 'GET or POST only' });
}, { roles: ['swoop_admin'] });

function getNextRecommendedDomain(connected, features) {
  const DOMAIN_ORDER = ['CRM', 'TEE_SHEET', 'POS', 'EMAIL', 'LABOR'];
  for (const d of DOMAIN_ORDER) {
    if (!connected.has(d)) {
      const wouldUnlock = features.filter(f => f.status === 'unavailable' && f.missingHard.length === 1 && f.missingHard[0] === d);
      return {
        domain: d,
        wouldUnlock: wouldUnlock.length,
        features: wouldUnlock.map(f => f.key),
        message: `Connect ${d.replace('_', ' ')} to unlock ${wouldUnlock.length} additional feature${wouldUnlock.length !== 1 ? 's' : ''}.`,
      };
    }
  }
  return null;
}
