import { sql } from '@vercel/postgres';

export interface CapabilityStatus {
  enabled: boolean;
  reason?: string;
}

export interface ClubContext {
  clubId: string;
  capabilities: Record<string, CapabilityStatus>;
}

const ALL_CAPABILITIES = [
  'tee_time_booking',
  'dining_reservations',
  'event_rsvp',
  'membership_services',
  'service_recovery',
  'pro_shop_operations',
  'financial_services',
];

// Maps route_to_role_agent target_role values to their capability name
const ROLE_TO_CAPABILITY: Record<string, string> = {
  tee_time:   'tee_time_booking',
  pro_shop:   'tee_time_booking',
  head_pro:   'pro_shop_operations',
  dining:     'dining_reservations',
  fb:         'dining_reservations',
  events:     'event_rsvp',
  membership: 'membership_services',
  service_recovery: 'service_recovery',
  controller: 'financial_services',
};

export async function getClubContext(clubId: string): Promise<ClubContext> {
  if (!clubId) return { clubId: '', capabilities: {} };

  const result = await sql`
    SELECT capability, enabled
    FROM club_capability_config
    WHERE club_id = ${clubId}
  `;

  const configMap: Record<string, boolean> = {};
  for (const row of result.rows) {
    configMap[row.capability as string] = row.enabled as boolean;
  }

  const capabilities: Record<string, CapabilityStatus> = {};
  for (const cap of ALL_CAPABILITIES) {
    const enabled = configMap[cap] ?? true;
    capabilities[cap] = enabled
      ? { enabled: true }
      : { enabled: false, reason: `${cap} is disabled for this club` };
  }

  return { clubId, capabilities };
}

export function isCapabilityAvailable(
  targetRole: string,
  ctx: ClubContext,
): { allowed: boolean; reason?: string } {
  const cap = ROLE_TO_CAPABILITY[targetRole];
  if (!cap) return { allowed: true };

  const status = ctx.capabilities[cap];
  if (!status || status.enabled) return { allowed: true };

  return { allowed: false, ...(status.reason ? { reason: status.reason } : {}) };
}

/**
 * Returns a compact note listing only explicitly disabled capabilities.
 * Empty string when all capabilities are enabled (the common case).
 */
export function formatCapabilitiesNote(ctx: ClubContext): string {
  if (!ctx.clubId) return '';

  const disabled = Object.entries(ctx.capabilities)
    .filter(([, s]) => !s.enabled)
    .map(([cap]) => cap);

  if (disabled.length === 0) return '';

  return `[Club config: the following capabilities are disabled for this club: ${disabled.join(', ')}]`;
}
