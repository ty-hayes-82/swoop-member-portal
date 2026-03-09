import { SoWhatCallout } from '@/components/ui';
import { getEmailHeatmap, getDecayingMembers } from '@/services/memberService';
import { theme } from '@/config/theme';

function heatColor(rate) {
  if (rate >= 0.65) return theme.colors.success;
  if (rate >= 0.45) return theme.colors.success;
  if (rate >= 0.25) return theme.colors.warning;
  if (rate >= 0.10) return theme.colors.staffing;
  return theme.colors.urgent;
}

const formatPercent = (value) => (Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : '—');
const formatTrend = (value) => (Number.isFinite(value) ? `${value}% trend` : '—');

export default function EmailTab() {
  const heatmap = getEmailHeatmap();
  const decaying = getDecayingMembers();

  const campaigns = [...new Set(heatmap.map(h => h.campaign))];
  const archetypes = [...new Set(heatmap.map(h => h.archetype))];

  const getRate = (campaign, archetype) =>
    heatmap.find(h => h.campaign === campaign && h.archetype === archetype)?.openRate ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Heatmap */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        padding: theme.spacing.md, border: `1px solid ${theme.colors.border}`, overflowX: 'auto' }}>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md }}>Email Open Rate Heatmap</div>
        <table style={{ borderCollapse: 'collapse', fontSize: theme.fontSize.xs, minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px', color: theme.colors.textMuted, textAlign: 'left',
                minWidth: 140 }}>Campaign</th>
              {archetypes.map(a => (
                <th key={a} style={{ padding: '4px 8px', color: theme.colors.textMuted,
                  textAlign: 'center', minWidth: 80, fontSize: 10 }}>{a.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c}>
                <td style={{ padding: '4px 8px', color: theme.colors.textSecondary,
                  fontSize: 10, maxWidth: 140 }}>{c}</td>
                {archetypes.map(a => {
                  const rate = getRate(c, a);
                  const color = Number.isFinite(rate) ? heatColor(rate) : theme.colors.textMuted;
                  return (
                    <td key={a} style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <div style={{
                        background: `${color}30`, border: `1px solid ${color}60`,
                        borderRadius: 4, padding: '3px 6px',
                        color, fontFamily: theme.fonts.mono, fontSize: 10,
                      }}>
                        {rate > 0 ? formatPercent(rate) : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decay watch list */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.urgent}30`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.urgent }}>
            ⚠ Engagement Decay Watch List
          </span>
          <span style={{ marginLeft: theme.spacing.sm, fontSize: theme.fontSize.xs,
            color: theme.colors.textMuted }}>Email decay precedes churn by 4–6 weeks</span>
        </div>
        {decaying.map((m, i) => (
          <div key={i} style={{ padding: theme.spacing.md,
            borderBottom: i < decaying.length - 1 ? `1px solid ${theme.colors.border}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>{m.name}</span>
              <span style={{ color: theme.colors.urgent, fontFamily: theme.fonts.mono,
                fontSize: theme.fontSize.sm }}>{formatTrend(m.trend)}</span>
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: 4 }}>
              {[['Nov', m.nov], ['Dec', m.dec], ['Jan', m.jan]].map(([label, val]) => (
                <span key={label} style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                  {label}: <span style={{ color: heatColor(Number.isFinite(val) ? val : 0), fontFamily: theme.fonts.mono }}>
                    {formatPercent(val)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SoWhatCallout variant="warning">
        Email decay is the <strong>earliest churn signal</strong> — preceding reduced golf and dining activity
        by 4–6 weeks. These {decaying.length} members are in the pre-departure window where personal outreach
        still works.
      </SoWhatCallout>
    </div>
  );
}
