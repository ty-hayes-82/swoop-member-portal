import { sql } from '@vercel/postgres';
import { getClient, getEnvId } from '../harness/client.ts';

export type SessionType = 'member' | 'gm' | 'role' | 'analyst';

export interface SessionRecord {
  sessionId: string;
  agentId: string;
  entityType: SessionType;
  entityId: string;
  clubId: string;
  status: string;
  lastEventAt: Date | null;
}

// ---------------------------------------------------------------------------
// Deterministic session ID generation (§3.1)
// ---------------------------------------------------------------------------

export function getSessionId(type: SessionType, clubId: string, entityId: string, role?: string): string {
  switch (type) {
    case 'member':   return `sess_member_${clubId}_${entityId}`;
    case 'gm':       return `sess_gm_${clubId}_${entityId}`;
    case 'role':     return `sess_role_${clubId}_${role ?? entityId}_${entityId}`;
    case 'analyst':  return `sess_analyst_${clubId}_${entityId}`;
  }
}

// ---------------------------------------------------------------------------
// In-memory session ID cache (agentSessionId → managedSessionId)
// ---------------------------------------------------------------------------

const _cache = new Map<string, string>();

// ---------------------------------------------------------------------------
// DB lookup + lazy create
// ---------------------------------------------------------------------------

export async function getOrCreateSession(
  type: SessionType,
  clubId: string,
  entityId: string,
  agentId: string,
  role?: string,
): Promise<{ managedSessionId: string; created: boolean }> {
  const sessionKey = getSessionId(type, clubId, entityId, role);
  const cacheKey = `${sessionKey}:${clubId}`;

  if (_cache.has(cacheKey)) {
    return { managedSessionId: _cache.get(cacheKey)!, created: false };
  }

  // Check DB
  const existing = await sql`
    SELECT managed_session_id, status FROM agent_sessions
    WHERE session_key = ${sessionKey} AND club_id = ${clubId}
    LIMIT 1
  `;

  if (existing.rows[0]) {
    const managedSessionId = existing.rows[0].managed_session_id as string;
    _cache.set(cacheKey, managedSessionId);
    return { managedSessionId, created: false };
  }

  // Create new session via Managed Agents API
  const client = getClient();
  const envId = getEnvId();

  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: envId,
    metadata: {
      session_key: sessionKey,
      entity_type: type,
      entity_id: entityId,
      club_id: clubId,
      ...(role ? { role } : {}),
    },
  });

  const managedSessionId = session.id;

  await sql`
    INSERT INTO agent_sessions (
      session_key, managed_session_id, agent_id,
      entity_type, entity_id, club_id, status, created_at, last_event_at
    )
    VALUES (
      ${sessionKey}, ${managedSessionId}, ${agentId},
      ${type}, ${entityId}, ${clubId}, 'active', NOW(), NOW()
    )
    ON CONFLICT (session_key) DO UPDATE
      SET managed_session_id = EXCLUDED.managed_session_id,
          status = 'active',
          last_event_at = NOW()
  `;

  _cache.set(cacheKey, managedSessionId);
  return { managedSessionId, created: true };
}

/**
 * Resolve an existing session. Throws if not found.
 * Use when you know the session should already exist (e.g., resuming).
 */
export async function resolveSession(sessionKey: string, clubId: string): Promise<string> {
  const cacheKey = `${sessionKey}:${clubId}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)!;

  const result = await sql`
    SELECT managed_session_id FROM agent_sessions
    WHERE session_key = ${sessionKey} AND club_id = ${clubId}
    LIMIT 1
  `;

  if (!result.rows[0]) {
    throw new Error(`Session not found: ${sessionKey} for club ${clubId}`);
  }

  const managedSessionId = result.rows[0].managed_session_id as string;
  _cache.set(cacheKey, managedSessionId);
  return managedSessionId;
}

export function clearCache(): void {
  _cache.clear();
}
