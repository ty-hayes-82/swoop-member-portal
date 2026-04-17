import { sql } from '@vercel/postgres';
import type { VaultKey } from './schema.ts';

/**
 * Log a credential rotation event. Actual rotation is done by updating
 * the env var in Vercel dashboard or CI secret store.
 * When Anthropic vault API is available, this will trigger a vault rotation.
 */
export async function logRotation(clubId: string, keyName: VaultKey, rotatedBy: string): Promise<void> {
  await sql`
    INSERT INTO vault_rotation_log (club_id, key_name, rotated_by, rotated_at)
    VALUES (${clubId}, ${keyName}, ${rotatedBy}, NOW())
  `;
}

export async function getLastRotation(clubId: string, keyName: VaultKey): Promise<Date | null> {
  const result = await sql`
    SELECT rotated_at FROM vault_rotation_log
    WHERE club_id = ${clubId} AND key_name = ${keyName}
    ORDER BY rotated_at DESC
    LIMIT 1
  `;
  return result.rows[0] ? new Date(result.rows[0]['rotated_at'] as string) : null;
}
