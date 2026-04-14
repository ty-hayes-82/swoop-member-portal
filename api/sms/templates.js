/**
 * SMS Templates API
 * GET /api/sms/templates?clubId=X  — list templates (club overrides + system defaults)
 * PUT /api/sms/templates/:id        — upsert a club-specific template override
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { cors } from '../lib/cors.js';

async function handler(req, res) {
  if (cors(req, res)) return;

  const clubId = req.method === 'GET'
    ? (req.query.clubId || req.session?.clubId)
    : (req.body?.clubId || req.session?.clubId);

  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  if (req.method === 'GET') {
    // Return system defaults, with club-specific overrides merged in
    const result = await sql`
      SELECT DISTINCT ON (template_id)
        template_id, club_id, category, trigger_type, body, reply_keywords, max_length, active
      FROM sms_templates
      WHERE club_id = ${clubId} OR club_id IS NULL
      ORDER BY template_id, club_id NULLS LAST
    `;
    return res.json({ templates: result.rows });
  }

  if (req.method === 'PUT') {
    // Upsert club-specific template override
    const templateId = req.query.id || req.body?.template_id;
    const { body } = req.body || {};
    if (!body) return res.status(400).json({ error: 'body required' });

    // Get the system template to copy metadata
    const sys = await sql`
      SELECT category, trigger_type, reply_keywords, max_length
      FROM sms_templates WHERE template_id = ${templateId} AND club_id IS NULL
    `;
    if (!sys.rows[0]) return res.status(404).json({ error: 'Template not found' });

    const { category, trigger_type, reply_keywords, max_length } = sys.rows[0];
    const overrideId = `${templateId}_${clubId}`;

    await sql`
      INSERT INTO sms_templates (template_id, club_id, category, trigger_type, body, reply_keywords, max_length)
      VALUES (${overrideId}, ${clubId}, ${category}, ${trigger_type}, ${body}, ${reply_keywords}, ${max_length})
      ON CONFLICT (template_id) DO UPDATE SET body = EXCLUDED.body
    `;

    return res.json({ ok: true, template_id: overrideId });
  }

  return res.status(405).json({ error: 'GET or PUT only' });
}

export default withAuth(handler);
