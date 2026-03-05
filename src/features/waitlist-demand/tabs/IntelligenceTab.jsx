import { SoWhatCallout, StoryHeadline } from '@/components/ui';
import TrendChart from '@/components/charts/TrendChart';
import { getDemandHeatmap, getRevenuePerSlot } from '@/services/waitlistService';
import { theme } from '@/config/theme';

const LEVEL_STYLES = {
  oversubscribed: { bg: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: theme.colors.urgent },
  normal:         { bg: 'rgba(26,122,60,0.10)', border: `1px solid rgba(26,122,60,0.2)`, color: theme.colors.success },
  underutilized:  { bg: 'rgba(181,118,10,0.10)', border: `1px solid rgba(181,118,10,0.2)`, color: theme.colors.warning },
};

function HeatmapCell({ day, block, fillRate, unmetRounds, level }) {
  const s = LEVEL_STYLES[level];
  return (
    <div style={{ background: s.bg, border: s.border, borderRadius: theme.radius.sm,
      padding: '6px 8px', minWidth: 90 }}>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{block}</div>
      <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, fontSize: theme.fontSize.sm,
        color: s.color }}>{Math.round(fillRate * 100)}%</div>
      {unmetRounds > 0 && (
        <div style={{ fontSize: 10, color: theme.colors.urgent }}>+{unmetRounds} unmet</div>
      )}
    </div>
  );
}

export default function IntelligenceTab() {
  const heatmap = getDemandHeatmap();
  const revPerSlot = getRevenuePerSlot();

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const blocks = ['7–8 AM', '8–9 AM', '9–10 AM', '10–11 AM', '11 AM–12'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="opportunity"
        headline="Saturday 7–9 AM is chronically oversubscribed. Tuesday–Thursday 7–9 AM runs at 52–65% — the same club, 40% fewer rounds."
        context="Opening Executive 9-hole overflow on Saturday AM could capture 12+ unmet rounds/month. That's $9,600 in estimated annual golf + dining revenue from capacity that already exists."
      />

      {/* Revenue attribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
        {[
          {
            label: 'Reactive Waitlist Fill',
            sub: 'First-come-first-served alert',
            value: `$${revPerSlot.reactive}`,
            note: 'Avg total club spend per slot filled',
            accent: theme.colors.textSecondary,
          },
          {
            label: 'Retention-Priority Fill',
            sub: 'At-risk member notified first',
            value: `$${revPerSlot.retentionPriority}`,
            note: `+${revPerSlot.upliftPct}% vs. reactive · avg total club spend`,
            accent: '#22D3EE',
          },
        ].map(({ label, sub, value, note, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: theme.spacing.lg, boxShadow: theme.shadow.sm }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>{sub}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4 }}>{note}</div>
          </div>
        ))}
      </div>

      {/* Demand heatmap */}
      <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
            Demand Heatmap · Tee Sheet Fill Rate by Day × Time
          </span>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            {[
              { label: 'Oversubscribed', color: theme.colors.urgent },
              { label: 'Normal',         color: theme.colors.success },
              { label: 'Underutilized',  color: theme.colors.warning },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: 11, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: theme.spacing.md, overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${days.length}, 1fr)`, gap: 6,
            minWidth: 700 }}>
            <div />
            {days.map(d => (
              <div key={d} style={{ fontSize: theme.fontSize.xs, fontWeight: 600,
                color: (d === 'Sat' || d === 'Sun') ? theme.colors.operations : theme.colors.textMuted,
                textAlign: 'center', paddingBottom: 4 }}>{d}</div>
            ))}
            {blocks.map(block => (
              <>
                <div key={block} style={{ fontSize: 11, color: theme.colors.textMuted,
                  display: 'flex', alignItems: 'center' }}>{block}</div>
                {days.map(day => {
                  const cell = heatmap.find(c => c.day === day && c.block === block);
                  return cell
                    ? <HeatmapCell key={day} {...cell} />
                    : <div key={day} style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.sm,
                        padding: '6px 8px', minWidth: 90, opacity: 0.4 }}>
                        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>—</div>
                      </div>;
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Trend charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
        <TrendChart
          title="Waitlist Fill Rate"
          metricKey="waitlistFillRate"
          color="#22D3EE"
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
        <strong>This is not a tee time tool.</strong> Reactive fill = $187/slot.
        Retention-priority fill = $312/slot. That's a $125 delta per cancellation recovered —
        across 44 monthly waitlist entries, that's <strong>$5,500/month in recoverable revenue</strong> from
        smarter queue management alone.
      </SoWhatCallout>
    </div>
  );
}
