import { sql } from '@vercel/postgres';
import { resumeSession } from './dormancy.ts';

/**
 * Ensure a session is active before sending a message.
 * If dormant, marks it active (Managed Agents reactivates automatically
 * on the next event send). If archived, throws — archived sessions are read-only.
 */
export async function ensureActive(managedSessionId: string): Promise<void> {
  const result = await sql`
    SELECT status FROM agent_sessions
    WHERE managed_session_id = ${managedSessionId}
    LIMIT 1
  `;

  const status = result.rows[0]?.status as string | undefined;

  if (status === 'archived') {
    throw new Error(`Session ${managedSessionId} is archived and cannot accept new messages.`);
  }

  if (status === 'dormant') {
    await resumeSession(managedSessionId);
  }
}
