import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  if (req.method === 'GET') {
    const result = await sql`
      SELECT * FROM club_settings WHERE club_id = ${clubId}
    `
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    return res.json(result.rows[0])
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const {
      club_name, timezone, gm_name, gm_email, gm_phone,
      notify_email, notify_sms, escalation_hours, demo_mode,
      trust_level, category_modes,
    } = body

    await sql`
      INSERT INTO club_settings (
        club_id, club_name, timezone, gm_name, gm_email, gm_phone,
        notify_email, notify_sms, escalation_hours, demo_mode,
        trust_level, category_modes, updated_at
      ) VALUES (
        ${clubId},
        ${(club_name as string) ?? ''},
        ${(timezone as string) ?? 'America/New_York'},
        ${(gm_name as string) ?? ''},
        ${(gm_email as string) ?? ''},
        ${(gm_phone as string) ?? ''},
        ${(notify_email as boolean) ?? true},
        ${(notify_sms as boolean) ?? false},
        ${(escalation_hours as number) ?? 4},
        ${(demo_mode as boolean) ?? false},
        ${(trust_level as number) ?? 2},
        ${JSON.stringify(category_modes ?? {})}::jsonb,
        NOW()
      )
      ON CONFLICT (club_id) DO UPDATE SET
        club_name        = EXCLUDED.club_name,
        timezone         = EXCLUDED.timezone,
        gm_name          = EXCLUDED.gm_name,
        gm_email         = EXCLUDED.gm_email,
        gm_phone         = EXCLUDED.gm_phone,
        notify_email     = EXCLUDED.notify_email,
        notify_sms       = EXCLUDED.notify_sms,
        escalation_hours = EXCLUDED.escalation_hours,
        demo_mode        = EXCLUDED.demo_mode,
        trust_level      = EXCLUDED.trust_level,
        category_modes   = EXCLUDED.category_modes,
        updated_at       = NOW()
    `
    const updated = await sql`SELECT * FROM club_settings WHERE club_id = ${clubId}`
    return res.json(updated.rows[0])
  }

  res.status(405).end()
}
