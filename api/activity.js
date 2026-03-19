import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { actionType, actionSubtype, actor, memberId, memberName, agentId, referenceId, referenceType, description, meta } = req.body;

      if (!actionType) {
        return res.status(400).json({ error: 'actionType is required' });
      }

      await sql`
        INSERT INTO activity_log (action_type, action_subtype, actor, member_id, member_name, agent_id, reference_id, reference_type, description, meta)
        VALUES (${actionType}, ${actionSubtype ?? null}, ${actor ?? 'gm_default'}, ${memberId ?? null}, ${memberName ?? null}, ${agentId ?? null}, ${referenceId ?? null}, ${referenceType ?? null}, ${description ?? null}, ${JSON.stringify(meta ?? {})})
      `;

      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM activity_log`;
      return res.status(200).json({ success: true, message: 'All activity history cleared' });
    }

    // GET — fetch activity feed
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const type = req.query.type;
    const memberId = req.query.memberId;

    let result;
    if (type && memberId) {
      result = await sql`SELECT * FROM activity_log WHERE action_type = ${type} AND member_id = ${memberId} ORDER BY created_at DESC LIMIT ${limit}`;
    } else if (type) {
      result = await sql`SELECT * FROM activity_log WHERE action_type = ${type} ORDER BY created_at DESC LIMIT ${limit}`;
    } else if (memberId) {
      result = await sql`SELECT * FROM activity_log WHERE member_id = ${memberId} ORDER BY created_at DESC LIMIT ${limit}`;
    } else {
      result = await sql`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ${limit}`;
    }

    res.status(200).json({ activities: result.rows });
  } catch (error) {
    console.error('Activity API error:', error);
    res.status(500).json({ error: error.message });
  }
}
