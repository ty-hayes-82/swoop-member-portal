import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const id = req.query['id'] as string
  const { resolution_notes } = (req.body ?? {}) as { resolution_notes?: string }

  if (!id) return res.status(400).json({ error: 'id required' })

  const result = await sql`
    UPDATE complaints
    SET status = 'resolved',
        resolved_at = NOW(),
        resolution_notes = COALESCE(${resolution_notes ?? null}, resolution_notes)
    WHERE id = ${id}
    RETURNING id, club_id, member_id, category
  `

  if (!result.rows.length) return res.status(404).json({ error: 'Not found' })

  const c = result.rows[0]
  await sql`
    INSERT INTO event_bus (event_type, payload, club_id, created_at)
    VALUES (
      'complaint.resolved',
      ${JSON.stringify({ complaint_id: id, member_id: c.member_id, category: c.category, resolution_notes: resolution_notes ?? null })},
      ${c.club_id},
      NOW()
    )
  `

  res.json({ ok: true, id })
}
