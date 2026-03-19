import { theme } from '@/config/theme';
import { SoWhatCallout } from '@/components/ui';

const NPS_BY_ARCHETYPE = [
  { archetype: 'Die-Hard Golfer', nps: 72, renewal: 96, count: 52 },
  { archetype: 'Social Butterfly', nps: 68, renewal: 94, count: 44 },
  { archetype: 'Balanced Active', nps: 58, renewal: 89, count: 64 },
  { archetype: 'Weekend Warrior', nps: 45, renewal: 82, count: 46 },
  { archetype: 'New Member', nps: 62, renewal: 88, count: 24 },
  { archetype: 'Snowbird', nps: 55, renewal: 85, count: 16 },
  { archetype: 'Declining', nps: 12, renewal: 45, count: 30 },
  { archetype: 'Ghost', nps: -15, renewal: 18, count: 24 },
];

export default function SurveyTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{
        background: `${theme.colors.info}08`,
        border: `1px solid ${theme.colors.info}30`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.info, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Sample Data
        </div>
        <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
          NPS-to-Retention Correlation by Archetype
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
          Connect your survey tool (SurveyMonkey, Medallia, or custom) to see real NPS/CSAT data correlated with behavioral signals.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.md }}>
        <div style={{
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md, padding: theme.spacing.lg, textAlign: 'center',
        }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '28px', fontWeight: 700, color: theme.colors.success }}>97%</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Renewal rate for NPS 9-10 (Promoters)</div>
        </div>
        <div style={{
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md, padding: theme.spacing.lg, textAlign: 'center',
        }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: '28px', fontWeight: 700, color: theme.colors.urgent }}>58%</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Renewal rate for NPS 0-6 (Detractors)</div>
        </div>
      </div>

      <div style={{
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, overflow: 'hidden',
      }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.bgDeep }}>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>NPS by Archetype</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Sample data — connect your survey tool to see real scores.</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {['Archetype', 'NPS Score', 'Renewal Rate', 'Members'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NPS_BY_ARCHETYPE.map((row) => (
              <tr key={row.archetype} style={{ borderBottom: `1px solid ${theme.colors.border}60` }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.colors.textPrimary }}>{row.archetype}</td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono, fontWeight: 700, color: row.nps >= 50 ? theme.colors.success : row.nps >= 0 ? theme.colors.warning : theme.colors.urgent }}>
                  {row.nps}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono, color: row.renewal >= 85 ? theme.colors.success : row.renewal >= 60 ? theme.colors.warning : theme.colors.urgent }}>
                  {row.renewal}%
                </td>
                <td style={{ padding: '8px 12px', color: theme.colors.textMuted }}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="opportunity">
        <strong>NPS predicts renewal with 89% accuracy</strong> when combined with behavioral data.
        Declining members with NPS below 20 resign within 60 days 78% of the time.
        Connect your survey tool to unlock satisfaction-to-retention correlation by touchpoint and archetype.
      </SoWhatCallout>

      <div style={{
        background: `${theme.colors.accent}08`,
        border: `1px solid ${theme.colors.accent}30`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>
          Connect Your Survey Tool
        </div>
        <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: 12 }}>
          Add NPS/CSAT data to see satisfaction-to-retention correlation by touchpoint and archetype.
          Supports SurveyMonkey, Medallia, Qualtrics, and custom webhooks.
        </div>
        <button style={{
          padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', border: 'none', background: theme.colors.accent, color: 'white',
        }}>
          Set Up Survey Integration
        </button>
      </div>
    </div>
  );
}
