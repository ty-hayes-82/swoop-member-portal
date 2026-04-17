import { sql } from '@vercel/postgres';
import { getClient } from '../../harness/client.ts';

/**
 * Transfer institutional memory from a departing staff member's session
 * to an incoming staff member's session.
 *
 * Reads decision.made and pattern.learned events from the departing session,
 * seeds the incoming session with a structured summary.
 */
export async function transferSessionMemory(
  departingManagedSessionId: string,
  incomingManagedSessionId: string,
  role: string,
): Promise<{ events_transferred: number }> {
  // Read key events from departing session
  const events = await sql`
    SELECT event_type, payload, created_at
    FROM agent_session_events
    WHERE session_id = ${departingManagedSessionId}
      AND event_type IN ('decision.made', 'pattern.learned', 'preference.observed')
    ORDER BY created_at DESC
    LIMIT 200
  `;

  if (events.rows.length === 0) {
    return { events_transferred: 0 };
  }

  // Seed incoming session with a handoff summary event
  const summary = {
    type: 'succession_handoff',
    from_session: departingManagedSessionId,
    role,
    event_count: events.rows.length,
    events: events.rows,
    transferred_at: new Date().toISOString(),
  };

  await sql`
    INSERT INTO agent_session_events (session_id, event_type, payload, created_at)
    VALUES (${incomingManagedSessionId}, 'handoff.received', ${JSON.stringify(summary)}, NOW())
  `;

  const client = getClient();
  await client.beta.sessions.events.send(incomingManagedSessionId, {
    events: [{
      type: 'user.message',
      content: [{
        type: 'text',
        text: `You are taking over the ${role} role. Here is the institutional memory from your predecessor: ${JSON.stringify(summary, null, 2)}`,
      }],
    }],
  });

  return { events_transferred: events.rows.length };
}
