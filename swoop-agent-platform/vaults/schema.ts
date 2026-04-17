/**
 * Vault credential key names and their env var mappings.
 *
 * Agents never see credentials. MCP servers call getVaultCredential()
 * to resolve the actual value at runtime from environment variables.
 *
 * When Anthropic vault API is available, replace the env lookup here.
 */

export type VaultKey =
  | 'jonas_api_key'
  | 'jonas_base_url'
  | 'foretees_api_key'
  | 'foretees_base_url'
  | 'openweather_api_key'
  | 'sendgrid_api_key'
  | 'twilio_account_sid'
  | 'twilio_auth_token'
  | 'twilio_from_number'
  | 'mcp_auth_token';

const ENV_MAP: Record<VaultKey, string> = {
  jonas_api_key:        'JONAS_API_KEY',
  jonas_base_url:       'JONAS_BASE_URL',
  foretees_api_key:     'FORETEES_API_KEY',
  foretees_base_url:    'FORETEES_BASE_URL',
  openweather_api_key:  'OPENWEATHER_API_KEY',
  sendgrid_api_key:     'SENDGRID_API_KEY',
  twilio_account_sid:   'TWILIO_ACCOUNT_SID',
  twilio_auth_token:    'TWILIO_AUTH_TOKEN',
  twilio_from_number:   'TWILIO_FROM_NUMBER',
  mcp_auth_token:       'MCP_AUTH_TOKEN',
};

export function getVaultCredential(key: VaultKey): string {
  const envVar = ENV_MAP[key];
  const value = process.env[envVar];
  if (!value) throw new Error(`Vault credential not set: ${envVar}`);
  return value;
}

export function getVaultCredentialOptional(key: VaultKey): string | undefined {
  const envVar = ENV_MAP[key];
  return process.env[envVar];
}
