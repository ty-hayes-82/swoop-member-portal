import { sql } from '@vercel/postgres';

/**
 * Archive a session permanently — used when a member resigns or staff leaves.
 * Session becomes read-only. Event log preserved for audit and succession.
 */
export async function archiveSession(
  managedSessionId: string,
  reason: 'member_resigned' | 'staff_departed' | 'analyst_decommissioned',
): Promise<void> {
  await sql`
    UPDATE agent_sessions
    SET status = 'archived', archived_at = NOW(), archive_reason = ${reason}
    WHERE managed_session_id = ${managedSessionId}
  `;
}

export async function isArchived(managedSessionId: string): Promise<boolean> {
  const result = await sql`
    SELECT status FROM agent_sessions
    WHERE managed_session_id = ${managedSessionId}
    LIMIT 1
  `;
  return result.rows[0]?.status === 'archived';
}
