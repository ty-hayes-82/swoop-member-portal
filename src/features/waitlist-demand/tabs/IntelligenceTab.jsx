import TrendChart from '@/components/charts/TrendChart';
import { Badge, SoWhatCallout, Sparkline, StatCard, InfoTooltip } from '@/components/ui';
import { demandHeatmap } from '@/data/pipeline';
import { revenuePerSlot } from '@/data/revenue';
import { getDemandInsight } from '@/services/waitlistService';
import { theme } from '@/config/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BLOCKS = ['7–8 AM', '8–9 AM', '9–10 AM', '10–11 AM', '11 AM–12'];

const LEVEL_STYLES = {
  oversubscribed: {
    bg: `${theme.colors.urgent}14`,
    border: `${theme.colors.urgent}33`,
    color: theme.colors.urgent,
  },
  normal: {
    bg: `${theme.colors.success}12`,
    border: `${theme.colors.success}2E`,
    color: theme.colors.success,
  },
  underutilized: {
    bg: `${theme.colors.warning}12`,
    border: `${theme.colors.warning}2E`,
    color: theme.colors.warning,
  },
};

function HeatmapCell({ cell }) {
  const style = LEVEL_STYLES[cell.level];
  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: theme.radius.sm,
        padding: '6px 8px',
      }}
    >
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{cell.block}</div>
      <div style={{ fontFamily: theme.fonts.mono, color: style.color, fontWeight: 700, fontSize: theme.fontSize.sm }}>
        {Math.round(cell.fillRate * 100)}%
      </div>
      <div style={{ fontSize: 10, color: cell.unmetRounds > 0 ? theme.colors.urgent : theme.colors.textMuted }}>
        {cell.unmetRounds > 0 ? `+${cell.unmetRounds} unmet rounds` : 'No unmet rounds'}
      </div>
    </div>
  );
}

function summarizeDemand(heatmap) {
  const weekendCells = heatmap.filter((cell) => ['Sat', 'Sun'].includes(cell.day));
  const weekdayCells = heatmap.filter((cell) => !['Sat', 'Sun'].includes(cell.day));
  const peakCell = [...heatmap].sort((a, b) => b.unmetRounds - a.unmetRounds)[0];

  const unmetWeekendRounds = weekendCells.reduce((sum, cell) => sum + cell.unmetRounds, 0);
  const weekendFill = Math.round(
    (weekendCells.reduce((sum, cell) => sum + cell.fillRate, 0) / Math.max(weekendCells.length, 1)) * 100,
  );
  const weekdayFill = Math.round(
    (weekdayCells.reduce((sum, cell) => sum + cell.fillRate, 0) / Math.max(weekdayCells.length, 1)) * 100,
  );

  return { unmetWeekendRounds, weekendFill, weekdayFill, peakCell };
}

function estimateRevenueOpportunity(unmetRounds) {
  return unmetRounds * (revenuePerSlot.retentionPriority - revenuePerSlot.reactive);
}

export default function IntelligenceTab() {
  const heatmap = demandHeatmap;
  const { unmetWeekendRounds, weekendFill, weekdayFill, peakCell } = summarizeDemand(heatmap);
  const opportunity = estimateRevenueOpportunity(unmetWeekendRounds);

  const stats = [
    {
      label: 'Reactive Fill Value',
      value: revenuePerSlot.reactive,
      format: 'currency',
      badge: { text: 'Current State', variant: 'timeline' },
      source: 'POS',
    },
    {
      label: 'Retention-Priority Fill Value',
      value: revenuePerSlot.retentionPriority,
      format: 'currency',
      badge: { text: `+${revenuePerSlot.upliftPct}%`, variant: 'success' },
      source: 'Member CRM',
    },
    {
      label: 'Weekend Fill Rate',
      value: `${weekendFill}%`,
      badge: { text: 'Overloaded', variant: 'warning' },
      source: 'Tee Sheet',
    },
    {
      label: 'Weekday Fill Rate',
      value: `${weekdayFill}%`,
      badge: { text: 'Underused Capacity', variant: 'effort' },
      source: 'Tee Sheet',
    },
  ];

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
              Demand Heatmap
              <InfoTooltip text="Fill Rate = (Booked Slots ÷ Available Slots) × 100. Shows capacity utilization by time block. Unmet rounds = waitlist members who couldn't be accommodated in that window." />
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Fill rate and unmet demand by day and time block.
            </div>
          </div>
          <Badge text="Capacity Rebalance Candidate" variant="timeline" />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)`, gap: 6, minWidth: 720 }}>
            <div />
            {DAYS.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  color: ['Sat', 'Sun'].includes(day) ? theme.colors.info : theme.colors.textMuted,
                  fontWeight: 600,
                  fontSize: theme.fontSize.xs,
                }}
              >
                {day}
              </div>
            ))}

            {BLOCKS.map((block) => (
              <div key={block} style={{ display: 'contents' }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{block}</div>
                {DAYS.map((day) => {
                  const cell = heatmap.find((item) => item.day === day && item.block === block);
                  return (
                    <div key={`${day}-${block}`}>
                      {cell ? (
                        <HeatmapCell cell={cell} />
                      ) : (
                        <div
                          style={{
                            background: theme.colors.bgDeep,
                            borderRadius: theme.radius.sm,
                            padding: '6px 8px',
                            color: theme.colors.textMuted,
                            fontSize: theme.fontSize.xs,
                          }}
                        >
                          -
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.md,
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>
            Unmet Weekend Demand Signal
          </div>
          <div style={{ height: 48 }}>
            <Sparkline
              data={heatmap.filter((cell) => ['Sat', 'Sun'].includes(cell.day)).map((cell) => cell.unmetRounds)}
              color={theme.colors.urgent}
              height={48}
              showDots
            />
          </div>
        </div>

        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
          Peak stress window is <strong>{peakCell?.day} {peakCell?.block}</strong> with <strong>{peakCell?.unmetRounds}</strong> unmet rounds.
          Re-routing those fills to retention-priority members yields an estimated <strong>${opportunity.toLocaleString()}</strong> additional
          slot value this period.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
        <TrendChart
          title="Waitlist Fill Rate"
          metricKey="waitlistFillRate"
          color={theme.colors.info}
          format="percent"
        />
        <TrendChart
          title="Post-Round Conversion (Waitlist Fills)"
          metricKey="postRoundConversionFromWaitlist"
          color={theme.colors.fb}
          format="percent"
        />
      </div>

      <SoWhatCallout variant="opportunity">
        <strong>GM decision:</strong> shift overflow messaging into Tuesday-Thursday mornings and reserve the next weekend
        cancellation for high-priority members. That captures dormant weekday capacity while preserving peak-weekend
        experience and improving per-slot yield. {getDemandInsight()}
      </SoWhatCallout>
    </div>
  );
}
