import { SoWhatCallout, ArchetypeBadge } from '@/components/ui';
import CancellationRiskRow from '@/features/pipeline/components/CancellationRiskRow';
import { DEMO_DATE } from '@/config/constants';
import { cancellationProbabilities, memberWaitlistEntries } from '@/data/pipeline';
import { getDemandGaps } from '@/services/operationsService';
import { getWaitlistWithRiskScoring, getWaitlistSummary } from '@/services/pipelineService';
import { theme } from '@/config/theme';

const RISK_COLORS = {
  Healthy: theme.colors.success,
  Watch: theme.colors.warning,
  'At Risk': theme.colors.riskAtRisk,
  Critical: theme.colors.urgent,
};

const MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const getDaysUntilCancellation = (teeTime) => {
  const match = teeTime?.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s([A-Za-z]{3})\s(\d{1,2})/);
  if (!match) return NaN;

  const [, monthAbbr, day] = match;
  const year = new Date(`${DEMO_DATE}T00:00:00Z`).getUTCFullYear();
  const target = Date.UTC(year, MONTH_INDEX[monthAbbr], Number(day));
  const base = Date.parse(`${DEMO_DATE}T00:00:00Z`);
  return Math.max(0, Math.round((target - base) / (24 * 60 * 60 * 1000)));
};

const buildTrend = (cancelProbability, index) => {
  const p = Math.round((cancelProbability ?? 0) * 100);
  const bias = index % 3;
  return [p - 14 + bias, p - 9 - bias, p - 5 + bias, p].map((v) => Math.max(2, Math.min(98, v)));
};

function WaitlistRow({ memberName, archetype, healthScore, riskLevel, requestedSlot, daysWaiting, retentionPriority, diningHistory }) {
  const isPriority = retentionPriority === 'HIGH';
  return (
    <tr style={{ borderTop: `1px solid ${theme.colors.border}`, background: isPriority ? 'rgba(192,57,43,0.04)' : 'transparent' }}>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          {isPriority && (
            <span style={{ fontSize: 10, background: theme.colors.urgent, color: theme.colors.white,
              padding: '1px 5px', borderRadius: 3, fontWeight: 700, letterSpacing: '0.04em' }}>
              PRIORITY
            </span>
          )}
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: isPriority ? 600 : 400,
            color: theme.colors.textPrimary }}>{memberName}</span>
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>{diningHistory}</div>
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
        <ArchetypeBadge archetype={archetype} size="sm" />
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'center' }}>
        <span style={{ fontFamily: theme.fonts.mono, fontWeight: 700, fontSize: theme.fontSize.sm,
          color: RISK_COLORS[riskLevel] || theme.colors.textSecondary }}>
          {healthScore}
        </span>
        <div style={{ fontSize: 10, color: RISK_COLORS[riskLevel], marginTop: 1 }}>{riskLevel}</div>
      </td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>{requestedSlot}</td>
      <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'center',
        fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm,
        color: daysWaiting >= 4 ? theme.colors.warning : theme.colors.textMuted }}>
        {daysWaiting}d
      </td>
    </tr>
  );
}

export default function DemandTab() {
  const gaps = getDemandGaps();
  const total = gaps.reduce((s, g) => s + g.waitlistCount, 0);
  const eventOverlapCount = gaps.filter((g) => g.eventOverlap).length;
  const waitlist = getWaitlistWithRiskScoring();
  const summary = getWaitlistSummary();

  const lastActivityByMemberId = new Map(memberWaitlistEntries.map((entry) => [entry.memberId, entry.lastRound]));
  const cancellationRows = [...cancellationProbabilities]
    .sort((a, b) => b.cancelProbability - a.cancelProbability)
    .slice(0, 6)
    .map((entry, index) => ({
      ...entry,
      daysUntilCancellation: getDaysUntilCancellation(entry.teeTime),
      lastActivityDate: lastActivityByMemberId.get(entry.memberId) || 'Unknown',
      trend: buildTrend(entry.cancelProbability, index),
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Waitlist Entries', value: total, sub: 'Total unmet demand', accent: theme.colors.operations },
          { label: 'Retention Priority', value: summary.highPriority, sub: 'At-risk members waiting', accent: theme.colors.urgent },
          { label: 'Peak Slot', value: 'Sat 7–9 AM', sub: 'Highest demand window', accent: theme.colors.textSecondary },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
            padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Waitlist Intelligence */}
      <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.colors.bgDeep }}>
          <div>
            <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
              Waitlist Intelligence
            </span>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: theme.spacing.sm }}>
              Retention-priority queue · {summary.total} members waiting
            </span>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            {[
              { label: `${summary.highPriority} retention priority`, color: theme.colors.urgent },
              { label: `${summary.atRisk} at-risk`, color: theme.colors.warning },
              { label: `avg ${summary.avgDaysWaiting}d wait`, color: theme.colors.textMuted },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: 11, color, fontWeight: 500,
                background: theme.colors.bg, border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm, padding: '2px 8px' }}>{label}</span>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
            <thead>
              <tr style={{ background: theme.colors.bg }}>
                {['Member', 'Archetype', 'Health', 'Requested Slot', 'Waiting'].map((h) => (
                  <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: h === 'Health' || h === 'Waiting' ? 'center' : 'left',
                    color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <WaitlistRow key={entry.memberId} {...entry} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation risk */}
      <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: theme.colors.bgDeep }}>
          <div>
            <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
              Cancellation Risk Watchlist
            </span>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: theme.spacing.sm }}>
              Top predicted cancellations before next tee window
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
            <thead>
              <tr style={{ background: theme.colors.bg }}>
                {['Member', 'Probability', 'Predicted Cancel In', 'Last Activity', 'Trend'].map((h) => (
                  <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: 'left', color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cancellationRows.map((entry) => (
                <CancellationRiskRow
                  key={entry.bookingId}
                  memberName={entry.memberName}
                  cancelProbability={entry.cancelProbability}
                  daysUntilCancellation={entry.daysUntilCancellation}
                  lastActivityDate={entry.lastActivityDate}
                  trend={entry.trend}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slot-level detail */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            Slot-Level Demand
          </span>
          <span style={{ marginLeft: theme.spacing.sm, fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            {eventOverlapCount} overlapping events
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Date', 'Time Slot', 'Waitlist', 'Event Overlap'].map((h) => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  textAlign: 'left', color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gaps.map((g, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textSecondary, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                  {g.date}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textPrimary }}>{g.slot}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.operations, fontFamily: theme.fonts.mono, fontWeight: 600 }}>
                  {g.waitlistCount}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                  {g.eventOverlap
                    ? <span style={{ color: theme.colors.warning, fontSize: theme.fontSize.xs }}>⚠ Yes</span>
                    : <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="warning">
        <strong>{summary.highPriority} at-risk members</strong> are waiting {summary.avgDaysWaiting}+ days for Saturday morning slots.
        First-come-first-served alerts are costing you retention, not just tee times — notifying them first when
        a cancellation opens is estimated to reduce resignation probability by 34%.
      </SoWhatCallout>
    </div>
  );
}
