import { sql } from '@vercel/postgres';
import type { VaultKey } from './schema.ts';

export interface VaultRecord {
  clubId: string;
  keyName: VaultKey;
  envVarOverride?: string;
}

/**
 * Record that a club has a credential provisioned for a given key.
 * The actual credential value lives in env vars (or future Anthropic vault).
 * This table tracks which keys a club has configured.
 */
export async function provisionVaultKey(clubId: string, keyName: VaultKey): Promise<void> {
  await sql`
    INSERT INTO club_vault_keys (club_id, key_name, provisioned_at)
    VALUES (${clubId}, ${keyName}, NOW())
    ON CONFLICT (club_id, key_name) DO UPDATE SET provisioned_at = NOW()
  `;
}

export async function listProvisionedKeys(clubId: string): Promise<VaultKey[]> {
  const result = await sql`
    SELECT key_name FROM club_vault_keys WHERE club_id = ${clubId}
  `;
  return result.rows.map(r => r['key_name'] as VaultKey);
}

export async function hasVaultKey(clubId: string, keyName: VaultKey): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM club_vault_keys
    WHERE club_id = ${clubId} AND key_name = ${keyName}
    LIMIT 1
  `;
  return result.rows.length > 0;
}
