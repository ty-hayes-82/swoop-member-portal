import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  if (req.method === 'GET') {
    const result = await sql`
      SELECT agent_name, assigned_to_name, assigned_to_email, assigned_to_phone, on_call, backup_name, updated_at
      FROM agent_role_assignments
      WHERE club_id = ${clubId}
      ORDER BY agent_name
    `
    return res.json({ club_id: clubId, roles: result.rows })
  }

  if (req.method === 'POST') {
    const { agent_name, assigned_to_name, assigned_to_email, assigned_to_phone, on_call, backup_name } = req.body as {
      agent_name: string
      assigned_to_name: string
      assigned_to_email: string
      assigned_to_phone: string
      on_call: boolean
      backup_name: string
    }
    if (!agent_name) return res.status(400).json({ error: 'agent_name required' })

    const updated = await sql`
      INSERT INTO agent_role_assignments
        (club_id, agent_name, assigned_to_name, assigned_to_email, assigned_to_phone, on_call, backup_name, updated_at)
      VALUES
        (${clubId}, ${agent_name}, ${assigned_to_name ?? ''}, ${assigned_to_email ?? ''},
         ${assigned_to_phone ?? ''}, ${on_call ?? false}, ${backup_name ?? ''}, NOW())
      ON CONFLICT (club_id, agent_name) DO UPDATE SET
        assigned_to_name  = EXCLUDED.assigned_to_name,
        assigned_to_email = EXCLUDED.assigned_to_email,
        assigned_to_phone = EXCLUDED.assigned_to_phone,
        on_call           = EXCLUDED.on_call,
        backup_name       = EXCLUDED.backup_name,
        updated_at        = NOW()
      RETURNING *
    `
    return res.json(updated.rows[0])
  }

  return res.status(405).end()
}
