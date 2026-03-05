// features/integrations/StickyPanel.jsx
// The sticky right-column panel. Shows empty state or full combination result.
import { theme } from '@/config/theme';
import { combinations } from '@/data/combinations';
import { integrationsById } from '@/data/integrations';

// ── Empty / one-selected state ──────────────────────────────────────────────
function EmptyState({ selected }) {
  const hasOne = selected.length === 1;
  const item = hasOne ? integrationsById[selected[0]] : null;

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: '36px 24px',
      textAlign: 'center',
      minHeight: 320,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      {hasOne ? (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `${item.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 4,
          }}>{item.icon}</div>
          <div style={{ fontWeight: 600, fontSize: theme.fontSize.md, color: theme.colors.textPrimary }}>
            {item.name} selected
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, lineHeight: 1.5, maxWidth: 240 }}>
            Now pick a second system from the grid to see what they unlock together.
          </div>
          {/* Ghost icons of remaining options */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.values(integrationsById)
              .filter(i => i.id !== selected[0])
              .slice(0, 6)
              .map(i => (
                <div key={i.id} style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: theme.colors.bgDeep,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, opacity: 0.5,
                }}>{i.icon}</div>
              ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40, marginBottom: 4, opacity: 0.3 }}>⚡</div>
          <div style={{ fontWeight: 600, fontSize: theme.fontSize.md, color: theme.colors.textPrimary }}>
            Pick two systems
          </div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, lineHeight: 1.5, maxWidth: 240 }}>
            Select any two integrations from the grid to see the insights and automations they unlock together.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['💳','⛳','👥','🌤'].map((icon, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 9,
                background: theme.colors.bgDeep,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, opacity: 0.4,
              }}>{icon}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ color, children }) {
  return (
    <div style={{
      fontSize: theme.fontSize.xs, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '1.1px',
      color, marginBottom: 10,
    }}>{children}</div>
  );
}

function ListItem({ color, text, last }) {
  return (
    <div style={{
      display: 'flex', gap: 9, alignItems: 'flex-start',
      padding: '8px 0',
      borderBottom: last ? 'none' : `1px solid ${theme.colors.border}`,
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      lineHeight: 1.5,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color, marginTop: 7, flexShrink: 0,
      }} />
      {text}
    </div>
  );
}

// ── Combination result ───────────────────────────────────────────────────────
function ComboResult({ idA, idB }) {
  const combo = combinations[`${idA}+${idB}`];
  const intA = integrationsById[idA];
  const intB = integrationsById[idB];

  const panelStyle = {
    background: '#fff',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    animation: 'fadeSlideIn 0.3s ease',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  };

  if (!combo) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>{intA.icon} + {intB.icon}</div>
          <div style={{ fontWeight: 600, fontSize: theme.fontSize.md, color: theme.colors.textPrimary, marginBottom: 8 }}>
            Cross-System Intelligence
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
            Contact our team to explore what <strong>{intA.name}</strong> + <strong>{intB.name}</strong> can reveal for your club.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle} id="combination-panel">
      {/* Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: 'rgba(247,245,242,0.6)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 9,
            background: `${intA.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>{intA.icon}</span>
          <span style={{ fontSize: 14, color: theme.colors.textMuted }}>+</span>
          <span style={{
            width: 38, height: 38, borderRadius: 9,
            background: `${intB.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>{intB.icon}</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: theme.fontSize.md, color: theme.colors.textPrimary, lineHeight: 1.2 }}>
            {combo.title}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            {intA.name} × {intB.name}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div style={{ padding: '16px 20px 0' }}>
        <SectionLabel color="#1a5c8e">Insights Unlocked</SectionLabel>
        {combo.insights.map((text, i) => (
          <ListItem key={i} color="#1a5c8e" text={text} last={i === combo.insights.length - 1} />
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: theme.colors.border, margin: '12px 0' }} />

      {/* Automations */}
      <div style={{ padding: '0 20px' }}>
        <SectionLabel color="#1a7a3c">Automations Enabled</SectionLabel>
        {combo.automations.map((text, i) => (
          <ListItem key={i} color="#1a7a3c" text={text} last={i === combo.automations.length - 1} />
        ))}
      </div>

      {/* Example insight */}
      <div style={{
        margin: '14px 20px 20px',
        background: 'rgba(139,100,32,0.05)',
        border: `1px solid rgba(139,100,32,0.18)`,
        borderLeft: `4px solid #8b6420`,
        borderRadius: '0 8px 8px 0',
        padding: '12px 14px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: '#8b6420',
          letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5,
        }}>
          Example Swoop Insight
        </div>
        <p style={{
          fontSize: theme.fontSize.sm, fontStyle: 'italic',
          color: theme.colors.textPrimary, lineHeight: 1.55,
          margin: 0, fontWeight: 500,
        }}>
          "{combo.example}"
        </p>
      </div>
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export function StickyPanel({ selected }) {
  if (selected.length < 2) {
    return <EmptyState selected={selected} />;
  }
  return <ComboResult idA={selected[0]} idB={selected[1]} />;
}
