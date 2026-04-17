import { sql } from '@vercel/postgres';
import { getClient } from '../../harness/client.ts';

const DORMANCY_THRESHOLD_DAYS = 30;

/**
 * Archive sessions that have been idle for 30+ days.
 * Run daily via cron. Marks DB record as dormant.
 * Managed Agents preserves the event log with zero runtime cost.
 */
export async function archiveDormantSessions(clubId: string): Promise<{ archived: number }> {
  const client = getClient();

  const dormant = await sql`
    SELECT session_key, managed_session_id
    FROM agent_sessions
    WHERE club_id = ${clubId}
      AND status = 'active'
      AND last_event_at < NOW() - (${DORMANCY_THRESHOLD_DAYS} || ' days')::interval
  `;

  let archived = 0;
  for (const row of dormant.rows) {
    const managedSessionId = row['managed_session_id'] as string;

    try {
      // The sessions beta API may expose an archive method; call it if available.
      // If not yet available, the DB update below is sufficient — the session
      // simply becomes idle and costs nothing until the next message arrives.
      const sessions = client.beta.sessions as unknown as Record<string, unknown>;
      if (typeof sessions['archive'] === 'function') {
        await (sessions['archive'] as (id: string) => Promise<void>)(managedSessionId);
      }
    } catch {
      // Gracefully handle if archive endpoint isn't available yet
    }

    await sql`
      UPDATE agent_sessions
      SET status = 'dormant', dormant_since = NOW()
      WHERE managed_session_id = ${managedSessionId}
    `;

    archived++;
  }

  return { archived };
}

/**
 * Resume a dormant session when a new inbound message arrives.
 * The Managed Agents platform reactivates automatically on the next event send.
 * This updates our DB status to reflect the transition.
 */
export async function resumeSession(managedSessionId: string): Promise<void> {
  await sql`
    UPDATE agent_sessions
    SET status = 'active', last_event_at = NOW(), dormant_since = NULL
    WHERE managed_session_id = ${managedSessionId}
  `;
}

/**
 * Touch the last_event_at timestamp after every emitted event to keep
 * the dormancy clock accurate.
 */
export async function touchSession(managedSessionId: string): Promise<void> {
  await sql`
    UPDATE agent_sessions
    SET last_event_at = NOW(), status = 'active', dormant_since = NULL
    WHERE managed_session_id = ${managedSessionId}
  `;
}
