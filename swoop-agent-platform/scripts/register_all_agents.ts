/**
 * register_all_agents.ts
 *
 * Idempotent agent registration script. Reads all YAML configs from
 * agents/identity/ and agents/analyst/, registers each via the Managed
 * Agents API, and upserts IDs into the agent_registry table.
 *
 * Usage:
 *   npx tsx scripts/register_all_agents.ts [--tier=identity|analyst|all] [--dry-run]
 *
 * Callable_agents are wired in Phase 3 after all workers are registered.
 * Run this script again after Phase 3 to update orchestrator definitions.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { sql } from '@vercel/postgres';
import { getClient } from '../harness/client.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const tierArg = args.find(a => a.startsWith('--tier='))?.split('=')[1] ?? 'all';
const dryRun = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// YAML agent definition shape
// ---------------------------------------------------------------------------

interface AgentYaml {
  name: string;
  model: string;
  description: string;
  system: string;
  tools?: unknown[];
  callable_agents?: Array<{ id?: string; name: string }>;
  skills?: string[];
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveToolRefs(tools: unknown[], yamlDir: string): Promise<unknown[]> {
  return Promise.all(
    tools.map(async (tool) => {
      if (typeof tool !== 'object' || tool === null) return tool;
      const t = tool as Record<string, unknown>;
      const ref = t['$ref'];
      if (typeof ref !== 'string') return tool;
      const schemaPath = resolve(yamlDir, ref);
      const raw = await readFile(schemaPath, 'utf-8');
      return JSON.parse(raw) as unknown;
    }),
  );
}

async function loadYamlFiles(dir: string): Promise<Array<{ file: string; config: AgentYaml }>> {
  const files = (await readdir(dir)).filter(f => f.endsWith('.yaml'));
  return Promise.all(
    files.map(async file => {
      const raw = await readFile(join(dir, file), 'utf-8');
      const config = yaml.load(raw) as AgentYaml;
      if (config.tools?.length) {
        config.tools = await resolveToolRefs(config.tools, dir);
      }
      return { file, config };
    }),
  );
}

async function resolveCallableAgents(
  callableAgents: Array<{ id?: string; name: string }>,
): Promise<Array<{ type: 'agent'; id: string }>> {
  const resolved: Array<{ type: 'agent'; id: string }> = [];
  for (const entry of callableAgents) {
    if (entry.id) {
      resolved.push({ type: 'agent', id: entry.id });
      continue;
    }
    const id = await getExistingAgentId(entry.name);
    if (id) {
      resolved.push({ type: 'agent', id });
    } else {
      console.warn(`  [warn] callable_agent "${entry.name}" not yet registered — skipping`);
    }
  }
  return resolved;
}

async function getExistingAgentId(agentName: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT agent_id FROM agent_registry
      WHERE agent_name = ${agentName}
      LIMIT 1
    `;
    return (result.rows[0]?.agent_id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function upsertAgentRegistry(agentName: string, agentId: string): Promise<void> {
  await sql`
    INSERT INTO agent_registry (agent_name, agent_id, registered_at)
    VALUES (${agentName}, ${agentId}, NOW())
    ON CONFLICT (agent_name)
    DO UPDATE SET agent_id = EXCLUDED.agent_id, registered_at = NOW()
  `;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const client = dryRun ? null : getClient();

  const tiers: Array<'identity' | 'analyst'> =
    tierArg === 'identity' ? ['identity'] :
    tierArg === 'analyst'  ? ['analyst']  :
    ['identity', 'analyst'];

  const results = { registered: [] as string[], skipped: [] as string[], errors: [] as string[] };

  for (const tier of tiers) {
    const dir = join(ROOT, 'agents', tier);
    const configs = await loadYamlFiles(dir);

    console.log(`\n[${tier}] Found ${configs.length} agent configs`);

    for (const { file, config } of configs) {
      const agentName = config.name;

      if (dryRun) {
        console.log(`  [dry-run] Would register: ${agentName} (${config.model})`);
        results.registered.push(agentName);
        continue;
      }

      try {
        const resolvedCallable = config.callable_agents?.length
          ? await resolveCallableAgents(config.callable_agents)
          : [];

        const body: Record<string, unknown> = {
          name: agentName,
          model: config.model,
          description: config.description,
          system: config.system,
        };

        if (config.tools?.length) body['tools'] = config.tools;
        if (resolvedCallable.length) body['callable_agents'] = resolvedCallable;

        const existingId = await getExistingAgentId(agentName);
        if (existingId && !args.includes('--force')) {
          console.log(`  [skip] ${agentName} already registered (${existingId})`);
          results.skipped.push(agentName);
          continue;
        }

        if (!client) throw new Error('client is null outside dry-run — should not reach here');

        if (existingId) {
          const current = await (client.beta.agents as unknown as {
            retrieve: (id: string) => Promise<{ id: string; version: number }>
          }).retrieve(existingId);
          const response = await (client.beta.agents as unknown as {
            update: (id: string, body: unknown) => Promise<{ id: string }>
          }).update(existingId, { ...body, version: current.version });
          const agentId = (response as { id: string }).id;
          await upsertAgentRegistry(agentName, agentId);
          console.log(`  [update] ${agentName} → ${agentId}`);
          results.registered.push(agentName);
          continue;
        }

        const response = await client.beta.agents.create(body as unknown as Parameters<typeof client.beta.agents.create>[0]);
        const agentId = (response as { id: string }).id;

        await upsertAgentRegistry(agentName, agentId);
        console.log(`  [ok] Registered ${agentName} → ${agentId}`);
        results.registered.push(agentName);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [error] ${agentName}: ${msg}`);
        results.errors.push(`${agentName}: ${msg}`);
      }
    }
  }

  console.log(`\nDone. Registered: ${results.registered.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);
  if (results.errors.length > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
