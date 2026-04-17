import { getClient } from './client.ts';
import { emitEvent } from './events.ts';

export interface ThreadRef {
  sessionId: string;
  threadId: string;
  agentId: string;
}

/**
 * Create a new session thread within an existing coordinator session.
 * Used when an orchestrator delegates to a worker agent.
 */
export async function createThread(
  sessionId: string,
  agentId: string,
  context: Record<string, unknown>,
): Promise<ThreadRef> {
  const client = getClient();
  const response = await client.post(`/v1/agents/sessions/${sessionId}/threads`, {
    body: {
      agent_id: agentId,
      metadata: { created_at: new Date().toISOString() },
    },
  }) as { session_thread_id: string };

  const threadId = response.session_thread_id;

  if (Object.keys(context).length > 0) {
    await sendThreadMessage(sessionId, threadId, JSON.stringify(context));
  }

  return { sessionId, threadId, agentId };
}

/**
 * Send a message to a specific thread within a coordinator session.
 */
export async function sendThreadMessage(
  sessionId: string,
  threadId: string,
  text: string,
): Promise<void> {
  await emitEvent(sessionId, {
    type: 'user.message',
    // Thread targeting is expressed via the event shape — the session_thread_id
    // field routes the message to the correct sub-agent thread.
    ...(threadId ? { session_thread_id: threadId } : {}),
    content: [{ type: 'text', text }],
  } as Parameters<typeof emitEvent>[1]);
}

/**
 * Retrieve the current status of a session, including active threads.
 */
export async function getSessionStatus(sessionId: string) {
  const client = getClient();
  return client.beta.sessions.retrieve(sessionId);
}
