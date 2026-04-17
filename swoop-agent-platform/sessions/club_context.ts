import { sql } from '@vercel/postgres';

export interface CapabilityStatus {
  enabled: boolean;
  staffGatePassed: boolean;
  available: boolean;
  reason?: string;
}

export interface ClubContext {
  clubId: string;
  activeRoles: string[];
  capabilities: Record<string, CapabilityStatus>;
}

// Maps the target_role enum value (from route_to_role_agent tool) to a capability name
// and the staff roles that must be on duty for it to be available.
const CAPABILITY_MAP: Record<string, { capability: string; requiredRoles: string[] }> = {
  tee_time:   { capability: 'tee_time_booking',      requiredRoles: ['head_pro', 'staff'] },
  pro_shop:   { capability: 'tee_time_booking',      requiredRoles: ['head_pro', 'staff'] },
  head_pro:   { capability: 'pro_shop_operations',   requiredRoles: ['head_pro', 'gm', 'assistant_gm'] },
  dining:     { capability: 'dining_reservations',   requiredRoles: ['fb_director', 'dining_room_manager', 'staff'] },
  fb:         { capability: 'dining_reservations',   requiredRoles: ['fb_director', 'dining_room_manager', 'staff'] },
  events:     { capability: 'event_rsvp',            requiredRoles: ['gm', 'assistant_gm', 'membership_director', 'staff'] },
  membership: { capability: 'membership_services',   requiredRoles: ['membership_director', 'gm', 'assistant_gm'] },
  // Service recovery has no staff gate — analyst runs async regardless of who's on duty
  service_recovery: { capability: 'service_recovery', requiredRoles: [] },
  controller: { capability: 'financial_services',   requiredRoles: ['controller', 'gm', 'assistant_gm'] },
};

// All defined capabilities with human-readable labels
const ALL_CAPABILITIES = [
  'tee_time_booking',
  'dining_reservations',
  'event_rsvp',
  'membership_services',
  'service_recovery',
  'pro_shop_operations',
  'financial_services',
];

export async function getClubContext(clubId: string): Promise<ClubContext> {
  if (!clubId) {
    return { clubId: '', activeRoles: [], capabilities: {} };
  }

  const [dutyResult, configResult] = await Promise.all([
    sql`
      SELECT role FROM staff_duty
      WHERE club_id = ${clubId} AND ended_at IS NULL
    `,
    sql`
      SELECT capability, enabled FROM club_capability_config
      WHERE club_id = ${clubId}
    `,
  ]);

  const activeRoles = dutyResult.rows.map(r => r.role as string);

  // Build config map — default to enabled=true if not explicitly configured
  const configMap: Record<string, boolean> = {};
  for (const row of configResult.rows) {
    configMap[row.capability as string] = row.enabled as boolean;
  }

  const capabilities: Record<string, CapabilityStatus> = {};

  for (const cap of ALL_CAPABILITIES) {
    const configEnabled = configMap[cap] ?? true;

    // Find if this capability has a staff requirement
    const capEntry = Object.values(CAPABILITY_MAP).find(c => c.capability === cap);
    const requiredRoles = capEntry?.requiredRoles ?? [];

    const staffGatePassed =
      requiredRoles.length === 0 ||
      requiredRoles.some(r => activeRoles.includes(r));

    const available = configEnabled && staffGatePassed;

    let reason: string | undefined;
    if (!configEnabled) {
      reason = `${cap} is disabled for this club`;
    } else if (!staffGatePassed) {
      const roleList = requiredRoles.filter(r => r !== 'staff').join(', ') || 'staff';
      reason = `No ${roleList} on duty`;
    }

    capabilities[cap] = { enabled: configEnabled, staffGatePassed, available, ...(reason ? { reason } : {}) };
  }

  return { clubId, activeRoles, capabilities };
}

/**
 * Check whether a specific route_to_role_agent target_role is currently available.
 */
export function isCapabilityAvailable(
  targetRole: string,
  ctx: ClubContext,
): { allowed: boolean; reason?: string } {
  const entry = CAPABILITY_MAP[targetRole];
  if (!entry) return { allowed: true }; // unknown roles pass through

  const status = ctx.capabilities[entry.capability];
  if (!status) return { allowed: true }; // not configured = available

  return { allowed: status.available, ...(status.reason ? { reason: status.reason } : {}) };
}

/**
 * Format a compact one-line capabilities note to prepend to member messages.
 * Only lists capabilities that are unavailable to keep noise low.
 */
export function formatCapabilitiesNote(ctx: ClubContext): string {
  if (!ctx.clubId) return '';

  const unavailable: string[] = [];

  for (const [cap, status] of Object.entries(ctx.capabilities)) {
    if (!status.available) {
      unavailable.push(`${cap}: ${status.reason}`);
    }
  }

  if (unavailable.length === 0) return '';

  return `[System context — unavailable capabilities: ${unavailable.join('; ')}]`;
}
