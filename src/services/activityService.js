/**
 * Activity tracking service — fire-and-forget POST to /api/activity.
 * Every user action in the product flows through trackAction().
 * The DB table serves as the universal action log for future integrations.
 */
import { apiFetch } from './apiClient';
import { logError } from '@/utils/logError';

function getActorName() {
  try {
    return localStorage.getItem('swoop_user_name') || localStorage.getItem('swoop_demo_name') || 'GM';
  } catch { return 'GM'; }
}

export function trackAction({
  actionType,
  actionSubtype,
  actor,
  memberId,
  memberName,
  agentId,
  referenceId,
  referenceType,
  description,
  meta,
}) {
  const resolvedActor = actor ?? getActorName();
  apiFetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionType,
      actionSubtype: actionSubtype ?? null,
      actor: resolvedActor,
      memberId: memberId ?? null,
      memberName: memberName ?? null,
      agentId: agentId ?? null,
      referenceId: referenceId ?? null,
      referenceType: referenceType ?? null,
      description: description ?? null,
      meta: meta ?? {},
    }),
  }).catch((err) => { logError(err, { service: 'activityService', op: 'trackAction', actionType }); });

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
        initiatedBy: resolvedActor,
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

/**
 * Check if a member was recently contacted via outreach.
 * Returns { recentlyContacted, lastContact, hoursAgo }
 */
export function checkRecentOutreach(memberId, windowHours = 48) {
  if (!memberId) return { recentlyContacted: false, lastContact: null, hoursAgo: null };
  const history = getOutreachHistory(memberId);
  if (!history.length) return { recentlyContacted: false, lastContact: null, hoursAgo: null };

  const last = history[0]; // already sorted newest-first
  const hoursAgo = Math.round((Date.now() - new Date(last.timestamp).getTime()) / (1000 * 60 * 60));

  return {
    recentlyContacted: hoursAgo < windowHours,
    lastContact: last,
    hoursAgo,
  };
}
