import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

// Marks selected agents as active for the club.
// Full session creation happens in club-thread-platform/scripts/pilot_club_bootstrap.ts
// This endpoint records the activation intent and confirms readiness.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'
  const { agents } = req.body as { agents: string[] }
  if (!agents?.length) return res.status(400).json({ error: 'agents array required' })

  // Check which requested agents are registered
  const registry = await sql`
    SELECT agent_name, agent_id FROM agent_registry WHERE club_id = ${clubId}
  `
  const registered = new Set(registry.rows.map(r => r.agent_name))
  const activated: string[] = []
  const missing: string[] = []

  for (const a of agents) {
    if (registered.has(a)) {
      activated.push(a)
      // Ensure a session row exists (idempotent)
      await sql`
        INSERT INTO agent_sessions (session_key, club_id, status, created_at, last_event_at)
        VALUES (
          ${'sess_' + a + '_' + clubId}, ${clubId}, 'active', NOW(), NOW()
        )
        ON CONFLICT (session_key) DO UPDATE SET status = 'active', last_event_at = NOW()
      `
    } else {
      missing.push(a)
    }
  }

  res.json({
    club_id: clubId,
    activated,
    missing,
    message: activated.length > 0
      ? `${activated.length} agent(s) activated for ${clubId}. Run pilot_club_bootstrap.ts for full session initialization.`
      : 'No agents activated. Ensure agents are registered first.',
  })
}
