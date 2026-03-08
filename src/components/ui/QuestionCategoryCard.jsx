// QuestionCategoryCard — GM question framing card for Integrations page
// Props: question{}, readiness{connected,required,ready}, comboCount, onExplore fn
// Flagship variant (question.flagship=true) gets dark treatment
import { theme } from '@/config/theme';

const TIER_LABEL = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

export default function QuestionCategoryCard({ question, readiness, comboCount, onExplore }) {
  const isFlagship = !!question.flagship;
  const color      = theme.colors[question.themeColor] ?? theme.colors.accent;
  const { connected, required } = readiness;
  const pct = required > 0 ? Math.round((connected / required) * 100) : 0;

  if (isFlagship) return (
    <FlagshipCard question={question} color={color} connected={connected}
      required={required} comboCount={comboCount} onExplore={onExplore} />
  );

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      cursor: 'pointer', transition: 'box-shadow 0.15s',
    }}
      onClick={onExplore}
      onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadow.md}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{question.icon}</span>
          <span style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color,
            background: `${color}18`, border: `1px solid ${color}30`,
            padding: '2px 6px', borderRadius: theme.radius.sm,
          }}>
            {TIER_LABEL[question.tier]}
          </span>
        </div>
        <ReadinessBar connected={connected} required={required} pct={pct} color={color} />
      </div>

      {/* Question label */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.35 }}>
        {question.label}
      </div>

      {/* The GM question */}
      <div style={{ fontSize: '12px', color: theme.colors.textMuted, lineHeight: 1.55, fontStyle: 'italic' }}>
        "{question.question}"
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
          {comboCount} insight{comboCount !== 1 ? 's' : ''} · {question.primaryBuyer}
        </span>
        <span style={{ fontSize: '11px', color, fontWeight: 600 }}>Explore →</span>
      </div>
    </div>
  );
}

function ReadinessBar({ connected, required, pct, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
      <span style={{ fontSize: '10px', color: pct === 100 ? color : theme.colors.textMuted, fontWeight: 600 }}>
        {connected}/{required} connected
      </span>
      <div style={{ width: '60px', height: '4px', background: theme.colors.bgDeep, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct === 100 ? theme.colors.success : color,
          borderRadius: '2px', transition: 'width 0.4s',
        }} />
      </div>
    </div>
  );
}

function FlagshipCard({ question, color, connected, required, comboCount, onExplore }) {
  return (
    <div style={{
      background: theme.colors.bgSidebar,
      border: `1px solid ${color}40`,
      borderRadius: theme.radius.md,
      padding: '20px 24px',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      position: 'relative', overflow: 'hidden',
    }}
      onClick={onExplore}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${color}60`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${color}, ${theme.colors.members})`,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <span style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{question.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: theme.colors.bgCard }}>
              {question.label}
            </span>
            <span style={{
              fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color, background: `${color}20`, border: `1px solid ${color}50`,
              padding: '2px 7px', borderRadius: theme.radius.sm,
            }}>
              Swoop Only
            </span>
          </div>
          <p style={{ fontSize: '13px', color: `${theme.colors.bgCard}CC`, lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>
            "{question.question}"
          </p>
          <p style={{ fontSize: '12px', color: `${theme.colors.bgCard}80`, lineHeight: 1.5, margin: '0 0 14px' }}>
            {question.why}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: `${theme.colors.bgCard}80` }}>
                Requires {required} systems connected
              </span>
              <span style={{ fontSize: '11px', color: `${theme.colors.bgCard}80` }}>
                {comboCount} insights
              </span>
            </div>
            <span style={{ fontSize: '12px', color, fontWeight: 700 }}>See Example →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
