import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const clubId  = (req.query.club_id as string) || 'bowling-green-cc'
  const agent   = req.query.agent as string | undefined
  const limit   = Math.min(parseInt((req.query.limit as string) || '50', 10), 200)

  const events = agent
    ? await sql`
        SELECT e.event_type, e.payload, e.created_at, s.session_key
        FROM agent_session_events e
        JOIN agent_sessions s ON s.id = e.session_id
        WHERE s.club_id = ${clubId}
          AND s.session_key LIKE ${'%' + agent + '%'}
        ORDER BY e.created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT e.event_type, e.payload, e.created_at, s.session_key
        FROM agent_session_events e
        JOIN agent_sessions s ON s.id = e.session_id
        WHERE s.club_id = ${clubId}
        ORDER BY e.created_at DESC
        LIMIT ${limit}
      `

  const rows = events.rows.map(r => ({
    session_key: r.session_key,
    event_type:  r.event_type,
    preview:     typeof r.payload === 'string'
      ? r.payload.slice(0, 120)
      : JSON.stringify(r.payload ?? {}).slice(0, 120),
    created_at:  r.created_at,
  }))

  res.json({ club_id: clubId, agent: agent ?? null, events: rows, count: rows.length })
}
