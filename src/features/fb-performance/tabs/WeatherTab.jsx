import { SoWhatCallout } from '@/components/ui';
import { getRainDayImpact } from '@/services/fbService';
import { theme } from '@/config/theme';

export default function WeatherTab() {
  const rainDays = getRainDayImpact();

  const rows = [
    { weather: '☀️ Sunny', golf: '+10%', fb: 'Baseline', note: 'Normal day' },
    { weather: '⛅ Cloudy', golf: 'Baseline', fb: 'Baseline', note: 'Typical weekday' },
    { weather: '💨 Windy', golf: '−15%', fb: '+5%', note: 'Members stay inside' },
    { weather: '🌧️ Rainy', golf: '−40%', fb: '+15%', note: 'Dining surge' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Rain Impact — Golf', value: '−40%', sub: 'Demand reduction', accent: theme.colors.urgent },
          { label: 'Rain Impact — F&B', value: '+15%', sub: 'Revenue opportunity', accent: theme.colors.success },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`, padding: theme.spacing.lg, textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.sm }}>{label}</div>
            <div style={{ fontSize: 48, fontFamily: theme.fonts.mono, fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            Weather → Revenue Shift Matrix
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Condition', 'Golf Impact', 'F&B Impact', 'GM Action'].map(h => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'left',
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textPrimary, fontWeight: 500 }}>{r.weather}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: r.golf.startsWith('−') ? theme.colors.urgent : theme.colors.success,
                  fontFamily: theme.fonts.mono }}>{r.golf}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: r.fb.startsWith('+') ? theme.colors.success : theme.colors.textSecondary,
                  fontFamily: theme.fonts.mono }}>{r.fb}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rainDays.length > 0 && (
        <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
          padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md }}>January Rain Days</div>
          {rainDays.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
              padding: `${theme.spacing.sm} 0`, borderBottom: i < rainDays.length - 1 ? `1px solid ${theme.colors.border}` : 'none' }}>
              <span style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.xs }}>{d.date}</span>
              <span style={{ color: theme.colors.urgent, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                Golf: ${d.golfRevenue.toLocaleString()}
              </span>
              <span style={{ color: theme.colors.success, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                F&B: ${d.fbRevenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <SoWhatCallout variant="opportunity">
        Rain days shift demand from golf to dining — but only if the dining room is ready.
        A weather-triggered F&B surge protocol (staffing + promotion) could capture an
        estimated <strong>$800–1,200 per rain day</strong> in incremental revenue.
      </SoWhatCallout>
    </div>
  );
}
