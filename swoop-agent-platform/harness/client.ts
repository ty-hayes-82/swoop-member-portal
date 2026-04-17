import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

function cleanEnvVar(v: string | undefined): string | undefined {
  return v?.replace(/\\n/g, '').trim() || undefined;
}

export function getClient(): Anthropic {
  if (!_client) {
    const apiKey = cleanEnvVar(process.env.ANTHROPIC_API_KEY) || cleanEnvVar(process.env.anthropic);
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// env_012XfsmKfXB1z5zYDNeFGFiF is the "swoop-agent-env" environment
const FALLBACK_ENV_ID = 'env_012XfsmKfXB1z5zYDNeFGFiF';

export function getEnvId(): string {
  const envId = cleanEnvVar(process.env.MANAGED_ENV_ID) || cleanEnvVar(process.env.MANAGED_AGENT_ENV_ID) || FALLBACK_ENV_ID;
  if (!envId) throw new Error('MANAGED_ENV_ID is not set');
  return envId;
}

export type { Anthropic };
