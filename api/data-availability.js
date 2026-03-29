/**
 * Data Availability API — checks which data domains have data for a club
 * GET /api/data-availability?clubId=xxx
 * Returns: { members: true, rounds: false, transactions: false, ... }
 */
import { sql } from '@vercel/postgres';

const TABLES = [
  { key: 'members', table: 'members', filter: 'club_id' },
  { key: 'rounds', table: 'rounds', filter: 'club_id' },
  { key: 'transactions', table: 'transactions', filter: 'club_id' },
  { key: 'complaints', table: 'complaints', filter: 'club_id' },
  { key: 'events', table: 'event_registrations', filter: 'club_id' },
  { key: 'email', table: 'email_events', filter: null },
  { key: 'health_scores', table: 'health_scores', filter: 'club_id' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { clubId } = req.query;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  const availability = {};

  for (const { key, table, filter } of TABLES) {
    try {
      const query = filter
        ? sql`SELECT COUNT(*) as count FROM ${sql.unsafe(table)} WHERE ${sql.unsafe(filter)} = ${clubId} LIMIT 1`
        : sql`SELECT COUNT(*) as count FROM ${sql.unsafe(table)} LIMIT 1`;
      const result = await query;
      availability[key] = Number(result.rows[0]?.count) > 0;
    } catch {
      // Table doesn't exist or query failed — data not available
      availability[key] = false;
    }
  }

  // Compute insight levels based on available data
  const levels = [];
  if (availability.members) levels.push('health_scores', 'at_risk', 'archetypes', 'first_90_days');
  if (availability.members && availability.rounds) levels.push('golf_engagement', 'pace_analysis');
  if (availability.members && availability.transactions) levels.push('revenue_signals', 'spend_patterns', 'scenario_modeling');
  if (availability.complaints) levels.push('complaint_tracking', 'service_followthrough');
  if (availability.events) levels.push('event_roi', 'retention_attribution');
  if (availability.email) levels.push('email_decay', 'communication_health');

  res.status(200).json({
    clubId,
    availability,
    insightLevels: levels,
    dataScore: Object.values(availability).filter(Boolean).length,
    maxScore: TABLES.length,
  });
}
