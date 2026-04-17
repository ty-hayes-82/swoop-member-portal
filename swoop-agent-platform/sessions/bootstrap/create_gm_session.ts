import { sql } from '@vercel/postgres';
import { getOrCreateSession } from '../registry.ts';

export async function createGmSession(
  clubId: string,
  userId: string,
): Promise<{ managedSessionId: string; created: boolean }> {
  const agentId = await resolveAgentId('gm_concierge');
  return getOrCreateSession('gm', clubId, userId, agentId);
}

async function resolveAgentId(agentName: string): Promise<string> {
  const result = await sql`
    SELECT agent_id FROM agent_registry WHERE agent_name = ${agentName} LIMIT 1
  `;
  if (!result.rows[0]) throw new Error(`${agentName} not registered. Run register_all_agents first.`);
  return result.rows[0]['agent_id'] as string;
}
