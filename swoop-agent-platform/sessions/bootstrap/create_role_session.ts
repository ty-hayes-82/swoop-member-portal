import { sql } from '@vercel/postgres';
import { getOrCreateSession } from '../registry.ts';

export type StaffRole =
  | 'membership_director'
  | 'fb_director'
  | 'head_pro'
  | 'dining_room_manager'
  | 'controller'
  | 'server'
  | 'pro_shop';

const ROLE_TO_AGENT: Record<StaffRole, string> = {
  membership_director: 'membership_director_agent',
  fb_director: 'fb_director_agent',
  head_pro: 'head_pro_agent',
  dining_room_manager: 'dining_room_manager_agent',
  controller: 'controller_agent',
  server: 'server_agent',
  pro_shop: 'pro_shop_agent',
};

export async function createRoleSession(
  clubId: string,
  role: StaffRole,
  userId: string,
): Promise<{ managedSessionId: string; created: boolean }> {
  const agentName = ROLE_TO_AGENT[role];
  const agentId = await resolveAgentId(agentName);
  return getOrCreateSession('role', clubId, userId, agentId, role);
}

async function resolveAgentId(agentName: string): Promise<string> {
  const result = await sql`
    SELECT agent_id FROM agent_registry WHERE agent_name = ${agentName} LIMIT 1
  `;
  if (!result.rows[0]) throw new Error(`${agentName} not registered. Run register_all_agents first.`);
  return result.rows[0]['agent_id'] as string;
}
