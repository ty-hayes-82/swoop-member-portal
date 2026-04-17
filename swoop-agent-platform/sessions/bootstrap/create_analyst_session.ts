import { sql } from '@vercel/postgres';
import { getOrCreateSession } from '../registry.ts';

export type AnalystName =
  | 'member_pulse_analyst'
  | 'service_recovery_analyst'
  | 'revenue_analyst'
  | 'labor_optimizer'
  | 'engagement_autopilot'
  | 'draft_communicator'
  | 'board_report_compiler';

export async function createAnalystSession(
  clubId: string,
  analyst: AnalystName,
): Promise<{ managedSessionId: string; created: boolean }> {
  const agentId = await resolveAgentId(analyst);
  return getOrCreateSession('analyst', clubId, analyst, agentId);
}

export async function bootstrapAllAnalystSessions(
  clubId: string,
): Promise<{ created: number; existing: number; errors: number }> {
  const analysts: AnalystName[] = [
    'member_pulse_analyst',
    'service_recovery_analyst',
    'revenue_analyst',
    'labor_optimizer',
    'engagement_autopilot',
    'draft_communicator',
    'board_report_compiler',
  ];

  let created = 0;
  let existing = 0;
  let errors = 0;

  for (const analyst of analysts) {
    try {
      const result = await createAnalystSession(clubId, analyst);
      result.created ? created++ : existing++;
    } catch {
      errors++;
    }
  }

  return { created, existing, errors };
}

async function resolveAgentId(agentName: string): Promise<string> {
  const result = await sql`
    SELECT agent_id FROM agent_registry WHERE agent_name = ${agentName} LIMIT 1
  `;
  if (!result.rows[0]) throw new Error(`${agentName} not registered. Run register_all_agents first.`);
  return result.rows[0]['agent_id'] as string;
}
