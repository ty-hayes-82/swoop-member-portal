/**
 * POST /api/recommendation-feedback
 * GET  /api/recommendation-feedback?clubId=...&since=...
 *
 * Dedicated feedback sink for agent recommendations. POST writes a
 * feedback row (action, recommendation id, agent id, reason, rating);
 * GET returns aggregate stats per agent (accept rate, snooze rate,
 * dismiss rate, avg rating) for the human-eval loop.
 *
 * Table is created on first write so no migration is required.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from './lib/withAuth.js';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS recommendation_feedback (
      id BIGSERIAL PRIMARY KEY,
      club_id TEXT NOT NULL,
      action_id TEXT,
      agent_id TEXT,
      feedback TEXT NOT NULL,
      reason TEXT,
      rating INTEGER,
      snoozed_until TIMESTAMPTZ,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_rec_feedback_club ON recommendation_feedback (club_id, created_at DESC)`;
  } catch { /* index may already exist */ }
}

async function postHandler(req, res) {
  const clubId = getWriteClubId(req);
  const body = req.body || {};
  const feedback = String(body.feedback || '').toLowerCase();
  if (!['accept', 'dismiss', 'snooze', 'rate'].includes(feedback)) {
    return res.status(400).json({ error: 'feedback must be accept|dismiss|snooze|rate' });
  }
  const rating = body.rating != null ? Math.max(1, Math.min(5, Number(body.rating))) : null;
  if (feedback === 'rate' && rating == null) {
    return res.status(400).json({ error: 'rating 1-5 required when feedback=rate' });
  }
  const snoozedUntil = feedback === 'snooze'
    ? new Date(Date.now() + (Number(body.snoozeHours) || 24) * 3600 * 1000).toISOString()
    : null;

  await ensureTable();
  await sql`
    INSERT INTO recommendation_feedback
      (club_id, action_id, agent_id, feedback, reason, rating, snoozed_until, created_by)
    VALUES
      (${clubId}, ${body.actionId || null}, ${body.agentId || null},
       ${feedback}, ${body.reason || null}, ${rating}, ${snoozedUntil},
       ${req.auth?.userId || 'unknown'})
  `;
  return res.status(200).json({ ok: true });
}

async function getHandler(req, res) {
  const clubId = getReadClubId(req);
  await ensureTable();
  const since = req.query?.since || '30 days';
  // Aggregate per agent: counts by feedback type + avg rating
  const r = await sql`
    SELECT
      agent_id,
      COUNT(*) FILTER (WHERE feedback = 'accept')::int  AS accepts,
      COUNT(*) FILTER (WHERE feedback = 'dismiss')::int AS dismisses,
      COUNT(*) FILTER (WHERE feedback = 'snooze')::int  AS snoozes,
      COUNT(*) FILTER (WHERE feedback = 'rate')::int    AS rates,
      ROUND(AVG(rating) FILTER (WHERE feedback = 'rate')::numeric, 2) AS avg_rating
    FROM recommendation_feedback
    WHERE club_id = ${clubId}
      AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY agent_id
    ORDER BY accepts + dismisses + snoozes DESC
  `;
  return res.status(200).json({ clubId, since, agents: r.rows });
}

async function mainHandler(req, res) {
  if (req.method === 'POST') return postHandler(req, res);
  if (req.method === 'GET') return getHandler(req, res);
  return res.status(405).json({ error: 'POST or GET only' });
}

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || {
      clubId: req.body?.clubId || req.body?.club_id || req.query?.clubId,
      userId: 'cron', role: 'system',
    };
    return mainHandler(req, res);
  }
  return withAuth(mainHandler)(req, res);
}
