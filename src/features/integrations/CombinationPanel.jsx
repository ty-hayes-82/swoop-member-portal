// features/integrations/CombinationPanel.jsx
import { theme } from '@/config/theme';
import { combinations } from '@/data/combinations';
import { integrationsById } from '@/data/integrations';

const sectionLabelStyle = (color) => ({
  fontSize: theme.fontSize.xs,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  color,
  marginBottom: 12,
});

const listItemStyle = (accentColor) => ({
  display: 'flex',
  gap: 10,
  padding: '10px 0',
  borderBottom: `1px solid ${theme.colors.border}`,
  fontSize: theme.fontSize.sm,
  color: theme.colors.textSecondary,
  lineHeight: 1.5,
  alignItems: 'flex-start',
});

const bulletStyle = (color) => ({
  width: 6, height: 6, borderRadius: '50%',
  background: color, marginTop: 6, flexShrink: 0,
});

export function CombinationPanel({ selected }) {
  if (selected.length < 2) return null;

  const [idA, idB] = selected;
  const comboKey = `${idA}+${idB}`;
  const combo = combinations[comboKey];
  const intA = integrationsById[idA];
  const intB = integrationsById[idB];

  const panelStyle = {
    background: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    animation: 'fadeSlideIn 0.3s ease',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  };

  if (!combo) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: '32px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{intA.icon} + {intB.icon}</div>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
            Cross-System Intelligence
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, maxWidth: 480, margin: '0 auto' }}>
            This combination unlocks powerful cross-system intelligence. Contact our team to explore what <strong>{intA.name}</strong> + <strong>{intB.name}</strong> can reveal for your club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle} id="combination-panel">
      {/* Header */}
      <div style={{
        padding: '24px 36px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(247,245,242,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${intA.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>{intA.icon}</span>
          <span style={{ fontSize: 18, color: theme.colors.textMuted, fontWeight: 300 }}>+</span>
          <span style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${intB.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>{intB.icon}</span>
        </div>
        <div>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
            {combo.title}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            {intA.name} × {intB.name}
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '28px 36px', gap: 36 }}>
        {/* Insights */}
        <div>
          <div style={sectionLabelStyle(theme.colors.integrationTeeSheet)}>Insights Unlocked</div>
          {combo.insights.map((insight, i) => (
            <div key={i} style={{ ...listItemStyle(theme.colors.integrationTeeSheet), borderBottom: i < combo.insights.length - 1 ? `1px solid ${theme.colors.border}` : 'none' }}>
              <span style={bulletStyle(theme.colors.integrationTeeSheet)} />
              {insight}
            </div>
          ))}
        </div>

        {/* Automations */}
        <div>
          <div style={sectionLabelStyle(theme.colors.operations)}>Automations Enabled</div>
          {combo.automations.map((auto, i) => (
            <div key={i} style={{ ...listItemStyle(theme.colors.operations), borderBottom: i < combo.automations.length - 1 ? `1px solid ${theme.colors.border}` : 'none' }}>
              <span style={bulletStyle(theme.colors.operations)} />
              {auto}
            </div>
          ))}
        </div>
      </div>

      {/* Example insight */}
      <div style={{
        margin: '0 36px 28px',
        background: 'rgba(139,100,32,0.06)',
        border: `1px solid rgba(139,100,32,0.2)`,
        borderLeft: `4px solid ${theme.colors.integrationPos}`,
        borderRadius: '0 8px 8px 0',
        padding: '14px 18px',
      }}>
        <div style={{ fontSize: theme.fontSize.xs, fontWeight: 600, color: theme.colors.integrationPos, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>
          Example Swoop Insight
        </div>
        <p style={{ fontSize: theme.fontSize.sm, fontStyle: 'italic', color: theme.colors.textPrimary, lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
          "{combo.example}"
        </p>
      </div>
    </div>
  );
}
