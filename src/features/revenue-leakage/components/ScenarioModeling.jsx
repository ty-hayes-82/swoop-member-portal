// ScenarioModeling — interactive "what-if" sliders for revenue recovery planning
import { useState } from 'react';
import { theme } from '@/config/theme';

const scenarios = [
  {
    key: 'pace',
    label: 'Improve pace of play',
    question: 'What if we reduce slow rounds by',
    unit: '%',
    min: 0,
    max: 50,
    default: 0,
    step: 5,
    // Each % improvement recovers proportional F&B revenue
    calcRecovery: (pct, paceLoss) => Math.round(paceLoss * (pct / 100) * 0.65),
    description: 'Ranger coverage on bottleneck holes reduces slow rounds, keeping members on schedule for post-round dining.',
  },
  {
    key: 'complaints',
    label: 'Faster complaint resolution',
    question: 'What if we resolve complaints within',
    unit: ' hours',
    min: 72,
    max: 4,
    default: 72,
    step: -4,
    // Faster resolution improves retention; each hour faster = ~0.5% retention improvement
    calcRecovery: (hrs) => {
      const improvement = Math.max(0, (72 - hrs) / 72);
      return Math.round(improvement * 2400); // max $2,400/mo from retention improvement
    },
    description: 'Same-day resolution improves renewal probability by 18%. Every complaint is a retention opportunity.',
  },
  {
    key: 'staffing',
    label: 'Fix staffing gaps',
    question: 'What if we add servers on high-demand days',
    unit: '',
    min: 0,
    max: 3,
    default: 0,
    step: 1,
    // Each additional server on understaffed days recovers ~$1,133
    calcRecovery: (servers, _p, staffingLoss) => Math.round(Math.min(servers * 1133, staffingLoss)),
    description: 'Holding a 4-server minimum on high-demand Fridays eliminates the service failures that drive complaints.',
  },
];

function Slider({ value, min, max, step, onChange }) {
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  const isReversed = min > max;

  return (
    <input
      type="range"
      min={actualMin}
      max={actualMax}
      step={Math.abs(step)}
      value={isReversed ? actualMin + actualMax - value : value}
      onChange={(e) => {
        const raw = Number(e.target.value);
        onChange(isReversed ? actualMin + actualMax - raw : raw);
      }}
      style={{
        width: '100%',
        height: '8px',
        borderRadius: '4px',
        appearance: 'none',
        background: `linear-gradient(to right, ${theme.colors.accent} 0%, ${theme.colors.accent} ${((isReversed ? actualMin + actualMax - value : value) - actualMin) / (actualMax - actualMin) * 100}%, ${theme.colors.border} ${((isReversed ? actualMin + actualMax - value : value) - actualMin) / (actualMax - actualMin) * 100}%, ${theme.colors.border} 100%)`,
        cursor: 'pointer',
        outline: 'none',
        minHeight: '44px',
        padding: '18px 0',
      }}
    />
  );
}

const RECOMMENDED = { pace: 25, complaints: 24, staffing: 1 };

export default function ScenarioModeling({ paceLoss, staffingLoss, weatherLoss }) {
  const [values, setValues] = useState({ ...RECOMMENDED });

  const updateValue = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));
  const isDefault = values.pace === RECOMMENDED.pace && values.complaints === RECOMMENDED.complaints && values.staffing === RECOMMENDED.staffing;
  const isZero = values.pace === 0 && values.complaints === 72 && values.staffing === 0;

  const recoveries = scenarios.map((s) => ({
    key: s.key,
    amount: s.calcRecovery(values[s.key], paceLoss, staffingLoss),
  }));

  const totalRecovery = recoveries.reduce((sum, r) => sum + r.amount, 0);
  const totalLoss = paceLoss + staffingLoss + weatherLoss;
  const recoveryPct = totalLoss > 0 ? Math.round((totalRecovery / totalLoss) * 100) : 0;

  return (
    <div
      style={{
        background: theme.colors.bgCard,
        border: '1px solid ' + theme.colors.border,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.lg }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '4px',
          }}>
            Scenario Modeling
          </div>
          <h3 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
            What if you took action?
          </h3>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
            {isDefault ? 'Swoop recommends this scenario based on your club\'s data.' : 'Adjust the sliders to see projected monthly recovery.'}
          </p>
          {/* Preset benchmark buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Conservative (10%)', pace: 10 },
              { label: 'Moderate (25%)', pace: 25 },
              { label: 'Aggressive (50%)', pace: 50 },
            ].map((preset) => {
              const isActive = values.pace === preset.pace && values.complaints === RECOMMENDED.complaints && values.staffing === RECOMMENDED.staffing;
              return (
                <button
                  key={preset.label}
                  onClick={() => setValues({ pace: preset.pace, complaints: RECOMMENDED.complaints, staffing: RECOMMENDED.staffing })}
                  style={{
                    padding: '4px 12px',
                    fontSize: theme.fontSize.xs,
                    fontWeight: 600,
                    color: isActive ? theme.colors.accent : theme.colors.textSecondary,
                    background: isActive ? `${theme.colors.accent}12` : 'transparent',
                    border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
            {!isDefault && (
              <button
                onClick={() => setValues({ ...RECOMMENDED })}
                style={{
                  padding: '4px 10px',
                  fontSize: theme.fontSize.xs,
                  fontWeight: 600,
                  color: theme.colors.accent,
                  background: 'none',
                  border: `1px solid ${theme.colors.accent}40`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}
          </div>
          {/* Quick comparison */}
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: 8 }}>
            {[10, 25, 50].map((pct) => {
              const recovery = scenarios[0].calcRecovery(pct, paceLoss);
              return (
                <span key={pct} style={{ fontSize: 11, color: theme.colors.textMuted }}>
                  {pct}% = <strong style={{ color: theme.colors.success, fontFamily: theme.fonts.mono }}>+${recovery.toLocaleString()}/mo</strong>
                </span>
              );
            })}
          </div>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '12px 20px',
          borderRadius: theme.radius.md,
          background: totalRecovery > 0 ? theme.colors.success + '12' : theme.colors.bgDeep,
          border: '1px solid ' + (totalRecovery > 0 ? theme.colors.success + '30' : theme.colors.border),
          minWidth: 120,
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: theme.fonts.mono,
            color: totalRecovery > 0 ? theme.colors.success : theme.colors.textMuted,
          }}>
            ${totalRecovery.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 6 }}>
            projected monthly recovery ({recoveryPct}%)
          </div>
          <div style={{
            fontSize: '20px', fontWeight: 700, fontFamily: theme.fonts.mono,
            color: totalRecovery > 0 ? theme.colors.info : theme.colors.textMuted,
          }}>
            {Math.round(totalRecovery / 1500)} members
          </div>
          <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>
            protected from churn
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        {scenarios.map((s) => {
          const recovery = recoveries.find((r) => r.key === s.key)?.amount ?? 0;
          const displayValue = s.key === 'complaints'
            ? values[s.key] + s.unit
            : values[s.key] + s.unit;

          return (
            <div key={s.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
                    {s.question}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.md,
                    fontWeight: 700,
                    fontFamily: theme.fonts.mono,
                    color: theme.colors.accent,
                    marginLeft: '6px',
                  }}>
                    {displayValue}
                  </span>
                  {s.key === 'complaints' && <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}> (currently 72hrs avg)</span>}
                </div>
                {recovery > 0 && (
                  <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.success, fontFamily: theme.fonts.mono }}>
                    +${recovery.toLocaleString()}/mo
                  </span>
                )}
              </div>
              <Slider
                value={values[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => updateValue(s.key, v)}
              />
              <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, margin: '6px 0 0' }}>
                {s.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
