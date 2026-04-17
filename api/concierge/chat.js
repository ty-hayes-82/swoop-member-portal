/**
 * POST /api/concierge/chat
 *
 * Member Concierge chat endpoint — powered by swoop-agent-platform.
 * Routes through a persistent Managed Agent session per member.
 *
 * Auth: member-level (the member themselves, or GM on behalf).
 * Body: { member_id: string, message: string }
 */
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { createMemberSession } from '../../swoop-agent-platform/sessions/bootstrap/create_member_session.ts';
import { sendAndConsumeStream } from '../../swoop-agent-platform/harness/events.ts';
import { ALL_HANDLERS } from '../../swoop-agent-platform/tools/handlers/index.ts';
import { seedMemberContext } from '../../swoop-agent-platform/sessions/bootstrap/seed_member_context.ts';

async function chatHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { member_id, message } = req.body;

  if (!member_id) return res.status(400).json({ error: 'member_id is required' });
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });

  try {
    const { managedSessionId, created } = await createMemberSession(clubId, member_id);

    // Seed Jonas context on first session (fire-and-forget, non-blocking)
    if (created) {
      seedMemberContext(clubId, member_id).catch(err =>
        console.warn('[concierge/chat] seed error (non-fatal):', err.message),
      );
    }

    const responseText = await sendAndConsumeStream(managedSessionId, message, ALL_HANDLERS);

    return res.status(200).json({
      session_id: managedSessionId,
      member_id,
      response: responseText || fallbackResponse(req, member_id),
      simulated: false,
    });
  } catch (err) {
    console.error('[concierge/chat] error:', err);
    return res.status(200).json({
      session_id: null,
      member_id,
      response: "I'm having a moment — please call the front desk and they'll take great care of you.",
      simulated: false,
      error_handled: true,
    });
  }
}

function fallbackResponse(req, memberId) {
  return `Hi, I ran into a snag. Please call the front desk and they'll help you right away.`;
}

export default withAuth(chatHandler, { allowDemo: true });
