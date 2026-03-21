/**
 * Onboarding Wizard — Track 3, Item 11
 * Guided setup flow for new clubs consuming api/onboard-club.js
 */
import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';

const STEP_ICONS = {
  club_created: '✓',
  crm_connected: '🔌',
  members_imported: '👥',
  tee_sheet_connected: '⛳',
  pos_connected: '🍽️',
  health_scores_computed: '📊',
  team_invited: '👤',
  notifications_configured: '🔔',
  pilot_live: '🚀',
};

export default function OnboardingWizard({ clubId }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [percentComplete, setPercentComplete] = useState(0);

  useEffect(() => {
    if (!clubId) return;
    fetch(`/api/onboard-club?clubId=${clubId}`)
      .then(r => r.json())
      .then(data => {
        setSteps(data.steps || []);
        setPercentComplete(data.percentComplete || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  const markComplete = async (stepKey) => {
    await fetch('/api/onboard-club', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId, stepKey, completed: true }),
    });
    setSteps(prev => prev.map(s => s.key === stepKey ? { ...s, completed: true } : s));
    setPercentComplete(prev => Math.min(100, prev + Math.round(100 / steps.length)));
  };

  if (loading) {
    return <div style={{ padding: theme.spacing.xl, color: theme.colors.textMuted, textAlign: 'center' }}>Loading onboarding progress...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>Club Onboarding</span>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.accent }}>{percentComplete}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: theme.colors.bgDeep }}>
          <div style={{ height: '100%', borderRadius: 4, background: theme.colors.accent, width: `${percentComplete}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step, i) => {
          const icon = STEP_ICONS[step.key] || `${i + 1}`;
          const isNext = !step.completed && (i === 0 || steps[i - 1]?.completed);

          return (
            <div
              key={step.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: theme.radius.md,
                border: `1px solid ${step.completed ? theme.colors.success + '30' : isNext ? theme.colors.accent + '30' : theme.colors.border}`,
                background: step.completed ? `${theme.colors.success}06` : isNext ? `${theme.colors.accent}04` : theme.colors.bgCard,
              }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step.completed ? '16px' : '18px',
                background: step.completed ? theme.colors.success : isNext ? theme.colors.accent : theme.colors.bgDeep,
                color: step.completed || isNext ? '#fff' : theme.colors.textMuted,
                fontWeight: 700,
              }}>
                {step.completed ? '✓' : icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: theme.fontSize.sm, fontWeight: 600,
                  color: step.completed ? theme.colors.textMuted : theme.colors.textPrimary,
                  textDecoration: step.completed ? 'line-through' : 'none',
                }}>
                  {step.label}
                </div>
                {step.completedAt && (
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                    Completed {new Date(step.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              {isNext && !step.completed && (
                <button
                  onClick={() => markComplete(step.key)}
                  style={{
                    padding: '6px 14px', borderRadius: theme.radius.sm, border: 'none',
                    background: theme.colors.accent, color: '#fff',
                    fontSize: theme.fontSize.xs, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
