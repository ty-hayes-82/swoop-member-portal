/**
 * Activity tracking service — fire-and-forget POST to /api/activity.
 * Every user action in the product flows through trackAction().
 * The DB table serves as the universal action log for future integrations.
 */
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
  fetch('/api/activity', {
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
}
