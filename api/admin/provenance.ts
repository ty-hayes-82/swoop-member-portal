import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  const [members, complaints, pos, sessions, handoffs] = await Promise.all([
    sql`SELECT COUNT(*)::int AS cnt FROM members WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM complaints WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM pos_transactions WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM agent_sessions WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM agent_handoffs WHERE club_id = ${clubId}`,
  ])

  // Determine data tier per table for this club
  // Tier 3 = real pilot data; Tier 4 = fixture/seeded synthetic data
  // Heuristic: bowling-green-cc data loaded via CSV ingest = Tier 3
  //            demo-club-cc data always = Tier 4
  //            bowling-green-cc data before Jonas CSV loaded = Tier 4
  const isDemo = clubId === 'demo-club-cc'

  const memberCnt    = members.rows[0]?.cnt    ?? 0
  const complaintCnt = complaints.rows[0]?.cnt ?? 0
  const posCnt       = pos.rows[0]?.cnt        ?? 0
  const sessionCnt   = sessions.rows[0]?.cnt   ?? 0
  const handoffCnt   = handoffs.rows[0]?.cnt   ?? 0

  // Check if Jonas CSV has been ingested (Tier 3 marker: ingested_at populated)
  const ingestCheck = await sql`
    SELECT COUNT(*)::int AS cnt FROM members
    WHERE club_id = ${clubId} AND ingested_at IS NOT NULL
  `
  const hasRealIngestion = (ingestCheck.rows[0]?.cnt ?? 0) > 0

  const dataTier = isDemo ? 4 : hasRealIngestion ? 3 : 4

  const tables = [
    { table: 'members',          row_count: memberCnt,    tier: dataTier, source: isDemo ? 'fixture/migration-009' : hasRealIngestion ? 'jonas-csv-ingest' : 'fixture/migration-004' },
    { table: 'complaints',       row_count: complaintCnt, tier: dataTier, source: isDemo ? 'fixture/migration-009' : hasRealIngestion ? 'pilot-data' : 'fixture/migration-005' },
    { table: 'pos_transactions', row_count: posCnt,       tier: dataTier, source: isDemo ? 'fixture/migration-009' : hasRealIngestion ? 'pilot-data' : 'fixture/migration-006' },
    { table: 'agent_sessions',   row_count: sessionCnt,   tier: 1,        source: 'live-managed-agents' },
    { table: 'agent_handoffs',   row_count: handoffCnt,   tier: 1,        source: 'live-analyst-output' },
  ]

  const tier4Count = tables.filter(t => t.tier === 4).reduce((s, t) => s + t.row_count, 0)
  const tier3Count = tables.filter(t => t.tier === 3).reduce((s, t) => s + t.row_count, 0)
  const tier1Count = tables.filter(t => t.tier === 1).reduce((s, t) => s + t.row_count, 0)

  res.json({
    club_id: clubId,
    overall_tier: dataTier,
    tier4_row_count: tier4Count,
    tier3_row_count: tier3Count,
    tier1_row_count: tier1Count,
    pilot_ready: dataTier <= 3,
    tables,
    message: dataTier === 4
      ? 'This club is running on fixture data (Tier 4). Load Jonas CSV to promote to Tier 3.'
      : dataTier === 3
      ? 'Real pilot data loaded (Tier 3). Tier 4 fixtures replaced.'
      : 'Live data.',
  })
}
