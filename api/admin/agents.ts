import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const club_id = (req.query.club_id as string) ?? 'bowling-green-cc'

  const [registryResult, sessionsResult] = await Promise.all([
    sql`
      SELECT agent_name, agent_id, model, description, registered_at
      FROM   agent_registry
      ORDER  BY agent_name
    `,
    sql`
      SELECT session_key, status, last_event_at, created_at
      FROM   agent_sessions
      WHERE  club_id = ${club_id}
    `,
  ])

  const sessionsByKey: Record<string, { status: string; last_event_at: string | null }> = {}
  for (const s of sessionsResult.rows) {
    sessionsByKey[s.session_key] = { status: s.status, last_event_at: s.last_event_at }
  }

  const agents = registryResult.rows.map(r => {
    const analystKey = `sess_analyst_${club_id}_${r.agent_name}`
    const session = sessionsByKey[analystKey] ?? null
    return {
      agent_name:   r.agent_name,
      agent_id:     r.agent_id,
      model:        r.model,
      description:  r.description,
      registered_at: r.registered_at,
      session_status: session?.status ?? null,
      last_run_at:   session?.last_event_at ?? null,
    }
  })

  res.json({ agents })
}
