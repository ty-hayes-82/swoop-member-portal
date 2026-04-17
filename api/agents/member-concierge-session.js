/**
 * api/agents/member-concierge-session.js
 *
 * Vercel API route — member concierge chat via Managed Agents session.
 * Thin shim: resolves/creates the durable session, pipes SSE back to client.
 *
 * POST body: { clubId, memberId, message }
 * Response: text/event-stream  { type: 'text'|'tool_use'|'done', ... }
 *
 * Never touches api/agents/ legacy files. Imports only from swoop-agent-platform/.
 */

import { createMemberSession } from '../../swoop-agent-platform/sessions/bootstrap/create_member_session.ts';
import { seedMemberContext } from '../../swoop-agent-platform/sessions/bootstrap/seed_member_context.ts';
import { ensureActive } from '../../swoop-agent-platform/sessions/lifecycle/resume.ts';
import { emitEvent } from '../../swoop-agent-platform/harness/events.ts';
import { pipeSessionToSSE } from '../../swoop-agent-platform/harness/stream.ts';
import { ALL_HANDLERS } from '../../swoop-agent-platform/tools/handlers/index.ts';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clubId, memberId, message } = req.body ?? {};

  if (!clubId || !memberId || !message?.trim()) {
    return res.status(400).json({ error: 'clubId, memberId, and message are required' });
  }

  let managedSessionId;
  try {
    const session = await createMemberSession(clubId, memberId);
    managedSessionId = session.managedSessionId;
    if (session.created) {
      // Fire-and-forget: seed Jonas history for brand-new sessions
      seedMemberContext(clubId, memberId).catch(err =>
        console.error('[member-concierge-session] seed failed:', err.message)
      );
    }
  } catch (err) {
    console.error('[member-concierge-session] session bootstrap failed:', err.message);
    return res.status(503).json({ error: 'Session unavailable', detail: err.message });
  }

  try {
    await ensureActive(managedSessionId);
  } catch (err) {
    console.error('[member-concierge-session] ensureActive failed:', err.message);
    return res.status(410).json({ error: 'Session archived', detail: err.message });
  }

  await emitEvent(managedSessionId, {
    type: 'user.message',
    content: [{ type: 'text', text: message.trim() }],
  });

  await pipeSessionToSSE(managedSessionId, res, ALL_HANDLERS);
}
