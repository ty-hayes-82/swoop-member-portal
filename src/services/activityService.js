/**
 * Activity tracking service — fire-and-forget POST to /api/activity.
 * Every user action in the product flows through trackAction().
 * The DB table serves as the universal action log for future integrations.
 */
import { apiFetch } from './apiClient';

export function trackAction({
  actionType,
  actionSubtype,
  memberId,
  memberName,
  agentId,
  referenceId,
  referenceType,
  description,
  meta,
}) {
  apiFetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType,
      actionSubtype: actionSubtype ?? null,
      memberId: memberId ?? null,
      memberName: memberName ?? null,
      agentId: agentId ?? null,
      referenceId: referenceId ?? null,
      referenceType: referenceType ?? null,
      description: description ?? null,
      meta: meta ?? {},
    }),
  }).catch(() => {});

  // Also log outreach events to localStorage for member profile display
  if (memberId && ['call', 'email', 'sms', 'comp', 'outreach'].includes(actionType)) {
    try {
      const key = 'swoop_outreach_log';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        memberId,
        memberName: memberName ?? '',
        type: actionType,
        description: description ?? `${actionType} for ${memberName ?? memberId}`,
        timestamp: new Date().toISOString(),
        initiatedBy: 'Sarah Mitchell',
      });
      // Keep last 100 entries
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
    } catch {}
  }
}

/**
 * Get outreach history for a specific member from local log
 */
export function getOutreachHistory(memberId) {
  try {
    const log = JSON.parse(localStorage.getItem('swoop_outreach_log') || '[]');
    return log.filter(entry => entry.memberId === memberId);
  } catch {
    return [];
  }
}
