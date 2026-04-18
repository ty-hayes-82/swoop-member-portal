import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  // Data readiness: check what we actually have in the DB for this club
  const [memberCount, complaintCount, posCount, lastIngested, sessionCount, handoffCount] = await Promise.all([
    sql`SELECT COUNT(*)::int AS cnt, MAX(ingested_at) AS last_sync FROM members WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM complaints WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM pos_transactions WHERE club_id = ${clubId}`,
    sql`SELECT MAX(ingested_at) AS last_sync FROM members WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM agent_sessions WHERE club_id = ${clubId}`,
    sql`SELECT COUNT(*)::int AS cnt FROM agent_handoffs WHERE club_id = ${clubId}`,
  ])

  const memberCnt = memberCount.rows[0]?.cnt ?? 0
  const lastSync = lastIngested.rows[0]?.last_sync ?? null
  const posCnt = posCount.rows[0]?.cnt ?? 0
  const complaintCnt = complaintCount.rows[0]?.cnt ?? 0

  const daysSinceSync = lastSync
    ? Math.floor((Date.now() - new Date(lastSync).getTime()) / 86400_000)
    : null

  // Readiness score: 0-100 based on what's actually loaded
  let score = 0
  if (memberCnt > 0) score += 35      // Jonas members
  if (complaintCnt > 0) score += 15   // Service data
  if (posCnt > 0) score += 20         // POS / F&B data
  if (sessionCount.rows[0]?.cnt > 0) score += 20  // Agent sessions running
  if (handoffCount.rows[0]?.cnt > 0) score += 10  // Handoffs being generated

  const integrations = [
    {
      id: 'jonas',
      name: 'Jonas Club Management',
      mcp: 'mcp_jonas',
      status: memberCnt > 0 ? 'connected' : 'pending',
      status_label: memberCnt > 0
        ? `CSV · ${memberCnt} members · ${daysSinceSync != null ? `${daysSinceSync}d ago` : 'synced'}`
        : 'Not connected',
      count: memberCnt,
      last_sync: lastSync,
    },
    {
      id: 'service',
      name: 'Service / Complaints',
      mcp: 'mcp_complaints',
      status: complaintCnt > 0 ? 'connected' : 'pending',
      status_label: complaintCnt > 0 ? `${complaintCnt} complaints loaded` : 'No data',
      count: complaintCnt,
      last_sync: null,
    },
    {
      id: 'pos',
      name: 'POS / F&B Transactions',
      mcp: 'mcp_pos',
      status: posCnt > 0 ? 'connected' : 'pending',
      status_label: posCnt > 0 ? `${posCnt} transactions loaded` : 'No data',
      count: posCnt,
      last_sync: null,
    },
    {
      id: 'agents',
      name: 'Agent sessions',
      mcp: 'managed_agents',
      status: sessionCount.rows[0]?.cnt > 0 ? 'connected' : 'pending',
      status_label: `${sessionCount.rows[0]?.cnt ?? 0} active sessions`,
      count: sessionCount.rows[0]?.cnt ?? 0,
      last_sync: null,
    },
  ]

  res.json({
    club_id: clubId,
    readiness_score: score,
    member_count: memberCnt,
    last_sync: lastSync,
    days_since_sync: daysSinceSync,
    integrations,
  })
}
