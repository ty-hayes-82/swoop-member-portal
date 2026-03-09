import { useMemo, useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { Badge, Btn, SoWhatCallout, Sparkline, StatCard, WaitlistRow, InfoTooltip } from '@/components/ui';
import {
  getWaitlistQueue,
  getWaitlistSummary,
  getWaitlistInsight,
  getWaitlistDemandSparkline,
} from '@/services/waitlistService';
import { theme } from '@/config/theme';

const SLOT_WINDOWS = ['Sat 7:00', 'Sat 7:08', 'Sat 7:16', 'Sat 7:24', 'Sun 7:00', 'Sun 7:08'];

function buildQueueStats(summary, queue) {
  const atRiskRevenue = queue
    .filter((member) => ['At Risk', 'Critical'].includes(member.riskLevel))
    .reduce((sum, member) => sum + (member.memberValueAnnual ?? 0), 0);

  const avgHealthScore = Math.round(
    queue.reduce((sum, member) => sum + member.healthScore, 0) / Math.max(queue.length, 1),
  );

  return [
    {
      label: 'Total Waiting',
      value: summary.total,
      trend: { direction: 'up', value: '+12%', period: 'vs last month' },
      sparklineData: getWaitlistDemandSparkline(),
      badge: { text: 'Live Queue', variant: 'timeline' },
      source: 'Tee Sheet',
    },
    {
      label: 'Retention Priority',
      value: summary.highPriority,
      trend: { direction: 'up', value: '+2', period: 'vs last weekend', inverted: true },
      sparklineData: queue.slice(0, 6).map((member) => member.daysWaiting).reverse(),
      badge: { text: 'Escalate', variant: 'warning' },
      source: 'Member CRM',
    },
    {
      label: 'At-Risk Dues Exposed',
      value: atRiskRevenue,
      format: 'currency',
      trend: { direction: 'up', value: '+$4.1K', period: 'if not routed today', inverted: true },
      sparklineData: queue
        .filter((member) => ['At Risk', 'Critical'].includes(member.riskLevel))
        .slice(0, 6)
        .map((member) => member.memberValueAnnual ?? 0)
        .reverse(),
      badge: { text: 'GM Attention', variant: 'urgent' },
      source: 'Member CRM',
    },
    {
      label: 'Average Health Score',
      value: avgHealthScore,
      trend: { direction: 'down', value: '-4 pts', period: 'past 2 weeks', inverted: true },
      sparklineData: queue.slice(0, 6).map((member) => member.healthScore).reverse(),
      badge: { text: 'Member Health', variant: 'effort' },
      source: 'Analytics',
    },
  ];
}

export default function QueueTab() {
  const queue = getWaitlistQueue();
  const summary = getWaitlistSummary();
  const stats = buildQueueStats(summary, queue);

  const [selectedMemberId, setSelectedMemberId] = useState(queue[0]?.memberId ?? null);
  const [selectedSlot, setSelectedSlot] = useState(SLOT_WINDOWS[0]);
  const [sortKey, setSortKey] = useState('priority');
  const [sortDir, setSortDir] = useState('desc');

  const sortedQueue = useMemo(() => {
    const score = {
      priority: (member) => (member.retentionPriority === 'HIGH' ? 1 : 0),
      health: (member) => member.healthScore,
      waiting: (member) => member.daysWaiting,
    };
    const getter = score[sortKey] ?? score.priority;
    return [...queue].sort((a, b) => {
      const valA = getter(a);
      const valB = getter(b);
      if (valA === valB) return 0;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return sortDir === 'asc' ? -1 : 1;
    });
  }, [queue, sortKey, sortDir]);

  const selectedMember = useMemo(
    () => sortedQueue.find((member) => member.memberId === selectedMemberId) ?? sortedQueue[0],
    [sortedQueue, selectedMemberId],
  );

  const slotCandidates = useMemo(() => {
    if (!selectedMember) return SLOT_WINDOWS;
    const preferred = selectedMember.alternatesAccepted ?? [];
    const merged = [...preferred, ...SLOT_WINDOWS];
    return [...new Set(merged)].slice(0, 6);
  }, [selectedMember]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div className="grid-responsive-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
          boxShadow: theme.shadow.sm,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <div>
            <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Retention-Prioritized Queue
              <InfoTooltip text="Members are ranked by retention value and health score, not FIFO. At-risk members get priority access to prevent churn — even if they requested later than healthier members." />
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Members are ranked by retention value and current health, not by timestamp.
            </div>
          </div>
          <Badge text="Retention-First Routing" variant="timeline" />
        </div>

        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', flexWrap: 'wrap', marginBottom: theme.spacing.sm }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Sort by:</span>
          {[
            { key: 'priority', label: 'Retention Priority' },
            { key: 'health', label: 'Health Score' },
            { key: 'waiting', label: 'Days Waiting' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                if (sortKey === opt.key) {
                  setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                } else {
                  setSortKey(opt.key);
                  setSortDir('desc');
                }
              }}
              style={{
                border: `1px solid ${sortKey === opt.key ? theme.colors.info : theme.colors.border}`,
                background: sortKey === opt.key ? `${theme.colors.info}12` : 'transparent',
                color: sortKey === opt.key ? theme.colors.info : theme.colors.textSecondary,
                borderRadius: theme.radius.sm,
                padding: '4px 10px',
                fontSize: theme.fontSize.xs,
                cursor: 'pointer',
              }}
            >
              {opt.label} {sortKey === opt.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {sortedQueue.map((entry) => (
            <WaitlistRow
              key={entry.memberId}
              {...entry}
              onSelect={setSelectedMemberId}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr',
          gap: theme.spacing.md,
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>
            Queue Pressure Trend
          </div>
          <div style={{ height: 46, marginBottom: theme.spacing.sm }}>
            <Sparkline data={getWaitlistDemandSparkline()} color={theme.colors.info} height={46} showDots />
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
            Priority members account for <strong>{summary.highPriority}</strong> of <strong>{summary.total}</strong> queue entries.
            Average wait is <strong>{summary.avgDaysWaiting} days</strong>, concentrated in Saturday 7:00-9:00 windows.
          </div>
        </div>

        <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.sm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>Queue Management</strong>
            <Badge text={selectedMember?.retentionPriority === 'HIGH' ? 'Priority' : 'Standard'} variant="effort" size="sm" />
          </div>

          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 8 }}>
            Next candidate:{' '}
            {selectedMember ? (
              <MemberLink memberId={selectedMember.memberId} style={{ fontWeight: 700 }}>
                {selectedMember.memberName}
              </MemberLink>
            ) : (
              <strong>None selected</strong>
            )}
          </div>

          <div style={{ display: 'grid', gap: 6, marginBottom: theme.spacing.sm }}>
            {slotCandidates.map((slot) => {
              const selected = slot === selectedSlot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    textAlign: 'left',
                    border: `1px solid ${selected ? theme.colors.info : theme.colors.border}`,
                    background: selected ? `${theme.colors.info}12` : theme.colors.bgCard,
                    color: theme.colors.textSecondary,
                    borderRadius: theme.radius.sm,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    fontSize: theme.fontSize.xs,
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="primary" size="sm" accent={theme.colors.info}>Assign Slot</Btn>
            <Btn variant="ghost" size="sm">Notify Concierge</Btn>
            <Btn variant="ghost" size="sm">Escalate to GM</Btn>
          </div>
        </div>
      </div>

      <SoWhatCallout variant="warning">
        {selectedMember ? (
          <MemberLink memberId={selectedMember.memberId} style={{ fontWeight: 700 }}>
            {selectedMember.memberName}
          </MemberLink>
        ) : (
          <strong>The selected member</strong>
        )} should receive the next available <strong>{selectedSlot}</strong> opening.
        This action protects member value, reduces queue-time friction, and converts cancellation volatility into
        measurable retention impact. {getWaitlistInsight()}
      </SoWhatCallout>
    </div>
  );
}
