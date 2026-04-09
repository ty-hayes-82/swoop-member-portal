/**
 * Pause/Resume API — S4 from Playbooks audit
 * POST /api/pause-resume
 *
 * Pause or resume agents and playbook runs with optional scheduled resume.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from './lib/withAuth.js';
import { withAdminOverride } from './lib/withAdminOverride.js';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { targetType, targetId, action, resumeAt } = req.body;
  const clubId = getWriteClubId(req, {
    allowAdminOverride: true,
    reason: 'swoop_admin pause/resume console manages any tenant (handler is role-gated to swoop_admin)',
  });
  // SEC-4: audit actor must come from the authenticated session, not a hardcoded 'GM'.
  const pausedBy = req.auth?.userId || 'unknown';
  if (!clubId || !targetType || !targetId || !action) {
    return res.status(400).json({ error: 'clubId, targetType, targetId, and action required' });
  }

  // Ensure pause tracking table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pause_state (
        club_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        paused BOOLEAN DEFAULT FALSE,
        paused_at TIMESTAMPTZ,
        resume_at TIMESTAMPTZ,
        paused_by TEXT,
        PRIMARY KEY (club_id, target_type, target_id)
      )
    `;
  } catch {}

  try {
    if (action === 'pause') {
      await sql`
        INSERT INTO pause_state (club_id, target_type, target_id, paused, paused_at, resume_at, paused_by)
        VALUES (${clubId}, ${targetType}, ${targetId}, TRUE, NOW(), ${resumeAt || null}, ${pausedBy})
        ON CONFLICT (club_id, target_type, target_id) DO UPDATE SET
          paused = TRUE, paused_at = NOW(), resume_at = ${resumeAt || null}
      `;

      // If it's an agent, also update agent_configs
      if (targetType === 'agent') {
        await sql`
          UPDATE agent_configs SET enabled = FALSE, last_run = NOW()
          WHERE club_id = ${clubId} AND agent_id = ${targetId}
        `;
      }

      // If it's a playbook run, update status
      if (targetType === 'playbook_run') {
        await sql`
          UPDATE playbook_runs SET status = 'paused'
          WHERE club_id = ${clubId} AND run_id = ${targetId}
        `;
      }

      // Log
      await sql`
        INSERT INTO feature_state_log (club_id, feature_type, feature_key, previous_state, new_state, reason)
        VALUES (${clubId}, ${targetType}, ${targetId}, 'active', 'paused', ${resumeAt ? `Paused until ${resumeAt}` : 'Manually paused'})
      `;

      return res.status(200).json({ ok: true, message: `${targetType} ${targetId} paused${resumeAt ? ` until ${resumeAt}` : ''}` });
    }

    if (action === 'resume') {
      await sql`
        INSERT INTO pause_state (club_id, target_type, target_id, paused, paused_at, resume_at)
        VALUES (${clubId}, ${targetType}, ${targetId}, FALSE, NULL, NULL)
        ON CONFLICT (club_id, target_type, target_id) DO UPDATE SET
          paused = FALSE, paused_at = NULL, resume_at = NULL
      `;

      if (targetType === 'agent') {
        await sql`
          UPDATE agent_configs SET enabled = TRUE
          WHERE club_id = ${clubId} AND agent_id = ${targetId}
        `;
      }

      if (targetType === 'playbook_run') {
        await sql`
          UPDATE playbook_runs SET status = 'active'
          WHERE club_id = ${clubId} AND run_id = ${targetId}
        `;
      }

      await sql`
        INSERT INTO feature_state_log (club_id, feature_type, feature_key, previous_state, new_state, reason)
        VALUES (${clubId}, ${targetType}, ${targetId}, 'paused', 'active', 'Manually resumed')
      `;

      return res.status(200).json({ ok: true, message: `${targetType} ${targetId} resumed` });
    }

    // Check for scheduled resumes that are due
    if (action === 'check_scheduled') {
      const due = await sql`
        SELECT * FROM pause_state
        WHERE club_id = ${clubId} AND paused = TRUE AND resume_at IS NOT NULL AND resume_at <= NOW()
      `;

      let resumed = 0;
      for (const item of due.rows) {
        await sql`UPDATE pause_state SET paused = FALSE, resume_at = NULL WHERE club_id = ${clubId} AND target_type = ${item.target_type} AND target_id = ${item.target_id}`;
        if (item.target_type === 'agent') {
          await sql`UPDATE agent_configs SET enabled = TRUE WHERE club_id = ${clubId} AND agent_id = ${item.target_id}`;
        }
        if (item.target_type === 'playbook_run') {
          await sql`UPDATE playbook_runs SET status = 'active' WHERE club_id = ${clubId} AND run_id = ${item.target_id}`;
        }
        resumed++;
      }

      return res.status(200).json({ ok: true, resumed, message: `${resumed} items auto-resumed` });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export default withAuth(
  withAdminOverride(handler, {
    adminTool: 'pause-resume',
    reason: 'swoop_admin pause/resume console',
  }),
  { roles: ['swoop_admin'] }
);
