import { SoWhatCallout, ArchetypeBadge, StoryHeadline } from '@/components/ui';
import { getCancellationPredictions, getCancellationSummary } from '@/services/waitlistService';
import { theme } from '@/config/theme';

const PROB_COLOR = (p) => {
  if (p >= 0.65) return theme.colors.urgent;
  if (p >= 0.45) return theme.colors.warning;
  return theme.colors.success;
};

function ProbBar({ probability }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: theme.colors.bgDeep,
        borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${probability * 100}%`, height: '100%',
          background: PROB_COLOR(probability), borderRadius: 3,
          transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontFamily: theme.fonts.mono, fontWeight: 700, fontSize: theme.fontSize.sm,
        color: PROB_COLOR(probability), minWidth: 36, textAlign: 'right' }}>
        {Math.round(probability * 100)}%
      </span>
    </div>
  );
}

function PredictionRow({ memberName, archetype, teeTime, cancelProbability, drivers, recommendedAction, estimatedRevenueLost }) {
  const isHighRisk = cancelProbability >= 0.60;
  return (
    <tr style={{ borderTop: `1px solid ${theme.colors.border}`,
      background: isHighRisk ? 'rgba(192,57,43,0.03)' : 'transparent' }}>
      <td style={{ padding: `10px ${theme.spacing.md}` }}>
        <div style={{ fontWeight: isHighRisk ? 600 : 400, fontSize: theme.fontSize.sm,
          color: theme.colors.textPrimary }}>{memberName}</div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
          {teeTime}
        </div>
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}` }}>
        <ArchetypeBadge archetype={archetype} size="sm" />
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, minWidth: 160 }}>
        <ProbBar probability={cancelProbability} />
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary, maxWidth: 200 }}>
        {drivers.slice(0, 2).map((d, i) => (
          <div key={i} style={{ marginBottom: i < drivers.length - 1 ? 2 : 0 }}>· {d}</div>
        ))}
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, fontSize: theme.fontSize.xs,
        color: isHighRisk ? theme.colors.warning : theme.colors.textMuted }}>
        {recommendedAction}
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, textAlign: 'right',
        fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm,
        color: isHighRisk ? theme.colors.urgent : theme.colors.textMuted }}>
        ${estimatedRevenueLost.toLocaleString()}
      </td>
    </tr>
  );
}

export default function PredictionsTab() {
  const predictions = getCancellationPredictions();
  const summary = getCancellationSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="insight"
        headline="Tomorrow's wind advisory will likely trigger 4–6 cancellations — 3 from members already at retention risk."
        context="Wind speed correlates with 2 prior cancellations each for Kevin Hurst and Anne Jordan. Combined revenue at risk: $863. Proactive confirmation + waitlist pre-alert sent 18h out historically reduces no-show rate by 34%."
      />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Bookings Scored',   value: summary.total,                             accent: theme.colors.textSecondary },
          { label: 'High-Risk (≥60%)',  value: summary.highRisk,                          accent: theme.colors.urgent },
          { label: 'Revenue at Risk',   value: `$${summary.totalRevAtRisk.toLocaleString()}`, accent: theme.colors.warning },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: theme.spacing.md, boxShadow: theme.shadow.sm }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Predictions table */}
      <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgDeep }}>
          <span style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
            Cancellation Risk · Jan 18 Tee Sheet
          </span>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: 8 }}>
            Sorted by probability · Weather × history × engagement signals
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.colors.bg }}>
                {['Member', 'Archetype', 'Cancel Risk', 'Drivers', 'Recommended Action', 'Rev at Risk'].map(h => (
                  <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: h === 'Rev at Risk' ? 'right' : 'left',
                    color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.map(p => <PredictionRow key={p.bookingId} {...p} />)}
            </tbody>
          </table>
        </div>
      </div>

      <SoWhatCallout variant="insight">
        <strong>Proactive confirmation nudge + waitlist pre-alert</strong> sent 18 hours out historically reduces
        no-show rate by 34%. For Kevin Hurst (82% risk), a GM personal outreach is the difference between a
        retained round and an empty slot — and possibly a retained member.
      </SoWhatCallout>
    </div>
  );
}
