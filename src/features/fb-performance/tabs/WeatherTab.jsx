import { SoWhatCallout } from '@/components/ui';
import { getRainDayImpact } from '@/services/fbService';
import { theme } from '@/config/theme';

const formatDelta = (value) => {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
};

export default function WeatherTab() {
  const rainSource = getRainDayImpact();
  const rainDays = Array.isArray(rainSource) ? rainSource : [];
  const decoratedRainDays = rainDays.map((day, index) => {
    const golfRevenue = Number.isFinite(Number(day?.golfRevenue)) ? Number(day.golfRevenue) : 0;
    const fbRevenue = Number.isFinite(Number(day?.fbRevenue)) ? Number(day.fbRevenue) : 0;
    const golfVsAvg = Number.isFinite(Number(day?.golfVsAvg)) ? Number(day.golfVsAvg) : null;
    const fbVsAvg = Number.isFinite(Number(day?.fbVsAvg)) ? Number(day.fbVsAvg) : null;
    return {
      id: day?.date ?? `rain-${index}`,
      date: day?.date ?? 'Unknown date',
      weather: day?.weather ?? 'rainy',
      golfRevenue,
      fbRevenue,
      golfVsAvg,
      fbVsAvg,
    };
  });
  const avgRainGolfImpact = decoratedRainDays.length
    ? decoratedRainDays.reduce((sum, day) => sum + (day.golfVsAvg ?? 0), 0) / decoratedRainDays.length
    : -40;
  const avgRainFbImpact = decoratedRainDays.length
    ? decoratedRainDays.reduce((sum, day) => sum + (day.fbVsAvg ?? 0), 0) / decoratedRainDays.length
    : 15;

  const rows = [
    { weather: '☀️ Sunny', golf: '+10%', fb: 'Baseline', note: 'Normal day' },
    { weather: '⛅ Cloudy', golf: 'Baseline', fb: 'Baseline', note: 'Typical weekday' },
    { weather: '💨 Windy', golf: '−15%', fb: '+5%', note: 'Members stay inside' },
    {
      weather: '🌧️ Rainy',
      golf: formatDelta(avgRainGolfImpact),
      fb: formatDelta(avgRainFbImpact),
      note: decoratedRainDays.length
        ? 'Dining surge — staff up & push offers'
        : 'Connect weather feeds to unlock surge alerts',
      highlight: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.md }}>
        {[{
          label: 'Rain Impact — Golf',
          value: formatDelta(avgRainGolfImpact),
          sub: 'Demand reduction',
          accent: theme.colors.urgent,
        }, {
          label: 'Rain Impact — F&B',
          value: formatDelta(avgRainFbImpact),
          sub: 'Revenue opportunity',
          accent: theme.colors.accent,
        }].map(({ label, value, sub, accent }) => (
          <div
            key={label}
            style={{
              background: theme.colors.bgCard,
              boxShadow: theme.shadow.sm,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.lg,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: theme.spacing.sm,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 48, fontFamily: theme.fonts.mono, fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>{sub}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: theme.colors.bgDeep,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            Weather → Revenue Shift Matrix
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Condition', 'Golf Impact', 'F&B Impact', 'GM Action'].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    textAlign: 'left',
                    color: theme.colors.textMuted,
                    fontSize: theme.fontSize.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 500,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.weather} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textPrimary, fontWeight: 500 }}>
                  {row.weather}
                </td>
                <td
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    color: row.golf.startsWith('−') ? theme.colors.urgent : theme.colors.accent,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  {row.golf}
                </td>
                <td
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    color: row.fb.startsWith('+') ? theme.colors.accent : theme.colors.textSecondary,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  {row.fb}
                </td>
                <td
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    color: row.highlight ? theme.colors.textPrimary : theme.colors.textMuted,
                    fontSize: theme.fontSize.xs,
                  }}
                >
                  {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {decoratedRainDays.length > 0 ? (
        <div
          style={{
            background: theme.colors.bgDeep,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: theme.fontSize.sm,
              fontWeight: 600,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.md,
            }}
          >
            January Rain Days
          </div>
          {decoratedRainDays.map((day, index) => (
            <div
              key={day.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: `${theme.spacing.sm} 0`,
                borderBottom: index < decoratedRainDays.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
              }}
            >
              <span style={{ color: theme.colors.textSecondary, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>{day.date}</span>
              <span style={{ color: theme.colors.urgent, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                Golf: ${day.golfRevenue.toLocaleString()} ({formatDelta(day.golfVsAvg ?? avgRainGolfImpact)})
              </span>
              <span style={{ color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                F&B: ${day.fbRevenue.toLocaleString()} ({formatDelta(day.fbVsAvg ?? avgRainFbImpact)})
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: theme.spacing.lg,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
            color: theme.colors.textMuted,
            background: theme.colors.bgDeep,
          }}
        >
          No rain-day revenue records yet. Once weather + POS are synced, we’ll show the exact swing between golf and dining when storms hit.
        </div>
      )}

      <SoWhatCallout variant="opportunity">
        Rain days shift demand from golf to dining — but only if the dining room is ready. A weather-triggered surge protocol (staffing +
        targeted offer) could capture an estimated <strong>${(Math.abs(avgRainFbImpact) * 60).toLocaleString()}</strong> per rain day in incremental revenue.
      </SoWhatCallout>
    </div>
  );
}
