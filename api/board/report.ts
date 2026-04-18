import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const club_id = (req.query.club_id as string) ?? 'bowling-green-cc'

  const { rows } = await sql`
    SELECT id, club_id, month, content, status, generated_at
    FROM board_reports
    WHERE club_id = ${club_id}
    ORDER BY generated_at DESC
    LIMIT 1
  `

  if (!rows.length) return res.status(404).json({ error: 'No report found' })
  res.json(rows[0])
}
