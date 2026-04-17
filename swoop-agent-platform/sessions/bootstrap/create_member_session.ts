import { sql } from '@vercel/postgres';
import { getOrCreateSession } from '../registry.ts';

/**
 * Bootstrap a member concierge session.
 * Called when a member joins or on first concierge interaction.
 * Idempotent: returns existing session if already created.
 */
export async function createMemberSession(
  clubId: string,
  memberId: string,
): Promise<{ managedSessionId: string; created: boolean }> {
  const agentId = await resolveMemberConciergeAgentId(clubId);
  return getOrCreateSession('member', clubId, memberId, agentId);
}

/**
 * Bootstrap sessions for all active members in a club.
 * Used during pilot club setup. Processes in batches to avoid rate limits.
 */
export async function bootstrapAllMemberSessions(
  clubId: string,
  batchSize = 10,
): Promise<{ created: number; existing: number; errors: number }> {
  const members = await sql`
    SELECT member_id FROM members
    WHERE club_id = ${clubId} AND status = 'active'
    ORDER BY member_id
  `;

  let created = 0;
  let existing = 0;
  let errors = 0;

  for (let i = 0; i < members.rows.length; i += batchSize) {
    const batch = members.rows.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (row) => {
        try {
          const result = await createMemberSession(clubId, row['member_id'] as string);
          result.created ? created++ : existing++;
        } catch {
          errors++;
        }
      }),
    );
    // Brief pause between batches to respect rate limits
    if (i + batchSize < members.rows.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return { created, existing, errors };
}

async function resolveMemberConciergeAgentId(clubId: string): Promise<string> {
  const result = await sql`
    SELECT agent_id FROM agent_registry
    WHERE agent_name = 'member_concierge'
    LIMIT 1
  `;
  if (!result.rows[0]) {
    throw new Error(`member_concierge agent not registered for club ${clubId}. Run register_all_agents first.`);
  }
  return result.rows[0]['agent_id'] as string;
}
